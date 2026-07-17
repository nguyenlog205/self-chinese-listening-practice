from __future__ import annotations

from contextlib import contextmanager

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from listening_backend.content import vocabulary_router as vocabulary_router_module
from listening_backend.db import get_conn as real_get_conn


@pytest.fixture
def client(db_path, monkeypatch):
    @contextmanager
    def fake_get_conn():
        with real_get_conn(db_path) as conn:
            yield conn

    monkeypatch.setattr(vocabulary_router_module, "get_conn", fake_get_conn)

    app = FastAPI()
    app.include_router(vocabulary_router_module.router)
    return TestClient(app)


def _insert_word(db_path, level, hanzi, pinyin, en="", vi=""):
    with real_get_conn(db_path) as conn:
        conn.execute(
            "INSERT INTO vocab_words (level, hanzi, pinyin, en, vi) VALUES (?, ?, ?, ?, ?)",
            (level, hanzi, pinyin, en, vi),
        )


def test_list_vocabulary_filters_by_level(client, db_path):
    _insert_word(db_path, "1", "爱", "ài", "love", "yêu")
    _insert_word(db_path, "2", "开始", "kāishǐ", "to start", "bắt đầu")

    resp = client.get("/api/vocabulary", params={"level": "1"})
    assert resp.status_code == 200
    words = resp.json()
    assert len(words) == 1
    assert words[0] == {"hanzi": "爱", "pinyin": "ài", "en": "love", "vi": "yêu"}


def test_list_vocabulary_requires_level_query_param(client):
    resp = client.get("/api/vocabulary")
    assert resp.status_code == 422


def test_list_levels_sorts_numerically_with_7_9_last(client, db_path):
    for level in ("6", "1", "7-9", "2"):
        _insert_word(db_path, level, "爱", "ài")

    resp = client.get("/api/vocabulary/levels")
    assert resp.json() == ["1", "2", "6", "7-9"]
