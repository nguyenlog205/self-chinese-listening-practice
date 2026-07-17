ACTIVITY_SCHEMA = """
CREATE TABLE IF NOT EXISTS practice_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    mode TEXT NOT NULL,
    item_type TEXT NOT NULL,
    item_id TEXT NOT NULL,
    level TEXT,
    is_correct INTEGER
);
CREATE INDEX IF NOT EXISTS idx_practice_events_created_at ON practice_events(created_at);
"""
