"""Refreshes vocab_words/dialogues from the JSON files committed under
seed_data/ on GitHub, via raw.githubusercontent.com — no auth needed since
the repo is public. This lets content (new HSK levels, more dialogues) be
updated by pushing to the repo and clicking "Cập nhật dữ liệu" in Settings,
without a new app release.

Unlike the first-run seeding in db.py (which only fills empty tables), this
always replaces: DELETE then INSERT, so it also picks up edits/removals to
existing entries, not just new ones."""

from __future__ import annotations

import json
import urllib.request
from urllib.error import HTTPError, URLError

from ..config import BACKEND_DIR, DIALOGUE_AUDIO_CACHE_DIR

RAW_BASE = (
    "https://raw.githubusercontent.com/nguyenlog205/"
    "self-chinese-listening-practice/main/backend/listening_backend/seed_data"
)

# Bundled fallback for dialogues that shipped with the app instead of (or
# before) being pulled via "Cập nhật dữ liệu" — see content/audio_router.py.
SEED_DIALOGUES_AUDIO_DIR = BACKEND_DIR / "listening_backend" / "seed_data" / "dialogues_audio"

VOCAB_LEVELS = ["1", "2", "3", "4", "5", "6", "7-9"]

REQUIRED_WORD_KEYS = {"hanzi", "pinyin"}
REQUIRED_DIALOGUE_KEYS = {"id", "level", "lines", "question", "options", "blanks"}


class ContentSyncError(RuntimeError):
    pass


def _fetch_json(url: str):
    try:
        with urllib.request.urlopen(url, timeout=15) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except (URLError, TimeoutError) as exc:
        raise ContentSyncError(f"Không tải được {url}: {exc}") from exc
    except json.JSONDecodeError as exc:
        raise ContentSyncError(f"Dữ liệu JSON không hợp lệ tại {url}: {exc}") from exc


def _level_filename(level: str) -> str:
    return f"hsk_{level.replace('-', '_')}.json"


def _fetch_dialogue_audio(dialogue_id: str) -> bool:
    """Downloads {dialogue_id}.mp3 from seed_data/dialogues_audio/ on GitHub
    into the local writable cache. Returns False (not an error) if that
    dialogue simply doesn't have a recording yet — most dialogues won't,
    early on, and that's fine: playback falls back to TTS."""
    url = f"{RAW_BASE}/dialogues_audio/{dialogue_id}.mp3"
    try:
        with urllib.request.urlopen(url, timeout=15) as resp:
            data = resp.read()
    except HTTPError as exc:
        if exc.code == 404:
            return False
        raise ContentSyncError(f"Không tải được {url}: {exc}") from exc
    except (URLError, TimeoutError) as exc:
        raise ContentSyncError(f"Không tải được {url}: {exc}") from exc

    DIALOGUE_AUDIO_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    (DIALOGUE_AUDIO_CACHE_DIR / f"{dialogue_id}.mp3").write_bytes(data)
    return True


def refresh_content(conn) -> dict:
    result: dict = {"vocabulary": {}, "dialogues": 0, "dialogue_audio": 0}

    for level in VOCAB_LEVELS:
        url = f"{RAW_BASE}/vocabulary/{_level_filename(level)}"
        words = _fetch_json(url)
        if not isinstance(words, list):
            raise ContentSyncError(f"Payload từ vựng cấp {level} phải là một danh sách")
        for w in words:
            if not isinstance(w, dict) or not REQUIRED_WORD_KEYS.issubset(w):
                raise ContentSyncError(f"Từ vựng thiếu trường bắt buộc ở cấp {level}: {w!r}")

        conn.execute("DELETE FROM vocab_words WHERE level = ?", (level,))
        conn.executemany(
            "INSERT INTO vocab_words (level, hanzi, pinyin, en, vi) VALUES (?, ?, ?, ?, ?)",
            [(level, w["hanzi"], w["pinyin"], w.get("en", ""), w.get("vi", "")) for w in words],
        )
        result["vocabulary"][level] = len(words)

    dialogues = _fetch_json(f"{RAW_BASE}/dialogues.json")
    if not isinstance(dialogues, list):
        raise ContentSyncError("Payload hội thoại phải là một danh sách")
    for d in dialogues:
        if not isinstance(d, dict) or not REQUIRED_DIALOGUE_KEYS.issubset(d):
            raise ContentSyncError(f"Hội thoại thiếu trường bắt buộc: {d.get('id', '?')!r}")

    conn.execute("DELETE FROM dialogues")
    conn.executemany(
        "INSERT INTO dialogues (id, level, data) VALUES (?, ?, ?)",
        [
            (
                d["id"],
                str(d["level"]),
                json.dumps(
                    {
                        "lines": d["lines"],
                        "question": d["question"],
                        "options": d["options"],
                        "blanks": d["blanks"],
                    },
                    ensure_ascii=False,
                ),
            )
            for d in dialogues
        ],
    )
    result["dialogues"] = len(dialogues)

    result["dialogue_audio"] = sum(
        1 for d in dialogues if _fetch_dialogue_audio(d["id"])
    )

    return result
