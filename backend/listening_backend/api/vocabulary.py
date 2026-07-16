from __future__ import annotations

from fastapi import APIRouter, Query

from ..db import get_conn
from ..models import VocabWordOut

router = APIRouter(prefix="/api/vocabulary", tags=["vocabulary"])


def _level_sort_key(level: str) -> tuple[int, int | str]:
    return (1, level) if level == "7-9" else (0, int(level))


@router.get("/levels", response_model=list[str])
def list_levels() -> list[str]:
    with get_conn() as conn:
        rows = conn.execute("SELECT DISTINCT level FROM vocab_words").fetchall()
    return sorted((r["level"] for r in rows), key=_level_sort_key)


@router.get("", response_model=list[VocabWordOut])
def list_vocabulary(level: str = Query(...)) -> list[VocabWordOut]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT hanzi, pinyin, en, vi FROM vocab_words WHERE level = ?", (level,)
        ).fetchall()
    return [VocabWordOut(**dict(row)) for row in rows]
