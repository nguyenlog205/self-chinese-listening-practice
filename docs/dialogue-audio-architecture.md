# Dialogue Audio & Exercise Architecture

## Problem

Hiện tại dialogue gộp mọi thứ vào 1 file audio, nhưng có 2 exercise types hoàn toàn khác nhau:

| Type | Behavior | Audio | Metadata |
|------|----------|-------|----------|
| **Choice** | Nghe toàn bộ, chọn đáp án | Full audio | Question + options |
| **Cloze** | Nghe toàn bộ, gõ từ bị thiếu | Full audio + **pause at gaps** | Blanks + timing |

## Solution: Exercise-aware metadata

### 1. Data Structure

```
seed_data/
├─ dialogues.json           (chỉ chứa exercise definition)
└─ dialogues_audio/
   ├─ {dialogue_id}/
   │  ├─ audio.mp3          (master audio file)
   │  └─ metadata.json      (exercise variants + timing)
```

### 2. dialogues.json Format

```json
[
  {
    "id": "greeting_001",
    "level": 1,
    "lines": [
      { "speaker": "A", "hanzi": "你好", "pinyin": "nǐ hǎo" },
      { "speaker": "B", "hanzi": "你好", "pinyin": "nǐ hǎo" }
    ],
    "exercises": {
      "choice": {
        "question": "Họ nói gì?",
        "options": ["你好", "再见", "谢谢"]
      },
      "cloze": {
        "blanks": [
          { "lineIndex": 0, "answer": "你好" }
        ]
      }
    }
  }
]
```

**Ghi chú:**
- `lines` + `exercises` là **định nghĩa bài tập**
- Không còn `question`, `options`, `blanks` ở top-level
- Mỗi exercise type có metadata riêng

### 3. dialogues_audio/{id}/metadata.json

```json
{
  "id": "greeting_001",
  "audio_file": "audio.mp3",
  "duration_sec": 8.3,
  "exercises": {
    "choice": {
      "play_mode": "full",
      "timings": {
        "start": 0,
        "end": 8.3
      }
    },
    "cloze": {
      "play_mode": "with_gaps",
      "gaps": [
        {
          "lineIndex": 0,
          "start": 0.5,
          "end": 1.2,
          "pause_after": true
        }
      ]
    }
  }
}
```

**Ghi chú:**
- Backend generate từ audio analysis (Whisper timestamps)
- Hoặc manual tune nếu cần precision
- `pause_after: true` = auto-pause ở gap để user gõ

### 4. Backend Response Flow

```
GET /api/dialogues?level=1
  ← dialogue definition (lines + exercises)

GET /api/dialogues/{id}/audio/metadata
  ← timing + play_mode info

GET /api/dialogues/{id}/audio
  ← serve audio.mp3 (same as before)
```

### 5. Frontend Usage

**DialogueChoice:**
```js
const { dialogue, metadata } = useDialogueWithMetadata(id);
const play = () => playAudio(metadata.exercises.choice);
// → phát full audio
```

**DialogueCloze:**
```js
const { dialogue, metadata } = useDialogueWithMetadata(id);
const play = () => playAudioWithGaps(metadata.exercises.cloze);
// → phát audio, auto-pause ở gaps
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
