from __future__ import annotations

import json

from fastapi import APIRouter, Query

from ..db import get_conn
from .models import GrammarPointOut

router = APIRouter(prefix="/api/grammar", tags=["grammar"])


@router.get("", response_model=list[GrammarPointOut])
def list_grammar(level: str = Query(...)) -> list[GrammarPointOut]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT id, level, data FROM grammar_points WHERE level = ?", (level,)
        ).fetchall()
    return [GrammarPointOut(id=row["id"], level=row["level"], **json.loads(row["data"])) for row in rows]
