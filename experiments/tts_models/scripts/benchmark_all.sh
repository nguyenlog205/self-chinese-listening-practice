#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
VENV_PY="$PROJECT_ROOT/.venv/bin/python3"

DATASET_DIR="${1:-data/common-voice-zh}"
DATASET_NAME="$(basename "$DATASET_DIR")"

MODELS=(
  "faster-whisper-small"
  "sensevoice-small"
  "wav2vec2-xlsr-53-chinese"
  "wav2vec2-large-wenetspeech"
)

echo "Benchmarking dataset: $DATASET_NAME"
echo ""

for model in "${MODELS[@]}"; do
  echo "=========================================="
  echo "Model: $model"
  echo "=========================================="
  "$VENV_PY" "$SCRIPT_DIR/run_benchmark.py" \
    --model "$model" \
    --dataset-dir "$DATASET_DIR" \
    --out "benchmarks/results/${model}_${DATASET_NAME}.json"
  echo ""
done

echo "=========================================="
echo "Merging results..."
echo "=========================================="
"$VENV_PY" "$SCRIPT_DIR/merge_results.py"

echo ""
echo "Done! See benchmarks/results_summary.csv"
