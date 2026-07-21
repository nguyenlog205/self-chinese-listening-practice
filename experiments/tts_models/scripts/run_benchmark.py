#!/usr/bin/env python3
"""Benchmark a single STT model against a single dataset.

Usage:
    python run_benchmark.py --model faster-whisper-small \
        --dataset-dir data/common-voice-zh \
        --out benchmarks/results/faster-whisper-small.json \
        [--limit 5]
"""

import argparse
import json
import platform
import resource
import time
from datetime import datetime, timezone
from pathlib import Path

import jieba
import jiwer
from opencc import OpenCC
from pypinyin import Style, pinyin

from models import REGISTRY

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent

_T2S = OpenCC("t2s")


def normalize_zh(text: str) -> str:
    # Some models (e.g. Whisper) output Traditional Chinese even when the
    # ground truth is Simplified (zh-CN). Normalize both to Simplified before
    # scoring so CER/WER reflect real recognition errors, not script variants.
    return _T2S.convert(text)


def word_segment(text: str) -> str:
    return " ".join(jieba.lcut(text))


def compute_wer_cer(ground_truth: str, prediction: str):
    if not ground_truth:
        return None, None
    ground_truth = normalize_zh(ground_truth)
    prediction = normalize_zh(prediction)
    cer = jiwer.cer(ground_truth, prediction)
    wer = jiwer.wer(word_segment(ground_truth), word_segment(prediction))
    return round(wer, 4), round(cer, 4)


def tone_accuracy(ground_truth: str, prediction: str):
    ground_truth = normalize_zh(ground_truth)
    prediction = normalize_zh(prediction)
    gt_tones = [p[0][-1] for p in pinyin(ground_truth, style=Style.TONE3, errors="ignore") if p[0][-1].isdigit()]
    pred_tones = [p[0][-1] for p in pinyin(prediction, style=Style.TONE3, errors="ignore") if p[0][-1].isdigit()]
    if not gt_tones or len(gt_tones) != len(pred_tones):
        return None
    correct = sum(1 for a, b in zip(gt_tones, pred_tones) if a == b)
    return round(correct / len(gt_tones), 4)


def peak_ram_mb():
    # ru_maxrss is in KB on Linux
    return round(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024, 2)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True, choices=list(REGISTRY.keys()))
    parser.add_argument("--dataset-dir", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--limit", type=int, default=None)
    args = parser.parse_args()

    dataset_dir = Path(args.dataset_dir)
    if not dataset_dir.is_absolute():
        dataset_dir = PROJECT_ROOT / dataset_dir

    with open(dataset_dir / "transcriptions.json", "r", encoding="utf-8") as f:
        samples = json.load(f)["samples"]

    if args.limit:
        samples = samples[: args.limit]

    print(f"Model: {args.model} | Dataset: {dataset_dir.name} | Samples: {len(samples)}")

    adapter_cls = REGISTRY[args.model]
    adapter = adapter_cls()

    t0 = time.perf_counter()
    adapter.load()
    cold_start_ms = round((time.perf_counter() - t0) * 1000, 2)
    print(f"Cold start: {cold_start_ms} ms")

    sample_results = []
    total_wer, total_cer, total_tone_acc = [], [], []
    total_latency_ms, total_rtf = [], []

    for i, sample in enumerate(samples):
        audio_path = dataset_dir / sample["audio_file"]
        t0 = time.perf_counter()
        try:
            prediction = adapter.transcribe(str(audio_path))
        except Exception as e:
            prediction = ""
            print(f"  [{i+1}/{len(samples)}] ERROR on {sample['id']}: {e}")
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

        print(f"  [{i+1}/{len(samples)}] {sample['id']}: cer={cer} latency={latency_ms}ms")

    model_size_mb = adapter.model_size_mb()
    adapter.unload()

    def avg(lst):
        return round(sum(lst) / len(lst), 4) if lst else None

    result = {
        "experiment_id": f"{args.model}_{dataset_dir.name}_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "model": {
            "name": args.model,
            "checkpoint": adapter.checkpoint,
            "framework": adapter.__class__.__module__,
        },
        "dataset": dataset_dir.name,
        "environment": {
            "device": "cpu",
            "cpu": platform.processor() or platform.machine(),
            "python_version": platform.python_version(),
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
            "memory": {
                "model_size_mb": model_size_mb,
                "peak_ram_mb": peak_ram_mb(),
            },
        },
        "samples": sample_results,
    }

    out_path = Path(args.out)
    if not out_path.is_absolute():
        out_path = PROJECT_ROOT / out_path
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"\nSaved to {out_path}")
    print(f"WER={result['metrics']['accuracy']['wer']} CER={result['metrics']['accuracy']['cer']} "
          f"RTF={result['metrics']['performance']['rtf']} ModelSize={model_size_mb}MB")


if __name__ == "__main__":
    main()
