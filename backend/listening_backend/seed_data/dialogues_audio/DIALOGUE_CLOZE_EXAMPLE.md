# DialogueCloze Exercise - Audio Setup

Fill-the-blank listening: **Hear dialogue → Type missing words at pauses**

## Example: d2 (Shopping)

### Dialogue Definition (`../dialogues.json`)
```json
{
  "id": "d2",
  "level": 1,
  "lines": [
    { "speaker": "A", "hanzi": "你好，这个多少钱？", "pinyin": "..." },
    { "speaker": "B", "hanzi": "十五块。", "pinyin": "..." },
    { "speaker": "A", "hanzi": "太贵了，便宜一点儿吧。", "pinyin": "..." },
    { "speaker": "B", "hanzi": "好吧，十块给你。", "pinyin": "..." }
  ],
  "exercises": {
    "choice": { ... },
    "cloze": {
      "blanks": [
        { "lineIndex": 1, "answer": "十五块" },
        { "lineIndex": 3, "answer": "十块" }
      ]
    }
  }
}
```

### Audio Setup (`dialogues_audio/d2/`)

**File:** `audio.mp3`
- Duration: ~10.8 seconds
- Entire dialogue as one file (don't split per line)
- Both speakers in order

**Metadata:** `metadata.json`
```json
{
  "id": "d2",
  "audio_file": "audio.mp3",
  "duration_sec": 10.8,
  "exercises": {
    "choice": { ... },
    "cloze": {
      "play_mode": "with_gaps",
      "gaps": [
        {
          "lineIndex": 1,
          "start": 2.5,
          "end": 3.2,
          "pause_after": true
        },
        {
          "lineIndex": 3,
          "start": 8.0,
          "end": 9.0,
          "pause_after": true
        }
      ]
    }
  }
}
```

## Gap Timing Explained

```
Timeline:
  0s ──────────── 2.5s ──── 3.2s ─────────── 8.0s ──── 9.0s ────── 10.8s
  "你好，这个多少钱？"  [BLANK A]  "太贵了..."    [BLANK B]  "...给你。"

gaps[0]:
  - lineIndex: 1 = "十五块。" (speaker B, line 1)
  - start: 2.5s = when B starts speaking
  - end: 3.2s = when B finishes ("十五块。")
  - pause_after: true = auto-pause here for user to type

gaps[1]:
  - lineIndex: 3 = "好吧，十块给你。"
  - start: 8.0s = when B starts this line
  - end: 9.0s = when key words end
  - pause_after: true = auto-pause for user to type
```

## How to Fill Gaps

1. **Record full dialogue** (don't pause)
2. **Identify blanks** in your exercise definition
3. **Measure timing** for each blank:
   - `start` = when speaker begins the blank line
   - `end` = when the key words to fill finish
4. **Set `pause_after: true`** to auto-pause for user input

## Pattern

**For any DialogueCloze:**

1. Record entire dialogue continuously
2. Set `play_mode: "with_gaps"`
3. For each blank, measure `start` / `end` timing
4. App will:
   - Play 0 → first gap start
   - Play gap (user hears it)
   - **Auto-pause** at gap end
   - Wait for user input
   - Resume play
   - Repeat for next gap

---

**See also:** `DIALOGUE_CHOICE_EXAMPLE.md` for multiple choice setup
