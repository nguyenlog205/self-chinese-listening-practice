# Backend

Python package `listening_backend` (installed as `listening-backend`, see
`backend/pyproject.toml`), served by FastAPI/uvicorn. Single process,
single SQLite file, background YouTube-transcription work done via a
thread pool. Organized into four independent **domains**, each its own
subpackage with its own schema fragment, models, and router(s) —
`lessons/`, `content/`, `activity/`, `tts/` — wired together only in
`main.py`.

## Entry point (`main.py`)

- `create_app()` builds the FastAPI app: ensures storage dirs exist,
  initializes the DB schema (`db.init_db()`, which runs every domain's
  schema), registers all domain routers (12 in total) plus `GET /health`,
  and adds a wide-open CORS middleware (`allow_origins=["*"]` — fine here
  since the server only ever binds to `127.0.0.1` for a single local
  desktop user).
- `main()` (the console entry point run by `scripts/run.sh`) picks a port
  (an explicit `LISTENING_PORT` env var, or an OS-assigned free port via
  `socket.bind(("127.0.0.1", 0))`), starts uvicorn, and prints
  `READY <port>` to stdout **only after** `server.started` is true — this
  is the line Electron's main process greps for to learn the port.
- A `lifespan` context stashes the running asyncio event loop
  (`lessons.jobs.set_main_loop`) so background *threads* (the YouTube
  pipeline) can schedule callbacks (WebSocket broadcasts) onto the *async*
  loop via `loop.call_soon_threadsafe`.

## Configuration (`config.py`)

`Settings` (pydantic-settings) reads env vars prefixed `LISTENING_`, e.g.
`LISTENING_WHISPER_DEVICE=cuda`. Fields: `host`, `port`,
`whisper_model_size`, `whisper_device`, `whisper_compute_type`,
`whisper_language`, `pinyin_style`, `audio_sample_rate`, `audio_channels`.
Defaults are CPU-friendly (`base` model, `int8` compute) so the app works
out of the box without a GPU.

**Storage path resolution** (`_storage_dir()`) is the one piece of logic
worth understanding before touching packaging: it writes to
`backend/storage/` when that directory is writable (repo checkout / dev
mode), and falls back to an XDG data dir
(`$XDG_DATA_HOME/ListeningPractice/storage`, default
`~/.local/share/ListeningPractice/storage`) when it's not — e.g. installed
system-wide under `/opt` by the Fedora `.rpm`, which is root-owned. This
mirrors the same read-only-install accommodation `scripts/run.sh` makes for
the venv (see [dev-workflow.md](dev-workflow.md)). If you add new
persistent state, put it under one of the `*_DIR` constants this module
exposes (`STORAGE_DIR`, `AUDIO_CACHE_DIR`, `VIDEO_CACHE_DIR`,
`DIALOGUE_AUDIO_CACHE_DIR`, `TTS_CACHE_DIR`) rather than hardcoding a path,
so it inherits this fallback.

## Database (`db.py` + per-domain `db.py`)

Plain `sqlite3`, no ORM. Top-level `db.py::init_db()` runs each domain's
`*_SCHEMA` string (idempotent `CREATE TABLE IF NOT EXISTS`) via
`executescript`, then calls `content.seed.seed_if_empty()`. There is no
migration framework; if you change a schema, you're responsible for either
keeping it additive/backward-compatible or handling old DBs, since
existing users' `storage/` carries over across app updates.

`get_conn()` is a context manager: opens a connection, sets
`row_factory = sqlite3.Row` and `PRAGMA foreign_keys = ON`, commits on
clean exit, always closes. Every DB access in the codebase goes through
`with get_conn() as conn:` — there's no long-lived shared connection or
pool (SQLite + a single local process doesn't need one).

### `lessons` domain schema

- **`lessons`**: `id` (the YouTube video id — also the primary key, so
  re-adding the same URL is idempotent), `source_url`, `title`, `status`,
  `progress_pct`, `stage`, `error_message`, `duration_sec`, `created_at`,
  `last_practiced_at`.
- **`segments`**: one row per sentence — `lesson_id` (FK, `ON DELETE
  CASCADE`), `idx` (0-based order within the lesson), `start_sec`,
  `end_sec`, `text_zh`, `pinyin`. `UNIQUE(lesson_id, idx)`.

### `content` domain schema

- **`vocab_words`**: `id`, `level` (`"1"`..`"6"` or `"7-9"`), `hanzi`,
  `pinyin`, `en`, `vi`.
- **`grammar_points`**: `id` (PK, stable across syncs — the frontend's local
  "known" tracking keys off it), `level`, `data` (JSON blob — `title`,
  `structure`, `explanation`, `examples`; see
  `seed_data/CONVENTION.md#grammar`).
- **`reading_passages`**: `id` (PK, stable across syncs), `level`, `data`
  (JSON blob — `title`, `hanzi`, `pinyin`, `translation`; see
  `seed_data/CONVENTION.md#reading`). Unlike `READING_PASSAGES` in the old
  frontend-bundled version, this is a list per level (multiple passages),
  not exactly one.
- **`dialogues`**: `id`, `level`, `data` (JSON blob — the dialogue lines).
- **`vocab_progress`**: `hanzi` (PK), `level`, `learned_at` — which words
  the user has marked "learned"; existence of a row *is* the state (no
  boolean column).
- **`dialogue_exercises_choice` / `_cloze` / `_dictation`**: `id`,
  `audio_id` (FK → `dialogues.id`), `data` (JSON — shape differs per kind:
  choice has `question`/`options`, cloze has `blanks`, dictation has
  `target_line`; all three also carry `lines_from_dialogue`).
- **`dialogues_audio_metadata`**: `id` (FK → `dialogues.id`), `data` (JSON
  — `audio_file`, `duration_sec`, per-exercise timing gaps).

### `activity` domain schema

- **`practice_events`**: append-only log, one row per completed practice
  interaction — `id`, `created_at`, `mode`, `item_type`, `item_id`,
  `level`, `is_correct`. This is the **single source of truth**; streaks
  and the daily heatmap are computed from it on read (`activity/repo.py`),
  not stored as separate aggregate tables — so there's nothing to keep in
  sync when the log changes.

## `lessons` domain — YouTube ingestion & practice

### Lesson status lifecycle

A lesson's `status`/`stage`/`progress_pct` walk through, in order:

| status         | stage           | progress_pct (approx) |
|----------------|-----------------|------------------------|
| `queued`       | `queued`        | 0 (row just inserted)  |
| `downloading`  | `metadata`      | 2                      |
| `downloading`  | `video`         | 10 → 65                |
| `downloading`  | `audio`         | 68                     |
| `transcribing` | `transcribing`  | 72 → 92                |
| `segmenting`   | `segmenting`    | 92                     |
| `ready`        | `done`          | 100                    |
| `error`        | `error`         | 0                      |

`error` can be reached from any prior state — the whole pipeline body in
`jobs._run_pipeline` is wrapped in a broad `except Exception`, storing
`str(exc)` as `error_message`. There's no retry; the user must delete and
re-add the lesson (downloaded video/audio files are cache-hit and skipped,
see below).

### Pipeline stages (`lessons/pipeline/`)

Each pipeline module is deliberately "the only place that imports X" (a
comment convention used throughout) so the corresponding third-party
dependency is easy to find/swap.

1. **`youtube.extract_info(url)`** — uses `yt_dlp.YoutubeDL(skip_download=True)`
   to fetch `id`, `title`, `duration`. Raises `MetadataExtractionError` on
   failure (surfaced as a 400 from `POST /api/lessons`, not a background
   job error, since it happens synchronously before the lesson row is even
   created).
2. **`youtube.download_video(video_id, url, on_progress)`** — downloads the
   best mp4 video+audio (`bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[...]`),
   merged into a single mp4, into `VIDEO_CACHE_DIR/{video_id}.mp4`. **Cached
   by file existence**: if the file is already there, returns immediately
   without hitting the network — this is what makes re-adding an existing
   lesson (or retrying after a transcription-stage error) cheap. Video (not
   audio-only) is downloaded because the practice view plays it locally
   with an HTML5 `<video>` tag — there's no way to stream just the audio
   track and get a synced video for free without the IFrame embed.
3. **`youtube.extract_audio_wav(video_path, video_id, sample_rate,
   channels)`** — runs `ffmpeg` (subprocess, must be on `PATH`) on the
   already-downloaded video to produce a mono WAV in `AUDIO_CACHE_DIR`, no
   further network call. Also cached by file existence.
4. **`transcribe.transcribe(audio_path, model_size, device, compute_type,
   language, on_progress)`** — loads a `faster_whisper.WhisperModel`
   (cached in-process per `(model_size, device, compute_type)` tuple, so
   switching settings mid-session doesn't reuse a stale model, but repeated
   lessons at the same settings don't reload the model each time). Whisper
   segments (its own sentence-ish chunks) are then **re-split** by
   `_split_segment`: each Whisper segment's text is split into Chinese
   sentences (`sentence_split.split_sentences`) and its `[start, end]` time
   window is redistributed across those sentences proportionally to
   character count — an approximation, since Whisper doesn't give
   per-sentence timestamps.
5. **`sentence_split.split_sentences(text)`** — regex split on Chinese
   sentence-final punctuation (`。！？!?`), keeping the delimiter attached to
   the preceding sentence. No handling for quotes/parentheses/ellipses
   beyond that.
6. **`pinyin_convert.to_pinyin(text, style)`** — wraps `pypinyin.pinyin()`.
   `style` is either `tone_marks` (`Style.TONE`, e.g. `nǐ hǎo`) or
   `numeric` (`Style.TONE3`, e.g. `ni3 hao3`), controlled by
   `LISTENING_PINYIN_STYLE`. `errors="ignore"` silently drops characters
   pypinyin can't convert rather than crashing the whole segment.

Segments are inserted into the `segments` table only after transcription +
segmentation fully succeeds, in a single connection/transaction alongside
the final `status="ready"` update — so a lesson never shows as `ready`
with a partial segment list.

### Background jobs & progress (`lessons/jobs.py`)

- `start_job(lesson_id, url, settings)` submits `_run_pipeline` to a
  module-level `ThreadPoolExecutor(max_workers=2)` — at most two lessons
  transcribe concurrently; a third `add_lesson` call queues behind them.
  This is a plain thread pool, not a persistent queue: **jobs are lost on
  backend restart** if they were mid-flight; the lesson row is left stuck
  at whatever `status`/`stage` it last wrote.
- Progress is delivered to clients two ways, kept in sync from the same
  call site (`_report`): (1) written to the `lessons` row in SQLite, so a
  fresh page load / `GET /api/lessons` always reflects current state, and
  (2) broadcast to any subscribed WebSocket queues via `_broadcast`.
- `_listeners: dict[lesson_id, set[asyncio.Queue]]` + a `threading.Lock`
  (subscribe/unsubscribe/broadcast are called from both the async
  request-handling thread and the background pipeline threads) is the
  pub-sub registry. `_broadcast` uses
  `_main_loop.call_soon_threadsafe(queue.put_nowait, event)` specifically
  because it's invoked from a background *thread*, not the event loop.
- The video-download progress callback clamps to non-decreasing
  percentages — yt-dlp reports the video and audio streams as two separate
  downloads before muxing, each restarting its own 0→1 fraction, which
  would otherwise make the progress bar jump backward once.

### Routers

- **`lessons/router.py`** (`/api/lessons`): `POST /api/lessons` calls
  `youtube.extract_info(url)` **synchronously** (blocking the request) to
  resolve the video id before touching the DB, so re-submitting the same
  URL is idempotent (looks up `lessons` by the resolved video id and
  returns the existing row instead of inserting a duplicate / starting a
  second job — including if that row previously errored; there is no
  automatic retry). Only after that lookup does it insert the row and call
  `jobs.start_job` (returns immediately; the pipeline runs on the thread
  pool).
- **`lessons/jobs_router.py`**: the `/ws/jobs/{lesson_id}` WebSocket. On
  connect, immediately sends the lesson's *current* DB state as one
  message (so a client that connects after the lesson already reached
  `ready`/`error` gets that terminal state right away and the handler
  returns without ever subscribing). Otherwise it subscribes and forwards
  every broadcast event until one with `status in ("ready", "error")`
  arrives, then closes.
- **`lessons/media_router.py`**: two plain `FileResponse` endpoints
  (`/media/audio/{id}.wav`, `/media/video/{id}.mp4`) that 404 if the cache
  file isn't present. No range-request handling beyond what FastAPI's
  `FileResponse` gives for free — video seeking in the practice view
  relies on that.

## `content` domain — HSK vocabulary, dialogues, exercises

Bundled reference content, not user-submitted — the opposite lifecycle
from `lessons`: seeded once into SQLite, then optionally refreshed
wholesale from GitHub, never generated on the fly.

- **`content/seed.py::seed_if_empty(conn)`** — called once from top-level
  `db.init_db()`. Loads `listening_backend/seed_data/vocabulary/hsk_*.json`,
  `grammar/hsk_*.json`, `reading/hsk_*.json`, `dialogues.json`, and
  `dialogue_exercises/{choice,cloze,dictation}/*.json` into their tables,
  but **only if the relevant table is empty** — a first-run-only seed, it
  never overwrites existing rows.
- **`listening_backend/seed_data/CONVENTION.md`** documents the JSON shape for each
  content kind and the authoring workflow (add a dialogue → add exercises
  referencing its `audio_id` → record real audio → add timing metadata →
  push → user clicks "Cập nhật dữ liệu"). Read it before adding/editing
  seed content.
- **`content/sync.py::refresh_content(conn)`** — the GitHub content-sync
  mechanism, invoked by `POST /api/content/refresh`. Fetches vocabulary,
  grammar, reading, and dialogues via
  `raw.githubusercontent.com/.../seed_data/...`
  (no auth, public repo), and lists exercise JSON files per-kind via the
  GitHub Contents API (raw doesn't support directory listing). Unlike the
  first-run seed, this always `DELETE`s then re-`INSERT`s each table, so it
  picks up edits and removals, not just additions. Dialogue audio
  (`dialogues_audio/{id}/audio.mp3`) is fetched into
  `DIALOGUE_AUDIO_CACHE_DIR` as a flat `{id}.mp3`; a missing audio/metadata
  file (404) is tolerated, not an error — the frontend falls back to TTS
  playback for dialogues without a real recording.
- **`content/exercises.py`** — shared row-building/validation helpers used
  by the seed and sync paths for the three exercise kinds.
- **`content/audio_router.py`** (`GET /api/dialogues/{id}/audio`) — prefers
  the writable sync cache (`DIALOGUE_AUDIO_CACHE_DIR`, may be newer than
  what shipped with the app) over the bundled `seed_data` copy; 404s if
  neither exists, which is how the frontend (`useDialogueAudio.js`)
  decides to fall back to `GET /api/tts` instead.
- **`content/vocabulary_router.py`, `grammar_router.py`,
  `reading_router.py`, `dialogues_router.py`, `exercises_router.py`,
  `progress_router.py`** — plain read/write endpoints over the tables
  above; see [api.md](api.md) for exact shapes. `grammar_router.py`'s and
  `reading_router.py`'s single `GET /api/grammar?level=` /
  `GET /api/reading?level=` read `grammar_points` / `reading_passages` and
  re-hydrate each row's JSON `data` column into the response shape —
  neither has a progress endpoint: unlike vocabulary's server-side
  "learned" state, grammar's "known" tracking lives only in frontend
  `localStorage` (`useGrammarProgress.js`), and reading has no progress
  concept at all yet.

## `activity` domain — streaks & daily activity

- **`activity/repo.py`** — pure aggregation logic, no router: `insert_event`,
  `clear_all`, `get_daily_counts(conn, days)` (per-day event counts for the
  heatmap), `compute_streak(conn)` (consecutive-day streak ending today or
  yesterday). Kept separate from the routers so both can share the exact
  same query logic without copy-paste, and so it's unit-testable without
  spinning up FastAPI (`tests/test_activity_repo.py`).
- **`activity/router.py`** (`/api/activity`): `POST /events` logs one
  practice interaction (`mode`, `item_type`, `item_id`, `level`,
  `is_correct`); `DELETE /events` clears the whole log (used by a
  "reset progress" settings action); `GET /daily?days=N` returns the
  per-day counts.
- **`activity/streak_router.py`** (`/api/streak`): `GET /api/streak`,
  split into its own router/file because the streak algorithm ("consecutive
  days ending today or yesterday") is unrelated to "count events per day"
  and benefits from being tested in isolation.

## `tts` domain — pronunciation audio

- **`tts/synth.py`** — text-to-speech via `edge-tts` (Microsoft Edge's free
  neural voices, no API key needed) rather than the browser's Web Speech
  API, which depends on voices installed at the OS/browser level and often
  lacks zh-CN on Linux. Voice `zh-CN-XiaoxiaoNeural`, rate `-10%`. Output is
  cached on disk in `TTS_CACHE_DIR`, keyed by a SHA-256 hash of the input
  text (first 24 hex chars) — so the same word/sentence is only ever
  synthesized once, across the whole app (vocab pronunciation, dialogue
  fallback audio, etc. all share this cache).
- **`tts/router.py`** (`GET /api/tts?text=...`) — returns the cached mp3
  (`Cache-Control: public, max-age=31536000, immutable`, since the content
  for a given text never changes), synthesizing on first request. A 502 if
  `edge-tts` itself fails (network/service issue — it calls a remote
  Microsoft service, unlike everything else in this backend which is fully
  local).

## Adding a new pipeline stage or endpoint

- New YouTube-pipeline step: add a module under `lessons/pipeline/`, call
  it from `jobs._run_pipeline` between existing stages, and add a
  `status`/`stage`/`progress_pct` tuple for it in the lifecycle table above
  (keep `progress_pct` monotonically increasing — the frontend doesn't
  defend against it going backward except for the video-download special
  case).
- New REST endpoint: add it to the relevant domain's router (or a new
  router in a new/existing domain, registered in `main.create_app`), and
  add/extend a `models.py` schema if it returns structured data. If it's a
  new content kind (like a new exercise type), also extend
  `listening_backend/seed_data/CONVENTION.md` and `content/sync.py` (paths there are `listening_backend/seed_data/...`, not under `content/`).
