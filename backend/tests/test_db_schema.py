"""Schema creation against a fresh temp path creates every table without
error — catches schema typos/FK-ordering mistakes before they hit a real
install.

Deliberately tests schema application directly (same three `executescript`
calls `init_db()` makes), not `init_db()` itself: `init_db()` also runs
`seed_if_empty()`, which currently crashes on a truly empty DB due to the
pre-existing, out-of-scope dialogues-seeding bug (see
test_content_seed.py's xfail tests) — unrelated to whether the schema
itself is well-formed."""

from __future__ import annotations

import sqlite3

from listening_backend.activity.db import ACTIVITY_SCHEMA
from listening_backend.content.db import CONTENT_SCHEMA
from listening_backend.lessons.db import LESSONS_SCHEMA

EXPECTED_TABLES = {
    "lessons",
    "segments",
    "vocab_words",
    "dialogues",
    "vocab_progress",
    "dialogue_exercises_choice",
    "dialogue_exercises_cloze",
    "dialogue_exercises_dictation",
    "dialogues_audio_metadata",
    "practice_events",
}


def test_schema_creates_all_tables(tmp_path):
    db_path = tmp_path / "fresh.db"
    with sqlite3.connect(db_path) as conn:
        conn.executescript(LESSONS_SCHEMA)
        conn.executescript(CONTENT_SCHEMA)
        conn.executescript(ACTIVITY_SCHEMA)

    with sqlite3.connect(db_path) as conn:
        tables = {
            row[0]
            for row in conn.execute("SELECT name FROM sqlite_master WHERE type = 'table'").fetchall()
        }

    assert EXPECTED_TABLES.issubset(tables)


def test_dialogue_exercise_tables_enforce_audio_id_foreign_key(tmp_path):
    db_path = tmp_path / "fresh.db"
    with sqlite3.connect(db_path) as conn:
        conn.executescript(CONTENT_SCHEMA)

    with sqlite3.connect(db_path) as conn:
        conn.execute("PRAGMA foreign_keys = ON")
        try:
            conn.execute(
                "INSERT INTO dialogue_exercises_choice (id, audio_id, data) VALUES (?, ?, ?)",
                ("choice_001", "does_not_exist", "{}"),
            )
            conn.commit()
            raised = False
        except sqlite3.IntegrityError:
            raised = True
    assert raised
