"""SQLite storage — plumbing shared across domains. Plain stdlib sqlite3, no
ORM — the schema is small and stable enough that an ORM would only add
ceremony. Each domain owns its own schema/seed (lessons/db.py,
content/db.py + content/seed.py, activity/db.py); this file just wires them
together at init time."""

from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

from .activity.db import ACTIVITY_SCHEMA
from .config import DB_PATH
from .content.db import CONTENT_SCHEMA
from .content.seed import seed_if_empty
from .lessons.db import LESSONS_SCHEMA


def init_db(db_path: Path = DB_PATH) -> None:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(db_path) as conn:
        conn.executescript(LESSONS_SCHEMA)
        conn.executescript(CONTENT_SCHEMA)
        conn.executescript(ACTIVITY_SCHEMA)
    seed_if_empty(db_path)


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
