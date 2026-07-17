# Documentation index

This `docs/` folder is the deep-dive documentation for the Listening
Practice desktop app. The top-level [README.md](../README.md) covers
install/run/build; these docs cover how the app actually works internally,
so a new contributor can extend it without archaeology.

- [architecture.md](architecture.md) — process model (Electron ↔ FastAPI),
  directory layout, request/data flow, storage layout.
- [backend.md](backend.md) — the Python backend in detail: pipeline stages,
  job/progress system, database schema, configuration.
- [api.md](api.md) — full REST + WebSocket API reference.
- [frontend.md](frontend.md) — the plain HTML/CSS/JS renderer: pages, state,
  how practice/dictation works.
- [dev-workflow.md](dev-workflow.md) — running locally, debugging, common
  gotchas, packaging/build notes.
- [activity-tracking-plan.md](activity-tracking-plan.md) — spec cho việc
  chưa làm: bảng `practice_events`, endpoint streak/activity, và danh sách
  chính xác các chỗ ở frontend cần gọi về khi làm xong backend.

Read `architecture.md` first if you're new to the codebase.
