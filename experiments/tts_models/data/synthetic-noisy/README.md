# Synthetic Noisy Dataset

## Mô tả

Clean audio từ AISHELL-1 hoặc AISHELL-2 dengan noise augmentation. Simulate real-world scenarios như café, street noise, background music.

## Metadata

- Source: AISHELL-1/2 + augmentation (MUSAN, ESC-50)
- License: Inherited from source datasets
- Language: Mandarin Chinese
- Audio Format: WAV, 16kHz, 16-bit, mono
- SNR levels: 20dB, 10dB, 5dB, 0dB

## Danh mục

Breakdown theo loại noise:
- Café chatter: ~50 samples
- Street noise: ~50 samples
- Background music: ~50 samples
- Office environment: ~50 samples
- Various SNR levels: Distributed across categories

## Tone coverage

Same distribution as source dataset.

## Cách sử dụng

```bash
python augment_with_noise.py \
  --source aishell-1 \
  --noise_source musan,esc50 \
  --output_dir synthetic-noisy/audio
```

## Status

- Downloaded: No
- Prepared: No
- Size: Variable
- Last Updated: -

## Notes

Tạo từ mã lệnh prepare script, không cần download từ bên ngoài. Tốt cho stress-testing model robustness trên noisy conditions.
