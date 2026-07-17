# Backend

Python package `listening_backend` (installed as `listening-backend`,
see `backend/pyproject.toml`), served by FastAPI/uvicorn. Single-process,
single SQLite file, background work done via a thread pool.

## Entry point

`listening_backend/main.py`:

- `create_app()` builds the FastAPI app: ensures storage dirs exist,
  initializes the DB schema, registers the three routers
  (`lessons`, `jobs`, `media`) plus a `/health` endpoint, and adds a
  wide-open CORS middleware (`allow_origins=["*"]` — fine here since the
  server only ever binds to `127.0.0.1` for a single local desktop user).
- `main()` (the console entry point run by `scripts/run.sh`) picks a port
  (an explicit `LISTENING_PORT` env var, or an OS-assigned free port via
  `socket.bind(("127.0.0.1", 0))`), starts uvicorn, and prints
  `READY <port>` to stdout **only after** `server.started` is true — this
  is the line Electron's main process greps for to learn the port.
- A `lifespan` context stashes the running asyncio event loop
  (`jobs.set_main_loop`) so background *threads* can schedule callbacks
  (WebSocket broadcasts) onto the *async* loop via
  `loop.call_soon_threadsafe`.

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
persistent state, put it under `STORAGE_DIR`/`AUDIO_CACHE_DIR`/
`VIDEO_CACHE_DIR` from this module rather than hardcoding a path, so it
inherits this fallback.

## Database (`db.py`)

Plain `sqlite3`, no ORM. Schema (see `SCHEMA` in `db.py`):

- **`lessons`**: `id` (the YouTube video id — also the primary key, so
  re-adding the same URL is idempotent, see below), `source_url`, `title`,
  `status`, `progress_pct`, `stage`, `error_message`, `duration_sec`,
  `created_at`, `last_practiced_at`.
- **`segments`**: one row per sentence — `lesson_id` (FK, `ON DELETE
  CASCADE`), `idx` (0-based order within the lesson), `start_sec`,
  `end_sec`, `text_zh`, `pinyin`. `UNIQUE(lesson_id, idx)`.

`init_db()` runs the (idempotent, `CREATE TABLE IF NOT EXISTS`) schema on
every backend startup — there is no migration framework; if you change the
schema, you're responsible for either keeping it additive/backward-compatible
or bumping a version and handling old DBs, since existing users' `storage/`
carries over across app updates.

`get_conn()` is a context manager: opens a connection, sets
`row_factory = sqlite3.Row` and `PRAGMA foreign_keys = ON`, commits on
clean exit, always closes. Every DB access in the codebase goes through
`with get_conn() as conn:` — there's no long-lived shared connection or
connection pool (SQLite + a single local process doesn't need one).

## Lesson status lifecycle

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
`str(exc)` as `error_message`. There's no retry; the user must re-add the
lesson (which re-runs the full pipeline, though downloaded video/audio
files are cache-hit and skipped — see below).

## Pipeline stages (`pipeline/`)

Each pipeline module is deliberately "the only place that imports X" (a
comment convention used throughout) so the corresponding third-party
dependency is easy to find/swap.

1. **`youtube.extract_info(url)`** — `pipeline/youtube.py`. Uses
   `yt_dlp.YoutubeDL(skip_download=True)` to fetch `id`, `title`,
   `duration`. Raises `MetadataExtractionError` on failure (surfaced as a
   400 from `POST /api/lessons`, not a background job error, since it
   happens synchronously before the lesson row is even created).

2. **`youtube.download_video(video_id, url, on_progress)`** — downloads the
   best mp4 video+audio (`bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[...]`),
   merged into a single mp4, into `VIDEO_CACHE_DIR/{video_id}.mp4`. **Cached
   by file existence**: if the file is already there, returns immediately
   without hitting the network — this is what makes re-adding an existing
   lesson (or retrying after a transcription-stage error) cheap. Progress is
   reported via yt-dlp's `progress_hooks`, converted to a 0..1 fraction.
   Video (not audio-only) is downloaded because the practice view plays it
   locally with an HTML5 `<video>` tag — a `file://`-loaded Electron page
   can't use the YouTube IFrame embed, so there's no way to stream just the
   audio track and get a synced video for free.

3. **`youtube.extract_audio_wav(video_path, video_id, sample_rate,
   channels)`** — runs `ffmpeg` (subprocess, must be on `PATH`) on the
   already-downloaded video to produce a mono WAV in `AUDIO_CACHE_DIR`, no
   further network call. Also cached by file existence.

4. **`transcribe.transcribe(audio_path, model_size, device, compute_type,
   language, on_progress)`** — `pipeline/transcribe.py`. Loads a
   `faster_whisper.WhisperModel` (cached in-process per
   `(model_size, device, compute_type)` tuple in `_model_cache`, so
   switching settings mid-session doesn't reuse a stale model, but repeated
   lessons at the same settings don't reload the model each time). Whisper
   segments (its own sentence-ish chunks) are then **re-split** by
   `_split_segment`: each Whisper segment's text is split into Chinese
   sentences (`sentence_split.split_sentences`) and its `[start, end]` time
   window is redistributed across those sentences proportionally to
   character count. This is an approximation — Whisper doesn't give
   per-sentence timestamps, so this assumes roughly constant speech rate
   within a segment. Progress is reported per-Whisper-segment as
   `segment.end / total_duration`.

5. **`sentence_split.split_sentences(text)`** — regex split on Chinese
   sentence-final punctuation (`。！？!?`), keeping the delimiter attached to
   the preceding sentence. No handling for quotes/parentheses/ellipses
   beyond that — see [dev-workflow.md](dev-workflow.md#known-limitations)
   for where this can misbehave.

6. **`pinyin_convert.to_pinyin(text, style)`** — wraps `pypinyin.pinyin()`.
   `style` is either `tone_marks` (`Style.TONE`, e.g. `nǐ hǎo`) or
   `numeric` (`Style.TONE3`, e.g. `ni3 hao3`), controlled by
   `LISTENING_PINYIN_STYLE`. `errors="ignore"` silently drops characters
   pypinyin can't convert (e.g. stray Latin text) rather than crashing the
   whole segment.

Segments are inserted into the `segments` table only after transcription +
segmentation fully succeeds (`jobs._run_pipeline`, `stage="segmenting"`),
in a single connection/transaction alongside the final `status="ready"`
update — so a lesson never shows as `ready` with a partial segment list.

## Background jobs & progress (`jobs.py`)

- `start_job(lesson_id, url, settings)` submits `_run_pipeline` to a
  module-level `ThreadPoolExecutor(max_workers=2)` — at most two lessons
  transcribe concurrently; a third `add_lesson` call queues behind them.
  This is a plain thread pool, not a persistent queue: **jobs are lost on
  backend restart** if they were mid-flight (no resume-on-restart logic);
  the lesson row is left stuck at whatever `status`/`stage` it last wrote.
- Progress is delivered to clients two ways, kept in sync from the same
  call site (`_report`): (1) written to the `lessons` row in SQLite, so a
  fresh page load / `GET /api/lessons` always reflects current state, and
  (2) broadcast to any subscribed WebSocket queues via `_broadcast`.
- `_listeners: dict[lesson_id, set[asyncio.Queue]]` + `_listeners_lock`
  (a `threading.Lock`, since subscribe/unsubscribe/broadcast are called
  from both the async request-handling thread and the background pipeline
  threads) is the pub-sub registry. `_broadcast` uses
  `_main_loop.call_soon_threadsafe(queue.put_nowait, event)` specifically
  because it's invoked from a background *thread*, not the event loop.
- The video-download progress callback (`on_download_progress` in
  `_run_pipeline`) clamps to non-decreasing percentages
  (`max(last_pct[0], ...)`) — yt-dlp reports the video and audio streams as
  two separate downloads before muxing, each restarting its own 0→1
  fraction, which would otherwise make the progress bar jump backward once.

## API routers (`api/`)

Full request/response reference lives in [api.md](api.md); this section is
implementation notes.

- **`api/lessons.py`**: `POST /api/lessons` is the interesting one — it
  calls `youtube.extract_info(url)` **synchronously** (blocking the request)
  to resolve the video id before touching the DB, so that re-submitting the
  same URL is idempotent (it looks up `lessons` by the resolved video id
  and returns the existing row instead of inserting a duplicate / starting
  a second job). Only after that lookup does it insert the row and call
  `jobs.start_job` (which returns immediately; the actual pipeline runs on
  the thread pool).
- **`api/jobs.py`**: the `/ws/jobs/{lesson_id}` WebSocket. On connect, it
  immediately sends the lesson's *current* DB state as one message (so a
  client that connects after the lesson already reached `ready`/`error`
  gets that terminal state right away and the handler returns without ever
  calling `jobs.subscribe`). Otherwise it subscribes and forwards every
  broadcast event until one with `status in ("ready", "error")` arrives,
  then closes.
- **`api/media.py`**: two plain `FileResponse` endpoints
  (`/media/audio/{id}.wav`, `/media/video/{id}.mp4}`) that 404 if the cache
  file isn't present. No range-request handling beyond what FastAPI's
  `FileResponse` gives for free — video seeking in the practice view relies
  on that.

## Adding a new pipeline stage or endpoint

- New pipeline step: add a module under `pipeline/`, call it from
  `jobs._run_pipeline` between existing stages, and add a
  `status`/`stage`/`progress_pct` tuple for it in the table above (keep
  `progress_pct` monotonically increasing — the frontend doesn't defend
  against it going backward except for the video-download special case).
- New REST endpoint: add it to the relevant `api/*.py` router (or a new one,
  registered in `main.create_app`), and add/extend a `models.py` schema if
  it returns structured data.
