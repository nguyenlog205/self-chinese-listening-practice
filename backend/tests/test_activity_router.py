"""activity/router.py + streak_router.py wired into a throwaway FastAPI app
(not the real `main.app`, to avoid its module-level `init_db()` touching the
real dev database) — `get_conn` is monkeypatched per-module since each
router imported it by name into its own namespace."""

from __future__ import annotations

from contextlib import contextmanager

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from listening_backend.activity import router as activity_router_module
from listening_backend.activity import streak_router as streak_router_module
from listening_backend.db import get_conn as real_get_conn


@pytest.fixture
def client(db_path, monkeypatch):
    @contextmanager
    def fake_get_conn():
        with real_get_conn(db_path) as conn:
            yield conn

    monkeypatch.setattr(activity_router_module, "get_conn", fake_get_conn)
    monkeypatch.setattr(streak_router_module, "get_conn", fake_get_conn)

    app = FastAPI()
    app.include_router(activity_router_module.router)
    app.include_router(streak_router_module.router)
    return TestClient(app)


def test_log_event_then_streak_reflects_it(client):
    resp = client.post(
        "/api/activity/events",
        json={"mode": "hsk_dictation", "item_type": "vocab", "item_id": "爱", "level": "1", "is_correct": True},
    )
    assert resp.status_code == 201

    streak = client.get("/api/streak").json()
    assert streak["current"] == 1
    assert streak["weekly"][-1] is True


def test_daily_activity_defaults_to_182_days_and_fills_zeros(client):
    resp = client.get("/api/activity/daily")
    assert resp.status_code == 200
    days = resp.json()
    assert len(days) == 182
    assert all(d["count"] == 0 for d in days)


def test_daily_activity_respects_days_query_param(client):
    client.post(
        "/api/activity/events",
        json={"mode": "listening_choice", "item_type": "vocab", "item_id": "八", "level": "1"},
    )
    days = client.get("/api/activity/daily", params={"days": 1}).json()
    assert len(days) == 1
    assert days[0]["count"] == 1


def test_reset_events_clears_streak(client):
    client.post(
        "/api/activity/events",
        json={"mode": "hsk_dictation", "item_type": "vocab", "item_id": "爱", "level": "1"},
    )
    assert client.get("/api/streak").json()["current"] == 1

    resp = client.delete("/api/activity/events")
    assert resp.status_code == 200
    assert client.get("/api/streak").json()["current"] == 0


def test_log_event_requires_mode_and_item_id(client):
    resp = client.post("/api/activity/events", json={"item_type": "vocab"})
    assert resp.status_code == 422
