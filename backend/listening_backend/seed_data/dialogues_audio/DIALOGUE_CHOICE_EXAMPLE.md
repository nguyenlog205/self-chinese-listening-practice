# DialogueChoice Exercise - Audio Setup

Multiple choice listening: **Hear full dialogue → Answer question**

## Example: d1 (Greeting)

### Dialogue Definition (`../dialogues.json`)
```json
{
  "id": "d1",
  "level": 1,
  "lines": [
    { "speaker": "A", "hanzi": "你好，你叫什么名字？", "pinyin": "..." },
    { "speaker": "B", "hanzi": "我叫王明。你叫什么名字？", "pinyin": "..." },
    { "speaker": "A", "hanzi": "我叫丽丽。很高兴认识你。", "pinyin": "..." },
    { "speaker": "B", "hanzi": "我也很高兴认识你。", "pinyin": "..." }
  ],
  "exercises": {
    "choice": {
      "question": { "vi": "Người nam tên là gì?", "en": "What is the man's name?" },
      "options": [
        { "vi": "Vương Minh", "correct": true },
        { "vi": "Lệ Lệ", "correct": false },
        { "vi": "Lý Minh", "correct": false }
      ]
    },
    "cloze": { "blanks": [...] }
  }
}
```

### Audio Setup (`dialogues_audio/d1/`)

**File:** `audio.mp3`
- Duration: ~12.5 seconds
- Entire dialogue as one continuous take
- Both speakers in order (A → B → A → B)

**Metadata:** `metadata.json`
```json
{
  "id": "d1",
  "audio_file": "audio.mp3",
  "duration_sec": 12.5,
  "exercises": {
    "choice": {
      "play_mode": "full",
      "timings": {
        "start": 0,
        "end": 12.5
      }
    },
    "cloze": { ... }
  }
}
```

## Pattern

**For any DialogueChoice:**

1. Record **entire dialogue** as one file
2. Set `play_mode: "full"` (app plays 0 → end)
3. User hears everything before answering question
4. No special timing needed for choice mode

---

**See also:** `DIALOGUE_CLOZE_EXAMPLE.md` for fill-the-blank timing
