"""Pure query/aggregation logic over practice_events — no FastAPI here, so
both activity/router.py (event log + daily counts) and
activity/streak_router.py (streak) can share it without copy-pasting."""

from __future__ import annotations

import sqlite3
from datetime import date, timedelta


def insert_event(
    conn: sqlite3.Connection,
    *,
    mode: str,
    item_type: str,
    item_id: str,
    level: str | None,
    is_correct: bool | None,
) -> None:
    conn.execute(
        """INSERT INTO practice_events (mode, item_type, item_id, level, is_correct)
           VALUES (?, ?, ?, ?, ?)""",
        (mode, item_type, item_id, level, None if is_correct is None else int(is_correct)),
    )


def get_daily_counts(conn: sqlite3.Connection, days: int) -> list[dict]:
    """[{date: 'YYYY-MM-DD', count: N}] liên tục `days` ngày, kể cả ngày count=0."""
    since = date.today() - timedelta(days=days - 1)
    rows = conn.execute(
        """SELECT date(created_at) AS d, COUNT(*) AS c FROM practice_events
           WHERE date(created_at) >= ? GROUP BY d""",
        (since.isoformat(),),
    ).fetchall()
    counts = {r["d"]: r["c"] for r in rows}
    return [
        {
            "date": (since + timedelta(days=i)).isoformat(),
            "count": counts.get((since + timedelta(days=i)).isoformat(), 0),
        }
        for i in range(days)
    ]


def clear_all(conn: sqlite3.Connection) -> None:
    conn.execute("DELETE FROM practice_events")


def get_active_days(conn: sqlite3.Connection) -> set[str]:
    rows = conn.execute("SELECT DISTINCT date(created_at) AS d FROM practice_events").fetchall()
    return {r["d"] for r in rows}


def compute_streak(conn: sqlite3.Connection) -> dict:
    active = get_active_days(conn)
    today = date.today()

    # current: chuỗi ngày liên tiếp có hoạt động, tính lùi từ hôm nay HOẶC
    # hôm qua (nếu hôm nay chưa học thì streak coi như "còn sống" tới hết
    # ngày hôm nay, không rớt về 0 ngay khi vừa sang ngày mới).
    start = today if today.isoformat() in active else today - timedelta(days=1)
    current = 0
    cursor = start
    while cursor.isoformat() in active:
        current += 1
        cursor -= timedelta(days=1)

    # longest: quét toàn bộ các ngày có hoạt động, tìm chuỗi liên tiếp dài nhất.
    longest = 0
    if active:
        sorted_days = sorted(date.fromisoformat(d) for d in active)
        run = 1
        longest = 1
        for prev, cur in zip(sorted_days, sorted_days[1:]):
            run = run + 1 if (cur - prev).days == 1 else 1
            longest = max(longest, run)

    weekly = [(today - timedelta(days=6 - i)).isoformat() in active for i in range(7)]

    return {"current": current, "longest": longest, "weekly": weekly}
