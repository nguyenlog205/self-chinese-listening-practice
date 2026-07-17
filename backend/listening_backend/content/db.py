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
"""
