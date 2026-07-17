from __future__ import annotations

from fastapi import APIRouter, HTTPException

from ..db import get_conn
from .sync import ContentSyncError, refresh_content

router = APIRouter(prefix="/api/content", tags=["content"])


@router.post("/refresh")
def refresh() -> dict:
    with get_conn() as conn:
        try:
            return refresh_content(conn)
        except ContentSyncError as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc
