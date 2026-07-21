"""App-wide settings. Storage lives next to the backend source during local
dev (repo checkout, writable). Once installed system-wide (e.g. the Fedora
.rpm installs into /opt, owned by root), that directory is read-only for a
regular user, so storage instead moves to a per-user XDG data directory --
the same convention run.sh uses for the venv in that case."""

from __future__ import annotations

import os
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[1]


def _storage_dir() -> Path:
    if os.access(BACKEND_DIR, os.W_OK):
        return BACKEND_DIR / "storage"
    data_home = Path(os.environ.get("XDG_DATA_HOME", str(Path.home() / ".local" / "share")))
    return data_home / "ListeningPractice" / "storage"


STORAGE_DIR = _storage_dir()
AUDIO_CACHE_DIR = STORAGE_DIR / "audio_cache"
VIDEO_CACHE_DIR = STORAGE_DIR / "video_cache"
TTS_CACHE_DIR = STORAGE_DIR / "tts_cache"
DIALOGUE_AUDIO_CACHE_DIR = STORAGE_DIR / "dialogue_audio_cache"
DB_PATH = STORAGE_DIR / "listening.db"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="LISTENING_")

    host: str = "127.0.0.1"
    port: int = 0  # 0 = let the OS pick a free port; printed on startup

    # STT model for lesson transcription (lessons/pipeline/transcribe.py).
    # HF checkpoint name, chosen from experiments/tts_models benchmark
    # (best CER/tone-accuracy among tested models on Chinese speech).
    whisper_model_size: str = "wbbbbb/wav2vec2-large-chinese-zh-cn"
    whisper_device: str = "cpu"  # cpu | cuda
    whisper_compute_type: str = "int8"  # float16 (cuda) enables fp16; anything else stays fp32
    whisper_language: str = "zh"  # unused (model is Mandarin-only)

    pinyin_style: str = "tone_marks"  # tone_marks | numeric

    audio_sample_rate: int = 16000
    audio_channels: int = 1


def get_settings() -> Settings:
    return Settings()


def ensure_storage_dirs() -> None:
    STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    AUDIO_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    VIDEO_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    TTS_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    DIALOGUE_AUDIO_CACHE_DIR.mkdir(parents=True, exist_ok=True)
