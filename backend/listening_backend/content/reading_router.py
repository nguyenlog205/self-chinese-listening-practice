from __future__ import annotations

import json

from fastapi import APIRouter, Query

from ..db import get_conn
from .models import ReadingPassageOut

router = APIRouter(prefix="/api/reading", tags=["reading"])


@router.get("", response_model=list[ReadingPassageOut])
def list_reading(level: str = Query(...)) -> list[ReadingPassageOut]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT id, level, data FROM reading_passages WHERE level = ?", (level,)
        ).fetchall()
    return [ReadingPassageOut(id=row["id"], level=row["level"], **json.loads(row["data"])) for row in rows]
