# CommonVoice Chinese Dataset

## Mô tả

Crowd-sourced speech corpus từ Mozilla CommonVoice project. Là read speech (câu đọc từ Wikipedia/văn bản do volunteer thu âm), không phải spontaneous speech. Đóng vai trò baseline phụ, không thay thế cho youtube-samples (mục tiêu chính về real-world natural speech).

## Metadata

- Source: fsicoli/common_voice_17_0 trên Hugging Face (mirror của mozilla-foundation/common_voice_17_0, dataset gốc dùng loading script không còn được `datasets` library hỗ trợ)
- License: CC0 (Public Domain)
- Language: Mandarin Chinese (zh-CN)
- Audio Format: WAV, 16kHz, 16-bit, mono (resample từ MP3 gốc)
- Total samples: 200

## Danh mục

Toàn bộ 200 samples hiện gán category `crowdsourced` (chưa phân tách clean/noisy/accented/fast/slow). Volunteer đọc câu từ văn bản có sẵn, phát âm nhìn chung rõ ràng, gần với "clean" hơn là spontaneous.

## Tone coverage

Mixed, tùy theo giọng đọc của từng volunteer (metadata age/gender/accent có trong transcriptions.json).

## Cách sử dụng

```bash
cd experiments/tts_models
./.venv/bin/python3 data/common-voice-zh/download.py
```

Yêu cầu HF token đã đăng nhập (`huggingface-cli login`) và các package trong `requirements.txt` đã cài trong `.venv`.

Script tự động đọc `transcriptions.json` hiện có, chỉ tải thêm phần thiếu để đạt `TARGET_TOTAL` (hiện set = 200), không tải trùng.

## Status

- Downloaded: Yes
- Prepared: Yes
- Size: 38 MB (audio/)
- Total samples: 200
- Last Updated: 2026-07-22

## Notes

Crowd-sourced quality có thể không đồng nhất, nhưng đây là read speech (câu Wikipedia), không phải spontaneous conversational speech. Dùng làm baseline so sánh, không phải đại diện chính cho "người nói ngoài đời thực" trong STATEMENT.md.
