# CommonVoice Chinese Dataset

## Mô tả

Crowd-sourced speech corpus từ Mozilla CommonVoice project. Bao gồm diverse speakers, accents, recording conditions.

## Metadata

- Source: https://commonvoice.mozilla.org/
- License: CC0 (Public Domain)
- Language: Mandarin Chinese
- Audio Format: MP3/WAV, 48kHz (need resample to 16kHz)
- Split: Train/dev/test

## Danh mục

Breakdown theo loại:
- Clean: ~200 samples
- Background noise: ~200 samples
- Accented: ~150 samples
- Various speaking speeds: ~150 samples

## Tone coverage

Mixed, từ native và non-native speakers.

## Cách sử dụng

```bash
# Download từ Mozilla CommonVoice
# Requires account registration tại https://commonvoice.mozilla.org/

# Resample audio để 16kHz mono
ffmpeg -i input.mp3 -acodec pcm_s16le -ar 16000 -ac 1 output.wav
```

## Status

- Downloaded: No
- Prepared: No
- Size: Variable
- Last Updated: -

## Notes

Crowd-sourced quality có thể không đồng nhất. Tốt cho testing robustness.
