"""content/seed.py against the REAL bundled seed_data/ (not a fixture) --
catches drift between the seed files and the code that loads them.

After "refactor: separate exercises from dialogue definitions" (ec3fe19),
seed_data/dialogues.json entries only have {id, level, lines};
question/options/blanks live in dialogue_exercises/{choice,cloze}/*.json
instead, served independently via content/exercises_router.py (see
test_exercises_router.py) -- content/seed.py and content/sync.py were
updated to match, dropping question/options/blanks from the dialogues
table entirely."""

from __future__ import annotations

import json
import sqlite3

from listening_backend.content.seed import SEED_DATA_DIR, seed_if_empty
from listening_backend.content.sync import REQUIRED_DIALOGUE_KEYS


def test_real_seed_vocabulary_files_have_required_fields():
    for path in (SEED_DATA_DIR / "vocabulary").glob("hsk_*.json"):
        words = json.loads(path.read_text(encoding="utf-8"))
        assert isinstance(words, list) and words, f"{path.name} is empty or not a list"
        for w in words:
            assert "hanzi" in w and "pinyin" in w, f"{path.name}: {w!r} missing hanzi/pinyin"


def test_seed_if_empty_loads_real_dialogues_json(db_path):
    seed_if_empty(db_path)

    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        count = conn.execute("SELECT COUNT(*) c FROM dialogues").fetchone()["c"]
        sample = conn.execute("SELECT data FROM dialogues WHERE id = 'd1'").fetchone()

    assert count > 0
    assert "lines" in json.loads(sample["data"])


def test_real_dialogues_json_matches_sync_requirements():
    dialogues = json.loads((SEED_DATA_DIR / "dialogues.json").read_text(encoding="utf-8"))
    for d in dialogues:
        assert REQUIRED_DIALOGUE_KEYS.issubset(d), f"{d.get('id')} missing {REQUIRED_DIALOGUE_KEYS - d.keys()}"


def test_seed_exercises_and_audio_metadata_from_real_seed_data(db_path):
    seed_if_empty(db_path)

    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        choice_count = conn.execute("SELECT COUNT(*) c FROM dialogue_exercises_choice").fetchone()["c"]
        cloze_count = conn.execute("SELECT COUNT(*) c FROM dialogue_exercises_cloze").fetchone()["c"]
        dictation_count = conn.execute("SELECT COUNT(*) c FROM dialogue_exercises_dictation").fetchone()["c"]
        audio_meta_count = conn.execute("SELECT COUNT(*) c FROM dialogues_audio_metadata").fetchone()["c"]
        sample = conn.execute(
            "SELECT audio_id, data FROM dialogue_exercises_dictation WHERE id = 'dictation_001'"
        ).fetchone()

    expected_choice = len(list((SEED_DATA_DIR / "dialogue_exercises" / "choice").glob("*.json")))
    expected_cloze = len(list((SEED_DATA_DIR / "dialogue_exercises" / "cloze").glob("*.json")))
    expected_dictation = len(list((SEED_DATA_DIR / "dialogue_exercises" / "dictation").glob("*.json")))
    expected_audio_meta = len(list((SEED_DATA_DIR / "dialogues_audio").glob("*/metadata.json")))

    assert choice_count == expected_choice > 0
    assert cloze_count == expected_cloze > 0
    assert dictation_count == expected_dictation > 0
    assert audio_meta_count == expected_audio_meta > 0

    assert sample["audio_id"] == "d1"
    assert json.loads(sample["data"])["target_line"] == 2
