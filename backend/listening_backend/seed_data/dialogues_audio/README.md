# Dialogue Audio & Metadata

Real conversation audio + exercise-specific timing metadata for `DialogueChoice` and `DialogueCloze`.

## Folder Structure

```
dialogues_audio/
└─ {dialogue_id}/
   ├─ audio.mp3           ← Master audio (both speakers, continuous)
   └─ metadata.json       ← Timing + play modes per exercise
```

## Per-Dialogue Files

### audio.mp3
- **Format:** MP3, mono, 44.1kHz
- **Content:** Entire dialogue as one continuous take (both speakers in order)
- **Duration:** Typically 5-15 seconds
- **Fallback:** If missing, app uses TTS synthesis (automatic on frontend)

### metadata.json
Exercise-specific timing and play modes. See `../CONVENTION.md` for schema.

**Example:**
```json
{
  "id": "greeting_001",
  "audio_file": "audio.mp3",
  "duration_sec": 8.3,
  "exercises": {
    "choice": {
      "play_mode": "full",
      "timings": { "start": 0, "end": 8.3 }
    },
    "cloze": {
      "play_mode": "with_gaps",
      "gaps": [
        { "lineIndex": 0, "start": 0.5, "end": 1.2, "pause_after": true }
      ]
    }
  }
}
```

## Adding Audio

1. Create folder: `mkdir dialogues_audio/{dialogue_id}`
2. Add audio file: `cp recording.mp3 dialogues_audio/{dialogue_id}/audio.mp3`
3. Add metadata: Create `metadata.json` with timing info
4. Ensure `../dialogues.json` has matching dialogue definition
5. Commit & push → User clicks "Cập nhật dữ liệu" → auto-sync ✓

## Exercise Type Examples

- **[DIALOGUE_CHOICE_EXAMPLE.md](DIALOGUE_CHOICE_EXAMPLE.md)** — Multiple choice setup (d1)
  - Full audio playback, no special timing needed
- **[DIALOGUE_CLOZE_EXAMPLE.md](DIALOGUE_CLOZE_EXAMPLE.md)** — Fill-the-blank setup (d2)
  - Gap timing for auto-pause at blanks

Existing examples: `d1/`, `d2/`, `d3/`, `d4/`

## Distribution

Two ways files reach users:

1. **Bundled** — included in app release (fallback)
2. **Live sync** — "Cập nhật dữ liệu" downloads from GitHub into local cache (preferred for updates)
