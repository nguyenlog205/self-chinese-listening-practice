# API reference

Base URL: `http://127.0.0.1:<port>`, where `<port>` is whatever
`backend/listening_backend/main.py` bound (OS-assigned unless
`LISTENING_PORT` is set) — the frontend discovers it at runtime via
`window.listeningApp.getBackendPort()` (see `electron/preload.js` and
`frontend/js/api.js`). There is no auth; the server only ever binds to
`127.0.0.1` for a single local user.

All request/response bodies are JSON. Schemas below reference
`listening_backend/models.py`.

## `GET /health`

Liveness check. `{"ok": true}`. Not used by the frontend today; useful for
manual debugging (`curl http://127.0.0.1:<port>/health`).

## Lessons — `api/lessons.py`

### `POST /api/lessons`

Add a lesson from a YouTube URL. Body:

```json
{ "url": "https://www.youtube.com/watch?v=..." }
```

Behavior:
- Resolves video metadata **synchronously** (blocks the request) via
  yt-dlp. On failure (bad URL, video unavailable, network error): `400`
  with `{"detail": "<error message>"}`.
- If a lesson with this video id already exists, returns it as-is
  (**idempotent** — does not re-queue a job, regardless of its current
  status, even if it previously errored). To retry a failed lesson today
  you'd need to delete it first (`DELETE /api/lessons/{id}`) and re-add.
- Otherwise inserts a new `queued` lesson row, starts the background
  pipeline, and returns the new row (still `queued`/`0%` at this point —
  poll `GET` or open the WebSocket to track progress).

Response: `LessonOut` (200).

### `GET /api/lessons`

List all lessons, most recently created first (`ORDER BY created_at DESC`).
Response: `list[LessonOut]` (200).

### `GET /api/lessons/{lesson_id}`

Fetch one lesson. `404` with `{"detail": "Lesson not found"}` if the id
doesn't exist. Response: `LessonOut` (200).

### `GET /api/lessons/{lesson_id}/segments`

Fetch the ordered sentence list for a lesson (empty list if not yet
transcribed — check `status == "ready"` first, or just handle empty).
`404` if the lesson id doesn't exist. Response: `list[SegmentOut]` (200).

### `POST /api/lessons/{lesson_id}/practiced`

Marks `last_practiced_at = now()`. Called by the frontend when the user
reaches the last segment of a practice session
(`frontend/js/practice.js`, `goTo()`). `404` if not found. Response:
`LessonOut` (200) — the updated row.

### `DELETE /api/lessons/{lesson_id}`

Deletes the lesson row (segments cascade via the FK). **Does not delete**
the cached audio/video files under `storage/audio_cache/` /
`storage/video_cache/` — those are keyed by video id and left behind, so
re-adding the same URL later reuses them instead of re-downloading. `404`
if not found. Response: `{"deleted": true}` (200).

## `LessonOut` shape

```json
{
  "id": "dQw4w9WgXcQ",
  "source_url": "https://...",
  "title": "...",
  "status": "queued | downloading | transcribing | segmenting | ready | error",
  "progress_pct": 0,
  "stage": "queued | metadata | video | audio | transcribing | segmenting | done | error",
  "error_message": null,
  "duration_sec": 123.4,
  "created_at": "2026-...",
  "last_practiced_at": null,
  "segment_count": 0
}
```

## `SegmentOut` shape

```json
{
  "idx": 0,
  "start_sec": 0.0,
  "end_sec": 2.3,
  "text_zh": "你好。",
  "pinyin": "nǐ hǎo"
}
```

## Media — `api/media.py`

### `GET /media/audio/{lesson_id}.wav`

Serves the cached mono WAV extracted for transcription. `404` if not
cached (the file only exists after the `audio` stage runs). Not currently
used by the frontend (the practice view plays the video file, not this
WAV) — present for potential audio-only playback / debugging.

### `GET /media/video/{lesson_id}.mp4`

Serves the cached mp4. This is what `practice.html`'s `<video>` element's
`src` points at. `404` if not cached yet.

## WebSocket — `api/jobs.py`

### `WS /ws/jobs/{lesson_id}`

Live progress stream for one lesson's background job.

- On connect, immediately sends one message with the lesson's *current*
  state (works even if you connect after the job already finished/failed —
  in which case the server sends that terminal state and closes
  immediately without further messages).
- If not yet terminal, the connection stays open and a message is pushed
  every time the job reports progress, until a message with
  `status in ("ready", "error")` arrives, after which the server closes the
  socket.
- If the lesson id doesn't exist yet in the DB (e.g. connecting before
  `POST /api/lessons` has returned), the server sends nothing on connect
  and just waits for the subscription — in practice the frontend always
  waits for the `POST` response first.

Message shape (every message, including the initial one):

```json
{
  "status": "downloading",
  "stage": "video",
  "progress_pct": 42,
  "error_message": null
}
```

Some intermediate broadcasts include extra fields not in this shape,
e.g. once metadata resolves, one broadcast carries a `"title"` key too
(`jobs._run_pipeline`) — the frontend (`library.js`) ignores unknown
fields and just triggers a `GET /api/lessons` refresh on every message
rather than reading fields off the event directly, so this isn't a strict
contract to depend on beyond `status`/`progress_pct`/`error_message`.

No authentication, no reconnection/backoff logic on either side — if the
socket drops mid-job, the frontend simply won't get further live updates
for that lesson until the next `GET /api/lessons` poll or page reload
re-subscribes (see `library.js: trackProgress`, called again on every
render for any lesson not yet in `openSockets`).
