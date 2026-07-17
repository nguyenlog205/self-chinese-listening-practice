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

Định nghĩa bài tập (lines + exercise metadata):

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

**Fields:**
- `id` — unique string (dùng để map audio folder)
- `level` — HSK level (1-6 hoặc "7-9")
- `lines` — mảng {speaker, hanzi, pinyin}
- `exercises.choice` — multiple choice exercise
  - `question` — câu hỏi (bất kỳ ngôn ngữ nào)
  - `options` — 3-4 đáp án
- `exercises.cloze` — fill-the-blank exercise
  - `blanks` — mảng {lineIndex, answer}

---

## Audio & Metadata

**Folder:** `dialogues_audio/{dialogue_id}/`

```
dialogues_audio/
└─ greeting_001/
   ├─ audio.mp3          ← master audio file
   └─ metadata.json      ← timing + play modes
```

### audio.mp3
- Format: MP3, 44.1kHz, mono
- Duration: tùy ý (thường 5-15 giây)
- Upload file thực cùng với metadata

### metadata.json

Timing info + exercise-specific play modes:

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

**Fields:**
- `duration_sec` — tổng độ dài audio (giây)
- `exercises.choice.play_mode: "full"` — phát toàn bộ
- `exercises.cloze.play_mode: "with_gaps"` — phát với pause ở gaps
- `gaps[].pause_after` — tự động pause ở điểm này để user gõ

---

## Workflow

1. **Thêm dialogue definition** → `dialogues.json`
2. **Record audio** → `dialogues_audio/{id}/audio.mp3`
3. **Add timing metadata** → `dialogues_audio/{id}/metadata.json`
4. **Commit & push**
5. **User click "Cập nhật dữ liệu"** → auto-sync toàn bộ

**Nếu chưa có audio?** → App dùng TTS fallback (không sao, có thể add sau)
