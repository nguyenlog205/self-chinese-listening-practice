"""Shared fixtures for the backend test suite.

Deliberately does NOT import `listening_backend.main` (it calls `init_db()`
and `ensure_storage_dirs()` at module import time against the real
`config.DB_PATH`) — every test here builds its own throwaway sqlite file
under `tmp_path` instead, so the suite never touches a developer's real
`backend/storage/listening.db`.
"""

from __future__ import annotations

import sqlite3
from pathlib import Path

import pytest

from listening_backend.activity.db import ACTIVITY_SCHEMA
from listening_backend.content.db import CONTENT_SCHEMA
from listening_backend.lessons.db import LESSONS_SCHEMA


@pytest.fixture
def db_path(tmp_path: Path) -> Path:
    path = tmp_path / "test.db"
    with sqlite3.connect(path) as setup_conn:
        setup_conn.executescript(LESSONS_SCHEMA)
        setup_conn.executescript(CONTENT_SCHEMA)
        setup_conn.executescript(ACTIVITY_SCHEMA)
    return path


@pytest.fixture
def conn(db_path: Path):
    connection = sqlite3.connect(db_path)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()
