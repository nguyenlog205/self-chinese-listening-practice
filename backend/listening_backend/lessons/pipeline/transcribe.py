"""The only place that imports transformers/wav2vec2. Transcribes an audio
file and groups the resulting per-character timestamps into sentences,
cutting on speech pauses (the model does not emit punctuation, so pause
length is the segmentation signal instead of sentence-final punctuation)."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Callable

import torch
from transformers import Pipeline
from transformers import pipeline as hf_pipeline

ProgressCallback = Callable[[float], None]  # fraction 0..1 of audio processed

_CHUNK_LENGTH_SEC = 30
_STRIDE_LENGTH_SEC = 5
_PAUSE_THRESHOLD_SEC = 0.6  # gap between chars treated as a sentence boundary
_SENTENCE_END_CHARS = set("。！？!?")

_model_cache: dict[tuple[str, str, str], Pipeline] = {}


@dataclass
class TranscriptSentence:
    start_sec: float
    end_sec: float
    text: str


def _get_model(model_name: str, device: str, compute_type: str) -> Pipeline:
    key = (model_name, device, compute_type)
    if key not in _model_cache:
        dtype = torch.float16 if (device == "cuda" and compute_type == "float16") else torch.float32
        _model_cache[key] = hf_pipeline(
            "automatic-speech-recognition",
            model=model_name,
            device=0 if device == "cuda" else -1,
            dtype=dtype,
        )
    return _model_cache[key]


def _group_by_pause(chars: list[dict]) -> list[list[dict]]:
    groups: list[list[dict]] = []
    current: list[dict] = []
    for i, c in enumerate(chars):
        current.append(c)
        is_last = i == len(chars) - 1
        ends_sentence = c["text"] in _SENTENCE_END_CHARS
        next_gap = 0.0
        if not is_last:
            next_gap = chars[i + 1]["timestamp"][0] - c["timestamp"][1]
        if is_last or ends_sentence or next_gap >= _PAUSE_THRESHOLD_SEC:
            groups.append(current)
            current = []
    if current:
        groups.append(current)
    return groups


def transcribe(
    audio_path: Path,
    model_size: str,
    device: str,
    compute_type: str,
    language: str,  # unused, model is Mandarin-only
    on_progress: ProgressCallback | None = None,
) -> list[TranscriptSentence]:
    model = _get_model(model_size, device, compute_type)
    result = model(
        str(audio_path),
        chunk_length_s=_CHUNK_LENGTH_SEC,
        stride_length_s=_STRIDE_LENGTH_SEC,
        return_timestamps="char",
    )
    if on_progress:
        on_progress(1.0)

    sentences: list[TranscriptSentence] = []
    for group in _group_by_pause(result.get("chunks", [])):
        text = "".join(c["text"] for c in group).strip()
        if not text:
            continue
        sentences.append(TranscriptSentence(
            start_sec=group[0]["timestamp"][0],
            end_sec=group[-1]["timestamp"][1],
            text=text,
        ))
    return sentences
