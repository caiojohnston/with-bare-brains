from datetime import datetime, timedelta
from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, status
from jose import JWTError, jwt

from app.core import settings

ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 30


def create_access_token() -> str:
    expire = datetime.utcnow() + timedelta(days=TOKEN_EXPIRE_DAYS)
    to_encode = {"exp": expire}
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> bool:
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[ALGORITHM])
        return True
    except JWTError:
        return False


def get_current_auth(
    auth_token: Annotated[str | None, Cookie()] = None,
) -> bool:
    if auth_token is None:
        return False
    if not verify_token(auth_token):
        return False
    return True


def require_auth(
    authenticated: Annotated[bool, Depends(get_current_auth)],
) -> bool:
    if not authenticated:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    return True
