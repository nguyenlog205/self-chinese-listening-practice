from __future__ import annotations

from pydantic import BaseModel


class VocabWordOut(BaseModel):
    hanzi: str
    pinyin: str
    en: str
    vi: str


class VocabProgressIn(BaseModel):
    hanzi: str
    level: str


class VocabProgressOut(BaseModel):
    hanzi: str
    level: str
    learned_at: str


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
