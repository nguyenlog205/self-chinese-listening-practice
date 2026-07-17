"""Locks in the `GET /api/dialogues` response shape the frontend
(DialogueChoice.jsx / DialogueCloze.jsx) currently depends on: each row's
`data` JSON blob must carry `lines` + `question` + `options` + `blanks`,
matching `content/models.py::DialogueOut`.

Note: the *current* `seed_data/dialogues.json` on disk no longer has
`question`/`options`/`blanks` (see `test_content_seed.py`), so a fresh
install can no longer produce rows matching this shape — this test only
verifies the router's contract, not that anything can currently populate it
that way in production. See docs/learning_material_update_feature.md."""

from __future__ import annotations

import json
from contextlib import contextmanager

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from listening_backend.content import dialogues_router as dialogues_router_module
from listening_backend.db import get_conn as real_get_conn


@pytest.fixture
def client(db_path, monkeypatch):
    @contextmanager
    def fake_get_conn():
        with real_get_conn(db_path) as conn:
            yield conn

    monkeypatch.setattr(dialogues_router_module, "get_conn", fake_get_conn)

    app = FastAPI()
    app.include_router(dialogues_router_module.router)
    return TestClient(app)


def _insert_dialogue(db_path, id_, level):
    data = {
        "lines": [{"speaker": "A", "hanzi": "你好", "pinyin": "nǐ hǎo"}],
        "question": {"vi": "Câu hỏi?", "en": "Question?", "zh": "问题？"},
        "options": [{"vi": "Đúng", "en": "Right", "correct": True}],
        "blanks": [{"lineIndex": 0, "answer": "你好"}],
    }
    with real_get_conn(db_path) as conn:
        conn.execute(
            "INSERT INTO dialogues (id, level, data) VALUES (?, ?, ?)",
            (id_, level, json.dumps(data, ensure_ascii=False)),
        )


def test_list_dialogues_returns_full_shape(client, db_path):
    _insert_dialogue(db_path, "d1", "1")

    resp = client.get("/api/dialogues")
    assert resp.status_code == 200
    [dialogue] = resp.json()
    assert dialogue["id"] == "d1"
    assert dialogue["lines"][0]["hanzi"] == "你好"
    assert dialogue["options"][0]["correct"] is True
    assert dialogue["blanks"][0]["answer"] == "你好"


def test_list_dialogues_filters_by_level(client, db_path):
    _insert_dialogue(db_path, "d1", "1")
    _insert_dialogue(db_path, "d2", "2")

    resp = client.get("/api/dialogues", params={"level": "2"})
    ids = [d["id"] for d in resp.json()]
    assert ids == ["d2"]
