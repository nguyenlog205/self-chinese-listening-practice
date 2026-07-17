# Data Convention

## Vocabulary

**File:** `vocabulary/hsk_N.json` (N = 1-6, `7_9`)

```json
[
  {
    "hanzi": "你好",
    "pinyin": "nǐ hǎo",
    "en": "hello",
    "vi": "xin chào"
  }
]
```

**Required:** `hanzi`, `pinyin`  
**Optional:** `en`, `vi`

---

## Dialogues

**File:** `dialogues.json`

Chỉ chứa **lines** (nội dung hội thoại), không chứa exercises:

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

**Fields:**
- `id` — unique string (reference trong audio/exercises)
- `level` — HSK level (1-6 hoặc "7-9")
- `lines` — mảng {speaker, hanzi, pinyin}

---

## Dialogue Exercises

### Choice Exercises

**Folder:** `dialogue_exercises/choice/`  
**File:** `choice_NNN.json`

1 audio có thể dùng cho nhiều choice questions:

```json
{
  "id": "choice_001",
  "audio_id": "d1",
  "lines_from_dialogue": [0, 1, 2, 3],
  "question": "Người nam tên là gì?",
  "options": [
    { "vi": "Vương Minh", "correct": true },
    { "vi": "Lệ Lệ", "correct": false },
    { "vi": "Lý Minh", "correct": false }
  ]
}
```

**Fields:**
- `id` — unique exercise ID
- `audio_id` — reference tới dialogues.json (d1, d2, ...)
- `lines_from_dialogue` — line indices từ dialogue (để show context)
- `question` — câu hỏi
- `options` — 3-4 đáp án {text, correct}

### Cloze Exercises

**Folder:** `dialogue_exercises/cloze/`  
**File:** `cloze_NNN.json`

1 audio có thể dùng cho nhiều cloze questions:

```json
{
  "id": "cloze_001",
  "audio_id": "d1",
  "lines_from_dialogue": [0, 1, 2, 3],
  "blanks": [
    { "lineIndex": 1, "answer": "王明" }
  ]
}
```

**Fields:**
- `id` — unique exercise ID
- `audio_id` — reference tới audio (d1, d2, ...)
- `lines_from_dialogue` — line indices
- `blanks` — mảng {lineIndex, answer}

---

## Audio & Metadata

**Folder:** `dialogues_audio/{audio_id}/`

```
dialogues_audio/
├─ d1/
│  ├─ audio.mp3          ← dùng cho choice_001, cloze_001, v.v
│  └─ metadata.json      ← timing info
├─ d2/
│  ├─ audio.mp3
│  └─ metadata.json
└─ ...
```

### audio.mp3
- Format: MP3, 44.1kHz, mono
- Entire dialogue as continuous take
- 1 audio có thể dùng cho nhiều exercises

### metadata.json

Timing info per exercise type:

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

---

## Workflow

1. **Add dialogue lines** → `dialogues.json` (chỉ lines)
2. **Create exercises** → `dialogue_exercises/choice/*.json` + `dialogue_exercises/cloze/*.json`
   - Mỗi exercise reference tới audio_id
3. **Record audio** → `dialogues_audio/{audio_id}/audio.mp3`
4. **Add timing metadata** → `dialogues_audio/{audio_id}/metadata.json`
5. **Commit & push**
6. **User click "Cập nhật dữ liệu"** → auto-sync toàn bộ

**Lợi ích:**
- ✅ 1 audio dùng cho nhiều exercises
- ✅ Cập nhật exercise không cần re-record audio
- ✅ Dễ add variations (alternative questions)
