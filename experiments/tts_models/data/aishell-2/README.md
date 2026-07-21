# AISHELL-2 Dataset

## Mô tả

Extension của AISHELL-1 với speech từ nhiều nguồn và speakers khác nhau. Bao gồm real-world scenarios, conversational speech, và diverse accents.

## Metadata

- Source: https://www.openslr.org/33/
- License: CC BY-NC-SA 4.0
- Language: Mandarin Chinese
- Total Duration: 1000+ hours
- Speakers: ~1000+
- Audio Format: WAV, 16kHz, 16-bit, mono

## Danh mục

Breakdown theo loại:
- Clean: ~500 samples
- Conversational: ~300 samples
- Accented: ~150 samples
- Fast-paced: ~200 samples

## Tone coverage

Diverse tone distribution từ nhiều speakers.

## Cách sử dụng

```bash
wget https://www.openslr.org/resources/33/data_aishell.tgz
tar -xzf data_aishell.tgz
python prepare_aishell2.py
```

## Status

- Downloaded: No
- Prepared: No
- Size: ~82 GB
- Last Updated: -

## Notes

Bao gồm nhiều scenarios thực tế, tốt cho testing robustness.
