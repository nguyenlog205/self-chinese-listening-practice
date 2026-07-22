#!/usr/bin/env python3
"""Export the winning ASR checkpoint from the model-selection benchmark
(wav2vec2-large-wenetspeech, wbbbbb/wav2vec2-large-chinese-zh-cn, CER 0.094)
to ONNX, then verify the ONNX graph agrees with the original PyTorch model
on a real sample before anything downstream trusts it.

Usage:
    python export_onnx.py \
        --out models/onnx/wav2vec2-large-wenetspeech.onnx \
        [--dataset-dir data/common-voice-zh] [--opset 14]
"""

import argparse
import json
from pathlib import Path

import numpy as np
import onnxruntime as ort
import soundfile as sf
import torch
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
CHECKPOINT = "wbbbbb/wav2vec2-large-chinese-zh-cn"
CACHE_DIR = PROJECT_ROOT / "models" / "hf"


def load_sample_audio(dataset_dir: Path) -> np.ndarray:
    with open(dataset_dir / "transcriptions.json", "r", encoding="utf-8") as f:
        samples = json.load(f)["samples"]
    audio_path = dataset_dir / samples[0]["audio_file"]
    audio, sr = sf.read(str(audio_path), dtype="float32")
    if sr != 16000:
        raise ValueError(f"expected 16kHz audio for this checkpoint, got {sr}Hz")
    return audio


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default="models/onnx/wav2vec2-large-wenetspeech.onnx")
    parser.add_argument("--dataset-dir", default="data/common-voice-zh")
    parser.add_argument("--opset", type=int, default=14)
    args = parser.parse_args()

    dataset_dir = Path(args.dataset_dir)
    if not dataset_dir.is_absolute():
        dataset_dir = PROJECT_ROOT / dataset_dir
    out_path = Path(args.out)
    if not out_path.is_absolute():
        out_path = PROJECT_ROOT / out_path
    out_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"Loading {CHECKPOINT} ...")
    processor = Wav2Vec2Processor.from_pretrained(CHECKPOINT, cache_dir=str(CACHE_DIR))
    model = Wav2Vec2ForCTC.from_pretrained(CHECKPOINT, cache_dir=str(CACHE_DIR))
    model.eval()

    audio = load_sample_audio(dataset_dir)
    inputs = processor(audio, sampling_rate=16000, return_tensors="pt", padding=True)
    input_values = inputs.input_values  # (1, num_samples)

    print(f"Tracing + exporting to {out_path} (opset {args.opset}) ...")
    torch.onnx.export(
        model,
        (input_values,),
        str(out_path),
        input_names=["input_values"],
        output_names=["logits"],
        dynamic_axes={
            "input_values": {0: "batch", 1: "sequence"},
            "logits": {0: "batch", 1: "sequence"},
        },
        opset_version=args.opset,
        do_constant_folding=True,
        dynamo=False,
    )
    print(f"Exported: {out_path} ({out_path.stat().st_size / 1e6:.1f} MB)")

    # --- Sanity check: PyTorch vs ONNX logits must agree before we trust it ---
    print("\nVerifying ONNX export against the original PyTorch model...")
    with torch.no_grad():
        pt_logits = model(input_values).logits.numpy()

    session = ort.InferenceSession(str(out_path), providers=["CPUExecutionProvider"])
    onnx_logits = session.run(["logits"], {"input_values": input_values.numpy()})[0]

    max_diff = float(np.abs(pt_logits - onnx_logits).max())
    pt_ids = pt_logits.argmax(axis=-1)
    onnx_ids = onnx_logits.argmax(axis=-1)
    token_agreement = float((pt_ids == onnx_ids).mean())

    print(f"Max abs logit diff (PyTorch vs ONNX): {max_diff:.6f}")
    print(f"Predicted-token agreement: {token_agreement * 100:.2f}%")
    if token_agreement < 0.999:
        print("WARNING: predicted tokens diverge on this sample — inspect before benchmarking.")
    else:
        print("OK: ONNX export verified against PyTorch on this sample.")


if __name__ == "__main__":
    main()
