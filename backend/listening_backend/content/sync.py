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
from .exercises import (
    AUDIO_METADATA_REQUIRED_KEYS,
    EXERCISE_KINDS,
    EXERCISE_REQUIRED_KEYS,
    audio_metadata_row,
    exercise_row,
)

GITHUB_OWNER_REPO = "nguyenlog205/self-chinese-listening-practice"
GITHUB_CONTENT_PATH = "backend/listening_backend/seed_data"

RAW_BASE = f"https://raw.githubusercontent.com/{GITHUB_OWNER_REPO}/main/{GITHUB_CONTENT_PATH}"

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
    """Downloads dialogues_audio/{dialogue_id}/audio.mp3 from GitHub into the
    local writable cache (flat: {cache}/{dialogue_id}.mp3 — the cache dir
    doesn't need to mirror seed_data's per-dialogue folder layout). Returns
    False (not an error) if that dialogue simply doesn't have a recording
    yet — most dialogues won't, early on, and that's fine: playback falls
    back to TTS."""
    url = f"{RAW_BASE}/dialogues_audio/{dialogue_id}/audio.mp3"
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


def _fetch_audio_metadata(dialogue_id: str) -> dict | None:
    """Fetches dialogues_audio/{dialogue_id}/metadata.json. Returns None
    (not an error) on 404 — same tolerance as `_fetch_dialogue_audio`: most
    dialogues won't have a recording (or its metadata) yet."""
    url = f"{RAW_BASE}/dialogues_audio/{dialogue_id}/metadata.json"
    try:
        with urllib.request.urlopen(url, timeout=15) as resp:
            item = json.loads(resp.read().decode("utf-8"))
    except HTTPError as exc:
        if exc.code == 404:
            return None
        raise ContentSyncError(f"Không tải được {url}: {exc}") from exc
    except (URLError, TimeoutError) as exc:
        raise ContentSyncError(f"Không tải được {url}: {exc}") from exc
    except json.JSONDecodeError as exc:
        raise ContentSyncError(f"Dữ liệu JSON không hợp lệ tại {url}: {exc}") from exc

    if not isinstance(item, dict) or not AUDIO_METADATA_REQUIRED_KEYS.issubset(item):
        raise ContentSyncError(f"{url}: thiếu trường bắt buộc")
    return item


def _list_github_dir(path: str) -> list[dict]:
    """Lists `.json` files in a seed_data/ subfolder via the GitHub Contents
    API — raw.githubusercontent.com has no directory-listing endpoint, and
    the whole point of the dialogue_exercises convention (see
    seed_data/CONVENTION.md) is "commit a new file, click sync" with no
    manifest to maintain by hand. A missing folder (e.g. no exercises of
    that kind yet) is not an error — returns an empty list, same tolerance
    as the per-dialogue audio/metadata fetches."""
    url = f"https://api.github.com/repos/{GITHUB_OWNER_REPO}/contents/{GITHUB_CONTENT_PATH}/{path}"
    request = urllib.request.Request(url, headers={"User-Agent": "listening-backend"})
    try:
        with urllib.request.urlopen(request, timeout=15) as resp:
            entries = json.loads(resp.read().decode("utf-8"))
    except HTTPError as exc:
        if exc.code == 404:
            return []
        raise ContentSyncError(f"Không liệt kê được {url}: {exc}") from exc
    except (URLError, TimeoutError) as exc:
        raise ContentSyncError(f"Không liệt kê được {url}: {exc}") from exc
    except json.JSONDecodeError as exc:
        raise ContentSyncError(f"Dữ liệu JSON không hợp lệ tại {url}: {exc}") from exc

    return [e for e in entries if e.get("type") == "file" and e["name"].endswith(".json")]


def _fetch_exercises(kind: str, dialogue_ids: set[str]) -> list[dict]:
    required = EXERCISE_REQUIRED_KEYS[kind]
    items = []
    for entry in _list_github_dir(f"dialogue_exercises/{kind}"):
        item = _fetch_json(entry["download_url"])
        if not isinstance(item, dict) or not required.issubset(item):
            raise ContentSyncError(f"{kind}/{entry['name']} thiếu trường bắt buộc")
        if item["audio_id"] not in dialogue_ids:
            raise ContentSyncError(
                f"{kind}/{entry['name']}: audio_id {item['audio_id']!r} không khớp hội thoại nào"
            )
        items.append(item)
    return items


def refresh_content(conn) -> dict:
    result: dict = {
        "vocabulary": {},
        "dialogues": 0,
        "dialogue_audio": 0,
        "audio_metadata": 0,
        "choice_exercises": 0,
        "cloze_exercises": 0,
        "dictation_exercises": 0,
    }

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
    dialogue_ids = {d["id"] for d in dialogues}

    audio_meta_items = [
        item for d in dialogues if (item := _fetch_audio_metadata(d["id"])) is not None
    ]
    conn.execute("DELETE FROM dialogues_audio_metadata")
    conn.executemany(
        "INSERT INTO dialogues_audio_metadata (id, data) VALUES (?, ?)",
        [audio_metadata_row(item) for item in audio_meta_items],
    )
    result["audio_metadata"] = len(audio_meta_items)

    for kind in EXERCISE_KINDS:
        items = _fetch_exercises(kind, dialogue_ids)
        table = f"dialogue_exercises_{kind}"
        conn.execute(f"DELETE FROM {table}")  # noqa: S608 (table from a fixed tuple, not user input)
        conn.executemany(
            f"INSERT INTO {table} (id, audio_id, data) VALUES (?, ?, ?)",  # noqa: S608
            [exercise_row(item) for item in items],
        )
        result[f"{kind}_exercises"] = len(items)

    result["dialogue_audio"] = sum(
        1 for d in dialogues if _fetch_dialogue_audio(d["id"])
    )

    return result
