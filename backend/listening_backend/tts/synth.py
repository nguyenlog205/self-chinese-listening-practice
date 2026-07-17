"""Text-to-speech via edge-tts (Microsoft Edge's neural voices, free,
no API key) instead of the browser's Web Speech API — the latter depends on
voices installed at the OS/browser level, which is often missing zh-CN on
Linux. Results are cached on disk keyed by the input text, so the same
word/sentence is only ever synthesized once."""

from __future__ import annotations

import hashlib
from pathlib import Path

import edge_tts

from ..config import TTS_CACHE_DIR

VOICE = "zh-CN-XiaoxiaoNeural"
RATE = "-10%"  # roughly matches the old SpeechSynthesisUtterance rate=0.9


def cache_path(text: str) -> Path:
    digest = hashlib.sha256(text.encode("utf-8")).hexdigest()[:24]
    return TTS_CACHE_DIR / f"{digest}.mp3"


async def synthesize(text: str) -> Path:
    path = cache_path(text)
    if path.exists():
        return path
    await edge_tts.Communicate(text, VOICE, rate=RATE).save(str(path))
    return path
