"""Authentication endpoints: register, login, current user."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import LoginIn, RegisterIn, TokenOut, UserOut
from ..security import create_access_token, get_current_user, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


def _email_in_use(db: Session, email: str) -> bool:
    return db.scalar(select(User.id).where(User.matches_email(email)).limit(1)) is not None


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterIn, db: Session = Depends(get_db)) -> TokenOut:
    email = payload.email.strip().lower()
    if _email_in_use(db, email):
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    # Self-service registration only creates customers; admins are created by an admin.
    user = User(
        name=payload.name,
        email=email,
        password_hash=hash_password(payload.password),
        role="customer",
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        # The database also enforces the unique email when two signups overlap.
        if _email_in_use(db, email):
            raise HTTPException(status_code=409, detail="An account with this email already exists.") from None
        raise
    db.refresh(user)
    return TokenOut(access_token=create_access_token(user), user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)) -> TokenOut:
    users = db.scalars(select(User).where(User.matches_email(payload.email))).all()
    # Older imports can contain distinct rows that differ only by case.
    # Keep exact addresses usable and refuse an ambiguous match.
    user = users[0] if len(users) == 1 else next((row for row in users if row.email == payload.email), None)
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")
    return TokenOut(access_token=create_access_token(user), user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> UserOut:
    return UserOut.model_validate(user)
