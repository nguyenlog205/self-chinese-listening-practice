from __future__ import annotations

import json
from contextlib import contextmanager

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from listening_backend.content import reading_router as reading_router_module
from listening_backend.db import get_conn as real_get_conn


@pytest.fixture
def client(db_path, monkeypatch):
    @contextmanager
    def fake_get_conn():
        with real_get_conn(db_path) as conn:
            yield conn

    monkeypatch.setattr(reading_router_module, "get_conn", fake_get_conn)

    app = FastAPI()
    app.include_router(reading_router_module.router)
    return TestClient(app)


def _insert_passage(db_path, passage_id, level, **payload):
    data = {
        "title": {"vi": "vi", "en": "en", "zh": "zh"},
        "hanzi": "你好",
        "pinyin": "nǐ hǎo",
        "translation": {"vi": "vi", "en": "en"},
        **payload,
    }
    with real_get_conn(db_path) as conn:
        conn.execute(
            "INSERT INTO reading_passages (id, level, data) VALUES (?, ?, ?)",
            (passage_id, level, json.dumps(data, ensure_ascii=False)),
        )


def test_list_reading_filters_by_level(client, db_path):
    _insert_passage(db_path, "r1", "1")
    _insert_passage(db_path, "r2", "2")

    resp = client.get("/api/reading", params={"level": "1"})
    assert resp.status_code == 200
    passages = resp.json()
    assert len(passages) == 1
    assert passages[0]["id"] == "r1"
    assert passages[0]["level"] == "1"
    assert passages[0]["hanzi"] == "你好"


def test_list_reading_returns_multiple_passages_per_level(client, db_path):
    _insert_passage(db_path, "r1", "1")
    _insert_passage(db_path, "r1b", "1")

    resp = client.get("/api/reading", params={"level": "1"})
    assert {p["id"] for p in resp.json()} == {"r1", "r1b"}


def test_list_reading_requires_level_query_param(client):
    resp = client.get("/api/reading")
    assert resp.status_code == 422


def test_list_reading_empty_level_returns_empty_list(client):
    resp = client.get("/api/reading", params={"level": "6"})
    assert resp.status_code == 200
    assert resp.json() == []
