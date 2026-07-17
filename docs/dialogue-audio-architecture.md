# Dialogue Audio & Exercise Architecture

## Problem

Hiện tại dialogue gộp mọi thứ vào 1 file audio, nhưng có 2 exercise types hoàn toàn khác nhau:

| Type | Behavior | Audio | Metadata |
|------|----------|-------|----------|
| **Choice** | Nghe toàn bộ, chọn đáp án | Full audio | Question + options |
| **Cloze** | Nghe toàn bộ, gõ từ bị thiếu | Full audio + **pause at gaps** | Blanks + timing |

## Solution: Separated Exercises + Audio

### 1. Data Structure

```
seed_data/
├─ vocabulary/
├─ dialogues.json                    (lines only)
├─ dialogue_exercises/
│  ├─ choice/
│  │  ├─ choice_001.json  ← audio: d1
│  │  ├─ choice_002.json  ← audio: d1 (same audio, different question!)
│  │  └─ ...
│  └─ cloze/
│     ├─ cloze_001.json   ← audio: d1
│     ├─ cloze_002.json   ← audio: d1 (same audio, different blanks!)
│     └─ ...
└─ dialogues_audio/
   ├─ d1/
   │  ├─ audio.mp3        (used by choice_001, choice_002, cloze_001, ...)
   │  └─ metadata.json    (timing for d1)
   └─ ...
```

### 2. dialogues.json Format

**Only lines** (no exercises):

```json
[
  {
    "id": "d1",
    "level": 1,
    "lines": [
      { "speaker": "A", "hanzi": "你好，你叫什么名字？", "pinyin": "..." },
      { "speaker": "B", "hanzi": "我叫王明。你叫什么名字？", "pinyin": "..." },
      { "speaker": "A", "hanzi": "我叫丽丽。很高兴认识你。", "pinyin": "..." },
      { "speaker": "B", "hanzi": "我也很高兴认识你。", "pinyin": "..." }
    ]
  }
]
```

### 3. Exercise Files

**dialogue_exercises/choice/choice_001.json**
```json
{
  "id": "choice_001",
  "audio_id": "d1",                    ← references which audio
  "lines_from_dialogue": [0, 1, 2, 3], ← which lines to show
  "question": "Người nam tên là gì?",
  "options": [
    { "vi": "Vương Minh", "correct": true },
    { "vi": "Lệ Lệ", "correct": false }
  ]
}
```

**dialogue_exercises/cloze/cloze_001.json**
```json
{
  "id": "cloze_001",
  "audio_id": "d1",                    ← references which audio
  "lines_from_dialogue": [0, 1, 2, 3],
  "blanks": [
    { "lineIndex": 1, "answer": "王明" }
  ]
}
```

### 4. Audio + Metadata

**dialogues_audio/d1/metadata.json**
```json
{
  "id": "d1",
  "audio_file": "audio.mp3",
  "duration_sec": 12.5,
  "exercises": {
    "choice": {
      "play_mode": "full",
      "timings": { "start": 0, "end": 12.5 }
    },
    "cloze": {
      "play_mode": "with_gaps",
      "gaps": [
        { "lineIndex": 1, "start": 4.2, "end": 5.1, "pause_after": true }
      ]
    }
  }
}
```

**Key point:** Timing configured per exercise **type** (choice vs cloze), not per individual exercise.

### 5. Backend Response Flow

```
GET /api/dialogues?level=1
  ← [{id, level, lines}]

GET /api/dialogues/{audio_id}/audio/metadata
  ← timing info for choice/cloze

GET /api/dialogue-exercises/choice?level=1
  ← [{id, audio_id, question, options}]

GET /api/dialogue-exercises/cloze?level=1
  ← [{id, audio_id, blanks}]

GET /api/dialogues/{audio_id}/audio
  ← serve audio.mp3
```

### 6. Frontend Usage

**Load an exercise:**
```js
// 1. Load exercise definition (choice_001 or cloze_001)
const exercise = await getExercise(exerciseId);
const audioId = exercise.audio_id;

// 2. Load dialogue lines
const dialogue = await getDialogue(audioId);

// 3. Load audio timing metadata
const metadata = await getAudioMetadata(audioId);

// 4. Play with appropriate mode
if (exercise.type === "choice") {
  playAudio(metadata.exercises.choice);  // full playback
} else if (exercise.type === "cloze") {
  playAudioWithGaps(metadata.exercises.cloze);  // with pauses
}
```

## Migration Plan

### Phase 1: Backend schema
- [ ] Update `dialogues.json` → move `question/options/blanks` → `exercises.*`
- [ ] Create `metadata.json` per dialogue
- [ ] Add `GET /api/dialogues/{id}/audio/metadata` endpoint

### Phase 2: Sync
- [ ] Update `sync.py` to validate new schema
- [ ] Download `metadata.json` from GitHub during refresh

### Phase 3: Frontend hooks
- [ ] Create `useDialogueWithMetadata()` hook
- [ ] Update `useDialogueAudio()` to accept `playMode` + `gaps`
- [ ] Update `DialogueChoice` + `DialogueCloze` components

### Phase 4: Data migration
- [ ] Convert seed data to new format
- [ ] Test both exercises work

## Benefits

1. ✅ **Clear separation** — each exercise has its own metadata
2. ✅ **Extensible** — easy to add more exercise types (listening comprehension, speed adjust, etc.)
3. ✅ **Timing-aware** — can implement smart pause/resume
4. ✅ **Cleaner data** — no mixed concerns in 1 JSON blob
5. ✅ **Future-proof** — support multiple audio variants per exercise
