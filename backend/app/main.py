"""FastAPI application factory.

or use the convenience ``run.py`` script at the project root.
"""

from contextlib import asynccontextmanager

from beanie import init_beanie
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

from app.config import get_settings
from app.models import ALL_MODELS
from app.routers import trips as trip_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage the MongoDB connection across the application lifecycle.

    **Startup:** connect the Motor client, initialize Beanie (which
    registers document models and ensures all declared indexes exist).

    **Shutdown:** close the Motor client so the connection pool drains
    cleanly.
    """
    settings = get_settings()

    client = AsyncIOMotorClient(settings.mongodb_uri)
    database = client[settings.mongodb_database]

    await init_beanie(database=database, document_models=ALL_MODELS)

    # Initialize ML Engine
    from app.ml.face_engine import FaceEngine
    app.state.face_engine = FaceEngine()

    yield

    client.close()


def create_app() -> FastAPI:
    """Build and return the configured FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        description=(
            "Trip photo-sharing backend — face-matched personal galleries "
            "delivered via WhatsApp."
        ),
        lifespan=lifespan,
    )

    # ── CORS ──────────────────────────────────────────────────────────
    # Wide-open for local development.  Tighten ``allow_origins`` to
    # your actual frontend domain(s) before deploying.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Routers ───────────────────────────────────────────────────────
    app.include_router(trip_router.router)

    # ── Health check ──────────────────────────────────────────────────
    @app.get("/", tags=["Health"])
    async def health_check():
        """Minimal liveness probe."""
        return {
            "status": "ok",
            "app": settings.app_name,
            "version": "0.1.0",
        }

    return app


app = create_app()
