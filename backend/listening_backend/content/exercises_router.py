from __future__ import annotations

import json

from fastapi import APIRouter, HTTPException, Query

from ..db import get_conn
from .models import ChoiceExerciseOut, ClozeExerciseOut, DictationExerciseOut

router = APIRouter(prefix="/api/dialogue-exercises", tags=["dialogue-exercises"])

_OUT_MODELS = {
    "choice": ChoiceExerciseOut,
    "cloze": ClozeExerciseOut,
    "dictation": DictationExerciseOut,
}


def _list_exercises(kind: str, level: str | None):
    table = f"dialogue_exercises_{kind}"
    with get_conn() as conn:
        if level:
            rows = conn.execute(
                f"SELECT e.id, e.audio_id, e.data FROM {table} e "  # noqa: S608 (kind from a fixed tuple, not user input)
                "JOIN dialogues d ON d.id = e.audio_id WHERE d.level = ?",
                (level,),
            ).fetchall()
        else:
            rows = conn.execute(f"SELECT id, audio_id, data FROM {table}").fetchall()  # noqa: S608
    model = _OUT_MODELS[kind]
    return [
        model(id=row["id"], audio_id=row["audio_id"], **json.loads(row["data"])) for row in rows
    ]


def _get_exercise(kind: str, exercise_id: str):
    table = f"dialogue_exercises_{kind}"
    with get_conn() as conn:
        row = conn.execute(
            f"SELECT id, audio_id, data FROM {table} WHERE id = ?", (exercise_id,)  # noqa: S608
        ).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail=f"No {kind} exercise {exercise_id!r}")
    model = _OUT_MODELS[kind]
    return model(id=row["id"], audio_id=row["audio_id"], **json.loads(row["data"]))


@router.get("/choice", response_model=list[ChoiceExerciseOut])
def list_choice_exercises(level: str | None = Query(default=None)):
    return _list_exercises("choice", level)


@router.get("/choice/{exercise_id}", response_model=ChoiceExerciseOut)
def get_choice_exercise(exercise_id: str):
    return _get_exercise("choice", exercise_id)


@router.get("/cloze", response_model=list[ClozeExerciseOut])
def list_cloze_exercises(level: str | None = Query(default=None)):
    return _list_exercises("cloze", level)


@router.get("/cloze/{exercise_id}", response_model=ClozeExerciseOut)
def get_cloze_exercise(exercise_id: str):
    return _get_exercise("cloze", exercise_id)


@router.get("/dictation", response_model=list[DictationExerciseOut])
def list_dictation_exercises(level: str | None = Query(default=None)):
    return _list_exercises("dictation", level)


@router.get("/dictation/{exercise_id}", response_model=DictationExerciseOut)
def get_dictation_exercise(exercise_id: str):
    return _get_exercise("dictation", exercise_id)
