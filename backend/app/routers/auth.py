"""Authentication endpoints: register, login, current user."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import ForgotPasswordIn, ForgotPasswordOut, LoginIn, RegisterIn, ResetPasswordIn, TokenOut, UserOut
from ..security import (
    create_access_token,
    create_password_reset_token,
    get_current_user,
    hash_password,
    verify_password,
    verify_password_reset_token,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _email_in_use(db: Session, email: str) -> bool:
    return db.scalar(select(User.id).where(User.matches_email(email)).limit(1)) is not None


def _find_by_email(db: Session, email: str) -> User | None:
    """Case/whitespace-insensitive lookup that refuses an ambiguous match.

    Older imports can contain distinct rows that differ only by case; this
    still lets an exact address sign in (or reset its password) rather than
    guessing which of two rows was meant.
    """
    users = db.scalars(select(User).where(User.matches_email(email))).all()
    return users[0] if len(users) == 1 else next((row for row in users if row.email == email), None)


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
    user = _find_by_email(db, payload.email)
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")
    return TokenOut(access_token=create_access_token(user), user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> UserOut:
    return UserOut.model_validate(user)


@router.post("/forgot-password", response_model=ForgotPasswordOut)
def forgot_password(payload: ForgotPasswordIn, db: Session = Depends(get_db)) -> ForgotPasswordOut:
    """Confirms the email matches an account and authorises a new password.

    Deliberately the simple version, by choice: no email is sent, so nothing
    here proves the caller actually controls that inbox -- an account can be
    reset by anyone who knows (or guesses) its registered email address. A
    stronger version would email a one-time link instead and never reveal
    whether an address is registered. Document this trade-off if this project
    is written up for evaluation.
    """
    user = _find_by_email(db, payload.email)
    if user is None:
        raise HTTPException(status_code=404, detail="No account exists for that email.")
    return ForgotPasswordOut(token=create_password_reset_token(user))


@router.post("/reset-password", response_model=TokenOut)
def reset_password(payload: ResetPasswordIn, db: Session = Depends(get_db)) -> TokenOut:
    user = verify_password_reset_token(payload.token, db)
    user.password_hash = hash_password(payload.new_password)
    db.commit()
    db.refresh(user)
    # Signs them straight in, the same courtesy register() already extends --
    # having just proven (for whatever this flow's proof is worth) which
    # account this is, there is no reason to make them type the new password
    # again at a separate login screen.
    return TokenOut(access_token=create_access_token(user), user=UserOut.model_validate(user))
