"""Populates vocab_words/dialogues/dialogue_exercises_*/dialogues_audio_metadata
from the bundled seed_data/ JSON on first run. To refresh content after
regenerating the seed files (e.g. a new HSK level export), delete the
relevant rows (or the whole DB file) and restart the backend — this only
fills empty tables, it never overwrites existing rows."""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path

from ..config import BACKEND_DIR
from .exercises import (
    AUDIO_METADATA_REQUIRED_KEYS,
    EXERCISE_KINDS,
    EXERCISE_REQUIRED_KEYS,
    audio_metadata_row,
    exercise_row,
)

SEED_DATA_DIR = BACKEND_DIR / "listening_backend" / "seed_data"


def seed_if_empty(db_path: Path) -> None:
    with sqlite3.connect(db_path) as conn:
        (vocab_count,) = conn.execute("SELECT COUNT(*) FROM vocab_words").fetchone()
        if vocab_count == 0:
            for path in sorted((SEED_DATA_DIR / "vocabulary").glob("hsk_*.json")):
                level = path.stem.removeprefix("hsk_").replace("_", "-")
                words = json.loads(path.read_text(encoding="utf-8"))
                conn.executemany(
                    "INSERT INTO vocab_words (level, hanzi, pinyin, en, vi) VALUES (?, ?, ?, ?, ?)",
                    [
                        (level, w["hanzi"], w["pinyin"], w.get("en", ""), w.get("vi", ""))
                        for w in words
                    ],
                )

        (dialogue_count,) = conn.execute("SELECT COUNT(*) FROM dialogues").fetchone()
        if dialogue_count == 0:
            dialogues_path = SEED_DATA_DIR / "dialogues.json"
            if dialogues_path.exists():
                dialogues = json.loads(dialogues_path.read_text(encoding="utf-8"))
                conn.executemany(
                    "INSERT INTO dialogues (id, level, data) VALUES (?, ?, ?)",
                    [
                        (
                            d["id"],
                            str(d["level"]),
                            json.dumps(
                                {
                                    "lines": d["lines"],
                                    "question": d["question"],
                                    "options": d["options"],
                                    "blanks": d["blanks"],
                                },
                                ensure_ascii=False,
                            ),
                        )
                        for d in dialogues
                    ],
                )

        for kind in EXERCISE_KINDS:
            table = f"dialogue_exercises_{kind}"
            (count,) = conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()  # noqa: S608 (table from a fixed tuple, not user input)
            if count != 0:
                continue
            required = EXERCISE_REQUIRED_KEYS[kind]
            for path in sorted((SEED_DATA_DIR / "dialogue_exercises" / kind).glob("*.json")):
                item = json.loads(path.read_text(encoding="utf-8"))
                if not required.issubset(item):
                    raise ValueError(f"{path.name} missing required keys: {required - item.keys()}")
                conn.execute(
                    f"INSERT INTO {table} (id, audio_id, data) VALUES (?, ?, ?)",  # noqa: S608
                    exercise_row(item),
                )

        (audio_meta_count,) = conn.execute("SELECT COUNT(*) FROM dialogues_audio_metadata").fetchone()
        if audio_meta_count == 0:
            for path in sorted((SEED_DATA_DIR / "dialogues_audio").glob("*/metadata.json")):
                item = json.loads(path.read_text(encoding="utf-8"))
                if not AUDIO_METADATA_REQUIRED_KEYS.issubset(item):
                    raise ValueError(
                        f"{path}: missing required keys: {AUDIO_METADATA_REQUIRED_KEYS - item.keys()}"
                    )
                conn.execute(
                    "INSERT INTO dialogues_audio_metadata (id, data) VALUES (?, ?)",
                    audio_metadata_row(item),
                )

        conn.commit()
