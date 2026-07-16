"""The only place that imports yt-dlp. Fetches metadata, downloads the full
video (for local playback -- YouTube's IFrame embed rejects file:// origins,
which is what an Electron app's static pages load from), and extracts a mono
WAV from that same downloaded file for Whisper (no second network fetch)."""

from __future__ import annotations

import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

import yt_dlp

from ..config import AUDIO_CACHE_DIR, VIDEO_CACHE_DIR

DownloadProgressCallback = Callable[[float], None]  # fraction 0..1 downloaded


class MetadataExtractionError(Exception):
    pass


class AudioDownloadError(Exception):
    pass


class VideoDownloadError(Exception):
    pass


@dataclass
class VideoInfo:
    video_id: str
    title: str
    duration_sec: float
    source_url: str


def extract_info(url: str) -> VideoInfo:
    try:
        with yt_dlp.YoutubeDL({"quiet": True, "skip_download": True}) as ydl:
            info = ydl.extract_info(url, download=False)
    except Exception as exc:  # noqa: BLE001 - surfaced to the job/error state
        raise MetadataExtractionError(str(exc)) from exc

    return VideoInfo(
        video_id=info["id"],
        title=info.get("title", info["id"]),
        duration_sec=float(info.get("duration") or 0),
        source_url=url,
    )


def download_video(
    video_id: str,
    url: str,
    on_progress: DownloadProgressCallback | None = None,
) -> Path:
    """Downloads the video (merged with its best audio track) as an mp4,
    reusing the cached file if it already exists."""
    out_path = VIDEO_CACHE_DIR / f"{video_id}.mp4"
    if out_path.exists():
        return out_path

    VIDEO_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    tmp_template = str(VIDEO_CACHE_DIR / f"{video_id}.%(ext)s")

    def _hook(d: dict) -> None:
        if not on_progress or d.get("status") != "downloading":
            return
        total = d.get("total_bytes") or d.get("total_bytes_estimate")
        downloaded = d.get("downloaded_bytes")
        if total and downloaded:
            on_progress(min(downloaded / total, 1.0))

    ydl_opts = {
        "quiet": True,
        "format": "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        "merge_output_format": "mp4",
        "outtmpl": tmp_template,
        "progress_hooks": [_hook],
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
    except Exception as exc:  # noqa: BLE001
        raise VideoDownloadError(str(exc)) from exc

    if not out_path.exists():
        raise VideoDownloadError(f"Expected output file not found: {out_path}")
    return out_path


def extract_audio_wav(
    video_path: Path, video_id: str, sample_rate: int, channels: int
) -> Path:
    """Extracts a mono WAV at sample_rate from an already-downloaded video,
    via a local ffmpeg call -- no further network access needed."""
    out_path = AUDIO_CACHE_DIR / f"{video_id}.wav"
    if out_path.exists():
        return out_path

    AUDIO_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    try:
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-i",
                str(video_path),
                "-ar",
                str(sample_rate),
                "-ac",
                str(channels),
                "-vn",
                str(out_path),
            ],
            check=True,
            capture_output=True,
        )
    except (subprocess.CalledProcessError, FileNotFoundError) as exc:
        raise AudioDownloadError(f"ffmpeg audio extraction failed: {exc}") from exc

    if not out_path.exists():
        raise AudioDownloadError(f"Expected output file not found: {out_path}")
    return out_path
