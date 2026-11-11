"""Camelia AI Menu API — FastAPI application entry point."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from .config import settings
from .database import SessionLocal, init_db
from .models import Dish
from .routers import admin, auth, menu, orders, ratings, recommendations

logger = logging.getLogger("camelia")
logging.basicConfig(level=logging.INFO)


def _bootstrap() -> None:
    """Create tables and, on an empty database, load the demo data set."""
    init_db()
    if not settings.AUTO_SEED:
        return
    db = SessionLocal()
    try:
        if db.scalar(select(Dish).limit(1)) is None:
            db.close()
            from seed import seed

            seed()
            logger.info("Seeded demo data (24 dishes, demo users).")
    except Exception as exc:  # pragma: no cover - startup should never crash the API
        logger.warning("Could not auto-seed demo data: %s", exc)
    finally:
        db.close()


@asynccontextmanager
async def lifespan(_: FastAPI):
    _bootstrap()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "AI-based menu recommendation system for Camelia Café & Restaurant, Kigali.\n\n"
        "Hybrid recommender: TF-IDF cosine similarity (40%), preference rules (25%), "
        "popularity (20%) and occasion match (15%), with dietary requirements applied as hard filters."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_prefix = settings.API_PREFIX


@app.get("/", tags=["health"])
def root() -> dict:
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "ok",
        "docs": "/docs",
        "endpoints": f"{api_prefix}/health, {api_prefix}/dishes, {api_prefix}/recommend",
    }


@app.get("/api/health", tags=["health"])
def health() -> dict:
    return {"status": "ok", "version": settings.VERSION, "database": "connected"}


@app.get("/api/menu", tags=["menu"])
def legacy_menu() -> dict:
    """Backwards-compatible shape used by the first prototype frontend."""
    from .serializers import serialise_dish

    db = SessionLocal()
    try:
        dishes = db.scalars(select(Dish).where(Dish.is_available.is_(True))).unique().all()
        return {
            "items": [serialise_dish(d).model_dump() for d in dishes],
            "notice": "Live Camelia menu served from the database.",
        }
    finally:
        db.close()


for router in (auth.router, menu.router, recommendations.router, ratings.router, orders.router, admin.router):
    app.include_router(router, prefix=api_prefix)
