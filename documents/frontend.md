# Frontend

React 19 + Vite, built to static files (`frontend/dist/`) and loaded by
Electron's renderer — in dev via Vite's own dev server
(`http://localhost:5173`), in a packaged build via `file://`. No plain-JS
pages left; the earlier plain HTML/CSS/vanilla-JS frontend this repo used
to have has been fully replaced.

## Routing (`src/App.jsx`)

`HashRouter` (not `BrowserRouter`): a packaged build loads via `file://`,
where `location.pathname` is the real filesystem path to `index.html`, not
an app route — `HashRouter` keeps routing in the URL fragment (`#/...`)
instead, which works regardless of how the page was loaded. Routes, all
nested under a `<Shell>` layout route:

| Path                     | Page             |
|--------------------------|------------------|
| `/`                      | `HomePage`       |
| `/listening`             | `ListeningPage`  |
| `/listening/:sectionKey` | `ListeningPage`  |
| `/personal`              | `PersonalPage`   |
| `/settings`              | `SettingsPage`   |
| `/hsk`                   | `HSKPage`        |
| `/hsk/:sectionKey`       | `HSKPage`        |
| `/about`                 | `AboutPage`      |

`:sectionKey` addresses a sub-tab within `HSKPage`/`ListeningPage` (e.g.
`#/hsk/grammar`, `#/listening/dictation`) — each reads it via
`useParams()` and looks it up in its own `SECTIONS`/`GROUPS` list rather
than tracking the active tab in local `useState`, so a sub-tab is a real,
bookmarkable/shareable route, not just in-memory UI state.

Every page component above, plus every `HSKPage`/`ListeningPage` sub-tab
component, is loaded via `React.lazy()` and rendered inside a `<Suspense
fallback={<RouteLoading />}>` (`shell/RouteLoading.jsx`) — Vite emits one
chunk per lazy component, so opening the app only downloads/parses the
code for the page actually being viewed, not the whole feature set. If you
add a new page or sub-tab, follow the existing `lazy(() => import(...))`
pattern at that same call site rather than a static import.

`App.jsx` also wraps everything in `LanguageProvider` (i18n) and
`PreferencesProvider` (script/phonetic display prefs) — both available
app-wide via context.

## `src/shell/` — layout

`Shell.jsx` renders `<Sidebar>` plus `<Outlet/>` (the matched route).
`Sidebar.jsx` renders nav links (`NavLink`, so the active route is
highlighted) for the main routes plus separate entries for `/personal` and
`/settings`.

## `src/shared/api.js` — backend connection

Every other API client module goes through this one:

- `apiBase()` — resolves the backend's base URL lazily and once (memoized
  in `basePromise`). Inside Electron, calls
  `window.listeningApp.getBackendPort()` (the IPC bridge from
  `electron/preload.js`) and formats `http://127.0.0.1:<port>`. Outside
  Electron (e.g. running `vite dev` directly in a browser, without the
  Electron shell), falls back to `VITE_LISTENING_API_BASE` or
  `http://127.0.0.1:8000` — this is what makes plain browser frontend
  iteration possible against an already-running backend.
- `apiFetch(path, options)` — `fetch` wrapper: throws
  `Error(detail.detail || "Request failed: N")` on any non-OK response
  (backend error payloads are always `{"detail": "..."}`, per FastAPI
  convention), returns parsed JSON (or `null` on 204).
- `wsBase()` — same base URL with `http://` swapped to `ws://`, for the
  lessons WebSocket.

If you add a new backend endpoint, add its client function to the relevant
`shared/*Api.js` file (see below) rather than calling `fetch`/`apiFetch`
directly from a component.

## `src/features/` — pages, one folder per app section

- **`home/`** — `HomePage.jsx`, the dashboard: `components/DailyActivityChart.jsx`
  (GitHub-style contribution heatmap, backed by `useDailyActivity.js` →
  `GET /api/activity/daily`), `StreakCard.jsx` (`useStreak.js` →
  `GET /api/streak`), `ExamCountdownCard.jsx` and `ProgressGoalsCard.jsx`
  (both read HSK-goal/exam-date settings from `userSettings.js`,
  localStorage-backed).
- **`hsk_materials/`** — `HSKPage.jsx`, tabbed:
  `components/{Vocabulary,Listening,Reading,Grammar,MockTest}.jsx`. All
  five now fetch from the backend `content` domain (same
  `/api/vocabulary` the `listening` feature's word-practice modes use for
  `Vocabulary`/`Listening`/`MockTest`; `/api/grammar` via `useGrammar.js`
  for `Grammar`; `/api/reading` via `useReading.js` for `Reading`) — none
  of them bundle static content anymore. `data/hskData.js` only re-exports
  `HSK_LEVELS` at this point. Grammar's "known" state and reading both
  differ slightly from vocabulary's pattern: grammar's is tracked
  client-only in `localStorage` (`useGrammarProgress.js`), and reading has
  no progress-tracking concept at all — see [backend.md](backend.md) for
  why.
- **`listening/`** — the core dictation/listening practice feature,
  `ListeningPage.jsx` + `registry.js`. `registry.js` defines a two-level
  menu (a `GROUPS` array: `word`-level modes vs. `sentence`/dialogue-level
  modes, each with a `sections` array mapping a mode key to its component)
  rather than hardcoding a switch statement — **to add a new practice
  mode**, create its component under `components/`, add one entry to the
  relevant group's `sections`, and add matching `listening.tab.<key>` /
  `listening.menu.<key>` i18n keys; nothing else needs to change. Current
  modes: `DictationPractice`, `ChoiceListening`, `OrderListening` (word
  group); `SentenceDictation`, `DialogueChoice`, `DialogueCloze`,
  `YoutubeListening` (sentence group — the last one is the YouTube-lesson
  practice UI, backed by `lessonsApi.js` + the `/ws/jobs/{id}` socket).
- **`personal/`** — `PersonalPage.jsx`, profile/progress overview.
- **`settings/`** — `SettingsPage.jsx`: UI language switch, script
  (Simplified/Traditional) and phonetic (Pinyin/Zhuyin) toggles, HSK
  goal/exam date, and the "Cập nhật dữ liệu" button
  (`contentApi.js::refreshContent()` → `POST /api/content/refresh`).
- **`about/`** — `AboutPage.jsx` + `membersData.js` + team photos.

## `src/shared/` — hooks & clients

| File | Purpose |
|------|---------|
| `activityApi.js` | client for `/api/activity/*` |
| `buildQuiz.js` | builds multiple-choice quiz data from a vocab word list |
| `chineseText.js` | Simplified↔Traditional conversion (opencc-js) and pinyin↔zhuyin |
| `contentApi.js` | client for `/api/vocabulary`, `/api/grammar`, `/api/reading`, `/api/dialogues`, `/api/dialogue-exercises`, `/api/content/refresh` |
| `lessonsApi.js` | client for `/api/lessons` + the jobs WebSocket |
| `localProgress.js` | session-local counters (a stand-in for parts not yet wired to `activityApi.logEvent`) |
| `PreferencesContext.jsx` | React context: pinyin/script/phonetic display preferences, app-wide |
| `useDailyActivity.js` | fetches activity-heatmap data |
| `useDialogueAudio.js` | plays the real recording if cached, else falls back to TTS (`GET /api/tts`) |
| `useDialogueExercises.js` | fetches/caches dialogue exercises by kind |
| `useDialogues.js` | fetches/caches dialogues; refetches after a content sync |
| `useGrammar.js` | fetches/caches grammar points by level (`useGrammar`) or every level at once (`useAllGrammarLevels`) |
| `useGrammarProgress.js` | module-level, `localStorage`-backed "known" state for grammar points (not server-synced, unlike vocab progress) |
| `useLessons.js` | lists lessons, live-updates via WebSocket while any are in-progress |
| `useReading.js` | fetches/caches reading passages by level |
| `userSettings.js` | localStorage keys for name/HSK goal/exam date |
| `useSpeak.js` | pronunciation via the backend TTS endpoint (not the Web Speech API) |
| `useStreak.js` | fetches `/api/streak` |
| `useVocabProgress.js` | module-level cache of "learned" word state, shared app-wide |
| `useVocabulary.js` | fetches/caches vocab by level |
| `audioPlayer.js` | single shared "now playing" audio slot (stops the previous clip on new play) |
| `practiceWords.js` | Fisher–Yates shuffle helper |

## `src/i18n/` — multi-language UI

- `translations.js` — `LANGUAGES`/`DEFAULT_LANGUAGE` plus `translate(key, language, params)`
  over a large key→string map, one set of strings per language: Vietnamese,
  English, Simplified Chinese, Traditional Chinese.
- `LanguageContext.jsx` — `LanguageProvider` React context, persists the
  chosen language to `localStorage` (`listening-app:language`) and exposes
  `t()` to consumers.
- `locale.js` — maps a language code to a BCP-47 locale for
  `Intl.DateTimeFormat`, plus `last7DayLabels()` for the streak's weekly
  strip.

This is independent of `PreferencesContext`'s script/phonetic toggles
(Simplified↔Traditional, Pinyin↔Zhuyin) — UI language and hanzi
script/phonetic display can be set independently (e.g. English UI with
Traditional characters and Zhuyin).

## Adding a new page or major feature

- New page: add a folder under `src/features/`, register its route in
  `App.jsx` as `lazy(() => import(...))` (see the Routing section above),
  add a nav entry in `Sidebar.jsx`.
- New listening practice mode: see `registry.js` above — no `App.jsx` or
  routing change needed, it's entirely within the `listening` feature.
- New per-segment/lesson field: add it to the backend's `SegmentOut`/
  `LessonOut` (see [backend.md](backend.md)) and the corresponding
  `models.py`, then read it off the response in the relevant `listening/components/*.jsx`.
