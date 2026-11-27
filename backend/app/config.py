"""Application settings.

Values can be overridden with environment variables so the same code runs on a
laptop (SQLite) and on Render (PostgreSQL) without edits.
"""
from __future__ import annotations

import os
import secrets
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent  # .../backend


def _default_database_url() -> str:
    """SQLite for local development; set DATABASE_URL for PostgreSQL in production."""
    return f"sqlite:///{BASE_DIR / 'camelia.db'}"


def _database_url() -> str:
    url = os.getenv("DATABASE_URL", _default_database_url()).strip()
    if url.startswith("postgres://"):
        return "postgresql://" + url.removeprefix("postgres://")
    return url


class Settings:
    PROJECT_NAME: str = "Camelia AI Menu API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"

    DATABASE_URL: str = _database_url()

    # Where dish photos uploaded through the admin dashboard are written.
    # Local disk is fine for development; see README.md's deployment section
    # for why production (an ephemeral filesystem on most free hosting) needs
    # a persistent disk or object storage instead. Overridable so tests write
    # to a throwaway directory instead of the developer's real uploads folder.
    UPLOAD_DIR: Path = Path(os.getenv("UPLOAD_DIR", str(BASE_DIR / "uploads")))
    MAX_UPLOAD_BYTES: int = 5 * 1024 * 1024  # 5 MB

    # A generated fallback keeps local development moving; production must set JWT_SECRET.
    JWT_SECRET: str = os.getenv("JWT_SECRET", "dev-only-insecure-secret-change-me-1234567890")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

    # Comma separated list of allowed browser origins ("*" allows all).
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "*")

    AUTO_SEED: bool = os.getenv("AUTO_SEED", "1").lower() in {"1", "true", "yes"}

    @property
    def cors_origin_list(self) -> list[str]:
        raw = self.CORS_ORIGINS.strip()
        if raw in {"", "*"}:
            return ["*"]
        return [origin.strip() for origin in raw.split(",") if origin.strip()]

    def verify(self) -> None:
        if not self.JWT_SECRET or len(self.JWT_SECRET) < 16:
            self.JWT_SECRET = secrets.token_urlsafe(32)
        (self.UPLOAD_DIR / "dishes").mkdir(parents=True, exist_ok=True)


settings = Settings()
settings.verify()
