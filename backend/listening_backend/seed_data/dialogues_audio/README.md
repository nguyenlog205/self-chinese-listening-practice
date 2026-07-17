# Dialogue audio (real recordings)

Source of truth for **real, human-recorded** conversation audio backing
`listening/DialogueChoice.jsx` and `listening/DialogueCloze.jsx`. These
modes originally only had TTS (synthesized) playback, but the point of the
feature is listening practice on real conversations, not machine speech —
TTS there is a fallback for dialogues that don't have a recording yet, not
the intended long-term source.

## Convention

- One file per dialogue: `{dialogue.id}.mp3` (e.g. `d1.mp3`), matching the
  `id` field in `../dialogues.json`.
- Recording covers the **entire dialogue as one continuous take** (both
  speakers, in order) — not split per line. This mirrors how the app plays
  it (`listening.dialogue.playAll`) and how real listening-exam audio
  works.
- Format: mp3, mono, 44.1kHz is a safe default (no hard requirement — the
  backend serves whatever bytes are in the file with `media_type:
  audio/mpeg`, no transcoding).
- A dialogue with no matching file here simply falls back to TTS
  (`shared/useDialogueAudio.js` handles this automatically on the frontend)
  — you don't need to add every dialogue's audio at once.

## How it reaches a running app

Two ways a file here becomes audible:

1. **Bundled with the app** — if you added the file to a checkout/release
   before build, `content/audio_router.py` serves it directly from this
   folder as a fallback.
2. **Pulled by "Cập nhật dữ liệu" in Settings** — pushing a new file here to
   `main` on GitHub, then clicking "Cập nhật dữ liệu" downloads it into the
   local writable cache (`storage/dialogue_audio_cache/`), same mechanism
   `content/sync.py` already uses for `dialogues.json`/vocabulary. This is
   the path for updating already-installed apps without a new release.
