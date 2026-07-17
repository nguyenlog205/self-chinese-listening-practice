"""Locks in the `GET /api/dialogues` response shape: each row's `data` JSON
blob carries `lines` only, matching `content/models.py::DialogueOut` — the
exercise-specific fields (question/options/blanks) live in
dialogue_exercises_{choice,cloze,dictation} instead, served by
content/exercises_router.py (see test_exercises_router.py)."""

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
    data = {"lines": [{"speaker": "A", "hanzi": "你好", "pinyin": "nǐ hǎo"}]}
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


def test_list_dialogues_filters_by_level(client, db_path):
    _insert_dialogue(db_path, "d1", "1")
    _insert_dialogue(db_path, "d2", "2")

    resp = client.get("/api/dialogues", params={"level": "2"})
    ids = [d["id"] for d in resp.json()]
    assert ids == ["d2"]
