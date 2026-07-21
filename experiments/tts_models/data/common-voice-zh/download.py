#!/usr/bin/env python3

import csv
import io
import json
import os
import sys
import tarfile
from pathlib import Path

import requests
import soundfile as sf

DATASET_ID = "fsicoli/common_voice_17_0"
LANG_CONFIG = "zh-CN"
AUDIO_TAR_PATH = f"audio/{LANG_CONFIG}/train/{LANG_CONFIG}_train_0.tar"
TRANSCRIPT_PATH = f"transcript/{LANG_CONFIG}/train.tsv"
TARGET_TOTAL = 200
TARGET_SR = 16000

OUTPUT_DIR = Path(__file__).parent
AUDIO_DIR = OUTPUT_DIR / "audio"


def check_hf_token():
    from huggingface_hub import get_token

    token = (
        os.environ.get("HF_TOKEN")
        or os.environ.get("HUGGING_FACE_HUB_TOKEN")
        or get_token()
    )
    if not token:
        print(
            "ERROR: Khong tim thay HF_TOKEN.\n"
            "Chay: huggingface-cli login\n"
            "Hoac export HF_TOKEN=<your_token> truoc khi chay script nay.",
            file=sys.stderr,
        )
        sys.exit(1)
    return token


def load_transcripts():
    from huggingface_hub import hf_hub_download

    print(f"Downloading transcript {TRANSCRIPT_PATH}...")
    tsv_path = hf_hub_download(DATASET_ID, TRANSCRIPT_PATH, repo_type="dataset")

    transcripts = {}
    with open(tsv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            transcripts[row["path"]] = row
    print(f"  Loaded {len(transcripts)} transcript entries")
    return transcripts


def load_existing_samples():
    transcriptions_file = OUTPUT_DIR / "transcriptions.json"
    if not transcriptions_file.exists():
        return []
    with open(transcriptions_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data.get("samples", [])


def stream_audio_samples(transcripts, token, skip_count, target_new):
    from huggingface_hub import hf_hub_url

    url = hf_hub_url(DATASET_ID, AUDIO_TAR_PATH, repo_type="dataset")
    headers = {"Authorization": f"Bearer {token}"}

    print(
        f"Streaming tar {AUDIO_TAR_PATH} "
        f"(skip {skip_count} already-taken, collect {target_new} more)..."
    )
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)

    samples_data = []
    valid_seen = 0
    count = skip_count

    with requests.get(url, headers=headers, stream=True) as resp:
        resp.raise_for_status()
        with tarfile.open(fileobj=resp.raw, mode="r|*") as tar:
            for member in tar:
                if len(samples_data) >= target_new:
                    break
                if not member.isfile():
                    continue

                mp3_name = os.path.basename(member.name)
                row = transcripts.get(mp3_name)
                if row is None:
                    continue

                text = (row.get("sentence") or "").strip()
                if not text:
                    continue

                # This is a valid candidate sample; skip ones already taken
                # in a previous run before extracting/decoding audio.
                if valid_seen < skip_count:
                    valid_seen += 1
                    continue
                valid_seen += 1

                fileobj = tar.extractfile(member)
                if fileobj is None:
                    continue
                mp3_bytes = fileobj.read()

                try:
                    audio_array, sr = sf.read(io.BytesIO(mp3_bytes), dtype="float32")
                except Exception:
                    continue

                sample_id = f"commonvoice_{count:03d}"
                filename = f"{sample_id}.wav"
                dest_file = AUDIO_DIR / filename

                if sr != TARGET_SR:
                    import numpy as np
                    duration = len(audio_array) / sr
                    target_len = int(duration * TARGET_SR)
                    x_old = np.linspace(0, 1, len(audio_array))
                    x_new = np.linspace(0, 1, target_len)
                    audio_array = np.interp(x_new, x_old, audio_array)
                    sr = TARGET_SR

                sf.write(str(dest_file), audio_array, sr, subtype="PCM_16")
                duration_sec = len(audio_array) / sr

                samples_data.append({
                    "id": sample_id,
                    "audio_file": f"audio/{filename}",
                    "duration_sec": round(duration_sec, 2),
                    "ground_truth": text,
                    "category": "crowdsourced",
                    "speaker_id": row.get("client_id", "unknown")[:16],
                    "accent": row.get("accents") or "unknown",
                    "age": row.get("age") or "unknown",
                    "gender": row.get("gender") or "unknown",
                    "background_noise": "unknown",
                })

                count += 1
                print(f"  [{count - skip_count}/{target_new}] {sample_id}: {text[:30]}")

    return samples_data


def save_transcriptions(samples_data):
    transcriptions_file = OUTPUT_DIR / "transcriptions.json"
    with open(transcriptions_file, "w", encoding="utf-8") as f:
        json.dump({"samples": samples_data}, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(samples_data)} samples to {transcriptions_file}")


def save_metadata(sample_count):
    metadata = {
        "dataset_name": "CommonVoice Chinese",
        "version": "17.0",
        "source": f"https://huggingface.co/datasets/{DATASET_ID} (mirror of mozilla-foundation/common_voice_17_0)",
        "license": "CC0",
        "language": "Mandarin Chinese (zh-CN)",
        "total_samples": sample_count,
        "audio_format": "WAV",
        "sample_rate": TARGET_SR,
        "bit_depth": 16,
        "channels": 1,
        "description": "Crowd-sourced Mandarin Chinese speech corpus from Mozilla CommonVoice.",
        "notes": f"Subset of {sample_count} samples streamed from train tar shard 0 for benchmarking.",
    }

    metadata_file = OUTPUT_DIR / "metadata.json"
    with open(metadata_file, "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)
    print(f"Saved metadata to {metadata_file}")


if __name__ == "__main__":
    existing_samples = load_existing_samples()
    skip_count = len(existing_samples)
    target_new = TARGET_TOTAL - skip_count

    if target_new <= 0:
        print(f"Da co {skip_count} samples, >= TARGET_TOTAL={TARGET_TOTAL}. Khong can tai them.")
        sys.exit(0)

    token = check_hf_token()
    transcripts = load_transcripts()
    new_samples = stream_audio_samples(transcripts, token, skip_count, target_new)
    if not new_samples:
        print("ERROR: Khong tai duoc sample nao.", file=sys.stderr)
        sys.exit(1)

    all_samples = existing_samples + new_samples
    save_transcriptions(all_samples)
    save_metadata(len(all_samples))
    print("Done!")
