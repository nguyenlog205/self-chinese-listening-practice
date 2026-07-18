# API reference

Base URL: `http://127.0.0.1:<port>`, where `<port>` is whatever
`backend/listening_backend/main.py` bound (OS-assigned unless
`LISTENING_PORT` is set) — the frontend discovers it at runtime via
`window.listeningApp.getBackendPort()` (see `electron/preload.js` and
`frontend/src/shared/api.js`). There is no auth; the server only ever
binds to `127.0.0.1` for a single local user.

All request/response bodies are JSON. Schemas below reference each
domain's `models.py` (`lessons/models.py`, `content/models.py`,
`activity/models.py`).

## `GET /health`

Liveness check. `{"ok": true}`. Not called by the frontend; useful for
manual debugging (`curl http://127.0.0.1:<port>/health`).

---

## Lessons — `lessons/router.py`, prefix `/api/lessons`

The YouTube-video lesson feature: user submits a URL, the backend
transcribes it in the background, then the frontend plays it back
sentence by sentence.

### `POST /api/lessons`

Add a lesson from a YouTube URL. Body: `{ "url": "https://www.youtube.com/watch?v=..." }`.

Behavior:
- Resolves video metadata **synchronously** (blocks the request) via
  yt-dlp. On failure (bad URL, video unavailable, network error): `400`
  with `{"detail": "<error message>"}`.
- If a lesson with this video id already exists, returns it as-is
  (**idempotent** — does not re-queue a job, regardless of its current
  status, even if it previously errored). To retry a failed lesson today
  you'd need to delete it first (`DELETE /api/lessons/{id}`) and re-add.
- Otherwise inserts a new `queued` lesson row, starts the background
  pipeline, and returns the new row (still `queued`/`0%` — poll `GET` or
  open the WebSocket to track progress).

Response: `LessonOut` (200).

### `GET /api/lessons`

List all lessons, most recently created first. Response: `list[LessonOut]` (200).

### `GET /api/lessons/{lesson_id}`

Fetch one lesson. `404` if the id doesn't exist. Response: `LessonOut` (200).

### `GET /api/lessons/{lesson_id}/segments`

Fetch the ordered sentence list for a lesson (empty list if not yet
transcribed — check `status == "ready"` first, or just handle empty).
`404` if the lesson id doesn't exist. Response: `list[SegmentOut]` (200).

### `POST /api/lessons/{lesson_id}/practiced`

Marks `last_practiced_at = now()`. Called by the frontend when the user
reaches the last segment of a practice session. `404` if not found.
Response: `LessonOut` (200) — the updated row.

### `DELETE /api/lessons/{lesson_id}`

Deletes the lesson row (segments cascade via the FK). **Does not delete**
the cached audio/video files under `storage/audio_cache/` /
`storage/video_cache/` — those are keyed by video id and left behind, so
re-adding the same URL later reuses them instead of re-downloading. `404`
if not found. Response: `{"deleted": true}` (200).

### `LessonOut` shape

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

### `SegmentOut` shape

```json
{ "idx": 0, "start_sec": 0.0, "end_sec": 2.3, "text_zh": "你好。", "pinyin": "nǐ hǎo" }
```

## Media — `lessons/media_router.py`

### `GET /media/audio/{lesson_id}.wav`

Serves the cached mono WAV extracted for transcription. `404` if not
cached. Not currently used by the frontend (the practice view plays the
video file, not this WAV) — present for potential audio-only playback /
debugging.

### `GET /media/video/{lesson_id}.mp4`

Serves the cached mp4. This is what the YouTube practice view's `<video>`
element's `src` points at. `404` if not cached yet.

## WebSocket — `lessons/jobs_router.py`

### `WS /ws/jobs/{lesson_id}`

Live progress stream for one lesson's background job.

- On connect, immediately sends one message with the lesson's *current*
  state (works even if you connect after the job already finished/failed —
  the server sends that terminal state and closes immediately without
  further messages).
- If not yet terminal, the connection stays open and a message is pushed
  every time the job reports progress, until a message with
  `status in ("ready", "error")` arrives, after which the server closes
  the socket.
- If the lesson id doesn't exist yet in the DB (e.g. connecting before
  `POST /api/lessons` has returned), the server sends nothing on connect
  and just waits for the subscription — in practice the frontend always
  waits for the `POST` response first.

Message shape (every message, including the initial one):

```json
{ "status": "downloading", "stage": "video", "progress_pct": 42, "error_message": null }
```

Some intermediate broadcasts include extra fields not in this shape, e.g.
once metadata resolves, one broadcast carries a `"title"` key too — the
frontend ignores unknown fields and triggers a lesson-list refetch on
every message rather than reading fields off the event directly, so this
isn't a strict contract to depend on beyond `status`/`progress_pct`/`error_message`.

No authentication, no reconnection/backoff logic on either side — if the
socket drops mid-job, the frontend won't get further live updates for
that lesson until the next lesson-list poll or page reload re-subscribes.

---

## Vocabulary — `content/vocabulary_router.py`, prefix `/api/vocabulary`

### `GET /api/vocabulary/levels`

List distinct HSK levels present in the DB, sorted (`"1".."6"`, then
`"7-9"` last). Response: `list[str]` (200).

### `GET /api/vocabulary?level=<level>`

List words for one HSK level. `level` is required. Response:
`list[VocabWordOut]` (200) — `{hanzi, pinyin, en, vi}` each.

## Vocabulary progress — `content/progress_router.py`, prefix `/api/vocabulary/progress`

"Learned" state for individual vocab words — existence of a row *is* the
state, there's no boolean flag.

- `GET /api/vocabulary/progress` → `list[VocabProgressOut]`
  (`{hanzi, level, learned_at}`).
- `POST /api/vocabulary/progress` — body `{hanzi, level}`, `INSERT OR
  IGNORE` (idempotent). `201`, `{"ok": true}`.
- `DELETE /api/vocabulary/progress` — clears all progress. `200`,
  `{"ok": true}`.
- `DELETE /api/vocabulary/progress/{hanzi}` — unmarks one word. `200`,
  `{"ok": true}` (no error if it wasn't marked).

## Dialogues — `content/dialogues_router.py`, prefix `/api/dialogues`

### `GET /api/dialogues?level=<level>` (optional)

Lines-only dialogue data (no exercise content — see below). Response:
`list[DialogueOut]`:

```json
{ "id": "d001", "level": "3", "lines": [{"speaker": "A", "hanzi": "你好", "pinyin": "nǐ hǎo"}] }
```

## Dialogue exercises — `content/exercises_router.py`, prefix `/api/dialogue-exercises`

Three parallel kinds, each with a list + single-item endpoint following the
same shape: `/{kind}?level=<level>` and `/{kind}/{exercise_id}`, `kind ∈
{choice, cloze, dictation}`. All three share `id`, `audio_id` (the
dialogue this exercise plays audio from), and `lines_from_dialogue`
(indices into that dialogue's `lines`); `/{kind}/{exercise_id}` 404s with
`{"detail": "No {kind} exercise '<id>'"}` if not found.

- **`choice`**: `+ question: {vi, en, zh}`, `options: [{vi, en, correct}]`.
- **`cloze`**: `+ blanks: [{lineIndex, answer}]`.
- **`dictation`**: `+ target_line: int` (index into `lines_from_dialogue`).

## Dialogue audio — `content/audio_router.py`, prefix `/api/dialogues`

### `GET /api/dialogues/{dialogue_id}/audio/metadata`

`AudioMetadataOut`: `{id, audio_file, duration_sec, exercises: {...}}`
(per-exercise-kind timing gaps, e.g. cloze pause points). `404` if this
dialogue has no recorded audio yet.

### `GET /api/dialogues/{dialogue_id}/audio`

The mp3 file itself. Checks the writable sync cache
(`storage/dialogue_audio_cache/`, populated by content sync — may be newer
than the bundled copy) first, then the bundled `seed_data` copy. `404` if
neither exists — the frontend (`useDialogueAudio.js`) treats a 404 here as
"no real recording," and falls back to `GET /api/tts` (synthesized audio)
instead.

## Content sync — `content/sync_router.py`

### `POST /api/content/refresh`

Re-pulls vocabulary, dialogues, all three exercise kinds, and dialogue
audio from this repo on GitHub, replacing local rows (delete-then-insert,
so it picks up edits/removals too, not just additions) — this is what
Settings' "Cập nhật dữ liệu" button calls. `502` with
`{"detail": "<error>"}` on network/GitHub failure. `200` on success (shape:
whatever `content/sync.py::refresh_content` returns — a per-table
count summary).

---

## Activity — `activity/router.py`, prefix `/api/activity`

- `POST /api/activity/events` — log one completed practice interaction.
  Body (`PracticeEventIn`): `{mode, item_type, item_id, level?, is_correct?}`.
  `201`, `{"ok": true}`.
- `DELETE /api/activity/events` — clears the entire log (used by a "reset
  progress" settings action). `200`, `{"ok": true}`.
- `GET /api/activity/daily?days=182` — per-day event counts for the
  home-page contribution heatmap. `days` is `1..730`, default `182`.
  Response: `list[DailyActivityOut]`, `[{"date": "2026-07-01", "count": 3}, ...]`.

## Streak — `activity/streak_router.py`

### `GET /api/streak`

`StreakOut`: `{"current": 5, "longest": 12, "weekly": [true, true, false, ...]}`
— `current`/`longest` in consecutive days, `weekly` is 7 booleans (one per
day) for the home page's weekly strip.

---

## Text-to-speech — `tts/router.py`

### `GET /api/tts?text=<text>`

Returns a synthesized mp3 for `text` (edge-tts, `zh-CN-XiaoxiaoNeural`
voice). Cached on disk keyed by a hash of `text`, so repeat calls for the
same text are instant after the first. `Cache-Control: public,
max-age=31536000, immutable` on success. `502` with `{"detail": "<error>"}`
if edge-tts's remote service fails. Used both as the pronunciation button
throughout the app and as the dialogue-audio fallback when no real
recording exists (see "Dialogue audio" above).
