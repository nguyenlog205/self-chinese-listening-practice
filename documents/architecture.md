# Architecture

## High-level shape

This is an Electron desktop app with three layers that only talk to each
other over local HTTP/WebSocket — there is no shared code or shared process
between them:

```
electron/   Node.js main process: spawns the Python backend as a child
            process, opens a BrowserWindow, loads the built frontend.
backend/    Python/FastAPI process: exposes a REST + WebSocket API on a
            local port, owns the SQLite DB and all media files, runs the
            YouTube transcription pipeline in background threads.
frontend/   React (Vite-built) single-page app. In dev it's served by
            Vite's dev server (http://localhost:5173); in a packaged build
            it's static files loaded via file://. Talks to the backend
            exclusively via fetch/WebSocket over http://127.0.0.1:<port>.
```

There is no shared-types layer between backend and frontend — the contract
between them is the JSON shapes documented in [api.md](api.md).

## Process lifecycle

1. Electron's main process (`electron/main.js`) starts, disables hardware
   acceleration (works around a GPU-process crash on some Linux setups with
   missing/incompatible GL drivers), and before opening any window, spawns
   `backend/scripts/run.sh` as a child process (`bash`, cwd `backend/`).
2. That script creates a Python venv on first run (installing the backend
   package + its ML dependencies — faster-whisper, yt-dlp, pypinyin,
   edge-tts, etc.), then execs `python -m listening_backend.main`.
3. The backend binds to a free OS-assigned TCP port (`127.0.0.1:0`, unless
   `LISTENING_PORT` is set) and, once uvicorn has actually started
   listening, prints `READY <port>` to stdout.
4. `main.js` watches the child process's stdout for that line (regex
   `READY (\d+)`), parses out the port, and only then creates the
   `BrowserWindow`.
5. The port is handed to the renderer via a single IPC call
   (`get-backend-port`, exposed through `electron/preload.js`'s
   `contextBridge` as `window.listeningApp.getBackendPort()`) rather than
   being baked into any file — this is what lets the backend claim an
   arbitrary free port instead of a hardcoded one. `frontend/src/shared/api.js`
   is the one place that calls it.
6. In dev (`!app.isPackaged`), the window loads `http://localhost:5173`
   (Vite's dev server, run separately — see [dev-workflow.md](dev-workflow.md))
   and opens DevTools. In a packaged build it loads
   `frontend/dist/index.html` (bundled as an `extraResource`, see
   `electron/package.json`).
7. On `before-quit`, Electron kills the backend child process. There is no
   graceful shutdown handshake — the backend is expected to tolerate being
   SIGKILLed mid-request (SQLite writes are individually committed per
   connection, see [backend.md](backend.md#database)).

Why a real child process instead of an in-process Python (e.g. via a
subinterpreter) or a frozen binary: this keeps the ML dependency stack
(faster-whisper, CTranslate2, yt-dlp) entirely out of the Electron/Node
world, at the cost of the first-run venv setup and requiring Python +
ffmpeg on the end user's machine (see the "Known limitation" note in the
top-level README).

**Linux only for now.** The app currently only ships for Linux (AppImage /
Fedora `.rpm`, see [dev-workflow.md](dev-workflow.md#packaging--building-an-installer)).
There is no Windows build — `electron/main.js` and `backend/scripts/`
have no Windows-specific code path anymore; a Windows release, if it
happens, is future work, not a supported target today.

## Directory layout reference

```
backend/
  listening_backend/
    main.py             FastAPI app factory + uvicorn entrypoint (READY line),
                         registers every domain's router.
    config.py           Settings (env-var overridable) + storage path resolution.
    db.py                Top-level SQLite init: runs each domain's schema, then seeds.
    seed_data/            Bundled JSON content (vocabulary, dialogues, exercises,
                           dialogue audio) — see CONVENTION.md inside it. Loaded/synced
                           by content/seed.py and content/sync.py below.
    lessons/             YouTube-video lesson domain (see below).
      db.py, models.py, jobs.py, router.py, jobs_router.py, media_router.py
      pipeline/           youtube.py, transcribe.py, sentence_split.py, pinyin_convert.py
    content/              HSK vocabulary + dialogues + dialogue exercises domain.
      db.py, models.py, seed.py, sync.py, exercises.py
      vocabulary_router.py, progress_router.py, dialogues_router.py,
      exercises_router.py, audio_router.py, sync_router.py
    activity/              Practice-event log + streak/daily-activity aggregation.
      db.py, models.py, repo.py, router.py, streak_router.py
    tts/                   edge-tts pronunciation audio, disk-cached.
      synth.py, router.py
  scripts/
    run.sh                venv bootstrap + backend launcher (Linux only).
  storage/                gitignored: SQLite DB + cached audio/video/tts files.
electron/
  main.js                 Spawns backend, owns the BrowserWindow, IPC for port.
  preload.js               contextBridge: exposes getBackendPort() to renderer.
  package.json             electron-builder config (Linux packaging only).
frontend/
  src/App.jsx              HashRouter + top-level routes.
  src/shell/                Shell.jsx (layout) + Sidebar.jsx (nav).
  src/features/             home, hsk_materials, listening, personal, settings, about.
  src/shared/               API clients, hooks, i18n-agnostic helpers.
  src/i18n/                 translations.js, LanguageContext.jsx, locale.js.
documents/                  You are here — deep-dive docs.
docs/                       The project's public landing page (static HTML site,
                             not app documentation — see docs/README.md).
```

## Data flow: adding a YouTube lesson

```
frontend (YoutubeListening.jsx, via lessonsApi.js)
  → POST /api/lessons { url }
      backend resolves video metadata synchronously (yt-dlp), inserts a
      `queued` lesson row (or returns the existing one if already added),
      and spawns a background thread (lessons/jobs.py: start_job)
  → frontend opens ws://127.0.0.1:<port>/ws/jobs/<lesson_id>
      backend streams {status, stage, progress_pct, error_message} events
      as the background thread walks: metadata → video download →
      audio extraction → transcription → sentence segmentation → done
  ← on "ready" or "error", the socket closes and the frontend refetches
    the lesson list to update the UI
```

See [backend.md](backend.md#pipeline-stages-lessonspipeline) for what each
stage actually does, and [api.md](api.md) for exact payload shapes.

## Data flow: practicing a YouTube lesson

```
frontend (YoutubeListening.jsx)
  → GET /api/lessons/{id}           (title, status, etc.)
  → GET /api/lessons/{id}/segments  (ordered list of {start_sec, end_sec,
                                      text_zh, pinyin})
  → <video> element's src is set directly to
    GET /media/video/{id}.mp4       (the full downloaded video file, served
                                      as a static file response)
```

The video is **not** embedded via the YouTube IFrame API — it's the actual
mp4 that `lessons/pipeline/youtube.py` downloaded during ingestion, served
locally and played with a plain HTML5 `<video>` element (a `file://`-loaded
Electron page can't use the IFrame embed). Sentence-by-sentence practice is
implemented client-side by seeking `video.currentTime` to each segment's
`start_sec` and polling until `end_sec` to auto-pause.

## Data flow: HSK vocabulary & dialogue practice

Unlike lessons (user-submitted, transcribed on demand), vocabulary and
dialogue content is **bundled content**, seeded into SQLite on first run
from `listening_backend/seed_data/` and refreshable from GitHub without an app
update:

```
frontend (hsk_materials/, listening/ dialogue components, via contentApi.js)
  → GET /api/vocabulary?level=...         vocabulary_router.py
  → GET /api/grammar?level=...            grammar_router.py
  → GET /api/dialogues                    dialogues_router.py (lines only)
  → GET /api/dialogue-exercises/{choice,cloze,dictation}   exercises_router.py
  → GET /api/dialogues/{id}/audio          audio_router.py (real recording,
                                            falls back to TTS if not cached)
  → POST /api/vocabulary/progress          progress_router.py ("learned" state)
```

Settings → "Cập nhật dữ liệu" triggers `POST /api/content/refresh`
(`content/sync_router.py` → `content/sync.py`), which re-pulls vocabulary,
grammar, dialogues, exercises, and dialogue audio from this repo on GitHub
and replaces the local rows — this is how content is updated without a new
app release. See [backend.md](backend.md#content-domain-contentseed-content-content) for the sync mechanics.

Grammar's "known" tracking is the one exception to this domain's usual
shape: unlike vocabulary's `POST /api/vocabulary/progress`, there is no
`/api/grammar/progress` — the frontend tracks it entirely in
`localStorage` (`useGrammarProgress.js`), since it's a small local-only
convenience rather than data that needs to survive a reinstall.

## Data flow: activity tracking (streaks, daily heatmap)

Every completed practice interaction (vocab drill, dialogue exercise,
lesson segment, etc.) is logged as a row in `practice_events`
(`activity/db.py`) via `POST /api/activity/events`. `activity/repo.py`
aggregates that append-only log into the two things the home dashboard
needs — `GET /api/activity/daily` (heatmap) and `GET /api/streak`
(consecutive-day streak) — computed on read, not stored redundantly.
