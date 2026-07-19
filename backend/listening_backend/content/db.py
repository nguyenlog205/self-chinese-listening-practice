CONTENT_SCHEMA = """
CREATE TABLE IF NOT EXISTS vocab_words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    level TEXT NOT NULL,
    hanzi TEXT NOT NULL,
    pinyin TEXT NOT NULL,
    en TEXT NOT NULL DEFAULT '',
    vi TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_vocab_words_level ON vocab_words(level);

CREATE TABLE IF NOT EXISTS dialogues (
    id TEXT PRIMARY KEY,
    level TEXT NOT NULL,
    data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS vocab_progress (
    hanzi TEXT PRIMARY KEY,
    level TEXT NOT NULL,
    learned_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS dialogue_exercises_choice (
    id TEXT PRIMARY KEY,
    audio_id TEXT NOT NULL REFERENCES dialogues(id),
    data TEXT NOT NULL  -- JSON: {lines_from_dialogue, question, options}
);
CREATE INDEX IF NOT EXISTS idx_dialogue_exercises_choice_audio_id ON dialogue_exercises_choice(audio_id);

CREATE TABLE IF NOT EXISTS dialogue_exercises_cloze (
    id TEXT PRIMARY KEY,
    audio_id TEXT NOT NULL REFERENCES dialogues(id),
    data TEXT NOT NULL  -- JSON: {lines_from_dialogue, blanks}
);
CREATE INDEX IF NOT EXISTS idx_dialogue_exercises_cloze_audio_id ON dialogue_exercises_cloze(audio_id);

CREATE TABLE IF NOT EXISTS dialogue_exercises_dictation (
    id TEXT PRIMARY KEY,
    audio_id TEXT NOT NULL REFERENCES dialogues(id),
    data TEXT NOT NULL  -- JSON: {lines_from_dialogue, target_line}
);
CREATE INDEX IF NOT EXISTS idx_dialogue_exercises_dictation_audio_id ON dialogue_exercises_dictation(audio_id);

CREATE TABLE IF NOT EXISTS dialogues_audio_metadata (
    id TEXT PRIMARY KEY REFERENCES dialogues(id),
    data TEXT NOT NULL  -- JSON: {audio_file, duration_sec, exercises: {choice, cloze, dictation}}
);

CREATE TABLE IF NOT EXISTS grammar_points (
    id TEXT PRIMARY KEY,
    level TEXT NOT NULL,
    data TEXT NOT NULL  -- JSON: {title, structure, explanation, examples}
);
CREATE INDEX IF NOT EXISTS idx_grammar_points_level ON grammar_points(level);

CREATE TABLE IF NOT EXISTS reading_passages (
    id TEXT PRIMARY KEY,
    level TEXT NOT NULL,
    data TEXT NOT NULL  -- JSON: {title, hanzi, pinyin, translation}
);
CREATE INDEX IF NOT EXISTS idx_reading_passages_level ON reading_passages(level);
"""
