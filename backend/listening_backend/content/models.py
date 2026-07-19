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


class ChoiceExerciseOut(BaseModel):
    id: str
    audio_id: str
    lines_from_dialogue: list[int]
    question: DialogueQuestion
    options: list[DialogueOption]


class ClozeExerciseOut(BaseModel):
    id: str
    audio_id: str
    lines_from_dialogue: list[int]
    blanks: list[DialogueBlank]


class DictationExerciseOut(BaseModel):
    id: str
    audio_id: str
    lines_from_dialogue: list[int]
    target_line: int


class AudioMetadataOut(BaseModel):
    id: str
    audio_file: str
    duration_sec: float
    exercises: dict


class GrammarExample(BaseModel):
    hanzi: str
    pinyin: str
    translation: dict[str, str]  # {vi, en}


class GrammarPointOut(BaseModel):
    id: str
    level: str
    title: dict[str, str]  # {vi, en, zh}
    structure: str
    explanation: dict[str, str]  # {vi, en, zh}
    examples: list[GrammarExample]
