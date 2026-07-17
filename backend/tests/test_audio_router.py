"""content/audio_router.py -- GET /api/dialogues/{id}/audio/metadata, the
timing info (gaps/duration) a future gap-aware audio player would need."""

from __future__ import annotations

import json
from contextlib import contextmanager

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from listening_backend.content import audio_router as audio_router_module
from listening_backend.db import get_conn as real_get_conn


@pytest.fixture
def client(db_path, monkeypatch):
    @contextmanager
    def fake_get_conn():
        with real_get_conn(db_path) as conn:
            yield conn

    monkeypatch.setattr(audio_router_module, "get_conn", fake_get_conn)

    app = FastAPI()
    app.include_router(audio_router_module.router)
    return TestClient(app)


def _insert_audio_metadata(db_path, id_):
    data = {
        "audio_file": "audio.mp3",
        "duration_sec": 12.5,
        "exercises": {"choice": {"play_mode": "full", "timings": {"start": 0, "end": 12.5}}},
    }
    with real_get_conn(db_path) as conn:
        conn.execute(
            "INSERT INTO dialogues (id, level, data) VALUES (?, ?, ?)",
            (id_, "1", json.dumps({"lines": []})),
        )
        conn.execute(
            "INSERT INTO dialogues_audio_metadata (id, data) VALUES (?, ?)",
            (id_, json.dumps(data)),
        )


def test_get_audio_metadata(client, db_path):
    _insert_audio_metadata(db_path, "d1")

    resp = client.get("/api/dialogues/d1/audio/metadata")
    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] == "d1"
    assert body["duration_sec"] == 12.5
    assert body["exercises"]["choice"]["play_mode"] == "full"


def test_get_audio_metadata_404_when_missing(client):
    resp = client.get("/api/dialogues/does_not_exist/audio/metadata")
    assert resp.status_code == 404
