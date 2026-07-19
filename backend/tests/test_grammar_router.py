from __future__ import annotations

import json
from contextlib import contextmanager

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from listening_backend.content import grammar_router as grammar_router_module
from listening_backend.db import get_conn as real_get_conn


@pytest.fixture
def client(db_path, monkeypatch):
    @contextmanager
    def fake_get_conn():
        with real_get_conn(db_path) as conn:
            yield conn

    monkeypatch.setattr(grammar_router_module, "get_conn", fake_get_conn)

    app = FastAPI()
    app.include_router(grammar_router_module.router)
    return TestClient(app)


def _insert_point(db_path, point_id, level, **payload):
    data = {
        "title": {"vi": "vi", "en": "en", "zh": "zh"},
        "structure": "A + B",
        "explanation": {"vi": "vi", "en": "en", "zh": "zh"},
        "examples": [{"hanzi": "你好", "pinyin": "nǐ hǎo", "translation": {"vi": "vi", "en": "en"}}],
        **payload,
    }
    with real_get_conn(db_path) as conn:
        conn.execute(
            "INSERT INTO grammar_points (id, level, data) VALUES (?, ?, ?)",
            (point_id, level, json.dumps(data, ensure_ascii=False)),
        )


def test_list_grammar_filters_by_level(client, db_path):
    _insert_point(db_path, "shi", "1")
    _insert_point(db_path, "le", "2")

    resp = client.get("/api/grammar", params={"level": "1"})
    assert resp.status_code == 200
    points = resp.json()
    assert len(points) == 1
    assert points[0]["id"] == "shi"
    assert points[0]["level"] == "1"
    assert points[0]["structure"] == "A + B"
    assert points[0]["examples"][0]["hanzi"] == "你好"


def test_list_grammar_requires_level_query_param(client):
    resp = client.get("/api/grammar")
    assert resp.status_code == 422


def test_list_grammar_empty_level_returns_empty_list(client):
    resp = client.get("/api/grammar", params={"level": "6"})
    assert resp.status_code == 200
    assert resp.json() == []
