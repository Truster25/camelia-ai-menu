"""Database engine and session management (SQLAlchemy 2.0)."""
from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import settings


class Base(DeclarativeBase):
    """Declarative base shared by every model."""


def _engine_kwargs(url: str) -> dict:
    if url.startswith("sqlite"):
        # FastAPI runs handlers in a thread pool; SQLite needs this flag.
        return {"connect_args": {"check_same_thread": False}, "pool_pre_ping": True}
    return {"pool_pre_ping": True, "pool_size": 5, "max_overflow": 5}


engine = create_engine(settings.DATABASE_URL, **_engine_kwargs(settings.DATABASE_URL))
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a session and always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create tables if they do not exist (small project: no Alembic migrations yet)."""
    from . import models  # noqa: F401  (register models on Base.metadata)

    Base.metadata.create_all(bind=engine)
    _add_missing_columns()


def _add_missing_columns() -> None:
    """Add columns that were introduced after a database was first created.

    create_all only builds tables that are missing; it never alters one that
    already exists. So a database seeded before payments were added has no
    payment columns, and every order query fails with "no such column".

    Alembic is the correct answer and the wrong size for this project. This does
    the one thing needed: compare each model's columns against what the
    database actually has, and add what is missing, with a default so existing
    rows stay valid.
    """
    from . import models as _models  # noqa: F401

    insp = inspect(engine)
    with engine.begin() as conn:
        for table in Base.metadata.sorted_tables:
            if not insp.has_table(table.name):
                continue
            existing = {column["name"] for column in insp.get_columns(table.name)}
            for column in table.columns:
                if column.name in existing:
                    continue
                # SQLite cannot add a NOT NULL column without a default, and
                # adding one nullable is the safe general case.
                ddl = f'ALTER TABLE "{table.name}" ADD COLUMN "{column.name}" {column.type.compile(engine.dialect)}'
                if column.default is not None and getattr(column.default, "is_scalar", False):
                    default = column.default.arg
                    literal = f"'{default}'" if isinstance(default, str) else str(default)
                    ddl += f" DEFAULT {literal}"
                conn.execute(text(ddl))
