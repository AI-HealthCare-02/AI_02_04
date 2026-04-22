from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
import httpx

from app.core.limiter import limiter
from app.core.database import get_db
from app.core.deps import get_current_user
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    RefreshRequest,
    RegisterResponse,
    TokenResponse,
    KakaoRegisterRequest,
)
from app.services import auth as auth_service
from app.core.config import settings
from jose import jwt, JWTError
from app.models.user import User


router = APIRouter()


@router.post("/register", status_code=201)
@limiter.limit("3/minute")
def register(request:Request,data: RegisterRequest, db: Session = Depends(get_db)):
    try:
        user = auth_service.register_user(db, data)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))
    access_token = auth_service.create_access_token(user)
    refresh_token = auth_service.create_refresh_token(user)

    return {
        "success": True,
        "data": {
            "user_id": user.id,
            "user_type": user.user_type.value,
            "risk_level": (
                user.risk_level.value if user.risk_level else None
            ),  # type:ignore
            "goal": user.goal.value if user.goal else None,  # type:ignore
            "diabetes_type": (
                user.diabetes_type.value if user.diabetes_type else None
            ),  # type:ignore
            "access_token": access_token,
            "refresh_token": refresh_token,
        },
    }


@router.post("/login")
@limiter.limit("5/minute")
def login(request: Request, data: LoginRequest, db: Session = Depends(get_db)):

    try:
        user = auth_service.signin_user(db, data.email, data.password)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

    access_token = auth_service.create_access_token(user)
    refresh_token = auth_service.create_refresh_token(user)

    return {
        "success": True,
        "data": {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user_type": user.user_type.value,
            "goal": user.goal.value if user.goal else None,  # type:ignore
            "risk_level": (
                user.risk_level.value if user.risk_level else None  # type:ignore
            ),
            "diabetes_type": (
                user.diabetes_type.value if user.diabetes_type else None  # type:ignore
            ),
        },
    }


@router.post("/refresh")
def refresh(data: RefreshRequest, db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, detail="유효하지 않은 토큰입니다."
    )
    try:
        payload = jwt.decode(
            data.refresh_token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise credentials_exception

    access_token = auth_service.create_access_token(user)
    refresh_token = auth_service.create_refresh_token(user)

    return {
        "success": True,
        "data": {"access_token": access_token, "refresh_token": refresh_token},
    }


@router.get("/check-email")
def check_email(email: str = Query(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    return {"success": True, "data": {"available": True if not user else False}}


@router.post("/signout")
def signout(current_user: dict = Depends(get_current_user)):
    return {"success": True, "message": "로그아웃 되었습니다."}


@router.get("/kakao/login")
def kakao_login():
    kakao_auth_url = f"https://kauth.kakao.com/oauth/authorize?client_id={settings.KAKAO_REST_API_KEY}&redirect_uri={settings.KAKAO_REDIRECT_URI}&response_type=code"
    return {"url": kakao_auth_url}


@router.get("/kakao/callback")
async def kakao_callback(code: str, db: Session = Depends(get_db)):
    async with httpx.AsyncClient() as client:

        token_response = await client.post(
            "https://kauth.kakao.com/oauth/token",
            data={
                "grant_type": "authorization_code",
                "client_id": settings.KAKAO_REST_API_KEY,
                "redirect_uri": settings.KAKAO_REDIRECT_URI,
                "code": code,
                "client_secret": settings.KAKAO_CLIENT_SECRET,
            },
        )
        token_data = token_response.json()
        access_token = token_data.get("access_token")
        user_response = await client.get(
            "https://kapi.kakao.com/v2/user/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        user_info = user_response.json()
        kakao_id = str(user_info.get("id"))
        kakao_nickname = (
            user_info.get("kakao_account", {}).get("profile", {}).get("nickname")
        )
        user = db.query(User).filter(User.kakao_id == kakao_id).first()
        if not user:
            return {
                "success": True,
                "data": {
                    "is_new_user": True,
                    "kakao_id": kakao_id,
                    "nickname": kakao_nickname,
                },
            }
        access_token = auth_service.create_access_token(user)
        refresh_token = auth_service.create_refresh_token(user)
        return {
            "success": True,
            "data": {
                "is_new_user": False,
                "access_token": access_token,
                "refresh_token": refresh_token,
                "user_type": user.user_type.value,
            },
        }


@router.post("/kakao/register", status_code=201)
def kakao_register(data: KakaoRegisterRequest, db: Session = Depends(get_db)):
    try:
        user = auth_service.register_kakao_user(db, data)
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))

    access_token = auth_service.create_access_token(user)
    refresh_token = auth_service.create_refresh_token(user)

    return {
        "success": True,
        "data": {
            "user_id": user.id,
            "user_type": user.user_type.value,
            "access_token": access_token,
            "refresh_token": refresh_token,
        },
    }
