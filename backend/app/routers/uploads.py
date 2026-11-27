"""Dish photo uploads for the admin dashboard.

The file is sniffed by its actual bytes, not the filename or the
Content-Type header a client sends — both are easy to spoof, and this is the
one endpoint that writes an arbitrary file to disk. The client's filename is
never used for anything: the file is saved under a generated name, so there
is nothing here for a path-traversal name like "../../app/main.py" to reach.
"""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from ..config import settings
from ..models import User
from ..security import require_admin

router = APIRouter(prefix="/admin/uploads", tags=["admin"])

# Signature bytes for the formats browsers render as <img> without a plugin.
_SIGNATURES: list[tuple[bytes, str]] = [
    (b"\xff\xd8\xff", ".jpg"),
    (b"\x89PNG\r\n\x1a\n", ".png"),
    (b"RIFF", ".webp"),  # confirmed further below: bytes 8-12 must read "WEBP"
]


def _detect_extension(head: bytes) -> str | None:
    for signature, extension in _SIGNATURES:
        if not head.startswith(signature):
            continue
        if signature == b"RIFF" and head[8:12] != b"WEBP":
            continue
        return extension
    return None


@router.post("/dish-image", status_code=status.HTTP_201_CREATED)
async def upload_dish_image(file: UploadFile, _: User = Depends(require_admin)) -> dict:
    body = await file.read(settings.MAX_UPLOAD_BYTES + 1)
    if not body:
        raise HTTPException(status_code=422, detail="The uploaded file is empty.")
    if len(body) > settings.MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Images must be 5 MB or smaller.")

    extension = _detect_extension(body[:12])
    if extension is None:
        raise HTTPException(status_code=415, detail="Use a JPEG, PNG or WEBP image.")

    filename = f"{uuid.uuid4().hex}{extension}"
    target_dir = settings.UPLOAD_DIR / "dishes"
    target_dir.mkdir(parents=True, exist_ok=True)
    (target_dir / filename).write_bytes(body)

    return {"url": f"/uploads/dishes/{filename}"}
