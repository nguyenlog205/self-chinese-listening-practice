"""activity/repo.py — pure aggregation logic over practice_events, no FastAPI
involved. Dates are injected by writing `created_at` directly instead of
relying on `datetime('now')`, so tests don't depend on wall-clock time."""

from __future__ import annotations

from datetime import date, timedelta

from listening_backend.activity.repo import (
    clear_all,
    compute_streak,
    get_active_days,
    get_daily_counts,
    insert_event,
)


def _log_on(conn, day: date, **overrides):
    insert_event(
        conn,
        mode=overrides.get("mode", "hsk_dictation"),
        item_type=overrides.get("item_type", "vocab"),
        item_id=overrides.get("item_id", "爱"),
        level=overrides.get("level", "1"),
        is_correct=overrides.get("is_correct", True),
    )
    conn.execute(
        "UPDATE practice_events SET created_at = ? WHERE id = last_insert_rowid()",
        (day.isoformat(),),
    )


def test_insert_event_stores_row(conn):
    insert_event(conn, mode="hsk_dictation", item_type="vocab", item_id="爱", level="1", is_correct=True)
    row = conn.execute("SELECT * FROM practice_events").fetchone()
    assert row["mode"] == "hsk_dictation"
    assert row["item_id"] == "爱"
    assert row["is_correct"] == 1


def test_insert_event_allows_null_level_and_correctness(conn):
    insert_event(conn, mode="youtube_dictation", item_type="segment", item_id="l1:0", level=None, is_correct=None)
    row = conn.execute("SELECT * FROM practice_events").fetchone()
    assert row["level"] is None
    assert row["is_correct"] is None


def test_get_active_days_dedupes_same_day(conn):
    today = date.today()
    _log_on(conn, today)
    _log_on(conn, today)
    assert get_active_days(conn) == {today.isoformat()}


def test_clear_all_removes_every_event(conn):
    _log_on(conn, date.today())
    clear_all(conn)
    assert conn.execute("SELECT COUNT(*) FROM practice_events").fetchone()[0] == 0


def test_get_daily_counts_fills_gaps_with_zero(conn):
    today = date.today()
    _log_on(conn, today)
    _log_on(conn, today)
    _log_on(conn, today - timedelta(days=2))

    counts = get_daily_counts(conn, days=3)

    assert [c["date"] for c in counts] == [
        (today - timedelta(days=2)).isoformat(),
        (today - timedelta(days=1)).isoformat(),
        today.isoformat(),
    ]
    assert [c["count"] for c in counts] == [1, 0, 2]


def test_compute_streak_empty_history():
    import sqlite3

    from listening_backend.activity.db import ACTIVITY_SCHEMA

    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    conn.executescript(ACTIVITY_SCHEMA)
    result = compute_streak(conn)
    assert result == {"current": 0, "longest": 0, "weekly": [False] * 7}


def test_compute_streak_counts_consecutive_days_ending_today(conn):
    today = date.today()
    for offset in (0, 1, 2):
        _log_on(conn, today - timedelta(days=offset))
    # a gap further back must not extend the *current* streak
    _log_on(conn, today - timedelta(days=10))

    result = compute_streak(conn)

    assert result["current"] == 3
    assert result["weekly"] == [
        (today - timedelta(days=6 - i)).isoformat() in {(today - timedelta(days=o)).isoformat() for o in (0, 1, 2, 10)}
        for i in range(7)
    ]


def test_compute_streak_survives_a_missed_yesterday_but_not_two_days(conn):
    today = date.today()
    _log_on(conn, today - timedelta(days=1))  # practiced yesterday, not yet today
    result = compute_streak(conn)
    assert result["current"] == 1

    # nothing for two days running -> streak is dead, even counting from "yesterday"
    import sqlite3

    conn2 = sqlite3.connect(":memory:")
    conn2.row_factory = sqlite3.Row
    from listening_backend.activity.db import ACTIVITY_SCHEMA

    conn2.executescript(ACTIVITY_SCHEMA)
    _log_on(conn2, today - timedelta(days=2))
    assert compute_streak(conn2)["current"] == 0


def test_compute_streak_longest_is_the_best_historical_run(conn):
    today = date.today()
    # a 4-day run long ago...
    for offset in (20, 21, 22, 23):
        _log_on(conn, today - timedelta(days=offset))
    # ...then a shorter, more recent 2-day run
    _log_on(conn, today)
    _log_on(conn, today - timedelta(days=1))

    result = compute_streak(conn)
    assert result["current"] == 2
    assert result["longest"] == 4
