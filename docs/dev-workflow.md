# Dev workflow, debugging, packaging

## Prerequisites

- Python 3.10+ on `PATH` (`python3` on Linux, `python` on Windows).
- Node.js 18+ and npm.
- `ffmpeg` on `PATH` (used by `pipeline/youtube.py` to extract WAV audio
  from the downloaded video — required even though yt-dlp itself doesn't
  need it for the download step).

## Running locally

```bash
npm install    # postinstall hook runs `cd electron && npm install`
npm run dev    # -> cd electron && npm run start -> `electron .`
```

`npm run dev` launches Electron, which (in `electron/main.js`) spawns
`backend/scripts/run.sh` (`run.ps1` on Windows) as a child process. First
run creates `backend/.venv/` and does `pip install -e backend` — this
pulls in faster-whisper + CTranslate2 + yt-dlp, several hundred MB, so the
very first launch is slow; every launch after that just execs
`.venv/bin/python -m listening_backend.main` and is fast.

There is no separate "run backend only" or "run frontend only" script —
the backend is a standard FastAPI app though, so for backend-only
iteration you can bypass Electron entirely:

```bash
cd backend
source .venv/bin/activate   # after at least one npm run dev has bootstrapped it
python -m listening_backend.main
# prints "READY <port>" once bound — hit it directly, e.g.:
curl http://127.0.0.1:<port>/health
```

For frontend-only iteration against an already-running backend, you'd need
to either open `frontend/index.html` directly in a browser (it will fail —
`window.listeningApp` only exists inside Electron's preload-injected
context) or temporarily stub `getBackendPort()`; there's no dev proxy/mock
set up for this today.

## Configuration while developing

All backend settings are env vars prefixed `LISTENING_`, read by
`config.Settings` (pydantic-settings). Useful ones:

```bash
LISTENING_PORT=8000 npm run dev                       # fixed port instead of OS-assigned
LISTENING_WHISPER_MODEL_SIZE=tiny npm run dev          # faster, less accurate — good for iterating on pipeline code
LISTENING_WHISPER_DEVICE=cuda LISTENING_WHISPER_COMPUTE_TYPE=float16 npm run dev
LISTENING_PINYIN_STYLE=numeric npm run dev             # ni3 hao3 instead of nǐ hǎo
```

Since `npm run dev` execs through two shells (`npm` → `electron` → `bash
run.sh` → `python`), env vars set on the `npm run dev` invocation do
propagate through (child processes inherit the environment), so the above
works as shown.

## Storage / cache during development

Everything lives under `backend/storage/` in a repo checkout (writable
case of `config._storage_dir()`): `listening.db` (SQLite) plus
`audio_cache/*.wav` and `video_cache/*.mp4`, keyed by YouTube video id.

- To fully reset app state: stop the app and delete `backend/storage/`
  (it's recreated by `ensure_storage_dirs()`/`init_db()` on next launch).
- To force a lesson to re-download/re-transcribe without wiping everything:
  delete the lesson via the UI (or `DELETE /api/lessons/{id}`) **and**
  manually remove its cached files from `audio_cache/`/`video_cache/` —
  deleting the lesson row alone does *not* delete the cache files (this is
  intentional, see [api.md](api.md#delete-apilessonslesson_id)), so
  re-adding the same URL will skip straight past download/extraction and
  go directly to transcription.
- To inspect the DB directly: `sqlite3 backend/storage/listening.db`.

## Debugging

- Backend logs (uvicorn `log_level="warning"` plus any `print`/exceptions)
  are piped to Electron's stdout/stderr and printed with a `[backend]`
  prefix by `main.js` — check the terminal you ran `npm run dev` from.
- Open Electron's DevTools for frontend debugging: not currently wired to
  a shortcut or auto-opened in `main.js` — add
  `mainWindow.webContents.openDevTools()` temporarily in `createWindow()`
  if you need it (don't leave it in for a shipped build).
- A silently-stuck lesson (stuck at some `status`/`progress_pct` forever)
  almost always means the backend process died mid-job — background jobs
  run on a `ThreadPoolExecutor` with no persistence/resume, so a backend
  restart abandons any in-flight job (see
  [backend.md](backend.md#background-jobs--progress-jobspy)). Check the
  terminal for a Python traceback, and manually reset/delete the stuck
  lesson row.
- `yt_dlp`/ffmpeg failures usually surface cleanly as the lesson's
  `error_message` (both `youtube.py` functions wrap failures in typed
  exceptions with the underlying message) — check that first before
  digging into logs.

## Known limitations to be aware of when extending

- **Sentence splitting** (`pipeline/sentence_split.py`) is a simple regex
  on `。！？!?` — it doesn't account for quotes, parentheses, ellipses, or
  Whisper mistranscribing punctuation. If a Whisper segment has no
  sentence-final punctuation at all, `split_sentences` returns it as a
  single "sentence" (the regex still matches the whole unterminated run).
- **Sentence timestamps are approximated**, not real per-sentence ASR
  output — proportional-to-character-count redistribution within each
  Whisper segment (see [backend.md](backend.md#pipeline-stages)). This can
  visibly drift for segments with pauses or non-uniform speech rate.
- **Dictation grading** (`practice.js: checkAnswer`) is a naive index-wise
  character comparison, not an edit-distance/alignment diff — a single
  extra/missing character makes every following character show as wrong
  even if correct. See [frontend.md](frontend.md#practicehtml--jspracticejs--practice-view).
- **No job resume after backend restart/crash** — an in-flight lesson is
  simply abandoned; there's no persisted job queue.
- **Re-adding a previously-errored lesson does nothing** —
  `POST /api/lessons` treats any existing row (including `error` status) as
  "already exists," returns it unchanged, and does *not* restart the job.
  The user must delete it first.
- The top-level README describes practice video playback via "the YouTube
  IFrame API" — that's stale relative to the current implementation, which
  downloads the full video and plays it with a plain HTML5 `<video>` tag
  pointed at `/media/video/{id}.mp4` (see
  [architecture.md](architecture.md#data-flow-practicing-a-lesson)). Trust
  the code/these docs over that specific README paragraph if they ever
  diverge further.

## Packaging / building an installer

```bash
npm run build:linux   # electron-builder --linux -> dist/*.AppImage, dist/linux-unpacked/
npm run build:win     # electron-builder --win  -> dist/*.exe (NSIS installer)
npm run build:rpm     # build:linux, then scripts/build_rpm.sh -> dist/*.rpm
```

`electron/package.json`'s `build` config controls what gets bundled:
`backend/` and `frontend/` are copied in as `extraResources` (excluding
`.venv`, `*.egg-info`, and any existing `storage/` cache/db — packaging
always ships a clean backend source tree, never a dev machine's cached
media or database).

**The installer does not bundle Python or ffmpeg** — the end user still
needs both on their system; `run.sh`/`run.ps1` create the venv on first
launch of the *installed* app too. This is called out as a known v1
limitation in the top-level README; a fully offline single-binary build
(PyInstaller-freezing the backend into the app) would be the follow-up if
that's ever prioritized.

**Fedora `.rpm` specifics** (`scripts/build_rpm.sh`): bypasses
electron-builder's bundled `fpm` because modern `rpmbuild` (Fedora 41+, and
by extension current Fedora releases) doesn't honor fpm's
`--define buildroot=...` override — the script hand-writes an rpm spec
instead and lets `rpmbuild` compute its own buildroot. It installs to
`/opt/ListeningPractice` (root-owned, hence `config.py`'s writable-check
fallback to `~/.local/share/ListeningPractice` for storage and
`run.sh`'s equivalent fallback for the venv). Prerequisite: run
`npm run build:linux` first so `dist/linux-unpacked/` exists.
