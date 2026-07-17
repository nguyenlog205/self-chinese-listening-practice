from __future__ import annotations

from fastapi import APIRouter

from ..db import get_conn
from .models import VocabProgressIn, VocabProgressOut

router = APIRouter(prefix="/api/vocabulary/progress", tags=["vocabulary"])


@router.get("", response_model=list[VocabProgressOut])
def list_progress() -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute("SELECT hanzi, level, learned_at FROM vocab_progress").fetchall()
    return [dict(row) for row in rows]


@router.post("", status_code=201)
def mark_learned(payload: VocabProgressIn) -> dict:
    with get_conn() as conn:
        conn.execute(
            "INSERT OR IGNORE INTO vocab_progress (hanzi, level) VALUES (?, ?)",
            (payload.hanzi, payload.level),
        )
    return {"ok": True}


@router.delete("")
def clear_progress() -> dict:
    with get_conn() as conn:
        conn.execute("DELETE FROM vocab_progress")
    return {"ok": True}


@router.delete("/{hanzi}")
def unmark_learned(hanzi: str) -> dict:
    with get_conn() as conn:
        conn.execute("DELETE FROM vocab_progress WHERE hanzi = ?", (hanzi,))
    return {"ok": True}
