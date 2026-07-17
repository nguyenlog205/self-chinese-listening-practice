from __future__ import annotations

from fastapi import APIRouter

from ..db import get_conn
from .models import StreakOut
from .repo import compute_streak

router = APIRouter(prefix="/api/streak", tags=["streak"])


@router.get("", response_model=StreakOut)
def streak() -> dict:
    with get_conn() as conn:
        return compute_streak(conn)
