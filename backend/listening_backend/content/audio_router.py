from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from ..config import DIALOGUE_AUDIO_CACHE_DIR
from .sync import SEED_DIALOGUES_AUDIO_DIR

router = APIRouter(prefix="/api/dialogues", tags=["dialogues"])


@router.get("/{dialogue_id}/audio")
def get_dialogue_audio(dialogue_id: str) -> FileResponse:
    # Prefer the writable cache (populated by "Cập nhật dữ liệu"/content
    # sync — may be newer than what shipped with the app), fall back to the
    # bundled seed_data copy. Neither existing means this dialogue doesn't
    # have a real recording yet; the frontend falls back to TTS on 404.
    cached = DIALOGUE_AUDIO_CACHE_DIR / f"{dialogue_id}.mp3"
    if cached.is_file():
        return FileResponse(cached, media_type="audio/mpeg")

    bundled = SEED_DIALOGUES_AUDIO_DIR / dialogue_id / "audio.mp3"
    if bundled.is_file():
        return FileResponse(bundled, media_type="audio/mpeg")

    raise HTTPException(status_code=404, detail="No recording for this dialogue yet")
