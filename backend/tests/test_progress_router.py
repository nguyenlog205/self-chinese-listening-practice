from __future__ import annotations

from contextlib import contextmanager

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from listening_backend.content import progress_router as progress_router_module
from listening_backend.db import get_conn as real_get_conn


@pytest.fixture
def client(db_path, monkeypatch):
    @contextmanager
    def fake_get_conn():
        with real_get_conn(db_path) as conn:
            yield conn

    monkeypatch.setattr(progress_router_module, "get_conn", fake_get_conn)

    app = FastAPI()
    app.include_router(progress_router_module.router)
    return TestClient(app)


def test_mark_learned_then_list(client):
    resp = client.post("/api/vocabulary/progress", json={"hanzi": "爱", "level": "1"})
    assert resp.status_code == 201

    progress = client.get("/api/vocabulary/progress").json()
    assert len(progress) == 1
    assert progress[0]["hanzi"] == "爱"
    assert progress[0]["level"] == "1"


def test_mark_learned_is_idempotent(client):
    payload = {"hanzi": "爱", "level": "1"}
    client.post("/api/vocabulary/progress", json=payload)
    client.post("/api/vocabulary/progress", json=payload)

    progress = client.get("/api/vocabulary/progress").json()
    assert len(progress) == 1


def test_unmark_learned_removes_single_word(client):
    client.post("/api/vocabulary/progress", json={"hanzi": "爱", "level": "1"})
    client.post("/api/vocabulary/progress", json={"hanzi": "八", "level": "1"})

    client.delete("/api/vocabulary/progress/爱")

    progress = client.get("/api/vocabulary/progress").json()
    assert [p["hanzi"] for p in progress] == ["八"]


def test_clear_progress_removes_everything(client):
    client.post("/api/vocabulary/progress", json={"hanzi": "爱", "level": "1"})
    client.delete("/api/vocabulary/progress")
    assert client.get("/api/vocabulary/progress").json() == []
