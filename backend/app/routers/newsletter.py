"""Newsletter signups from the footer.

Public, no sign-in required, because the footer form is on every page for
everyone. The only rule that matters: an address that is already on the list
gets the same friendly answer as a new one, so the endpoint cannot be used to
test whether somebody has subscribed.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Subscriber

router = APIRouter(tags=["newsletter"])


class SubscribeIn(BaseModel):
    email: EmailStr


class SubscribeOut(BaseModel):
    message: str


@router.post("/newsletter", response_model=SubscribeOut, status_code=201)
def subscribe(payload: SubscribeIn, db: Session = Depends(get_db)) -> SubscribeOut:
    email = payload.email.strip().lower()
    existing = db.scalar(select(Subscriber).where(Subscriber.email == email))
    if existing is None:
        db.add(Subscriber(email=email))
        db.commit()
    # Deliberately the same wording either way: telling a stranger that an
    # address is already on the list is a small privacy leak that costs nothing
    # to avoid.
    return SubscribeOut(message="You are on the list. We will be in touch.")
