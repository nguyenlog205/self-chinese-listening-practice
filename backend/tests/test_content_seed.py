"""content/seed.py against the REAL bundled seed_data/ (not a fixture) —
catches drift between the seed files and the code that loads them.

Known bug (tracked, not fixed here — see docs/learning_material_update_feature.md):
after "refactor: separate exercises from dialogue definitions" (ec3fe19),
seed_data/dialogues.json entries only have {id, level, lines}, but
content/seed.py and content/sync.py still read d["question"]/d["options"]/
d["blanks"] unconditionally. A fresh install (empty DB) crashes with
KeyError while seeding dialogues, and clicking "Cập nhật dữ liệu" fails
every time with ContentSyncError, because REQUIRED_DIALOGUE_KEYS still
requires those fields too. This currently goes unnoticed because already-
running installs seeded before the refactor still have the old shape sitting
in their `dialogues` table (seed_if_empty only fills empty tables).
Fixing it for real means finishing the dialogue_exercises loading feature
described in that doc, not just patching this schema check.
"""

from __future__ import annotations

import json
import sqlite3

import pytest

from listening_backend.content.seed import SEED_DATA_DIR, seed_if_empty
from listening_backend.content.sync import REQUIRED_DIALOGUE_KEYS


def test_real_seed_vocabulary_files_have_required_fields():
    for path in (SEED_DATA_DIR / "vocabulary").glob("hsk_*.json"):
        words = json.loads(path.read_text(encoding="utf-8"))
        assert isinstance(words, list) and words, f"{path.name} is empty or not a list"
        for w in words:
            assert "hanzi" in w and "pinyin" in w, f"{path.name}: {w!r} missing hanzi/pinyin"


@pytest.mark.xfail(
    reason=(
        "seed_data/dialogues.json no longer carries question/options/blanks "
        "(split into seed_data/dialogue_exercises/), but content/seed.py "
        "still requires them — fresh installs currently crash seeding "
        "dialogues. Fix belongs to the dialogue_exercises loading feature, "
        "see docs/learning_material_update_feature.md."
    ),
    strict=True,
)
def test_seed_if_empty_loads_real_dialogues_json(db_path):
    seed_if_empty(db_path)


@pytest.mark.xfail(
    reason=(
        "Same schema drift as test_seed_if_empty_loads_real_dialogues_json: "
        "real dialogues.json entries no longer satisfy REQUIRED_DIALOGUE_KEYS."
    ),
    strict=True,
)
def test_real_dialogues_json_matches_sync_requirements():
    dialogues = json.loads((SEED_DATA_DIR / "dialogues.json").read_text(encoding="utf-8"))
    for d in dialogues:
        assert REQUIRED_DIALOGUE_KEYS.issubset(d), f"{d.get('id')} missing {REQUIRED_DIALOGUE_KEYS - d.keys()}"


def test_seed_exercises_and_audio_metadata_from_real_seed_data(db_path):
    # Pre-populate `dialogues` directly, bypassing the known-broken
    # dialogues-seeding path above (out of scope here, see the two xfail
    # tests) — exercises/audio-metadata seeding only needs the referenced
    # dialogue ids to already exist, not how they got there.
    dialogues = json.loads((SEED_DATA_DIR / "dialogues.json").read_text(encoding="utf-8"))
    with sqlite3.connect(db_path) as setup_conn:
        setup_conn.executemany(
            "INSERT INTO dialogues (id, level, data) VALUES (?, ?, ?)",
            [(d["id"], str(d["level"]), json.dumps({"lines": d["lines"]})) for d in dialogues],
        )
        setup_conn.commit()

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
