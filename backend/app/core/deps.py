from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.redis import is_blacklisted
from app.core.config import settings
from app.core.database import get_db


security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="유효하지 않은 토큰입니다.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        user_id: str = payload.get("sub") #type:ignore
        if user_id is None:
            raise credentials_exception
      
        token = credentials.credentials
        if await is_blacklisted(token):
            raise credentials_exception

    except JWTError:
        raise credentials_exception
    
    return {"user_id": int(user_id), "payload": payload}


def get_current_user_type(
    current_user: dict = Depends(get_current_user),
):
    payload = current_user.get("payload", {})
    return {
        "uset_type": payload.get("user_type"),
        "risk_level": payload.get("risk_level"),
        "diabetes_type": payload.get("diabetes_type"),
    }
