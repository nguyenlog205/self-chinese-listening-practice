#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
DATA_DIR="$PROJECT_ROOT/data"

echo "Starting dataset downloads for benchmarking..."
echo "Project root: $PROJECT_ROOT"
echo ""

# AISHELL-1
echo "=========================================="
echo "Downloading AISHELL-1 (50 samples)..."
echo "=========================================="
python3 "$SCRIPT_DIR/download_aishell1.py"
echo ""

# AISHELL-2
echo "=========================================="
echo "Downloading AISHELL-2 (50 samples)..."
echo "=========================================="
# python3 "$SCRIPT_DIR/download_aishell2.py"  # TODO: Implement
echo "[TODO] AISHELL-2 download script"
echo ""

# CommonVoice
echo "=========================================="
echo "Downloading CommonVoice Chinese (100 samples)..."
echo "=========================================="
python3 "$DATA_DIR/common-voice-zh/download.py"
echo ""

# YouTube samples
echo "=========================================="
echo "Preparing YouTube samples (50 samples)..."
echo "=========================================="
# python3 "$SCRIPT_DIR/download_youtube_samples.py"  # TODO: Implement
echo "[TODO] YouTube samples script"
echo ""

# Synthetic noisy
echo "=========================================="
echo "Generating synthetic noisy data..."
echo "=========================================="
# python3 "$SCRIPT_DIR/generate_synthetic_noisy.py"  # TODO: Implement
echo "[TODO] Synthetic noisy generation script"
echo ""

echo "=========================================="
echo "All datasets ready for benchmarking!"
echo "=========================================="
