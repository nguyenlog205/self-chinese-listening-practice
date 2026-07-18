# Documentation index

This `documents/` folder is the deep-dive documentation for the Listening
Practice desktop app. The top-level [README.md](../README.md) covers
install/run/build; these docs cover how the app actually works internally,
so a new contributor can extend it without archaeology. (Don't confuse
this with [`docs/`](../docs/) — that's the project's public landing page,
a static HTML site, not app documentation; see `docs/README.md`.)

- [architecture.md](architecture.md) — process model (Electron ↔ FastAPI ↔
  React), directory layout, request/data flow for each major feature,
  storage layout.
- [backend.md](backend.md) — the Python backend in detail: the four
  domains (lessons, content, activity, tts), YouTube pipeline stages,
  job/progress system, database schema, configuration, content sync.
- [api.md](api.md) — full REST + WebSocket API reference, all domains.
- [frontend.md](frontend.md) — the React app: routing, features, shared
  hooks/API clients, i18n.
- [dev-workflow.md](dev-workflow.md) — running locally, debugging, common
  gotchas, packaging/build notes (Linux only).

Read `architecture.md` first if you're new to the codebase.
