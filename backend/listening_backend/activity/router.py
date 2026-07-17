from __future__ import annotations

from fastapi import APIRouter, Query

from ..db import get_conn
from .models import DailyActivityOut, PracticeEventIn
from .repo import clear_all, get_daily_counts, insert_event

router = APIRouter(prefix="/api/activity", tags=["activity"])


@router.post("/events", status_code=201)
def log_event(payload: PracticeEventIn) -> dict:
    with get_conn() as conn:
        insert_event(conn, **payload.model_dump())
    return {"ok": True}


@router.delete("/events")
def reset_events() -> dict:
    with get_conn() as conn:
        clear_all(conn)
    return {"ok": True}


@router.get("/daily", response_model=list[DailyActivityOut])
def daily(days: int = Query(default=182, ge=1, le=730)) -> list[dict]:
    with get_conn() as conn:
        return get_daily_counts(conn, days)
