"""content/sync.py — the "Cập nhật dữ liệu" pull-from-GitHub flow. All
network calls go through `urllib.request.urlopen`, monkeypatched here to
fixture data so nothing hits the real network."""

from __future__ import annotations

import json
from urllib.error import HTTPError, URLError

import pytest

from listening_backend.content import sync as sync_module
from listening_backend.content.sync import ContentSyncError, refresh_content

VOCAB_LEVELS = sync_module.VOCAB_LEVELS


def _json_bytes(payload) -> bytes:
    return json.dumps(payload).encode("utf-8")


class _FakeResponse:
    def __init__(self, body: bytes):
        self._body = body

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def read(self):
        return self._body


def _vocab_url(level: str) -> str:
    return f"{sync_module.RAW_BASE}/vocabulary/{sync_module._level_filename(level)}"


def _grammar_url(level: str) -> str:
    return f"{sync_module.RAW_BASE}/grammar/{sync_module._level_filename(level)}"


def _reading_url(level: str) -> str:
    return f"{sync_module.RAW_BASE}/reading/{sync_module._level_filename(level)}"


def _dialogues_url() -> str:
    return f"{sync_module.RAW_BASE}/dialogues.json"


def _dialogue_audio_url(dialogue_id: str) -> str:
    return f"{sync_module.RAW_BASE}/dialogues_audio/{dialogue_id}/audio.mp3"


def _audio_metadata_url(dialogue_id: str) -> str:
    return f"{sync_module.RAW_BASE}/dialogues_audio/{dialogue_id}/metadata.json"


def _github_dir_url(path: str) -> str:
    return (
        f"https://api.github.com/repos/{sync_module.GITHUB_OWNER_REPO}/contents/"
        f"{sync_module.GITHUB_CONTENT_PATH}/{path}"
    )


@pytest.fixture
def urlopen_map(monkeypatch):
    """Maps exact URL -> a zero-arg callable producing the urlopen result
    (or raising), so each test only has to declare the URLs it cares about.
    `_list_github_dir` calls `urlopen(Request(...))` rather than a bare URL
    string, so both shapes are accepted here."""
    handlers: dict[str, callable] = {}

    def fake_urlopen(url_or_request, timeout=None):
        url = url_or_request if isinstance(url_or_request, str) else url_or_request.full_url
        if url not in handlers:
            raise AssertionError(f"unexpected fetch: {url}")
        return handlers[url]()

    monkeypatch.setattr(sync_module.urllib.request, "urlopen", fake_urlopen)
    return handlers


def _stub_no_audio_metadata_or_exercises(urlopen_map, dialogue_ids):
    """Stubs every dialogue's audio-metadata fetch as 404 (no recording
    yet) and every exercise-kind directory listing as empty — the
    "nothing extra to sync yet" baseline most tests build on top of."""
    for dialogue_id in dialogue_ids:

        def audio_meta_404(dialogue_id=dialogue_id):
            raise HTTPError(_audio_metadata_url(dialogue_id), 404, "not found", None, None)

        urlopen_map[_audio_metadata_url(dialogue_id)] = audio_meta_404

    for kind in sync_module.EXERCISE_KINDS:
        urlopen_map[_github_dir_url(f"dialogue_exercises/{kind}")] = lambda: _FakeResponse(
            _json_bytes([])
        )


def _stub_all_vocab_levels_empty(urlopen_map):
    for level in VOCAB_LEVELS:
        urlopen_map[_vocab_url(level)] = lambda: _FakeResponse(_json_bytes([]))


def _stub_all_grammar_levels_empty(urlopen_map):
    for level in sync_module.GRAMMAR_LEVELS:
        urlopen_map[_grammar_url(level)] = lambda: _FakeResponse(_json_bytes([]))


def _stub_all_reading_levels_empty(urlopen_map):
    for level in sync_module.READING_LEVELS:
        urlopen_map[_reading_url(level)] = lambda: _FakeResponse(_json_bytes([]))


def test_fetch_json_wraps_network_error(urlopen_map):
    def raise_url_error():
        raise URLError("boom")

    urlopen_map["http://example.test"] = raise_url_error
    with pytest.raises(ContentSyncError):
        sync_module._fetch_json("http://example.test")


def test_fetch_json_wraps_invalid_json(urlopen_map):
    urlopen_map["http://example.test"] = lambda: _FakeResponse(b"not json")
    with pytest.raises(ContentSyncError):
        sync_module._fetch_json("http://example.test")


def test_refresh_content_rejects_non_list_vocab_payload(urlopen_map, conn):
    urlopen_map[_vocab_url(VOCAB_LEVELS[0])] = lambda: _FakeResponse(_json_bytes({"not": "a list"}))
    with pytest.raises(ContentSyncError, match="danh sách"):
        refresh_content(conn)


def test_refresh_content_rejects_word_missing_required_keys(urlopen_map, conn):
    urlopen_map[_vocab_url(VOCAB_LEVELS[0])] = lambda: _FakeResponse(
        _json_bytes([{"hanzi": "爱"}])  # missing "pinyin"
    )
    with pytest.raises(ContentSyncError, match="thiếu trường bắt buộc"):
        refresh_content(conn)


def test_refresh_content_imports_vocab_and_dialogues(urlopen_map, conn):
    urlopen_map[_vocab_url(VOCAB_LEVELS[0])] = lambda: _FakeResponse(
        _json_bytes([{"hanzi": "爱", "pinyin": "ài", "en": "love", "vi": "yêu"}])
    )
    for level in VOCAB_LEVELS[1:]:
        urlopen_map[_vocab_url(level)] = lambda: _FakeResponse(_json_bytes([]))
    _stub_all_grammar_levels_empty(urlopen_map)
    _stub_all_reading_levels_empty(urlopen_map)

    dialogue = {
        "id": "d1",
        "level": 1,
        "lines": [{"speaker": "A", "hanzi": "你好", "pinyin": "nǐ hǎo"}],
    }
    urlopen_map[_dialogues_url()] = lambda: _FakeResponse(_json_bytes([dialogue]))
    _stub_no_audio_metadata_or_exercises(urlopen_map, ["d1"])

    def audio_404():
        raise HTTPError(_dialogue_audio_url("d1"), 404, "not found", None, None)

    urlopen_map[_dialogue_audio_url("d1")] = audio_404

    result = refresh_content(conn)

    assert result["vocabulary"][VOCAB_LEVELS[0]] == 1
    assert result["dialogues"] == 1
    assert result["dialogue_audio"] == 0  # 404 -> no recording yet, not an error
    assert result["audio_metadata"] == 0
    assert result["choice_exercises"] == 0
    assert result["cloze_exercises"] == 0
    assert result["dictation_exercises"] == 0

    row = conn.execute("SELECT * FROM vocab_words WHERE level = ?", (VOCAB_LEVELS[0],)).fetchone()
    assert row["hanzi"] == "爱"
    stored = json.loads(conn.execute("SELECT data FROM dialogues WHERE id = 'd1'").fetchone()["data"])
    assert stored["lines"][0]["hanzi"] == "你好"


def test_refresh_content_rejects_non_list_grammar_payload(urlopen_map, conn):
    _stub_all_vocab_levels_empty(urlopen_map)
    urlopen_map[_grammar_url(sync_module.GRAMMAR_LEVELS[0])] = lambda: _FakeResponse(
        _json_bytes({"not": "a list"})
    )
    with pytest.raises(ContentSyncError, match="danh sách"):
        refresh_content(conn)


def test_refresh_content_rejects_grammar_missing_required_keys(urlopen_map, conn):
    _stub_all_vocab_levels_empty(urlopen_map)
    urlopen_map[_grammar_url(sync_module.GRAMMAR_LEVELS[0])] = lambda: _FakeResponse(
        _json_bytes([{"id": "shi", "title": {"vi": "..."}}])  # missing structure/explanation/examples
    )
    with pytest.raises(ContentSyncError, match="thiếu trường bắt buộc"):
        refresh_content(conn)


def test_refresh_content_imports_grammar(urlopen_map, conn):
    _stub_all_vocab_levels_empty(urlopen_map)
    point = {
        "id": "shi",
        "title": {"vi": "Câu với 是", "en": "Sentences with 是", "zh": "是字句"},
        "structure": "A + 是 + B",
        "explanation": {"vi": "...", "en": "...", "zh": "..."},
        "examples": [
            {"hanzi": "我是学生。", "pinyin": "Wǒ shì xuésheng.", "translation": {"vi": "...", "en": "..."}}
        ],
    }
    first_level = sync_module.GRAMMAR_LEVELS[0]
    urlopen_map[_grammar_url(first_level)] = lambda: _FakeResponse(_json_bytes([point]))
    for level in sync_module.GRAMMAR_LEVELS[1:]:
        urlopen_map[_grammar_url(level)] = lambda: _FakeResponse(_json_bytes([]))
    _stub_all_reading_levels_empty(urlopen_map)

    dialogue = {"id": "d1", "level": 1, "lines": []}
    urlopen_map[_dialogues_url()] = lambda: _FakeResponse(_json_bytes([dialogue]))
    _stub_no_audio_metadata_or_exercises(urlopen_map, ["d1"])

    def audio_404():
        raise HTTPError(_dialogue_audio_url("d1"), 404, "not found", None, None)

    urlopen_map[_dialogue_audio_url("d1")] = audio_404

    result = refresh_content(conn)

    assert result["grammar"][first_level] == 1
    row = conn.execute(
        "SELECT level, data FROM grammar_points WHERE id = 'shi'"
    ).fetchone()
    assert row["level"] == first_level
    stored = json.loads(row["data"])
    assert stored["structure"] == "A + 是 + B"
    assert stored["examples"][0]["hanzi"] == "我是学生。"


def test_refresh_content_rejects_non_list_reading_payload(urlopen_map, conn):
    _stub_all_vocab_levels_empty(urlopen_map)
    _stub_all_grammar_levels_empty(urlopen_map)
    urlopen_map[_reading_url(sync_module.READING_LEVELS[0])] = lambda: _FakeResponse(
        _json_bytes({"not": "a list"})
    )
    with pytest.raises(ContentSyncError, match="danh sách"):
        refresh_content(conn)


def test_refresh_content_rejects_reading_missing_required_keys(urlopen_map, conn):
    _stub_all_vocab_levels_empty(urlopen_map)
    _stub_all_grammar_levels_empty(urlopen_map)
    urlopen_map[_reading_url(sync_module.READING_LEVELS[0])] = lambda: _FakeResponse(
        _json_bytes([{"id": "r1", "title": {"vi": "..."}}])  # missing hanzi/pinyin/translation
    )
    with pytest.raises(ContentSyncError, match="thiếu trường bắt buộc"):
        refresh_content(conn)


def test_refresh_content_imports_reading(urlopen_map, conn):
    _stub_all_vocab_levels_empty(urlopen_map)
    _stub_all_grammar_levels_empty(urlopen_map)
    passage = {
        "id": "r1",
        "title": {"vi": "Gia đình tôi", "en": "My family", "zh": "我的家"},
        "hanzi": "我叫马丁。",
        "pinyin": "Wǒ jiào Mǎdīng.",
        "translation": {"vi": "Tôi tên là Martin.", "en": "My name is Martin."},
    }
    first_level = sync_module.READING_LEVELS[0]
    urlopen_map[_reading_url(first_level)] = lambda: _FakeResponse(_json_bytes([passage]))
    for level in sync_module.READING_LEVELS[1:]:
        urlopen_map[_reading_url(level)] = lambda: _FakeResponse(_json_bytes([]))

    dialogue = {"id": "d1", "level": 1, "lines": []}
    urlopen_map[_dialogues_url()] = lambda: _FakeResponse(_json_bytes([dialogue]))
    _stub_no_audio_metadata_or_exercises(urlopen_map, ["d1"])

    def audio_404():
        raise HTTPError(_dialogue_audio_url("d1"), 404, "not found", None, None)

    urlopen_map[_dialogue_audio_url("d1")] = audio_404

    result = refresh_content(conn)

    assert result["reading"][first_level] == 1
    row = conn.execute("SELECT level, data FROM reading_passages WHERE id = 'r1'").fetchone()
    assert row["level"] == first_level
    stored = json.loads(row["data"])
    assert stored["hanzi"] == "我叫马丁。"
    assert stored["translation"]["vi"] == "Tôi tên là Martin."


def test_refresh_content_rejects_dialogue_missing_required_keys(urlopen_map, conn):
    _stub_all_vocab_levels_empty(urlopen_map)
    _stub_all_grammar_levels_empty(urlopen_map)
    _stub_all_reading_levels_empty(urlopen_map)
    # missing "lines" -- REQUIRED_DIALOGUE_KEYS is just {id, level, lines}
    # now that question/options/blanks live in dialogue_exercises/ instead.
    urlopen_map[_dialogues_url()] = lambda: _FakeResponse(
        _json_bytes([{"id": "d1", "level": 1}])
    )
    with pytest.raises(ContentSyncError, match="thiếu trường bắt buộc"):
        refresh_content(conn)


def test_fetch_dialogue_audio_returns_false_on_404(urlopen_map, monkeypatch, tmp_path):
    monkeypatch.setattr(sync_module, "DIALOGUE_AUDIO_CACHE_DIR", tmp_path / "cache")

    def audio_404():
        raise HTTPError(_dialogue_audio_url("missing"), 404, "not found", None, None)

    urlopen_map[_dialogue_audio_url("missing")] = audio_404
    assert sync_module._fetch_dialogue_audio("missing") is False


def test_fetch_dialogue_audio_saves_file_on_success(urlopen_map, monkeypatch, tmp_path):
    cache_dir = tmp_path / "cache"
    monkeypatch.setattr(sync_module, "DIALOGUE_AUDIO_CACHE_DIR", cache_dir)
    urlopen_map[_dialogue_audio_url("d1")] = lambda: _FakeResponse(b"fake-mp3-bytes")

    assert sync_module._fetch_dialogue_audio("d1") is True
    assert (cache_dir / "d1.mp3").read_bytes() == b"fake-mp3-bytes"


def test_fetch_dialogue_audio_raises_on_non_404_http_error(urlopen_map):
    def server_error():
        raise HTTPError(_dialogue_audio_url("d1"), 500, "boom", None, None)

    urlopen_map[_dialogue_audio_url("d1")] = server_error
    with pytest.raises(ContentSyncError):
        sync_module._fetch_dialogue_audio("d1")


def test_fetch_audio_metadata_returns_none_on_404(urlopen_map):
    def meta_404():
        raise HTTPError(_audio_metadata_url("d1"), 404, "not found", None, None)

    urlopen_map[_audio_metadata_url("d1")] = meta_404
    assert sync_module._fetch_audio_metadata("d1") is None


def test_fetch_audio_metadata_rejects_missing_required_keys(urlopen_map):
    urlopen_map[_audio_metadata_url("d1")] = lambda: _FakeResponse(_json_bytes({"id": "d1"}))
    with pytest.raises(ContentSyncError, match="thiếu trường bắt buộc"):
        sync_module._fetch_audio_metadata("d1")


def test_fetch_audio_metadata_returns_payload_on_success(urlopen_map):
    payload = {
        "id": "d1",
        "audio_file": "audio.mp3",
        "duration_sec": 12.5,
        "exercises": {"choice": {"play_mode": "full", "timings": {"start": 0, "end": 12.5}}},
    }
    urlopen_map[_audio_metadata_url("d1")] = lambda: _FakeResponse(_json_bytes(payload))
    assert sync_module._fetch_audio_metadata("d1") == payload


def test_list_github_dir_returns_empty_on_404(urlopen_map):
    def dir_404():
        raise HTTPError(_github_dir_url("dialogue_exercises/choice"), 404, "not found", None, None)

    urlopen_map[_github_dir_url("dialogue_exercises/choice")] = dir_404
    assert sync_module._list_github_dir("dialogue_exercises/choice") == []


def test_list_github_dir_filters_to_json_files(urlopen_map):
    entries = [
        {"name": "choice_001.json", "type": "file", "download_url": "https://raw/choice_001.json"},
        {"name": "README.md", "type": "file", "download_url": "https://raw/README.md"},
        {"name": "subdir", "type": "dir", "download_url": None},
    ]
    urlopen_map[_github_dir_url("dialogue_exercises/choice")] = lambda: _FakeResponse(_json_bytes(entries))
    result = sync_module._list_github_dir("dialogue_exercises/choice")
    assert [e["name"] for e in result] == ["choice_001.json"]


def test_fetch_exercises_rejects_audio_id_not_in_dialogues(urlopen_map):
    entry = {"name": "choice_001.json", "type": "file", "download_url": "https://raw/choice_001.json"}
    urlopen_map[_github_dir_url("dialogue_exercises/choice")] = lambda: _FakeResponse(_json_bytes([entry]))
    urlopen_map["https://raw/choice_001.json"] = lambda: _FakeResponse(
        _json_bytes(
            {
                "id": "choice_001",
                "audio_id": "does_not_exist",
                "lines_from_dialogue": [0],
                "question": {"vi": "?", "en": "?", "zh": "？"},
                "options": [{"vi": "a", "en": "a", "correct": True}],
            }
        )
    )
    with pytest.raises(ContentSyncError, match="không khớp hội thoại"):
        sync_module._fetch_exercises("choice", {"d1"})


def test_fetch_exercises_rejects_missing_required_keys(urlopen_map):
    entry = {"name": "dictation_001.json", "type": "file", "download_url": "https://raw/dictation_001.json"}
    urlopen_map[_github_dir_url("dialogue_exercises/dictation")] = lambda: _FakeResponse(_json_bytes([entry]))
    urlopen_map["https://raw/dictation_001.json"] = lambda: _FakeResponse(
        _json_bytes({"id": "dictation_001", "audio_id": "d1"})  # missing lines_from_dialogue/target_line
    )
    with pytest.raises(ContentSyncError, match="thiếu trường bắt buộc"):
        sync_module._fetch_exercises("dictation", {"d1"})


def test_refresh_content_syncs_audio_metadata_and_all_exercise_kinds(urlopen_map, conn):
    _stub_all_vocab_levels_empty(urlopen_map)
    _stub_all_grammar_levels_empty(urlopen_map)
    _stub_all_reading_levels_empty(urlopen_map)

    dialogue = {
        "id": "d1",
        "level": 1,
        "lines": [{"speaker": "A", "hanzi": "你好", "pinyin": "nǐ hǎo"}],
    }
    urlopen_map[_dialogues_url()] = lambda: _FakeResponse(_json_bytes([dialogue]))

    audio_meta = {
        "id": "d1",
        "audio_file": "audio.mp3",
        "duration_sec": 5.0,
        "exercises": {"choice": {"play_mode": "full", "timings": {"start": 0, "end": 5.0}}},
    }
    urlopen_map[_audio_metadata_url("d1")] = lambda: _FakeResponse(_json_bytes(audio_meta))
    urlopen_map[_dialogue_audio_url("d1")] = lambda: _FakeResponse(b"fake-mp3")

    choice_item = {
        "id": "choice_001",
        "audio_id": "d1",
        "lines_from_dialogue": [0],
        "question": {"vi": "?", "en": "?", "zh": "？"},
        "options": [{"vi": "a", "en": "a", "correct": True}],
    }
    cloze_item = {"id": "cloze_001", "audio_id": "d1", "lines_from_dialogue": [0], "blanks": []}
    dictation_item = {"id": "dictation_001", "audio_id": "d1", "lines_from_dialogue": [0], "target_line": 0}

    for kind, item in (("choice", choice_item), ("cloze", cloze_item), ("dictation", dictation_item)):
        entry = {"name": f"{item['id']}.json", "type": "file", "download_url": f"https://raw/{item['id']}.json"}
        urlopen_map[_github_dir_url(f"dialogue_exercises/{kind}")] = (
            lambda entry=entry: _FakeResponse(_json_bytes([entry]))
        )
        urlopen_map[entry["download_url"]] = lambda item=item: _FakeResponse(_json_bytes(item))

    result = refresh_content(conn)

    assert result["audio_metadata"] == 1
    assert result["choice_exercises"] == 1
    assert result["cloze_exercises"] == 1
    assert result["dictation_exercises"] == 1

    stored_meta = json.loads(conn.execute("SELECT data FROM dialogues_audio_metadata WHERE id = 'd1'").fetchone()[0])
    assert stored_meta["audio_file"] == "audio.mp3"

    choice_row = conn.execute(
        "SELECT audio_id, data FROM dialogue_exercises_choice WHERE id = 'choice_001'"
    ).fetchone()
    assert choice_row["audio_id"] == "d1"
    assert json.loads(choice_row["data"])["question"]["vi"] == "?"

    dictation_row = conn.execute(
        "SELECT audio_id, data FROM dialogue_exercises_dictation WHERE id = 'dictation_001'"
    ).fetchone()
    assert json.loads(dictation_row["data"])["target_line"] == 0
