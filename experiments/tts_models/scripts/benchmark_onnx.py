#!/usr/bin/env python3
"""Benchmark the ONNX-exported wav2vec2-large-wenetspeech model on
common-voice-zh, using the exact same CER/WER/tone-accuracy scoring as
run_benchmark.py so the numbers are directly comparable to the existing
PyTorch result (benchmarks/results/wav2vec2-large-wenetspeech_common-voice-zh.json).

Usage:
    python benchmark_onnx.py \
        --onnx models/onnx/wav2vec2-large-wenetspeech.onnx \
        --out benchmarks/results/wav2vec2-large-wenetspeech-onnx_common-voice-zh.json \
        [--limit 20]   # drop --limit for the full 200-sample run
"""

import argparse
import json
import platform
import time
from datetime import datetime, timezone
from pathlib import Path

import onnxruntime as ort
import soundfile as sf
from transformers import Wav2Vec2Processor

from run_benchmark import compute_wer_cer, tone_accuracy  # reuse scoring, keep results comparable

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
CHECKPOINT = "wbbbbb/wav2vec2-large-chinese-zh-cn"
CACHE_DIR = PROJECT_ROOT / "models" / "hf"
PYTORCH_BASELINE = PROJECT_ROOT / "benchmarks" / "results" / "wav2vec2-large-wenetspeech_common-voice-zh.json"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--onnx", default="models/onnx/wav2vec2-large-wenetspeech.onnx")
    parser.add_argument("--dataset-dir", default="data/common-voice-zh")
    parser.add_argument("--out", default="benchmarks/results/wav2vec2-large-wenetspeech-onnx_common-voice-zh.json")
    parser.add_argument("--limit", type=int, default=None)
    args = parser.parse_args()

    onnx_path = Path(args.onnx)
    if not onnx_path.is_absolute():
        onnx_path = PROJECT_ROOT / onnx_path
    dataset_dir = Path(args.dataset_dir)
    if not dataset_dir.is_absolute():
        dataset_dir = PROJECT_ROOT / dataset_dir
    out_path = Path(args.out)
    if not out_path.is_absolute():
        out_path = PROJECT_ROOT / out_path
    out_path.parent.mkdir(parents=True, exist_ok=True)

    with open(dataset_dir / "transcriptions.json", "r", encoding="utf-8") as f:
        samples = json.load(f)["samples"]
    if args.limit:
        samples = samples[: args.limit]

    print(f"Loading processor ({CHECKPOINT}) and ONNX session ({onnx_path.name}) ...")
    processor = Wav2Vec2Processor.from_pretrained(CHECKPOINT, cache_dir=str(CACHE_DIR))

    t0 = time.perf_counter()
    session = ort.InferenceSession(str(onnx_path), providers=["CPUExecutionProvider"])
    cold_start_ms = round((time.perf_counter() - t0) * 1000, 2)
    print(f"Cold start: {cold_start_ms} ms | Samples: {len(samples)}")

    sample_results = []
    total_wer, total_cer, total_tone_acc = [], [], []
    total_latency_ms, total_rtf = [], []

    for i, sample in enumerate(samples):
        audio_path = dataset_dir / sample["audio_file"]
        audio, sr = sf.read(str(audio_path), dtype="float32")

        t0 = time.perf_counter()
        try:
            inputs = processor(audio, sampling_rate=sr, return_tensors="np", padding=True)
            logits = session.run(["logits"], {"input_values": inputs.input_values})[0]
            pred_ids = logits.argmax(axis=-1)
            prediction = processor.batch_decode(pred_ids)[0].replace(" ", "").strip()
        except Exception as e:
            prediction = ""
            print(f"  [{i + 1}/{len(samples)}] ERROR on {sample['id']}: {e}")
        latency_ms = round((time.perf_counter() - t0) * 1000, 2)

        gt = sample["ground_truth"]
        wer, cer = compute_wer_cer(gt, prediction)
        tone_acc = tone_accuracy(gt, prediction)
        duration = sample.get("duration_sec", 0) or 0.001
        rtf = round((latency_ms / 1000) / duration, 4)

        if wer is not None:
            total_wer.append(wer)
            total_cer.append(cer)
        if tone_acc is not None:
            total_tone_acc.append(tone_acc)
        total_latency_ms.append(latency_ms)
        total_rtf.append(rtf)

        sample_results.append({
            "audio_id": sample["id"],
            "duration_sec": sample.get("duration_sec"),
            "ground_truth": gt,
            "prediction": prediction,
            "wer": wer,
            "cer": cer,
            "tone_accuracy": tone_acc,
            "inference_ms": latency_ms,
        })
        print(f"  [{i + 1}/{len(samples)}] {sample['id']}: cer={cer} latency={latency_ms}ms")

    def avg(lst):
        return round(sum(lst) / len(lst), 4) if lst else None

    result = {
        "experiment_id": f"wav2vec2-large-wenetspeech-onnx_{dataset_dir.name}_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "model": {
            "name": "wav2vec2-large-wenetspeech-onnx",
            "checkpoint": CHECKPOINT,
            "runtime": "onnxruntime",
        },
        "dataset": dataset_dir.name,
        "environment": {
            "device": "cpu",
            "cpu": platform.processor() or platform.machine(),
            "python_version": platform.python_version(),
            "onnxruntime_providers": session.get_providers(),
        },
        "metrics": {
            "accuracy": {
                "wer": avg(total_wer),
                "cer": avg(total_cer),
                "tone_accuracy": avg(total_tone_acc),
            },
            "performance": {
                "cold_start_ms": cold_start_ms,
                "inference_latency_ms": avg(total_latency_ms),
                "rtf": avg(total_rtf),
                "throughput_samples_per_sec": round(1000 / avg(total_latency_ms), 4) if avg(total_latency_ms) else None,
            },
        },
        "samples": sample_results,
    }

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"\nSaved to {out_path}")
    print(f"CER={result['metrics']['accuracy']['cer']} RTF={result['metrics']['performance']['rtf']} "
          f"latency={result['metrics']['performance']['inference_latency_ms']}ms")

    if PYTORCH_BASELINE.exists():
        with open(PYTORCH_BASELINE, "r", encoding="utf-8") as f:
            pt = json.load(f)
        pt_lat = pt["metrics"]["performance"]["inference_latency_ms"]
        pt_cer = pt["metrics"]["accuracy"]["cer"]
        onnx_lat = result["metrics"]["performance"]["inference_latency_ms"]
        onnx_cer = result["metrics"]["accuracy"]["cer"]
        print("\n=== PyTorch vs ONNX Runtime (CPU) ===")
        print(f"{'':22s} {'PyTorch':>12s} {'ONNX Runtime':>14s}")
        print(f"{'CER':22s} {pt_cer:>12} {onnx_cer:>14}")
        print(f"{'Latency (ms/sample)':22s} {pt_lat:>12} {onnx_lat:>14}")
        if onnx_lat:
            print(f"\nSpeedup: {pt_lat / onnx_lat:.2f}x")
    else:
        print(f"\n(No PyTorch baseline found at {PYTORCH_BASELINE} to compare against.)")


if __name__ == "__main__":
    main()
