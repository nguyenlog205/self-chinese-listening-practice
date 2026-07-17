"""content/exercises_router.py -- GET /api/dialogue-exercises/{kind}[/{id}],
the piece that finishes "separate exercises from dialogue definitions"
(ec3fe19): exercises are looked up independently of dialogues, joined only
through audio_id, so the same audio can back multiple exercises."""

from __future__ import annotations

import json
from contextlib import contextmanager

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from listening_backend.content import exercises_router as exercises_router_module
from listening_backend.db import get_conn as real_get_conn


@pytest.fixture
def client(db_path, monkeypatch):
    @contextmanager
    def fake_get_conn():
        with real_get_conn(db_path) as conn:
            yield conn

    monkeypatch.setattr(exercises_router_module, "get_conn", fake_get_conn)

    app = FastAPI()
    app.include_router(exercises_router_module.router)
    return TestClient(app)


def _insert_dialogue(db_path, id_, level):
    with real_get_conn(db_path) as conn:
        conn.execute(
            "INSERT INTO dialogues (id, level, data) VALUES (?, ?, ?)",
            (id_, level, json.dumps({"lines": []})),
        )


def _insert_choice(db_path, id_, audio_id):
    data = {
        "lines_from_dialogue": [0, 1],
        "question": {"vi": "?", "en": "?", "zh": "？"},
        "options": [{"vi": "a", "en": "a", "correct": True}],
    }
    with real_get_conn(db_path) as conn:
        conn.execute(
            "INSERT INTO dialogue_exercises_choice (id, audio_id, data) VALUES (?, ?, ?)",
            (id_, audio_id, json.dumps(data, ensure_ascii=False)),
        )


def _insert_cloze(db_path, id_, audio_id):
    data = {"lines_from_dialogue": [0], "blanks": [{"lineIndex": 0, "answer": "你好"}]}
    with real_get_conn(db_path) as conn:
        conn.execute(
            "INSERT INTO dialogue_exercises_cloze (id, audio_id, data) VALUES (?, ?, ?)",
            (id_, audio_id, json.dumps(data, ensure_ascii=False)),
        )


def _insert_dictation(db_path, id_, audio_id):
    data = {"lines_from_dialogue": [0, 1], "target_line": 1}
    with real_get_conn(db_path) as conn:
        conn.execute(
            "INSERT INTO dialogue_exercises_dictation (id, audio_id, data) VALUES (?, ?, ?)",
            (id_, audio_id, json.dumps(data)),
        )


def test_list_choice_exercises(client, db_path):
    _insert_dialogue(db_path, "d1", "1")
    _insert_choice(db_path, "choice_001", "d1")

    resp = client.get("/api/dialogue-exercises/choice")
    assert resp.status_code == 200
    [item] = resp.json()
    assert item["id"] == "choice_001"
    assert item["audio_id"] == "d1"
    assert item["question"]["vi"] == "?"
    assert item["options"][0]["correct"] is True


def test_multiple_choice_exercises_can_share_one_audio_id(client, db_path):
    _insert_dialogue(db_path, "d1", "1")
    _insert_choice(db_path, "choice_001", "d1")
    _insert_choice(db_path, "choice_002", "d1")

    resp = client.get("/api/dialogue-exercises/choice")
    ids = {item["id"] for item in resp.json()}
    assert ids == {"choice_001", "choice_002"}


def test_list_choice_exercises_filters_by_level(client, db_path):
    _insert_dialogue(db_path, "d1", "1")
    _insert_dialogue(db_path, "d2", "2")
    _insert_choice(db_path, "choice_001", "d1")
    _insert_choice(db_path, "choice_002", "d2")

    resp = client.get("/api/dialogue-exercises/choice", params={"level": "2"})
    ids = [item["id"] for item in resp.json()]
    assert ids == ["choice_002"]


def test_get_choice_exercise_by_id(client, db_path):
    _insert_dialogue(db_path, "d1", "1")
    _insert_choice(db_path, "choice_001", "d1")

    resp = client.get("/api/dialogue-exercises/choice/choice_001")
    assert resp.status_code == 200
    assert resp.json()["audio_id"] == "d1"


def test_get_choice_exercise_404_when_missing(client):
    resp = client.get("/api/dialogue-exercises/choice/does_not_exist")
    assert resp.status_code == 404


def test_list_cloze_exercises(client, db_path):
    _insert_dialogue(db_path, "d1", "1")
    _insert_cloze(db_path, "cloze_001", "d1")

    resp = client.get("/api/dialogue-exercises/cloze")
    [item] = resp.json()
    assert item["blanks"][0]["answer"] == "你好"


def test_list_dictation_exercises(client, db_path):
    _insert_dialogue(db_path, "d1", "1")
    _insert_dictation(db_path, "dictation_001", "d1")

    resp = client.get("/api/dialogue-exercises/dictation")
    [item] = resp.json()
    assert item["target_line"] == 1
