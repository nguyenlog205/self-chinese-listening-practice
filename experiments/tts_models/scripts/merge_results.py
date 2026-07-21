#!/usr/bin/env python3
"""Merge per-model benchmark result JSONs into a combined report."""

import csv
import json
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
RESULTS_DIR = PROJECT_ROOT / "benchmarks" / "results"
OUT_JSON = PROJECT_ROOT / "benchmarks" / "results.json"
OUT_CSV = PROJECT_ROOT / "benchmarks" / "results_summary.csv"


def main():
    result_files = sorted(RESULTS_DIR.glob("*.json"))
    if not result_files:
        raise SystemExit(f"No result files found in {RESULTS_DIR}")

    merged = []
    for f in result_files:
        with open(f, "r", encoding="utf-8") as fh:
            merged.append(json.load(fh))

    with open(OUT_JSON, "w", encoding="utf-8") as fh:
        json.dump({"experiments": merged}, fh, ensure_ascii=False, indent=2)
    print(f"Saved merged results to {OUT_JSON}")

    fieldnames = [
        "model", "checkpoint", "dataset", "num_samples",
        "wer", "cer", "tone_accuracy",
        "cold_start_ms", "inference_latency_ms", "rtf", "throughput_samples_per_sec",
        "model_size_mb", "peak_ram_mb",
    ]
    with open(OUT_CSV, "w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        for r in merged:
            acc = r["metrics"]["accuracy"]
            perf = r["metrics"]["performance"]
            mem = r["metrics"]["memory"]
            writer.writerow({
                "model": r["model"]["name"],
                "checkpoint": r["model"]["checkpoint"],
                "dataset": r["dataset"],
                "num_samples": len(r["samples"]),
                "wer": acc["wer"],
                "cer": acc["cer"],
                "tone_accuracy": acc["tone_accuracy"],
                "cold_start_ms": perf["cold_start_ms"],
                "inference_latency_ms": perf["inference_latency_ms"],
                "rtf": perf["rtf"],
                "throughput_samples_per_sec": perf["throughput_samples_per_sec"],
                "model_size_mb": mem["model_size_mb"],
                "peak_ram_mb": mem["peak_ram_mb"],
            })
    print(f"Saved summary CSV to {OUT_CSV}")


if __name__ == "__main__":
    main()
