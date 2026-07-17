# Kế hoạch: Practice activity tracking (streak + biểu đồ hoạt động)

**Trạng thái:** chưa làm — đây là spec để cắm vào code, không phải chỉ ý tưởng.
**Vì sao cần:** `StreakCard`, `DailyActivityChart` ở trang chủ đang dùng data
mock (`shared/useStreak.js`, `shared/useDailyActivity.js`). Không có nơi nào
trong app hiện ghi nhận "người dùng vừa học xong 1 câu/từ" — nên mock không
tự thay được bằng gì cả nếu không có bảng + endpoint mới ở backend, và không
có chỗ gọi báo về ở frontend.

## Nguyên tắc thiết kế

1. **Một bảng log duy nhất làm nguồn sự thật** (`practice_events`, append-only).
   Không tạo riêng bảng "streak" hay "daily_count" — cả hai đều là *aggregate*
   tính từ log này. Tính lại được, không cần đồng bộ 2 nơi.
2. **Tách theo resource, không gom vào 1 router/1 file** — và xa hơn nữa,
   tách theo **domain**, không chỉ tách router (xem mục 0 — refactor toàn bộ
   backend từ phẳng sang `lessons/`, `content/`, `activity/` trước khi viết
   code mới):
   - `activity/repo.py` (logic thuần, không phải router) — nơi query/tính
     toán thực sự, để cả 2 router bên dưới dùng chung, không copy-paste.
   - `activity/router.py` — router: ghi event + lấy biểu đồ theo ngày.
   - `activity/streak_router.py` — router riêng: tính streak. Thuật toán
     streak khác hẳn "đếm theo ngày" nên tách file cho rõ, dễ test riêng.
3. **Không đụng schema `vocab_words`/`dialogues`/`lessons` đã có.** Đây là
   tính năng hoàn toàn mới, cộng thêm bảng mới, không sửa bảng cũ.
4. Giữ nguyên **contract mà frontend đã giả định sẵn** (xem phần "Response
   shape" — copy y hệt từ `useStreak.js`/`useDailyActivity.js` hiện tại) để
   khi nối thật, các component (`StreakCard.jsx`, `DailyActivityChart.jsx`)
   **không cần sửa 1 dòng nào**, chỉ sửa 2 hook.

## 0. Refactor trước: gom backend theo domain

Backend hiện đang phẳng: `models.py` và `db.py`'s `SCHEMA` gom hết mọi domain
vào 1 file, càng thêm feature càng phình, không tách được. Làm refactor này
**trước** khi thêm domain `activity` — nếu không, domain mới lại ném thêm
file phẳng vào gốc, dọn sau sẽ đụng nhiều hơn bây giờ.

Nguyên tắc: gom theo **domain (vertical slice)**, không theo layer kỹ thuật
(không tách `models/`, `repos/`, `routers/` riêng — vậy phải nhảy 3 thư mục
để sửa 1 tính năng). Mỗi domain tự chứa model + logic + router của nó.

### Cây thư mục đích

```
listening_backend/
  __init__.py, main.py, config.py, db.py   # chỉ còn plumbing dùng chung
  lessons/
    __init__.py
    models.py          # AddLessonRequest, LessonOut, SegmentOut
    db.py               # LESSONS_SCHEMA (bảng lessons + segments)
    jobs.py             # (nội dung file jobs.py cũ — background pipeline runner)
    router.py           # (nội dung api/lessons.py cũ)
    jobs_router.py       # (nội dung api/jobs.py cũ — WS /ws/jobs/{id})
    media_router.py       # (nội dung api/media.py cũ)
    pipeline/
      __init__.py, youtube.py, transcribe.py, pinyin_convert.py, sentence_split.py
  content/
    __init__.py
    models.py          # VocabWordOut, DialogueLine, DialogueOption, DialogueBlank, DialogueQuestion, DialogueOut
    db.py               # CONTENT_SCHEMA (bảng vocab_words + dialogues)
    seed.py             # (hàm _seed_content_if_empty cũ, tách khỏi db.py)
    sync.py             # (nội dung content_sync.py cũ)
    vocabulary_router.py  # (nội dung api/vocabulary.py cũ)
    dialogues_router.py   # (nội dung api/dialogues.py cũ)
    sync_router.py         # (nội dung api/content.py cũ)
  activity/             # domain MỚI — xem mục 1-6 bên dưới, viết thẳng vào đây
    __init__.py, models.py, db.py, repo.py, router.py, streak_router.py
```

`api/` và `pipeline/` (ở gốc) biến mất — nội dung dời hết vào trong domain
tương ứng.

### Bước 1 — tạo khung thư mục

```bash
cd backend/listening_backend
mkdir -p lessons/pipeline content activity
touch lessons/__init__.py content/__init__.py activity/__init__.py
```

### Bước 2 — di chuyển file (dùng `git mv` để giữ history)

```bash
# lessons domain
git mv pipeline/__init__.py        lessons/pipeline/__init__.py
git mv pipeline/youtube.py         lessons/pipeline/youtube.py
git mv pipeline/transcribe.py      lessons/pipeline/transcribe.py
git mv pipeline/pinyin_convert.py  lessons/pipeline/pinyin_convert.py
git mv pipeline/sentence_split.py  lessons/pipeline/sentence_split.py
rmdir pipeline

git mv jobs.py          lessons/jobs.py
git mv api/lessons.py   lessons/router.py
git mv api/jobs.py      lessons/jobs_router.py
git mv api/media.py     lessons/media_router.py

# content domain
git mv content_sync.py     content/sync.py
git mv api/vocabulary.py   content/vocabulary_router.py
git mv api/dialogues.py    content/dialogues_router.py
git mv api/content.py      content/sync_router.py

rm api/__init__.py
rmdir api
```

### Bước 3 — tách `models.py` (không mv được, phải chép tay)

Xoá `models.py` gốc, tạo 2 file:

- `lessons/models.py`: chuyển nguyên `AddLessonRequest`, `LessonOut`,
  `SegmentOut` sang.
- `content/models.py`: chuyển nguyên `VocabWordOut`, `DialogueLine`,
  `DialogueOption`, `DialogueBlank`, `DialogueQuestion`, `DialogueOut` sang.

### Bước 4 — tách `db.py`'s `SCHEMA`

`lessons/db.py` (mới):

```python
LESSONS_SCHEMA = """
CREATE TABLE IF NOT EXISTS lessons (
    id TEXT PRIMARY KEY,
    source_url TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'queued',
    progress_pct INTEGER NOT NULL DEFAULT 0,
    stage TEXT NOT NULL DEFAULT 'queued',
    error_message TEXT,
    duration_sec REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_practiced_at TEXT
);

CREATE TABLE IF NOT EXISTS segments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    idx INTEGER NOT NULL,
    start_sec REAL NOT NULL,
    end_sec REAL NOT NULL,
    text_zh TEXT NOT NULL,
    pinyin TEXT NOT NULL,
    UNIQUE(lesson_id, idx)
);
"""
```

`content/db.py` (mới):

```python
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
"""
```

`content/seed.py` (mới — dời nguyên hàm `_seed_content_if_empty` cũ từ
`db.py` sang, đổi tên thành `seed_if_empty`, giữ nguyên logic bên trong y
hệt, chỉ sửa import):

```python
from __future__ import annotations
import json
import sqlite3
from pathlib import Path

from ..config import BACKEND_DIR

SEED_DATA_DIR = BACKEND_DIR / "listening_backend" / "seed_data"

def seed_if_empty(db_path: Path) -> None:
    ...  # y hệt thân hàm _seed_content_if_empty cũ, không đổi logic
```

`db.py` (rút gọn, chỉ còn plumbing dùng chung):

```python
from __future__ import annotations
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

from .config import DB_PATH
from .lessons.db import LESSONS_SCHEMA
from .content.db import CONTENT_SCHEMA
from .content.seed import seed_if_empty
from .activity.db import ACTIVITY_SCHEMA  # thêm sau khi làm xong mục 1 bên dưới

def init_db(db_path: Path = DB_PATH) -> None:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(db_path) as conn:
        conn.executescript(LESSONS_SCHEMA)
        conn.executescript(CONTENT_SCHEMA)
        conn.executescript(ACTIVITY_SCHEMA)
    seed_if_empty(db_path)

@contextmanager
def get_conn(db_path: Path = DB_PATH) -> Iterator[sqlite3.Connection]:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()
```

### Bước 5 — sửa import trong từng file đã move

Đa số **không đổi** vì độ sâu package giữ nguyên (file cũ ở `api/x.py` hay
`pipeline/x.py` đều đã sâu 1 cấp dưới `listening_backend`, giờ ở
`lessons/x.py`/`content/x.py` cũng vậy). Chỉ đổi những chỗ trỏ sang file
*cũng vừa bị move* hoặc đổi tên:

| File | Import cũ | Import mới |
|---|---|---|
| `lessons/router.py` | `from .. import jobs` | `from . import jobs` |
| `lessons/router.py` | `from ..models import ...` | `from .models import AddLessonRequest, LessonOut, SegmentOut` |
| `lessons/router.py` | `from ..pipeline import youtube` | `from .pipeline import youtube` |
| `lessons/router.py` | `from ..pipeline.youtube import MetadataExtractionError` | `from .pipeline.youtube import MetadataExtractionError` |
| `lessons/router.py` | `from ..config import get_settings` | *(không đổi)* |
| `lessons/router.py` | `from ..db import get_conn` | *(không đổi)* |
| `lessons/jobs_router.py` | `from .. import jobs as jobs_module` | `from . import jobs as jobs_module` |
| `lessons/jobs_router.py` | `from ..db import get_conn` | *(không đổi)* |
| `lessons/media_router.py` | `from ..config import ...` | *(không đổi)* |
| `lessons/jobs.py` | `from .config import ...` | `from ..config import Settings, ensure_storage_dirs` |
| `lessons/jobs.py` | `from .db import get_conn` | `from ..db import get_conn` |
| `lessons/jobs.py` | `from .pipeline import youtube` | *(không đổi — pipeline vẫn là em cùng cấp)* |
| `lessons/pipeline/youtube.py` | `from ..config import ...` | `from ...config import AUDIO_CACHE_DIR, VIDEO_CACHE_DIR` |
| `content/vocabulary_router.py` | `from ..models import VocabWordOut` | `from .models import VocabWordOut` |
| `content/vocabulary_router.py` | `from ..db import get_conn` | *(không đổi)* |
| `content/dialogues_router.py` | `from ..models import DialogueOut` | `from .models import DialogueOut` |
| `content/sync_router.py` | `from ..content_sync import ...` | `from .sync import ContentSyncError, refresh_content` |
| `content/sync_router.py` | `from ..db import get_conn` | *(không đổi)* |

`content/sync.py` (nội dung `content_sync.py` cũ) không có import nội bộ
(`json`, `urllib` — thư viện chuẩn), move nguyên không cần sửa gì.

### Bước 6 — `main.py`

```python
from __future__ import annotations
import asyncio
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .activity.router import router as activity_api
from .activity.streak_router import router as streak_api
from .content.dialogues_router import router as dialogues_api
from .content.sync_router import router as content_api
from .content.vocabulary_router import router as vocabulary_api
from .lessons.jobs import set_main_loop
from .lessons.jobs_router import router as jobs_api
from .lessons.media_router import router as media_api
from .lessons.router import router as lessons_api
from .config import ensure_storage_dirs, get_settings
from .db import init_db

# ... create_app() giữ nguyên logic, chỉ dùng lại các *_api ở trên
```

### Bước 7 — kiểm tra không vỡ gì

```bash
cd backend
.venv/bin/python -c "from listening_backend.main import app; print('OK', len(app.routes))"
# kỳ vọng: OK 11 (bằng đúng số route trước khi refactor, chưa cộng activity)
LISTENING_PORT=8000 .venv/bin/python -m listening_backend.main &
sleep 2 && curl -s localhost:8000/health && curl -s localhost:8000/api/vocabulary/levels
```

Nếu 2 lệnh `curl` trên chạy đúng như trước refactor → xong bước 0, chuyển
sang làm domain `activity` (mục 1 bên dưới) — viết thẳng vào `activity/`,
không tạo file phẳng nữa.

## 1. Database — file mới `backend/listening_backend/activity/db.py`

```python
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
```

Rồi thêm `from .activity.db import ACTIVITY_SCHEMA` + `conn.executescript(ACTIVITY_SCHEMA)`
vào `db.py` gốc — đã có sẵn dòng import này (comment "thêm sau khi làm xong
mục 1") trong đoạn `db.py` mẫu ở mục 0, giờ bỏ comment đó đi là dùng được.

Giải thích cột:

- `mode`: định danh chế độ luyện tập, giá trị cố định (xem bảng ở mục 4) —
  ví dụ `"listening_dictation"`, `"hsk_mocktest"`.
- `item_type`: `"vocab" | "dialogue" | "segment"`.
- `item_id`: `hanzi` (vocab), `dialogue.id` (dialogue), hoặc
  `"{lessonId}:{segmentIdx}"` (segment YouTube).
- `level`: cấp HSK nếu có (`"1"`..`"6"`, `"7-9"`), null nếu không áp dụng
  (vd hội thoại không phân cấp).
- `is_correct`: `1`/`0` nếu có chấm đúng/sai, `null` nếu hành động không có
  khái niệm đúng/sai (hiếm, nhưng để mở).

Không cần `user_id` — app single-user local (Electron spawn backend
127.0.0.1, không auth), giống toàn bộ schema hiện tại.

## 2. `backend/listening_backend/activity/repo.py` (file mới)

Logic thuần (không phải FastAPI router), 2 router bên dưới import từ đây.

```python
from __future__ import annotations
import sqlite3
from datetime import date, timedelta

def insert_event(
    conn: sqlite3.Connection, *, mode: str, item_type: str, item_id: str,
    level: str | None, is_correct: bool | None,
) -> None:
    conn.execute(
        """INSERT INTO practice_events (mode, item_type, item_id, level, is_correct)
           VALUES (?, ?, ?, ?, ?)""",
        (mode, item_type, item_id, level, None if is_correct is None else int(is_correct)),
    )

def get_daily_counts(conn: sqlite3.Connection, days: int) -> list[dict]:
    """[{date: 'YYYY-MM-DD', count: N}] liên tục `days` ngày, kể cả ngày count=0."""
    since = date.today() - timedelta(days=days - 1)
    rows = conn.execute(
        """SELECT date(created_at) AS d, COUNT(*) AS c FROM practice_events
           WHERE date(created_at) >= ? GROUP BY d""",
        (since.isoformat(),),
    ).fetchall()
    counts = {r["d"]: r["c"] for r in rows}
    return [
        {"date": (since + timedelta(days=i)).isoformat(),
         "count": counts.get((since + timedelta(days=i)).isoformat(), 0)}
        for i in range(days)
    ]

def get_active_days(conn: sqlite3.Connection) -> set[str]:
    rows = conn.execute("SELECT DISTINCT date(created_at) AS d FROM practice_events").fetchall()
    return {r["d"] for r in rows}

def compute_streak(conn: sqlite3.Connection) -> dict:
    active = get_active_days(conn)
    today = date.today()

    # current: chuỗi ngày liên tiếp có hoạt động, tính lùi từ hôm nay HOẶC
    # hôm qua (nếu hôm nay chưa học thì streak coi như "còn sống" tới hết
    # ngày hôm nay, không rớt về 0 ngay khi vừa sang ngày mới).
    start = today if today.isoformat() in active else today - timedelta(days=1)
    current = 0
    cursor = start
    while cursor.isoformat() in active:
        current += 1
        cursor -= timedelta(days=1)

    # longest: quét toàn bộ các ngày có hoạt động, tìm chuỗi liên tiếp dài nhất.
    longest = 0
    if active:
        sorted_days = sorted(date.fromisoformat(d) for d in active)
        run = 1
        longest = 1
        for prev, cur in zip(sorted_days, sorted_days[1:]):
            run = run + 1 if (cur - prev).days == 1 else 1
            longest = max(longest, run)

    weekly = [(today - timedelta(days=6 - i)).isoformat() in active for i in range(7)]

    return {"current": current, "longest": longest, "weekly": weekly}
```

`weekly` thứ tự **cũ → mới, kết thúc ở hôm nay** (index 6 = hôm nay) — đúng
khớp cách `StreakCard.jsx` build nhãn thứ (`last7DayLabels`, xem
`shared/useStreak.js` hiện tại) và cách `DailyActivityChart.jsx` build cột
tuần (cũ → mới). **Đừng đổi thứ tự** nếu không muốn sửa cả 2 component.

## 3. `backend/listening_backend/activity/models.py` (file mới)

```python
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
```

## 4. `backend/listening_backend/activity/router.py` (file mới)

```python
from fastapi import APIRouter, Query
from ..db import get_conn
from .repo import insert_event, get_daily_counts
from .models import PracticeEventIn, DailyActivityOut

router = APIRouter(prefix="/api/activity", tags=["activity"])

@router.post("/events", status_code=201)
def log_event(payload: PracticeEventIn) -> dict:
    with get_conn() as conn:
        insert_event(conn, **payload.model_dump())
    return {"ok": True}

@router.get("/daily", response_model=list[DailyActivityOut])
def daily(days: int = Query(default=182, ge=1, le=730)) -> list[dict]:
    with get_conn() as conn:
        return get_daily_counts(conn, days)
```

## 5. `backend/listening_backend/activity/streak_router.py` (file mới)

```python
from fastapi import APIRouter
from ..db import get_conn
from .repo import compute_streak
from .models import StreakOut

router = APIRouter(prefix="/api/streak", tags=["streak"])

@router.get("", response_model=StreakOut)
def streak() -> dict:
    with get_conn() as conn:
        return compute_streak(conn)
```

## 6. `main.py` — đăng ký 2 router mới

Đã có sẵn 2 dòng import + include trong đoạn `main.py` mẫu ở mục 0
(`from .activity.router import router as activity_api`,
`from .activity.streak_router import router as streak_api`) — chỉ cần thêm
`app.include_router(activity_api)` và `app.include_router(streak_api)`
trong `create_app()`, ngay cạnh các `include_router` khác.

## 7. `mode` — danh sách giá trị cố định (dùng đúng string này ở cả FE/BE)

| Component (frontend)                              | `mode`                 | `item_type` | `item_id`                    | `level` |
|-----------------------------------------------------|-------------------------|--------------|-------------------------------|---------|
| `hsk_materials/components/Listening.jsx`            | `hsk_dictation`          | `vocab`      | `word.hanzi`                   | có |
| `hsk_materials/components/MockTest.jsx`             | `hsk_mocktest`           | `vocab`      | `question.answer`              | có |
| `listening/components/DictationPractice.jsx`        | `listening_dictation`    | `vocab`      | `current.hanzi`                | có |
| `listening/components/ChoiceListening.jsx`          | `listening_choice`       | `vocab`      | `round.answer.hanzi`           | có |
| `listening/components/OrderListening.jsx`           | `listening_order`        | `vocab`      | `word.hanzi`                    | có |
| `listening/components/DialogueChoice.jsx`           | `dialogue_choice`        | `dialogue`   | `dialogue.id`                   | không |
| `listening/components/DialogueCloze.jsx`            | `dialogue_cloze`         | `dialogue`   | `dialogue.id`                   | không |
| `listening/components/YoutubeListening.jsx`         | `youtube_dictation`      | `segment`    | `` `${selectedId}:${currentIndex}` `` | không |

`Vocabulary.jsx` (đánh dấu đã thuộc) và `Reading.jsx` (đọc thụ động) **không**
log vào đây — không phải hành động "trả lời đúng/sai". Nếu sau này muốn tính
cả "duyệt từ vựng" vào streak thì thêm dòng vào bảng trên, không cần đổi
schema.

## 8. Frontend — file mới `shared/activityApi.js`

```js
import { apiFetch } from "./api";

export const ActivityApi = {
  logEvent: (event) =>
    apiFetch("/api/activity/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    }).catch(() => {}), // best-effort — lỗi log không được làm hỏng trải nghiệm học
  getDaily: (days = 182) => apiFetch(`/api/activity/daily?days=${days}`),
  getStreak: () => apiFetch("/api/streak"),
};
```

## 9. Sửa 2 hook mock — **chỉ 2 file này**, không đụng component nào

- `shared/useDailyActivity.js`: thay thân hàm bằng gọi
  `ActivityApi.getDaily(182)`, giữ nguyên return shape
  `{ days, loading, error }` với `days = [{date, count}]`.
- `shared/useStreak.js`: thay thân hàm bằng gọi `ActivityApi.getStreak()`,
  giữ nguyên return shape `{ streak: {current, longest, weekly}, loading, error }`.

Vì `StreakCard.jsx`/`DailyActivityChart.jsx` chỉ phụ thuộc vào shape này
(đã cố tình thiết kế vậy từ đầu), sửa xong 2 hook là trang chủ tự động lên
data thật, **không cần sửa JSX**.

## 10. Instrument 8 component luyện tập — mỗi chỗ chỉ thêm 1-3 dòng

Ví dụ `listening/components/ChoiceListening.jsx`, trong `choose()`:

```js
const choose = (option) => {
  if (selected) return;
  setSelected(option);
  const isCorrect = option.hanzi === round.answer.hanzi;
  setScore((s) => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
  ActivityApi.logEvent({
    mode: "listening_choice", item_type: "vocab",
    item_id: round.answer.hanzi, level: String(level), is_correct: isCorrect,
  });
};
```

Áp dụng tương tự cho 7 chỗ còn lại theo bảng ở mục 7 — vị trí gọi (đã grep
sẵn cho khỏi phải tìm lại):

- `Listening.jsx:29 checkAnswer()`
- `MockTest.jsx:30 choose()`
- `DictationPractice.jsx:29 checkAnswer()`
- `OrderListening.jsx:58 check()`
- `DialogueChoice.jsx:28 choose()`
- `DialogueCloze.jsx:38 check()`
- `YoutubeListening.jsx` — trong `checkDictation()` (chế độ chính tả) **và**
  trong `goTo()` khi chuyển câu (để log cả lượt nghe không bật chính tả,
  `is_correct: null`).

## 11. Thứ tự làm (checklist)

0. **Refactor domain trước** (mục 0) — move file, tách `models.py`/`db.py`,
   sửa import, chạy sanity check. Commit riêng bước này trước khi viết dòng
   code activity nào, để nếu có gì vỡ thì biết ngay là do move chứ không
   lẫn với logic mới.
1. `activity/db.py` — bảng `practice_events`.
2. `activity/repo.py` — file mới, 4 hàm ở mục 2.
3. `activity/models.py` — 3 model ở mục 3.
4. `activity/router.py` + `activity/streak_router.py` — 2 router mới.
5. `main.py` — đăng ký router (đã viết sẵn ở mục 0, chỉ cần bỏ comment).
6. Test bằng `curl` — xem mục 12.
7. `shared/activityApi.js` — file mới (frontend).
8. Sửa `useDailyActivity.js` + `useStreak.js` — chỉ 2 file.
9. Chạy app, xem `StreakCard`/`DailyActivityChart` đã lên đúng (chắc sẽ toàn
   0 vì chưa có event nào — bình thường).
10. Instrument 8 component theo bảng mục 7/10.
11. Học thử vài lượt, F5, xem streak/biểu đồ có tăng đúng không.

## 12. Test nhanh bằng curl (sau bước 5)

```bash
curl -X POST localhost:8000/api/activity/events \
  -H 'Content-Type: application/json' \
  -d '{"mode":"listening_choice","item_type":"vocab","item_id":"你好","level":"1","is_correct":true}'

curl "localhost:8000/api/activity/daily?days=7"
curl localhost:8000/api/streak
```

## Việc để sau (không làm trong lượt này)

- **Persist "đã thuộc" của Vocabulary.jsx** — hiện là `useState(new Set())`
  cục bộ, mất khi F5. Nếu làm: bảng `vocab_progress(hanzi PK, level, learned_at)`
  thuộc domain `content/` (vì gắn với vocab, không phải practice event) +
  `content/progress_router.py` cho `GET/POST /api/vocabulary/progress`.
  Độc lập hoàn toàn với `practice_events`, không phụ thuộc plan này.
- **Generator tự sinh hội thoại** (đã bàn trước đó) — pipeline riêng, ghi
  vào `seed_data/dialogues.json` rồi validate trước khi merge. Không liên
  quan tracking.
- **3 setting "chết"** (mục tiêu từ vựng/ngày, tốc độ phát âm, hiển thị
  pinyin) — một khi có `practice_events`, "mục tiêu từ vựng/ngày" có thể so
  sánh với `get_daily_counts` của hôm nay để hiện tiến độ trên trang chủ.
  Tốc độ phát âm / hiển thị pinyin thì đơn giản là chưa có ai đọc lại giá trị
  đã lưu — việc frontend thuần, không cần đợi backend.
