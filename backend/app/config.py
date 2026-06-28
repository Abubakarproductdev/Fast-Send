"""Centralized application settings.

All configuration is read from environment variables (or a ``.env`` file at
the project root).  Values are parsed and validated once at startup via
pydantic-settings, then cached for the lifetime of the process.

Usage::

    from app.config import get_settings

    settings = get_settings()
    print(settings.mongodb_uri)
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application-wide configuration.

    Every field maps to an environment variable of the same name
    (case-insensitive).  ``pydantic-settings`` reads the ``.env`` file
    automatically — there is no need for a manual ``load_dotenv()`` call.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    # ── MongoDB ──────────────────────────────────────────────────────
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_database: str = "fastsend"

    # ── Application ─────────────────────────────────────────────────
    app_name: str = "FastSend"
    debug: bool = False
    invite_code_length: int = 8

    # ── ML Engine ───────────────────────────────────────────────────
    ml_model_name: str = "buffalo_l"
    ml_det_size: int = 640
    ml_min_det_score: float = 0.5
    ml_min_face_size: int = 50


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached ``Settings`` instance.

    Using ``lru_cache`` means the ``.env`` file is parsed exactly once
    per process — not once per request.
    """
    return Settings()
