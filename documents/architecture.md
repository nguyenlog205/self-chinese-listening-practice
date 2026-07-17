# Architecture

## High-level shape

This is an Electron desktop app with three independent layers that only
talk to each other over local HTTP/WebSocket — there is no shared code or
shared process between them:

```
electron/   Node.js main process: spawns the Python backend as a child
            process, opens a BrowserWindow, loads frontend/index.html.
backend/    Python/FastAPI process: exposes a REST + WebSocket API on a
            local port, owns the SQLite DB and all media files, runs the
            transcription pipeline in background threads.
frontend/   Static HTML/CSS/vanilla-JS pages, loaded by Electron's renderer
            via file://. Talks to the backend exclusively via fetch/WebSocket
            over http://127.0.0.1:<port>.
```

There is no build step for the frontend (no bundler, no framework) and no
shared types between backend and frontend — the contract between them is
just the JSON shapes documented in [api.md](api.md).

## Process lifecycle

1. Electron's main process (`electron/main.js`) starts, and before opening
   any window, spawns `backend/scripts/run.sh` (or `run.ps1` on Windows) as
   a child process.
2. That script creates a Python venv on first run (installing the backend
   package + its ML dependencies — faster-whisper, yt-dlp, pypinyin, etc.),
   then execs `python -m listening_backend.main`.
3. The backend binds to a free OS-assigned TCP port (`127.0.0.1:0`) and,
   once uvicorn has actually started listening, prints `READY <port>` to
   stdout.
4. `main.js` watches the child process's stdout for that line, parses out
   the port, and only then creates the `BrowserWindow` and loads
   `frontend/index.html`.
5. The port is handed to the renderer via a single IPC call
   (`get-backend-port`, exposed through `electron/preload.js` as
   `window.listeningApp.getBackendPort()`) rather than being baked into any
   file — this is what lets the backend claim an arbitrary free port instead
   of a hardcoded one.
6. On `before-quit`, Electron kills the backend child process. There is no
   graceful shutdown handshake — the backend is expected to tolerate being
   SIGKILLed mid-request (SQLite writes are individually committed per
   connection, see [backend.md](backend.md#database)).

Why a real child process instead of an in-process Python (e.g. via a
subinterpreter) or a bundled binary: this keeps the ML dependency stack
(faster-whisper, CTranslate2, yt-dlp) entirely out of the Electron/Node
world, at the cost of the first-run venv setup and requiring Python +
ffmpeg on the end user's machine (see the "Known v1 limitation" note in the
top-level README).

## Directory layout reference

```
backend/
  listening_backend/
    main.py           FastAPI app factory + uvicorn entrypoint (READY line)
    config.py         Settings (env-var overridable) + storage path resolution
    db.py             SQLite schema + connection helper
    models.py         Pydantic request/response schemas
    jobs.py           Background job runner + WebSocket progress broadcast
    api/
      lessons.py      CRUD-ish REST endpoints for lessons/segments
      jobs.py         WebSocket endpoint for live job progress
      media.py        Serves cached audio/video files by lesson id
    pipeline/
      youtube.py      yt-dlp metadata + video download + ffmpeg audio extract
      transcribe.py   faster-whisper transcription + sentence timestamp split
      sentence_split.py  Regex sentence splitter for Chinese punctuation
      pinyin_convert.py  pypinyin wrapper
  scripts/
    run.sh / run.ps1  venv bootstrap + backend launcher (see dev-workflow.md)
  storage/            gitignored: SQLite DB + cached audio/video files
electron/
  main.js             Spawns backend, owns the BrowserWindow, IPC for port
  preload.js          contextBridge: exposes getBackendPort() to renderer
  package.json        electron-builder config (packaging targets/filters)
frontend/
  index.html / js/library.js    Library view (add link, list, progress bars)
  practice.html / js/practice.js  Practice view (video + subtitles + dictation)
  js/api.js           Shared fetch/WebSocket client used by both pages
  css/style.css       Shared stylesheet
docs/                 You are here.
```

## Data flow: adding a lesson

```
frontend (index.html)
  → POST /api/lessons { url }
      backend inserts a `queued` lesson row, returns it immediately,
      and spawns a background thread (jobs.start_job)
  → frontend opens ws://.../ws/jobs/<lesson_id>
      backend streams {status, stage, progress_pct, error_message} events
      as the background thread walks: metadata → video download →
      audio extraction → transcription → sentence segmentation → done
  ← on "ready" or "error", the socket closes and the frontend refetches
    /api/lessons to update the card
```

See [backend.md](backend.md#pipeline-stages) for what each stage actually
does, and [api.md](api.md) for exact payload shapes.

## Data flow: practicing a lesson

```
frontend (practice.html)
  → GET /api/lessons/{id}          (title, status, etc.)
  → GET /api/lessons/{id}/segments (ordered list of {start_sec, end_sec,
                                     text_zh, pinyin})
  → <video> element's src is set directly to
    GET /media/video/{id}.mp4      (the full downloaded video file, served
                                     as a static file response)
```

The video is **not** embedded via the YouTube IFrame API — it's the actual
mp4 that `pipeline/youtube.py` downloaded during ingestion, served locally
and played with a plain HTML5 `<video>` element. Sentence-by-sentence
practice is implemented client-side by seeking `video.currentTime` to each
segment's `start_sec` and polling (`setInterval`, 200ms) until
`end_sec` to auto-pause. See [frontend.md](frontend.md) for the full
practice-view state machine.
