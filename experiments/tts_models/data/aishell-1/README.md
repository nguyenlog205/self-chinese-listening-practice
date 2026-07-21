# AISHELL-1 Dataset

## Mô tả

Large-scale open source Mandarin speech corpus. Chuẩn mực, controlled quality audio, hoàn hảo cho baseline evaluation.

## Metadata

- Source: https://www.openslr.org/33/
- License: CC BY-NC-SA 4.0
- Language: Mandarin Chinese
- Total Duration: 178 hours
- Speakers: 340
- Utterances: 400 per speaker
- Audio Format: WAV, 16kHz, 16-bit, mono

## Danh mục

Breakdown theo loại:
- Clean: ~300 samples
- Fast-paced: ~50 samples
- Slow: ~50 samples

## Tone coverage

Standard Mandarin 5-tone distribution.

## Cách sử dụng

```bash
wget https://www.openslr.org/resources/33/data_aishell.tgz
tar -xzf data_aishell.tgz
python prepare_aishell1.py
```

## Status

- Downloaded: No
- Prepared: No
- Size: 36.7 GB
- Last Updated: -

## Notes

Thích hợp cho benchmark accuracy trên clean audio.
