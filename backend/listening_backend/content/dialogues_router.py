from __future__ import annotations

import json

from fastapi import APIRouter, Query

from ..db import get_conn
from .models import DialogueOut

router = APIRouter(prefix="/api/dialogues", tags=["dialogues"])


@router.get("", response_model=list[DialogueOut])
def list_dialogues(level: str | None = Query(default=None)) -> list[DialogueOut]:
    with get_conn() as conn:
        if level:
            rows = conn.execute(
                "SELECT * FROM dialogues WHERE level = ?", (level,)
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM dialogues").fetchall()
    return [
        DialogueOut(id=row["id"], level=row["level"], **json.loads(row["data"]))
        for row in rows
    ]
