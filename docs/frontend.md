# Frontend

Plain HTML/CSS/vanilla JS, no framework, no build step, no bundler — the
files under `frontend/` are loaded directly by Electron's renderer via
`mainWindow.loadFile(...)` (`file://` origin) and pull in `<script>` tags
in order. There are two pages, sharing one API client module.

## `js/api.js` — shared API client

Loaded by both pages before their page-specific script. Exposes a single
global `Api` object:

- `Api.base()` — resolves the backend's base URL lazily and once
  (`basePromise`), by calling `window.listeningApp.getBackendPort()` (the
  IPC bridge from `electron/preload.js`) and formatting
  `http://127.0.0.1:<port>`. Every other method awaits this first.
- `Api.listLessons() / getLesson(id) / getSegments(id) / markPracticed(id) /
  deleteLesson(id)` — thin wrappers around `fetch`, all going through
  `apiFetch()`, which throws `Error(detail.detail || "Request failed: N")`
  on any non-OK response (backend error payloads are always
  `{"detail": "..."}`, per FastAPI convention).
- `Api.jobSocket(id, onEvent)` — opens the `/ws/jobs/{id}` WebSocket
  (deriving `ws://` from the same base URL) and calls `onEvent(parsedJson)`
  for every message. Returns the raw `WebSocket` so the caller can track/
  close it.

If you add a new backend endpoint, add its wrapper here rather than calling
`fetch` directly from page scripts — both `library.js` and `practice.js`
assume this is the only place that knows the base URL / error convention.

## `index.html` + `js/library.js` — library view

State: an in-memory list of lessons re-fetched from the server (no local
cache/store beyond what's in the DOM), plus `openSockets: Map<lessonId,
WebSocket>` tracking which in-progress lessons already have a live
progress subscription.

Flow:
1. `refreshLessons()` (called on load, and again after any mutation) calls
   `Api.listLessons()` and re-renders the whole list (`renderLessons`
   clears and rebuilds `#lesson-list` from scratch — no diffing/keys, fine
   at this list size).
2. For every lesson whose `status` isn't `ready`/`error` (i.e. still "in
   progress"), and that doesn't already have an entry in `openSockets`,
   `trackProgress(id)` opens a WebSocket. Its `onEvent` handler just calls
   `refreshLessons()` again on *every* message (not just terminal ones) —
   the WebSocket here is used purely as a "something changed, re-poll the
   REST endpoint" signal, not as the source of truth for rendered state.
   On a terminal event it also removes the entry from `openSockets`.
3. Submitting the add-lesson form calls `Api.addLesson(url)`, clears the
   input, refreshes the list, and starts tracking progress for the new
   lesson if it isn't already terminal.
4. A `ready` lesson's card is clickable and navigates to
   `practice.html?id=<lessonId>`. Cards for other statuses show a stage
   label (Vietnamese, `STAGE_LABELS` map keyed by backend `stage` values —
   **must be kept in sync with the `stage` strings jobs.py writes**, see
   [backend.md](backend.md#lesson-status-lifecycle)) and a progress bar
   (`progress_pct` as `width: N%`).
5. Errors from any `Api` call are shown via `showError()`, which sets text
   on `#error-banner`, adds a `.visible` class, and auto-hides after 6s
   (CSS-driven transition, see `css/style.css`).

All rendered text goes through `escapeHtml()` (builds via `textContent`
then reads `innerHTML`) before being interpolated into the card's
`innerHTML` template string — necessary since lesson titles come from
YouTube video metadata (untrusted input).

## `practice.html` + `js/practice.js` — practice view

Reads `?id=` from the URL (redirects to `index.html` if absent). On load
(`init()`), fetches the lesson (for the title) and its segments in
parallel, points the `<video>` element's `src` directly at
`GET /media/video/{id}.mp4`, and renders the first segment.

State is just two variables: `segments` (the full array from the API) and
`currentIndex`. There is no separate "player state machine" — the video
element's native `currentTime`/`paused`/`volume`/`playbackRate` *are* the
state.

Per-segment playback (`playSegment()`):
- Sets `video.currentTime = segment.start_sec` and calls `.play()`.
- Starts a `setInterval` (200ms) polling `video.currentTime` against
  `segment.end_sec`; once reached, pauses and clears the interval. This is
  a polling loop rather than the `timeupdate` event because `timeupdate`
  fires at a browser-defined (coarser, inconsistent) cadence not tight
  enough for reliable segment-boundary pausing.
- Any navigation (`goTo`, `replayBtn`) clears the previous interval before
  starting a new one (`clearInterval(boundaryTimer)`), so segments never
  race each other.

Reveal toggles (`renderCurrent()` + the toggles' `change` listeners):
subtitle (`textLine`) and pinyin (`pinyinLine`) visibility are each just a
`.hidden` class toggle driven by the corresponding checkbox's `.checked`,
independent of each other and independent of navigation — toggling a
checkbox doesn't pause/replay, it only affects what's currently shown.

Dictation (`dictationToggle` shows/hides `#dictation-panel`):
- `checkAnswer()` diffs the typed guess against `segment.text_zh`
  **character-by-character by index** (not a proper alignment/diff
  algorithm): position `i` is `ok` if `guess[i] === target[i]`, else `err`.
  This means a single inserted/deleted character shifts every subsequent
  position to `err` even if the rest of the sentence was typed correctly —
  a known rough edge if you're looking to improve the dictation grading
  algorithm.
- Triggered by the "Kiểm tra" button or pressing Enter in the answer
  input.

Navigation (`goTo(index)`): bounds-checks against `segments.length`,
updates `currentIndex`, re-renders, and — specifically when landing on the
*last* segment — fires `Api.markPracticed(id)` (best-effort, errors
swallowed) to record `last_practiced_at`.

Keyboard shortcuts (global `keydown` listener, skipped when focus is in
the answer input so typing isn't intercepted): `Space` toggles play/pause,
`ArrowRight`/`ArrowLeft` move to next/previous segment.

Volume and speed controls (`#volume-slider`, `#speed-select`) map directly
to `video.volume` (0–1, from a 0–100 range input) and
`video.playbackRate`.

## Styling

`css/style.css` is shared across both pages — no per-page stylesheet,
no CSS framework/preprocessor. All text on both pages is Vietnamese/Chinese
(`lang="vi"`), reflecting the app's purpose (Vietnamese speakers practicing
Chinese listening).

## Adding a new page or major frontend feature

- New page: add an `.html` file under `frontend/`, include
  `js/api.js` then a new page-specific script, and reuse `Api` rather than
  hand-rolling fetch calls.
- New per-segment field (e.g. an English translation): add it to the
  backend's `SegmentOut`/`segments` table (see [backend.md](backend.md)),
  then read it off `segments[currentIndex]` in `practice.js`'s
  `renderCurrent()` alongside `pinyin`/`text_zh`.
