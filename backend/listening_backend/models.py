from __future__ import annotations

from pydantic import BaseModel


class AddLessonRequest(BaseModel):
    url: str


class LessonOut(BaseModel):
    id: str
    source_url: str
    title: str
    status: str
    progress_pct: int
    stage: str
    error_message: str | None = None
    duration_sec: float | None = None
    created_at: str
    last_practiced_at: str | None = None
    segment_count: int = 0


class SegmentOut(BaseModel):
    idx: int
    start_sec: float
    end_sec: float
    text_zh: str
    pinyin: str


class VocabWordOut(BaseModel):
    hanzi: str
    pinyin: str
    en: str
    vi: str


class DialogueLine(BaseModel):
    speaker: str
    hanzi: str
    pinyin: str


class DialogueOption(BaseModel):
    vi: str
    en: str
    correct: bool


class DialogueBlank(BaseModel):
    lineIndex: int
    answer: str


class DialogueQuestion(BaseModel):
    vi: str
    en: str
    zh: str


class DialogueOut(BaseModel):
    id: str
    level: str
    lines: list[DialogueLine]
    question: DialogueQuestion
    options: list[DialogueOption]
    blanks: list[DialogueBlank]
