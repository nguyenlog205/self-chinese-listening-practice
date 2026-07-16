"""SQLite storage for lessons + segments + the learning-content store
(vocabulary/dialogues). Plain stdlib sqlite3, no ORM — the schema is small
and stable enough that an ORM would only add ceremony."""

from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

from .config import BACKEND_DIR, DB_PATH

SEED_DATA_DIR = BACKEND_DIR / "listening_backend" / "seed_data"

SCHEMA = """
CREATE TABLE IF NOT EXISTS lessons (
    id TEXT PRIMARY KEY,
    source_url TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'queued',
    progress_pct INTEGER NOT NULL DEFAULT 0,
    stage TEXT NOT NULL DEFAULT 'queued',
    error_message TEXT,
    duration_sec REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_practiced_at TEXT
);

CREATE TABLE IF NOT EXISTS segments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    idx INTEGER NOT NULL,
    start_sec REAL NOT NULL,
    end_sec REAL NOT NULL,
    text_zh TEXT NOT NULL,
    pinyin TEXT NOT NULL,
    UNIQUE(lesson_id, idx)
);

CREATE TABLE IF NOT EXISTS vocab_words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    level TEXT NOT NULL,
    hanzi TEXT NOT NULL,
    pinyin TEXT NOT NULL,
    en TEXT NOT NULL DEFAULT '',
    vi TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_vocab_words_level ON vocab_words(level);

CREATE TABLE IF NOT EXISTS dialogues (
    id TEXT PRIMARY KEY,
    level TEXT NOT NULL,
    data TEXT NOT NULL
);
"""


def init_db(db_path: Path = DB_PATH) -> None:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(db_path) as conn:
        conn.executescript(SCHEMA)
    _seed_content_if_empty(db_path)


def _seed_content_if_empty(db_path: Path) -> None:
    """Populates vocab_words/dialogues from the bundled seed_data/ JSON on
    first run. To refresh content after regenerating the seed files (e.g. a
    new HSK level export), delete the relevant rows (or the whole DB file)
    and restart the backend — this only fills empty tables, it never
    overwrites existing rows."""
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
        conn.commit()


@contextmanager
def get_conn(db_path: Path = DB_PATH) -> Iterator[sqlite3.Connection]:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()
