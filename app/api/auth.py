from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel

from app.auth import create_access_token, get_current_auth
from app.core import settings

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    password: str


@router.post("/login")
def login(request: LoginRequest, response: Response):
    if request.password != settings.admin_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password",
        )
    token = create_access_token()
    response.set_cookie(
        key="auth_token",
        value=token,
        httponly=True,
        secure=True,  # True em produção com HTTPS
        samesite="lax",
        max_age=30 * 24 * 60 * 60,  # 30 dias
    )
    return {"message": "Logged in successfully"}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="auth_token")
    return {"message": "Logged out successfully"}


@router.get("/check")
def check_auth(authenticated: bool = Depends(get_current_auth)):
    return {"authenticated": authenticated}
