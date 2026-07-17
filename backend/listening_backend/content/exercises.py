"""Shared shape for dialogue_exercises_{choice,cloze,dictation} and
dialogues_audio_metadata — used by both content/seed.py (first-run, from
local seed_data/) and content/sync.py ("Cập nhật dữ liệu", from GitHub) so
the two loaders can't drift apart from each other."""

from __future__ import annotations

import json

EXERCISE_KINDS = ("choice", "cloze", "dictation")

EXERCISE_REQUIRED_KEYS: dict[str, set[str]] = {
    "choice": {"id", "audio_id", "lines_from_dialogue", "question", "options"},
    "cloze": {"id", "audio_id", "lines_from_dialogue", "blanks"},
    "dictation": {"id", "audio_id", "lines_from_dialogue", "target_line"},
}

AUDIO_METADATA_REQUIRED_KEYS = {"id", "audio_file", "duration_sec", "exercises"}


def exercise_row(item: dict) -> tuple[str, str, str]:
    """(id, audio_id, data_json) — `data` is every field except id/audio_id,
    so future exercise authors can add fields without a code change here."""
    data = {k: v for k, v in item.items() if k not in ("id", "audio_id")}
    return item["id"], item["audio_id"], json.dumps(data, ensure_ascii=False)


def audio_metadata_row(item: dict) -> tuple[str, str]:
    """(id, data_json) — `data` is every field except id."""
    data = {k: v for k, v in item.items() if k != "id"}
    return item["id"], json.dumps(data, ensure_ascii=False)
