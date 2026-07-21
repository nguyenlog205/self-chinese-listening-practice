# Technical Statement: Speech-to-Text Model Selection for Chinese Dictation

## Bối cảnh

Ứng dụng Chinese Dictation được phát triển nhằm hỗ trợ học tập tiếng Trung thông qua các bài tập dictation tương tác. Hiện tại, ứng dụng tập trung vào xử lý audio trong môi trường controlled (podcast, bài đọc chuẩn mực, tốc độ chậm).

Tuy nhiên, để nâng cao giá trị học tập thực tiễn, cần mở rộng khả năng xử lý đến các kịch bản thực tế:

1. Video tự nhiên từ internet (YouTube, bilibili, content creators)
2. Ngôn ngữ tự nhiên từ con người thực (varied accents, speaking speeds, background noise)
3. Các bài phát biểu tự do (spontaneous speech, không script)
4. Các môi trường có tiếng ồn (café, đường phố, không phải studio)

## Vấn đề

### Thách thức hiện tại

1. Mô hình STT cần hoạt động trên EDGE devices
   - Desktop/Laptop (CPU-bound)
   - Có thể sau này là mobile (Android/iOS)
   - Không dựa vào cloud API (privacy, latency, cost)

2. Thích ứng với real-world speech
   - Tiếng Trung có 4 tones chính + neutral tone
   - Tone detection lỗi kéo theo sai hiểu ý nghĩa
   - Người nói tự nhiên nói nhanh, không rõ
   - Background noise, multiple speakers

3. Trade-off performance

   Một mô hình STT có 3 chiều chính cần cân bằng:
   - Accuracy: Độ chính xác recognition (WER, CER, tone accuracy)
   - Latency: Tốc độ xử lý (cold start, inference time)
   - Resource: Tài nguyên yêu cầu (model size, RAM, CPU/GPU)

   Trên EDGE devices, không thể load các mô hình lớn (>2GB).
   Real-time streaming yêu cầu latency < 1000ms per utterance.
   Mô hình phải chạy trên CPU mà không cần GPU.

### Tình trạng hiện tại

- Ứng dụng chưa có STT integration riêng
- Các test datasets chỉ bao gồm audio chuẩn (HSK materials)
- Không có metrics để đánh giá trên real-world scenarios

## Mục tiêu

### Mục tiêu chính

Xác định mô hình STT tối ưu cho ứng dụng Chinese Dictation hoạt động trên EDGE devices với capability xử lý real-world speech.

### Tiêu chí đánh giá

1. Accuracy trên real-world speech
   - WER < 15% trên clean audio
   - WER < 30% trên noisy audio
   - Tone accuracy > 90%

2. Performance trên edge hardware (CPU)
   - Inference latency < 500ms per 10 second utterance
   - Real-time factor < 1.0 (xử lý nhanh hơn thời gian audio)
   - Model size < 500MB (feasible for offline distribution)

3. Memory footprint
   - Peak RAM usage < 2GB
   - Startup time < 5 seconds

### Phạm vi deliverables

1. Benchmark report
   - So sánh 4-5 mô hình STT chính trên cả clean và noisy datasets
   - Metrics: WER, CER, tone accuracy, latency, memory usage
   - Analysis: Performance vs Resource tradeoff

2. Test datasets
   - 50+ samples real-world Chinese speech
   - Kategori: clean, noisy, accented, fast-paced, slow
   - Ground truth transcriptions với tone markers

3. Deployment recommendations
   - Optimal mô hình cho production
   - Configuration details (quantization, batch size, device settings)
   - Integration guide cho application

## Phương pháp tiến hành

### Các mô hình cần evaluate

1. Whisper (OpenAI)
   - Pros: Robust, multilingual, tones support
   - Cons: Slow, large model
   - Variants to test: base, small, medium

2. SenseVoice (Alibaba)
   - Pros: Optimized for Chinese, fast, lightweight
   - Cons: Newer, less community support
   - Multilingual support (Zh, En, Ja, Ko)

3. Wav2vec 2.0 (Meta)
   - Pros: Fast, good for Chinese with fine-tuning
   - Cons: Requires careful fine-tuning
   - Variants: Chinese-specific pretrained

4. Hugging Face Chinese Models
   - XLNET, UniSpeech, WavLM
   - Community-maintained alternatives

### Dataset strategy

Sources:
- HSK reading materials (backend/listening_backend/seed_data/reading/)
- YouTube/bilibili Chinese videos (license-free samples)
- Speech synthesis + noise augmentation (để tạo noisy variants)

Categories:
- Clean speech (studio quality)
- Noisy speech (café, street, background music)
- Accented speech (từ non-native speakers)
- Fast speech (natural speaking speed)
- Slow speech (pedagogical content)

Annotations:
- Pinyin + tones (standard format)
- Character + tones (for validation)
- Speaker metadata (accent, speaking speed, background noise type)

### Evaluation metrics

Accuracy:
- WER: Word Error Rate = (S+D+I)/N
- CER: Character Error Rate (for Chinese with tones)
- Tone Accuracy: % tones predicted correctly
- Per-category accuracy (clean vs noisy vs accented)

Performance:
- Cold start: Time to load model first time
- Inference latency: Time per audio sample (ms)
- Real-time factor: Processing_time / Audio_duration
- Throughput: Samples processed per second

Resource:
- Model size: MB on disk
- Peak RAM: MB during inference
- Peak VRAM: MB if GPU available
- CPU usage: % during inference

Composite score:
- Efficiency ratio = (Accuracy * 100) / (Latency * Model_Size)

### Timeline

Week 1 (Jul 22-28): Setup
- Finalize model list
- Prepare test datasets
- Setup benchmarking infrastructure

Week 2 (Jul 29-Aug 4): Execution
- Download and test each model
- Run full benchmark suite
- Collect raw metrics

Week 3 (Aug 5-11): Analysis
- Process results
- Generate visualizations
- Write final report and recommendations

## Kết quả kỳ vọng

1. Comprehensive comparison table
   - 4-5 mô hình x 10+ metrics mỗi

2. Visualizations
   - Accuracy vs Latency tradeoff chart
   - Memory/Model size vs Performance
   - Per-category accuracy breakdown
   - Latency distribution histograms

3. Clear recommendations
   - "Best for accuracy" model + configuration
   - "Best for speed" model + configuration
   - "Best overall" compromise model
   - Hardware requirements for each

4. Integration roadmap
   - Next steps để integrate best model vào application
   - API design cho STT module
   - Test strategy cho production validation

## Constraints và Assumptions

Constraints:
- EDGE deployment (no cloud STT services)
- CPU-only execution (no GPU requirement)
- Model size < 500MB
- Development trên Linux (Docker possible)
- Focus trên Mandarin Chinese

Assumptions:
- PyTorch hoặc ONNX Runtime for inference
- CPU hardware standard (Intel i5/i7 or equivalent)
- Audio input <= 30 seconds per utterance
- Offline capability yêu cầu (models downloaded trước)

## Success criteria

- Identify ít nhất 1 mô hình có WER < 20% trên noisy data
- Confirm real-time capability (RTF < 1.0) trên target hardware
- Provide actionable integration guide
- Document edge cases và failure modes
