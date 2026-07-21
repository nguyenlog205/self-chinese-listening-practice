# Speech-to-Text Models Benchmarking

Thư mục này chứa các thí nghiệm và benchmarking liên quan đến mô hình speech-to-text cho ứng dụng dictation tiếng Trung Quốc.

## Mục đích

Đánh giá hiệu suất của các mô hình STT khác nhau. So sánh độ chính xác (accuracy, WER), tốc độ (latency), và tài nguyên tiêu thụ (CPU, memory). Xác định mô hình tối ưu cho ứng dụng mobile/desktop. Thiết lập baseline cho các cải tiến trong tương lai.

## Kịch bản Benchmarking

### Giai đoạn 1: Khảo sát mô hình (Tuần 1)

Mô hình cần test

1. Whisper (OpenAI)
   - Variants: tiny, base, small, medium
   - Ưu điểm: Open source, multilingual support, tiếng Trung tốt
   - Nhược điểm: Chậm hơn các mô hình khác

2. SenseVoice (Alibaba)
   - Tối ưu cho tiếng Trung, tiếng Anh, tiếng Nhật, tiếng Hàn
   - Nhanh và nhẹ hơn Whisper
   - Support chính xác tones tiếng Trung

3. Wav2vec 2.0 (Meta)
   - Chinese pretrained models
   - Hiệu suất cao, xử lý real-time

4. Hugging Face Models
   - XLNET, UniSpeech, WavLM variants
   - Test các mô hình Chinese-specific

### Giai đoạn 2: Thiết lập test environment (Tuần 1)

Test datasets

- Sample từ HSK reading materials (từ backend/listening_backend/seed_data/reading/)
- Chinese speech corpus (nếu có sẵn)
- Tối thiểu 50 samples: short (3-5 giây), medium (10-15 giây), long (30+ giây)

Test environment

- CPU: Intel/AMD standard specs
- Memory: Baseline 8GB, max 16GB
- GPU: Test cả CPU-only và GPU variants
- Framework: PyTorch, ONNX Runtime

### Giai đoạn 3: Định nghĩa metrics (Tuần 1)

Accuracy metrics

- WER (Word Error Rate): (S + D + I) / N trong đó S=substitutions, D=deletions, I=insertions
- CER (Character Error Rate): cho tiếng Trung (có tones)
- Tones accuracy: % tones dự đoán đúng

Performance metrics

- Latency:
  - Cold start time (load model)
  - Inference latency (ms per sample)
  - Real-time factor (RTF): processing_time / audio_duration
- Memory:
  - Model size (MB)
  - Peak RAM usage (MB)
  - VRAM usage (nếu dùng GPU)
- Throughput: samples/second

Hardware efficiency

- Score = (Accuracy * 100) / (Latency_ms * Model_Size_MB)
- Energy efficiency (nếu có measurements)

### Giai đoạn 4: Thực hiện experiment (Tuần 2)

Workflow

1. Download/cache models vào models/
2. Prepare test datasets
3. Run benchmarking script với comprehensive logging
4. Capture metrics vào benchmarks/results.json
5. Generate reports với charts

Output format

```json
{
  "experiment_id": "exp_001_20260722",
  "timestamp": "2026-07-22T10:30:00Z",
  "model": {
    "name": "whisper-base",
    "framework": "pytorch",
    "version": "20230101"
  },
  "environment": {
    "device": "cpu|gpu",
    "cpu": "Intel i7",
    "memory_gb": 16,
    "gpu": "NVIDIA RTX3090 (optional)"
  },
  "metrics": {
    "accuracy": {
      "wer": 0.12,
      "cer": 0.08,
      "tones_accuracy": 0.95
    },
    "performance": {
      "cold_start_ms": 2500,
      "inference_latency_ms": 150,
      "rtf": 0.18,
      "throughput_samples_per_sec": 6.67
    },
    "memory": {
      "model_size_mb": 140,
      "peak_ram_mb": 2048,
      "peak_vram_mb": 4096
    }
  },
  "samples": [
    {
      "audio_id": "sample_001",
      "duration_sec": 8.5,
      "ground_truth": "你好世界",
      "prediction": "你好世界",
      "wer": 0.0,
      "inference_ms": 145
    }
  ]
}
```

### Giai đoạn 5: Phân tích và báo cáo (Tuần 2)

Report sẽ include

- Comparison table (model x metrics)
- Performance vs Accuracy tradeoff visualization
- Latency distribution charts
- Memory usage breakdown
- Recommendations for production deployment

Deliverables

- benchmarks/results_summary.csv: Quick reference table
- benchmarks/detailed_results.json: Full metrics
- notebooks/analysis.ipynb: Visualizations và insights

## Cấu trúc thư mục

```
experiments/tts_models/
├── README.md                          # Kịch bản và tài liệu
├── benchmarks/
│   ├── results.json                   # Raw benchmark results
│   ├── results_summary.csv            # Quick reference table
│   └── plots/                         # Generated charts
├── models/
│   ├── whisper-base/                  # Cached models
│   ├── sensevoice/
│   └── wav2vec2/
├── scripts/
│   ├── download_models.py             # Model download script
│   ├── prepare_dataset.py             # Dataset preparation
│   ├── benchmark_single_model.py      # Individual model test
│   ├── run_all_benchmarks.py          # Full benchmark suite
│   └── analyze_results.py             # Post-processing & analysis
└── notebooks/
    └── analysis.ipynb                 # Visualization & insights
```

## Implementation Roadmap

Giai đoạn 1: Model selection & dataset prep (Tuần 1, từ 22-28 tháng 7)
Status: In Progress

Giai đoạn 2: Benchmark script development (Tuần 1-2, từ 22-28 tháng 7)
Status: Todo

Giai đoạn 3: Run benchmarks (Tuần 2, từ 29 tháng 7 - 4 tháng 8)
Status: Todo

Giai đoạn 4: Analysis và reporting (Tuần 2-3, từ 29 tháng 7 - 11 tháng 8)
Status: Todo

Giai đoạn 5: Optimization và recommendations (Tuần 3+, từ 4 tháng 8 trở đi)
Status: Todo

## Expected Outcomes

Bởi cuối Giai đoạn 2

- Detailed comparison table của 4-5 mô hình STT chính
- Latency vs Accuracy tradeoff analysis
- Memory/compute requirements baseline
- Hardware requirements recommendations

Recommendations sẽ cover

- Best model cho mobile devices (latency priority)
- Best model cho desktop/server (accuracy priority)
- Optimal inference strategy (batch vs stream)
- Hardware requirements và setup guide

## Integration Points

- Reading materials: backend/listening_backend/seed_data/reading/
- Frontend dictation feature: frontend/src/features/hsk_materials/components/Reading.jsx
- Existing backend: backend/listening_backend/

## Notes

- Focus trên Chinese speech recognition accuracy (tones là critical)
- Consider real-time streaming use case (RTF < 1.0 là critical)
- Test trên actual target hardware constraints
- Document failure cases và edge cases encountered
