#!/usr/bin/env python3
"""Statistical analysis + chart generation for the common-voice-zh benchmark report."""

import itertools
import json
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from scipy import stats

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
RESULTS_JSON = PROJECT_ROOT / "benchmarks" / "results.json"
REPORT_DIR = PROJECT_ROOT / "docs" / "report"
IMAGES_DIR = REPORT_DIR / "images"

MODEL_ORDER = [
    "faster-whisper-small",
    "sensevoice-small",
    "wav2vec2-xlsr-53-chinese",
    "wav2vec2-large-wenetspeech",
]
MODEL_LABELS = {
    "faster-whisper-small": "faster-whisper\n(small)",
    "sensevoice-small": "SenseVoice\n(small)",
    "wav2vec2-xlsr-53-chinese": "wav2vec2-XLSR-53\n(large)",
    "wav2vec2-large-wenetspeech": "wav2vec2-WenetSpeech\n(large)",
}
COLORS = {
    "faster-whisper-small": "#4C72B0",
    "sensevoice-small": "#55A868",
    "wav2vec2-xlsr-53-chinese": "#C44E52",
    "wav2vec2-large-wenetspeech": "#8172B2",
}

plt.rcParams.update({
    "figure.facecolor": "white",
    "axes.facecolor": "white",
    "axes.edgecolor": "#333333",
    "axes.grid": True,
    "grid.alpha": 0.3,
    "font.size": 11,
})


def load_experiments():
    with open(RESULTS_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)
    experiments = {e["model"]["name"]: e for e in data["experiments"]}
    return experiments


def paired_metric(experiments, metric_key):
    """Return dict model -> np.array of per-sample metric values, aligned by audio_id order."""
    ref_ids = [s["audio_id"] for s in experiments[MODEL_ORDER[0]]["samples"]]
    out = {}
    for m in MODEL_ORDER:
        by_id = {s["audio_id"]: s[metric_key] for s in experiments[m]["samples"]}
        out[m] = np.array([by_id[i] for i in ref_ids], dtype=float)
    return out


def bootstrap_ci(values, n_boot=5000, ci=95, seed=42):
    rng = np.random.default_rng(seed)
    n = len(values)
    boot_means = np.empty(n_boot)
    for i in range(n_boot):
        sample = rng.choice(values, size=n, replace=True)
        boot_means[i] = sample.mean()
    lo = np.percentile(boot_means, (100 - ci) / 2)
    hi = np.percentile(boot_means, 100 - (100 - ci) / 2)
    return float(values.mean()), float(lo), float(hi)


def run_statistical_tests(cer_by_model):
    arrays = [cer_by_model[m] for m in MODEL_ORDER]

    friedman_stat, friedman_p = stats.friedmanchisquare(*arrays)

    pairwise = []
    pairs = list(itertools.combinations(MODEL_ORDER, 2))
    bonferroni_alpha = 0.05 / len(pairs)
    for a, b in pairs:
        stat, p = stats.wilcoxon(cer_by_model[a], cer_by_model[b])
        pairwise.append({
            "model_a": a,
            "model_b": b,
            "wilcoxon_stat": float(stat),
            "p_value": float(p),
            "significant_bonferroni": bool(p < bonferroni_alpha),
        })

    return {
        "friedman": {
            "statistic": float(friedman_stat),
            "p_value": float(friedman_p),
            "significant_at_0.05": bool(friedman_p < 0.05),
        },
        "bonferroni_alpha": bonferroni_alpha,
        "pairwise_wilcoxon": pairwise,
    }


def compute_bootstrap_summary(experiments):
    summary = {}
    for m in MODEL_ORDER:
        cer_vals = np.array([s["cer"] for s in experiments[m]["samples"] if s["cer"] is not None])
        wer_vals = np.array([s["wer"] for s in experiments[m]["samples"] if s["wer"] is not None])
        lat_vals = np.array([s["inference_ms"] for s in experiments[m]["samples"]])
        cer_mean, cer_lo, cer_hi = bootstrap_ci(cer_vals)
        wer_mean, wer_lo, wer_hi = bootstrap_ci(wer_vals)
        lat_mean, lat_lo, lat_hi = bootstrap_ci(lat_vals)
        summary[m] = {
            "cer": {"mean": cer_mean, "ci95_lo": cer_lo, "ci95_hi": cer_hi},
            "wer": {"mean": wer_mean, "ci95_lo": wer_lo, "ci95_hi": wer_hi},
            "latency_ms": {"mean": lat_mean, "ci95_lo": lat_lo, "ci95_hi": lat_hi},
        }
    return summary


def plot_cer_wer_with_ci(bootstrap_summary):
    fig, axes = plt.subplots(1, 2, figsize=(11, 4.5))
    for ax, metric, title in [(axes[0], "cer", "Character Error Rate (CER)"), (axes[1], "wer", "Word Error Rate (WER)")]:
        means = [bootstrap_summary[m][metric]["mean"] for m in MODEL_ORDER]
        los = [bootstrap_summary[m][metric]["mean"] - bootstrap_summary[m][metric]["ci95_lo"] for m in MODEL_ORDER]
        his = [bootstrap_summary[m][metric]["ci95_hi"] - bootstrap_summary[m][metric]["mean"] for m in MODEL_ORDER]
        colors = [COLORS[m] for m in MODEL_ORDER]
        labels = [MODEL_LABELS[m] for m in MODEL_ORDER]
        ax.bar(labels, means, yerr=[los, his], capsize=5, color=colors, edgecolor="#333", linewidth=0.5)
        ax.set_title(title)
        ax.set_ylabel(metric.upper())
        ax.tick_params(axis="x", labelsize=9)
    fig.suptitle("Accuracy per model (mean, error bars = 95% bootstrap CI, n=200)")
    fig.tight_layout()
    fig.savefig(IMAGES_DIR / "cer_wer_with_ci.png", dpi=150)
    plt.close(fig)


def plot_cer_boxplot(cer_by_model):
    fig, ax = plt.subplots(figsize=(8, 5))
    data = [cer_by_model[m] for m in MODEL_ORDER]
    labels = [MODEL_LABELS[m] for m in MODEL_ORDER]
    bp = ax.boxplot(data, tick_labels=labels, patch_artist=True, showfliers=True)
    for patch, m in zip(bp["boxes"], MODEL_ORDER):
        patch.set_facecolor(COLORS[m])
        patch.set_alpha(0.6)
    ax.set_ylabel("CER (per sample)")
    ax.set_title("Distribution of per-sample CER (n=200, common-voice-zh)")
    ax.tick_params(axis="x", labelsize=9)
    fig.tight_layout()
    fig.savefig(IMAGES_DIR / "cer_boxplot.png", dpi=150)
    plt.close(fig)


def plot_accuracy_vs_latency(experiments):
    fig, ax = plt.subplots(figsize=(7.5, 6))
    for m in MODEL_ORDER:
        acc = experiments[m]["metrics"]["accuracy"]
        perf = experiments[m]["metrics"]["performance"]
        mem = experiments[m]["metrics"]["memory"]
        x = perf["inference_latency_ms"]
        y = 1 - acc["cer"]
        size = mem["model_size_mb"] / 5  # bubble size ~ model size
        ax.scatter(x, y, s=size, color=COLORS[m], alpha=0.75, edgecolor="#333", linewidth=0.8)
        ax.annotate(MODEL_LABELS[m].replace("\n", " "), (x, y), textcoords="offset points", xytext=(8, 6), fontsize=9)
    ax.set_xlabel("Avg. inference latency per sample (ms)")
    ax.set_ylabel("Accuracy (1 - CER)")
    ax.set_title("Accuracy vs. Latency (bubble size = model size on disk)")
    ax.axvline(500, color="gray", linestyle="--", linewidth=1, alpha=0.6, label="500ms EDGE target (STATEMENT.md)")
    ax.legend(loc="lower right", fontsize=9)
    fig.tight_layout()
    fig.savefig(IMAGES_DIR / "accuracy_vs_latency.png", dpi=150)
    plt.close(fig)


def plot_rtf(experiments):
    fig, ax = plt.subplots(figsize=(7, 4.5))
    rtfs = [experiments[m]["metrics"]["performance"]["rtf"] for m in MODEL_ORDER]
    labels = [MODEL_LABELS[m] for m in MODEL_ORDER]
    colors = [COLORS[m] for m in MODEL_ORDER]
    bars = ax.bar(labels, rtfs, color=colors, edgecolor="#333", linewidth=0.5)
    ax.axhline(1.0, color="red", linestyle="--", linewidth=1.2, label="Real-time threshold (RTF=1.0)")
    for bar, v in zip(bars, rtfs):
        ax.text(bar.get_x() + bar.get_width() / 2, v + 0.005, f"{v:.3f}", ha="center", fontsize=9)
    ax.set_ylabel("Real-Time Factor (RTF)")
    ax.set_title("Real-Time Factor per model (lower = faster than real-time)")
    ax.tick_params(axis="x", labelsize=9)
    ax.legend()
    fig.tight_layout()
    fig.savefig(IMAGES_DIR / "rtf_comparison.png", dpi=150)
    plt.close(fig)


def plot_memory_footprint(experiments):
    fig, ax = plt.subplots(figsize=(8, 4.5))
    x = np.arange(len(MODEL_ORDER))
    width = 0.35
    model_sizes = [experiments[m]["metrics"]["memory"]["model_size_mb"] for m in MODEL_ORDER]
    peak_rams = [experiments[m]["metrics"]["memory"]["peak_ram_mb"] for m in MODEL_ORDER]
    labels = [MODEL_LABELS[m] for m in MODEL_ORDER]
    ax.bar(x - width / 2, model_sizes, width, label="Model size on disk (MB)", color="#4C72B0")
    ax.bar(x + width / 2, peak_rams, width, label="Peak RAM during inference (MB)", color="#DD8452")
    ax.axhline(500, color="gray", linestyle="--", linewidth=1, alpha=0.6)
    ax.text(3.5, 520, "500MB EDGE budget", fontsize=8, color="gray", ha="right")
    ax.set_xticks(x)
    ax.set_xticklabels(labels, fontsize=9)
    ax.set_ylabel("MB")
    ax.set_title("Memory footprint: model size vs. peak RAM usage")
    ax.legend(fontsize=9)
    fig.tight_layout()
    fig.savefig(IMAGES_DIR / "memory_footprint.png", dpi=150)
    plt.close(fig)


def main():
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    experiments = load_experiments()

    cer_by_model = paired_metric(experiments, "cer")
    stat_results = run_statistical_tests(cer_by_model)
    bootstrap_summary = compute_bootstrap_summary(experiments)

    stats_out = {
        "n_samples": len(cer_by_model[MODEL_ORDER[0]]),
        "bootstrap_summary": bootstrap_summary,
        "significance_tests": stat_results,
    }
    with open(REPORT_DIR / "stats.json", "w", encoding="utf-8") as f:
        json.dump(stats_out, f, ensure_ascii=False, indent=2)
    print(f"Saved stats to {REPORT_DIR / 'stats.json'}")

    plot_cer_wer_with_ci(bootstrap_summary)
    plot_cer_boxplot(cer_by_model)
    plot_accuracy_vs_latency(experiments)
    plot_rtf(experiments)
    plot_memory_footprint(experiments)
    print(f"Saved 5 charts to {IMAGES_DIR}")

    print("\nFriedman test (overall difference among 4 models on CER):")
    print(f"  chi2={stat_results['friedman']['statistic']:.4f}, p={stat_results['friedman']['p_value']:.6f}")
    print(f"\nPairwise Wilcoxon (Bonferroni alpha={stat_results['bonferroni_alpha']:.4f}):")
    for pw in stat_results["pairwise_wilcoxon"]:
        sig = "SIGNIFICANT" if pw["significant_bonferroni"] else "not significant"
        print(f"  {pw['model_a']} vs {pw['model_b']}: p={pw['p_value']:.6f} ({sig})")


if __name__ == "__main__":
    main()
