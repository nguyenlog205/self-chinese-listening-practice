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

- `hanzi`, `pinyin` — bắt buộc
- `en`, `vi` — tùy chọn (chuỗi rỗng nếu không có)

## Dialogues

**File:** `dialogues.json`

```json
[
  {
    "id": "greeting_001",
    "level": 1,
    "lines": [
      { "hanzi": "你好", "pinyin": "nǐ hǎo" },
      { "hanzi": "你好", "pinyin": "nǐ hǎo" }
    ],
    "question": "Họ nói gì?",
    "options": ["你好", "再见", "谢谢"],
    "blanks": [0, 1]
  }
]
```

- `id` — unique string, dùng để map audio file
- `level` — HSK level (1-6 hoặc "7-9")
- `lines` — mảng {hanzi, pinyin}
- `question` — câu hỏi (tiếng Việt/Anh/Trung)
- `options` — 3-4 đáp án
- `blanks` — mảng index của lines cần fill-in (dialogue cloze mode)

## Audio

**Folder:** `dialogues_audio/`  
**File:** `{dialogue_id}.mp3`

Upload file audio với tên = dialogue id. App tự download khi user click "Cập nhật dữ liệu".

Nếu dialogue chưa có audio → app dùng TTS fallback (không sao).

---

**Push to GitHub** → User bấm "Cập nhật" → ✅ Automatic sync
