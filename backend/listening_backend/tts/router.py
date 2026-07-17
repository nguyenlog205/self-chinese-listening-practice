from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse

from .synth import synthesize

router = APIRouter(prefix="/api/tts", tags=["tts"])


@router.get("")
async def get_tts(text: str = Query(..., min_length=1)) -> FileResponse:
    try:
        path = await synthesize(text)
    except Exception as exc:  # edge-tts network/service failures
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return FileResponse(
        path,
        media_type="audio/mpeg",
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )
