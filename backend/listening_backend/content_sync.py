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
from urllib.error import URLError

RAW_BASE = (
    "https://raw.githubusercontent.com/nguyenlog205/"
    "self-chinese-listening-practice/main/backend/listening_backend/seed_data"
)

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


def refresh_content(conn) -> dict:
    result: dict = {"vocabulary": {}, "dialogues": 0}

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

    return result
