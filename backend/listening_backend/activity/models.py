from __future__ import annotations

from pydantic import BaseModel


class PracticeEventIn(BaseModel):
    mode: str
    item_type: str
    item_id: str
    level: str | None = None
    is_correct: bool | None = None


class DailyActivityOut(BaseModel):
    date: str
    count: int


class StreakOut(BaseModel):
    current: int
    longest: int
    weekly: list[bool]
