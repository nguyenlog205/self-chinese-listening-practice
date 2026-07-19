"""FastAPI app factory + uvicorn entrypoint. Prints "READY <port>" to stdout
once the server socket is bound, so the Electron main process knows which
port to point the renderer at."""

from __future__ import annotations

import asyncio
import socket
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .activity.router import router as activity_api
from .activity.streak_router import router as streak_api
from .content.audio_router import router as dialogue_audio_api
from .content.dialogues_router import router as dialogues_api
from .content.exercises_router import router as dialogue_exercises_api
from .content.grammar_router import router as grammar_api
from .content.progress_router import router as progress_api
from .content.reading_router import router as reading_api
from .content.sync_router import router as content_api
from .content.vocabulary_router import router as vocabulary_api
from .lessons.jobs import set_main_loop
from .lessons.jobs_router import router as jobs_api
from .lessons.media_router import router as media_api
from .lessons.router import router as lessons_api
from .tts.router import router as tts_api
from .config import ensure_storage_dirs, get_settings
from .db import init_db


@asynccontextmanager
async def _lifespan(app: FastAPI):
    set_main_loop(asyncio.get_event_loop())
    yield


def create_app() -> FastAPI:
    ensure_storage_dirs()
    init_db()

    app = FastAPI(title="Listening Practice Backend", lifespan=_lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(lessons_api)
    app.include_router(jobs_api)
    app.include_router(media_api)
    app.include_router(vocabulary_api)
    app.include_router(grammar_api)
    app.include_router(reading_api)
    app.include_router(progress_api)
    app.include_router(dialogues_api)
    app.include_router(dialogue_exercises_api)
    app.include_router(dialogue_audio_api)
    app.include_router(content_api)
    app.include_router(activity_api)
    app.include_router(streak_api)
    app.include_router(tts_api)

    @app.get("/health")
    def health() -> dict[str, bool]:
        return {"ok": True}

    return app


app = create_app()


def _free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def main() -> None:
    settings = get_settings()
    port = settings.port or _free_port()

    config = uvicorn.Config(app, host=settings.host, port=port, log_level="warning")
    server = uvicorn.Server(config)

    async def _run() -> None:
        loop = asyncio.get_event_loop()
        set_main_loop(loop)
        # print once the server has actually bound the socket
        server_task = asyncio.ensure_future(server.serve())
        while not server.started:
            await asyncio.sleep(0.05)
        print(f"READY {port}", flush=True)
        await server_task

    asyncio.run(_run())


if __name__ == "__main__":
    main()
