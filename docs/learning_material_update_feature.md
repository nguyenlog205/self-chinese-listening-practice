# Learning Material Update Feature

## Overview

User clicks "Cập nhật dữ liệu" in Settings → App downloads vocabulary, dialogues, exercises, audio from GitHub → Local database syncs → User gets fresh content without app reinstall.

## Current State

### ✅ Completed

1. **Data structure** (see `dialogue-audio-architecture.md`):
   - `vocabulary/hsk_*.json` (vocab lists)
   - `dialogues.json` (lines only)
   - `dialogue_exercises/choice/*.json` (choice exercises)
   - `dialogue_exercises/cloze/*.json` (cloze exercises)
   - `dialogues_audio/{id}/audio.mp3 + metadata.json`

2. **Frontend UI**:
   - Button "Cập nhật dữ liệu" exists in `SettingsPage.jsx`
   - Calls `ContentApi.refreshContent()` → `POST /api/content/refresh`
   - Shows success/error message

3. **Backend sync logic** (partial):
   - `content/sync.py` fetches vocab from GitHub
   - `content/sync.py` fetches dialogues from GitHub
   - `content/sync.py` downloads dialogue audio files
   - Returns: `{vocabulary: {...}, dialogues: N, dialogue_audio: N}`

### ❌ Missing

1. **Backend: Load exercises** (dialogue_exercises/choice, cloze)
   - Currently sync.py doesn't fetch exercises
   - Need to add download + INSERT to DB

2. **Backend: Database schema**
   - `dialogue_exercises_choice` table
   - `dialogue_exercises_cloze` table
   - Need columns for id, audio_id, question, options, blanks, etc.

3. **Backend: Validate schema**
   - sync.py validates vocab/dialogues but not exercises
   - Need: required fields check, foreign key references

4. **Backend: Endpoints**
   - `GET /api/dialogue-exercises/choice?level=N` → list exercises
   - `GET /api/dialogue-exercises/cloze?level=N` → list exercises
   - `GET /api/dialogue-exercises/choice/{exercise_id}` → single exercise
   - `GET /api/dialogue-exercises/cloze/{exercise_id}` → single exercise

5. **Backend: Audio metadata endpoint**
   - `GET /api/dialogues/{audio_id}/audio/metadata` → timing info
   - Currently no endpoint to fetch metadata, only serve audio file

6. **Frontend: Load exercises**
   - Components currently fetch from `useDialogues()` (returns all dialogues)
   - Need new hooks: `useDialogueExercises('choice')`, `useDialogueExercises('cloze')`
   - These should map exercise → dialogue → audio

7. **Frontend: Audio playback with metadata**
   - `useDialogueAudio()` currently plays full audio
   - Need to accept `playMode` + `gaps` from metadata
   - Implement: auto-pause for cloze gaps

---

## Implementation Plan

### Phase 1: Backend — Database & Schema (2-3 hours)

**File:** `backend/listening_backend/content/db.py`

1. Add `DIALOGUE_EXERCISES_CHOICE_SCHEMA`:
   ```sql
   CREATE TABLE IF NOT EXISTS dialogue_exercises_choice (
     id TEXT PRIMARY KEY,
     audio_id TEXT NOT NULL REFERENCES dialogues_audio(id),
     question JSON NOT NULL,  -- {vi, en, zh}
     options JSON NOT NULL    -- [{text: {...}, correct: bool}, ...]
   )
   ```

2. Add `DIALOGUE_EXERCISES_CLOZE_SCHEMA`:
   ```sql
   CREATE TABLE IF NOT EXISTS dialogue_exercises_cloze (
     id TEXT PRIMARY KEY,
     audio_id TEXT NOT NULL REFERENCES dialogues_audio(id),
     blanks JSON NOT NULL    -- [{lineIndex, answer}, ...]
   )
   ```

3. Add `DIALOGUE_AUDIO_SCHEMA`:
   ```sql
   CREATE TABLE IF NOT EXISTS dialogues_audio (
     id TEXT PRIMARY KEY,
     metadata JSON NOT NULL  -- {duration_sec, exercises: {choice, cloze}}
   )
   ```

**Verify:** Run `init_db()` should create all 3 tables without error.

### Phase 2: Backend — Sync Logic (2-3 hours)

**File:** `backend/listening_backend/content/sync.py`

1. Add `_fetch_exercises_choice()`:
   - Loop over `dialogue_exercises/choice/*.json`
   - Validate: required fields (id, audio_id, question, options)
   - Check audio_id exists in dialogues table (FK constraint)
   - Return list of exercise dicts

2. Add `_fetch_exercises_cloze()`:
   - Loop over `dialogue_exercises/cloze/*.json`
   - Validate: required fields (id, audio_id, blanks)
   - Check audio_id exists (FK)
   - Return list of exercise dicts

3. Add `_fetch_audio_metadata()`:
   - Loop over `dialogues_audio/{id}/metadata.json`
   - Store in database (one row per audio)
   - Validate: duration_sec, exercises structure

4. Update `refresh_content()`:
   - After syncing vocabulary, sync dialogues
   - After dialogues, sync `dialogues_audio` metadata
   - After audio metadata, sync choice exercises
   - After choice, sync cloze exercises
   - Return: `{vocabulary: {...}, dialogues: N, audio_metadata: N, choice_exercises: N, cloze_exercises: N, dialogue_audio: N}`

**Error handling:** If any fetch fails, raise `ContentSyncError` with detail (not partial sync).

### Phase 3: Backend — API Endpoints (1-2 hours)

**File:** `backend/listening_backend/content/exercises_router.py` (new file)

```python
router = APIRouter(prefix="/api/dialogue-exercises", tags=["exercises"])

@router.get("/choice")
def list_choice_exercises(level: int = Query(None)) -> list[dict]:
    # Return all choice exercises, optionally filtered by level
    # Join with dialogues table to get level

@router.get("/choice/{exercise_id}")
def get_choice_exercise(exercise_id: str) -> dict:
    # Return single exercise with audio_id, question, options

@router.get("/cloze")
def list_cloze_exercises(level: int = Query(None)) -> list[dict]:
    # Return all cloze exercises, optionally filtered by level

@router.get("/cloze/{exercise_id}")
def get_cloze_exercise(exercise_id: str) -> dict:
    # Return single exercise with audio_id, blanks
```

**File:** `backend/listening_backend/content/audio_metadata_router.py` (new file or add to existing)

```python
@router.get("/audio/{audio_id}/metadata")
def get_audio_metadata(audio_id: str) -> dict:
    # Return {id, duration_sec, exercises: {choice: {...}, cloze: {...}}}
```

Register in `main.py`:
```python
from .content.exercises_router import router as exercises_api
from .content.audio_metadata_router import router as audio_metadata_api
app.include_router(exercises_api)
app.include_router(audio_metadata_api)
```

### Phase 4: Frontend — Hooks & Data Loading (2-3 hours)

**File:** `frontend-new/src/shared/useDialogueExercises.js` (new)

```js
export function useDialogueExercises(type) {  // type: 'choice' | 'cloze'
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiFetch(`/api/dialogue-exercises/${type}`)
      .then(setExercises)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [type]);

  return { exercises, loading, error };
}
```

**File:** `frontend-new/src/shared/useExerciseWithAudio.js` (new)

```js
export function useExerciseWithAudio(exerciseId, type) {
  const [exercise, setExercise] = useState(null);
  const [dialogue, setDialogue] = useState(null);
  const [audioMetadata, setAudioMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      apiFetch(`/api/dialogue-exercises/${type}/${exerciseId}`),  // exercise def
      // load dialogue via exercise.audio_id
      // load audio metadata via exercise.audio_id
    ])
      .then(([ex, dial, meta]) => {
        setExercise(ex);
        setDialogue(dial);
        setAudioMetadata(meta);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [exerciseId, type]);

  return { exercise, dialogue, audioMetadata, loading, error };
}
```

### Phase 5: Frontend — Audio Playback with Gaps (2-3 hours)

**File:** `frontend-new/src/shared/useDialogueAudio.js` (update)

```js
export function useDialogueAudio() {
  const speakSequence = useSpeakSequence();

  return (audioId, metadata, exerciseType = null) => {
    stopAudio();
    (async () => {
      const url = await ContentApi.dialogueAudioUrl(audioId);
      try {
        if (exerciseType === 'cloze' && metadata?.exercises?.cloze?.play_mode === 'with_gaps') {
          // Play with auto-pause at gaps
          await playAudioWithGaps(url, metadata.exercises.cloze.gaps);
        } else {
          // Full playback (choice mode)
          await playAudio(url);
        }
      } catch {
        // TTS fallback
        speakSequence(...);
      }
    })();
  };
}

async function playAudioWithGaps(url, gaps) {
  return new Promise(async (resolve, reject) => {
    const audio = new Audio(url);
    current = audio;
    
    // Play until first gap
    if (gaps.length === 0) {
      await playAudio(url);
      return;
    }

    for (let gap of gaps) {
      // Play from current time to gap.start
      audio.currentTime = gap.start;
      await waitUntil(audio, gap.end);
      
      // Auto-pause here for user to type
      audio.pause();
      
      // Wait for user input (external trigger, or timeout)
      await userInputOrTimeout(5000);  // 5s timeout
    }
    
    // Play remainder
    audio.currentTime = gaps[gaps.length - 1].end;
    await new Promise(r => { audio.onended = r; });
    resolve();
  });
}
```

### Phase 6: Frontend — Component Updates (1-2 hours)

**File:** `frontend-new/src/features/listening/components/DialogueChoice.jsx` (update)

```js
export default function DialogueChoice() {
  const [exerciseId, setExerciseId] = useState(null);
  const { exercise, dialogue, audioMetadata, loading } = useExerciseWithAudio(exerciseId, 'choice');
  const playDialogue = useDialogueAudio();

  const play = () => {
    if (exercise && audioMetadata) {
      playDialogue(exercise.audio_id, audioMetadata, 'choice');
    }
  };

  // Rest of component uses exercise.question, exercise.options
}
```

**File:** `frontend-new/src/features/listening/components/DialogueCloze.jsx` (update)

```js
export default function DialogueCloze() {
  const [exerciseId, setExerciseId] = useState(null);
  const { exercise, dialogue, audioMetadata, loading } = useExerciseWithAudio(exerciseId, 'cloze');
  const playDialogue = useDialogueAudio();

  const play = () => {
    if (exercise && audioMetadata) {
      playDialogue(exercise.audio_id, audioMetadata, 'cloze');
    }
  };

  // Component uses exercise.blanks for fill-the-blank UI
}
```

---

## Testing Checklist

### Backend Tests

- [ ] `test_sync.py`: Fetch exercises (choice + cloze) from mock GitHub
- [ ] `test_sync.py`: Validate exercise schema (required fields)
- [ ] `test_sync.py`: FK constraint (audio_id must exist)
- [ ] `test_sync.py`: Fetch audio metadata
- [ ] `test_exercises_router.py`: List choice/cloze exercises
- [ ] `test_exercises_router.py`: Filter by level
- [ ] `test_exercises_router.py`: Get single exercise (404 if not found)
- [ ] `test_audio_metadata_router.py`: Get metadata (404 if audio not found)

### Frontend Tests

- [ ] `useDialogueExercises()` hook loads exercises
- [ ] `useExerciseWithAudio()` loads exercise + dialogue + metadata
- [ ] Audio plays full for choice mode
- [ ] Audio pauses at gaps for cloze mode
- [ ] User can type at pause → resume plays

### Integration Tests

- [ ] User clicks "Cập nhật dữ liệu"
- [ ] Backend downloads all 5 resource types (vocab, dialogues, audio, choice, cloze)
- [ ] Frontend lists choice/cloze exercises
- [ ] User picks exercise → audio plays with correct mode
- [ ] F5 reload → exercise still loads correctly

---

## Data Flow Diagram

```
User clicks "Cập nhật dữ liệu"
  ↓
POST /api/content/refresh
  ↓
Backend sync.py:
  1. Fetch + DELETE/INSERT vocab_words
  2. Fetch + DELETE/INSERT dialogues
  3. Fetch + DELETE/INSERT dialogues_audio metadata
  4. Fetch + DELETE/INSERT dialogue_exercises_choice
  5. Fetch + DELETE/INSERT dialogue_exercises_cloze
  6. Download audio files → cache
  ↓
Return {vocabulary: {...}, dialogues: N, audio_metadata: N, choice: N, cloze: N}
  ↓
Frontend shows: "✓ Đã cập nhật X từ vựng, Y hội thoại, Z bài tập"
  ↓
User navigates to DialogueChoice
  ↓
Load list of choice exercises
  → Pick one (e.g., choice_001)
  → Load exercise definition + dialogue + audio metadata
  → Play audio (full mode)
  → User answers question
```

---

## Notes for Next AI

1. **Don't skip database schema** — all 3 tables needed (exercises_choice, exercises_cloze, audio metadata)
2. **Foreign key constraint matters** — exercise.audio_id must reference dialogues table
3. **Metadata timing is per-audio, not per-exercise** — both choice_001 and cloze_001 can use same audio.mp3 with same metadata
4. **TTS fallback must still work** — if audio fails to load, use `useSpeakSequence()` as before
5. **Gap timing precision** — for cloze, gaps[].start/end are critical for UX (auto-pause at right time)
6. **No breaking changes** — existing PersonalPage, HSK materials should still work after this change
