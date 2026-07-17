# Listening Practice (desktop app)

An Electron desktop app for practicing Chinese listening and dictation:
HSK vocabulary drills, dialogue-based listening exercises, and YouTube-video
transcription (Whisper + pinyin) for sentence-by-sentence practice — all
running against a local Python backend, no account or server required.

## Features

- **HSK vocabulary practice** (levels 1-6 and 7-9): flashcard-style
  vocabulary browser, listen-and-type dictation, multiple choice, and
  character-ordering games, plus a mock test mode.
- **Dialogue listening**: multiple-choice comprehension, fill-in-the-blank
  (cloze), and full-sentence dictation, all drawn from a shared pool of
  dialogue recordings/scripts.
- **YouTube listening**: paste a link, the backend transcribes it
  (faster-whisper) and converts to pinyin, then you practice sentence by
  sentence with toggleable subtitles/pinyin and optional dictation grading.
- **Progress tracking**: daily streak, activity heatmap, and per-HSK-level
  progress, all local (SQLite) — no account needed.
- **Multi-language UI**: Vietnamese, English, Simplified Chinese, and
  Traditional Chinese, switchable in Settings.
- **Script/phonetic preferences**: toggle Simplified ↔ Traditional hanzi and
  Pinyin ↔ Zhuyin (Bopomofo) display anywhere hanzi is shown, independent of
  the UI language.
- **Content updates without a new release**: vocabulary, dialogues, and
  exercises live as JSON in this repo (`backend/listening_backend/seed_data/`)
  and can be refreshed from Settings ("Cập nhật dữ liệu") without
  reinstalling the app.

## Project layout

```
backend/        Python/FastAPI backend — REST API, SQLite storage, the
                 YouTube transcription pipeline (yt-dlp + faster-whisper),
                 edge-tts pronunciation audio, and content sync from GitHub.
electron/       Electron main process: spawns the backend, opens the window.
frontend/       React + Vite renderer UI.
docs/           Deep-dive docs (architecture, API reference, backend
                 pipeline) — written against an earlier plain HTML/CSS/JS
                 frontend that has since been replaced by the current React
                 app; treat frontend-specific claims there as historical,
                 not current.
scripts/        Packaging helpers (e.g. `build_rpm.sh`).
```

## Prerequisites

- **Python 3.10+** on PATH (`python3` on Linux, `python` on Windows)
- **Node.js 18+** and npm
- **ffmpeg** on PATH (required by yt-dlp/faster-whisper for audio extraction)
  - Fedora: `sudo dnf install ffmpeg`
  - Windows: `winget install ffmpeg` (or download and add to PATH manually)

The Python backend's virtual environment is created automatically on first
run (see `backend/scripts/run.sh` / `run.ps1`) — no manual `pip install`
needed.

## Running in development

Development runs the frontend and Electron as two separate processes —
there's no single script that starts both, so use two terminals:

```bash
# terminal 1: the frontend's Vite dev server (hot reload)
cd frontend
npm install
npm run dev             # serves on http://localhost:5173

# terminal 2: Electron, which spawns the Python backend itself
npm install              # root install; postinstall also installs electron/node_modules
npm run dev              # -> cd electron && npm run start -> electron .
```

Electron's main process (`electron/main.js`) spawns
`backend/scripts/run.sh` (`run.ps1` on Windows) before opening any window.
That script creates `backend/.venv/` on first run and installs the backend
package (`pip install -e backend`) — this pulls in faster-whisper + its
CTranslate2 backend + yt-dlp, several hundred MB, so the very first launch
is slow; subsequent launches just exec the already-installed venv and are
fast. In dev mode (`!app.isPackaged`), the window loads
`http://localhost:5173` (terminal 1's Vite server) directly.

For backend-only iteration (no Electron/frontend needed), once the venv
exists:

```bash
cd backend
.venv/bin/python -m listening_backend.main
# prints "READY <port>" once bound, e.g.:
curl http://127.0.0.1:<port>/health
```

## Running tests

```bash
cd backend
.venv/bin/pip install -e ".[dev]"   # once, installs pytest
.venv/bin/python -m pytest -v
```

There is currently no frontend test suite (`frontend/` has no
vitest/testing-library set up yet) — `npm run lint` (oxlint) and `npm run
build` are the only automated frontend checks.

## Building an installer

```bash
npm run build:linux   # builds frontend/, then packages -> produces an AppImage under dist/
npm run build:win     # same, but an NSIS installer (run on Windows, or cross-build)
```

Both scripts build `frontend/` first (`frontend/dist/`) and bundle that
output via `electron/package.json`'s `extraResources`, which
`electron/main.js` loads in production (`frontend/dist/index.html`).

**Known limitation**: the built installer still requires the end user to
have Python 3.10+ and ffmpeg on their machine — the backend venv is created
on first launch, it is not frozen into the installer. A fully offline,
single-binary build (PyInstaller-freezing the backend) is a follow-up, not
done yet.

## Configuration

Backend settings (Whisper model size/device, pinyin style, audio format) live
in `backend/listening_backend/config.py`, overridable via `LISTENING_*`
environment variables, e.g.:

```bash
LISTENING_WHISPER_DEVICE=cuda LISTENING_WHISPER_COMPUTE_TYPE=float16 npm run dev
```

Whisper defaults to CPU (`model_size=base`, `compute_type=int8`) so the app
works out of the box on any machine, GPU or not.

## Content updates

Vocabulary, dialogues, and dialogue exercises (choice/cloze/dictation) live
as JSON under `backend/listening_backend/seed_data/` (see
`seed_data/CONVENTION.md` for the file formats) and are seeded into SQLite
on first run. Clicking "Cập nhật dữ liệu" in Settings re-pulls the latest
versions of these files straight from this repo on GitHub — so content can
be updated by committing new/edited seed files and pushing, without a new
app release.

Data lives under `backend/storage/` (SQLite database + cached audio/video) —
entirely local and gitignored.

## Further documentation

See [docs/](docs/) for architecture notes, the backend pipeline in detail,
and the full API reference — useful for the backend and data model, but
written against an earlier plain-JS frontend that no longer exists (see
"Project layout" above), so frontend-specific sections there are out of
date.
