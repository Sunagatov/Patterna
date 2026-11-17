import hashlib
import os
import secrets
from datetime import UTC, datetime, timedelta
from threading import Lock
from time import monotonic
from typing import Annotated

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError
from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from sqlalchemy import delete
from sqlalchemy.orm import Session

from .db import database
from .models import OwnerSession
from .schemas import Login

router = APIRouter(prefix="/api/session", tags=["session"])
DB = Annotated[Session, Depends(database)]
COOKIE = "patterna_session"
LIFETIME = timedelta(days=7)
hasher = PasswordHasher()
login_lock = Lock()
failed_attempts: list[float] = []


def digest(token: str) -> str:
    password_hash = os.environ.get("PATTERNA_PASSWORD_HASH", "")
    return hashlib.sha256(f"{password_hash}:{token}".encode()).hexdigest()


def require_owner(db: DB, patterna_session: Annotated[str | None, Cookie()] = None):
    session = (
        db.get(OwnerSession, digest(patterna_session)) if patterna_session else None
    )
    if session is None or session.expires_at <= datetime.now(UTC):
        raise HTTPException(401, "Sign in to Patterna")


@router.post("", status_code=204)
def login(body: Login, response: Response, db: DB):
    password_hash = os.environ.get("PATTERNA_PASSWORD_HASH")
    if not password_hash:
        raise HTTPException(503, "The owner password has not been configured")
    with login_lock:
        now = monotonic()
        failed_attempts[:] = [stamp for stamp in failed_attempts if now - stamp < 60]
        if len(failed_attempts) >= 8:
            raise HTTPException(
                429,
                "Too many sign-in attempts. Try again in one minute.",
                headers={"Retry-After": "60"},
            )
        try:
            hasher.verify(password_hash, body.password)
        except InvalidHashError:
            raise HTTPException(
                503, "The configured password hash is invalid"
            ) from None
        except VerificationError:
            failed_attempts.append(now)
            raise HTTPException(401, "Incorrect password") from None
        failed_attempts.clear()

    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(UTC) + LIFETIME
    db.execute(delete(OwnerSession).where(OwnerSession.expires_at <= datetime.now(UTC)))
    db.add(OwnerSession(digest=digest(token), expires_at=expires_at))
    db.commit()
    response.set_cookie(
        COOKIE,
        token,
        max_age=int(LIFETIME.total_seconds()),
        path="/api",
        httponly=True,
        samesite="strict",
        secure=os.environ.get("PATTERNA_SECURE_COOKIE", "true").lower() != "false",
    )


@router.delete("", status_code=204)
def logout(
    response: Response, db: DB, patterna_session: Annotated[str | None, Cookie()] = None
):
    if patterna_session:
        db.execute(
            delete(OwnerSession).where(OwnerSession.digest == digest(patterna_session))
        )
        db.commit()
    response.delete_cookie(COOKIE, path="/api")
