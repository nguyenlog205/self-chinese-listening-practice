#!/usr/bin/env python3

import os
import subprocess
import tarfile
import json
import shutil
from pathlib import Path

AISHELL1_URL = "https://www.openslr.org/resources/33/data_aishell.tgz"
AISHELL1_MD5 = "38681d3e5c21e7dfe8ae1a36979d1ae1"
OUTPUT_DIR = Path(__file__).parent.parent / "data" / "aishell-1"
AUDIO_DIR = OUTPUT_DIR / "audio"
TEMP_DIR = Path("/tmp/aishell1_download")
SAMPLE_COUNT = 50


def download_dataset():
    """Download AISHELL-1 dataset"""
    print("Downloading AISHELL-1 dataset...")

    temp_file = TEMP_DIR / "data_aishell.tgz"
    TEMP_DIR.mkdir(parents=True, exist_ok=True)

    if not temp_file.exists():
        subprocess.run([
            "wget",
            "-O", str(temp_file),
            AISHELL1_URL
        ], check=True)

    print(f"Extracting to {TEMP_DIR}...")
    with tarfile.open(temp_file, "r:gz") as tar:
        tar.extractall(TEMP_DIR)


def extract_samples():
    """Extract 50 samples from AISHELL-1"""
    print(f"Extracting {SAMPLE_COUNT} samples...")

    AUDIO_DIR.mkdir(parents=True, exist_ok=True)

    source_dir = TEMP_DIR / "data_aishell" / "wav"
    transcription_file = TEMP_DIR / "data_aishell" / "transcript" / "aishell.txt"

    if not source_dir.exists():
        raise FileNotFoundError(f"Source directory not found: {source_dir}")

    # Read transcriptions
    transcriptions = {}
    if transcription_file.exists():
        with open(transcription_file, 'r', encoding='utf-8') as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) >= 2:
                    audio_id = parts[0]
                    text = ' '.join(parts[1:])
                    transcriptions[audio_id] = text

    # Copy first 50 samples
    samples_data = []
    sample_count = 0

    for speaker_dir in sorted(source_dir.iterdir()):
        if not speaker_dir.is_dir():
            continue

        speaker_id = speaker_dir.name
        output_speaker_dir = AUDIO_DIR / speaker_id
        output_speaker_dir.mkdir(parents=True, exist_ok=True)

        for wav_file in sorted(speaker_dir.glob("*.wav")):
            if sample_count >= SAMPLE_COUNT:
                break

            audio_id = wav_file.stem
            dest_file = output_speaker_dir / wav_file.name

            # Copy audio file
            shutil.copy2(wav_file, dest_file)

            # Get transcription
            text = transcriptions.get(audio_id, "")

            # Get audio duration
            try:
                import librosa
                y, sr = librosa.load(str(dest_file), sr=16000)
                duration = librosa.get_duration(y=y, sr=sr)
            except:
                duration = 0

            samples_data.append({
                "id": f"aishell1_{sample_count:03d}",
                "audio_file": f"aishell-1/audio/{speaker_id}/{wav_file.name}",
                "duration_sec": round(duration, 2),
                "ground_truth": text,
                "speaker_id": speaker_id,
                "category": "clean",
                "background_noise": "none",
                "speaking_speed": "normal"
            })

            sample_count += 1
            print(f"  [{sample_count}/{SAMPLE_COUNT}] {audio_id}")

        if sample_count >= SAMPLE_COUNT:
            break

    # Save transcriptions
    transcriptions_file = OUTPUT_DIR / "transcriptions.json"
    with open(transcriptions_file, 'w', encoding='utf-8') as f:
        json.dump({"samples": samples_data}, f, ensure_ascii=False, indent=2)

    print(f"Saved {len(samples_data)} samples to {transcriptions_file}")


def save_metadata():
    """Save dataset metadata"""
    metadata = {
        "dataset_name": "AISHELL-1",
        "version": "1.0",
        "source": "https://www.openslr.org/33/",
        "license": "CC BY-NC-SA 4.0",
        "language": "Mandarin Chinese",
        "total_samples": SAMPLE_COUNT,
        "total_duration_hours": 0,
        "speaker_count": 0,
        "audio_format": "WAV",
        "sample_rate": 16000,
        "bit_depth": 16,
        "channels": 1,
        "description": "AISHELL-1: Large-scale open source Mandarin speech corpus",
        "notes": "Clean, controlled quality audio. Subset of 50 samples for benchmarking."
    }

    metadata_file = OUTPUT_DIR / "metadata.json"
    with open(metadata_file, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

    print(f"Saved metadata to {metadata_file}")


def cleanup():
    """Remove temporary files"""
    print(f"Cleaning up {TEMP_DIR}...")
    shutil.rmtree(TEMP_DIR)


if __name__ == "__main__":
    try:
        download_dataset()
        extract_samples()
        save_metadata()
        cleanup()
        print("Done!")
    except Exception as e:
        print(f"Error: {e}")
        raise
