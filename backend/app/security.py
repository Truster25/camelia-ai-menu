"""Password hashing and JWT helpers (no passlib — bcrypt used directly)."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db
from .models import User

_bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(user: User) -> str:
    expires = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(user.id), "role": user.role, "email": user.email, "exp": expires}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


# A password-reset token is signed with the same key but carries a "purpose"
# claim a normal login token never has. get_current_user below rejects any
# token carrying one, so a reset token -- short-lived and handed out on a
# bare email match -- can never double as a session token for placing
# orders, reading the account, or anything else.
PASSWORD_RESET_PURPOSE = "password_reset"
PASSWORD_RESET_EXPIRE_MINUTES = 15


def create_password_reset_token(user: User) -> str:
    expires = datetime.now(timezone.utc) + timedelta(minutes=PASSWORD_RESET_EXPIRE_MINUTES)
    payload = {"sub": str(user.id), "purpose": PASSWORD_RESET_PURPOSE, "exp": expires}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


_credentials_error = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Your session is not valid. Please sign in again.",
    headers={"WWW-Authenticate": "Bearer"},
)

_reset_token_error = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="This reset link has expired. Please start again.",
)


def verify_password_reset_token(token: str, db: Session) -> User:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        raise _reset_token_error from None
    if payload.get("purpose") != PASSWORD_RESET_PURPOSE:
        raise _reset_token_error
    user = db.get(User, int(payload.get("sub", "0")))
    if user is None:
        raise _reset_token_error
    return user


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise _credentials_error
    try:
        payload = jwt.decode(credentials.credentials, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("purpose"):
            raise _credentials_error
        user_id = int(payload.get("sub", "0"))
    except (JWTError, ValueError):
        raise _credentials_error from None
    user = db.get(User, user_id)
    if user is None:
        raise _credentials_error
    return user


def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User | None:
    """Used by the public quiz endpoint so guests can still be logged."""
    if credentials is None:
        return None
    try:
        payload = jwt.decode(credentials.credentials, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("purpose"):
            return None
        return db.get(User, int(payload.get("sub", "0")))
    except (JWTError, ValueError):
        return None


def require_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Administrator access required.")
    return user


def require_staff(user: User = Depends(get_current_user)) -> User:
    """Admin or kitchen.

    Used for the work a cook legitimately does: seeing incoming orders and
    moving them along. Everything else stays on require_admin, so adding this
    role widened exactly one door and no others.
    """
    if not user.can_manage_orders:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Kitchen or administrator access required.")
    return user
