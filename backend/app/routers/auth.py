from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.schemas.auth import(
     RegisterRequest,
    LoginRequest,
    RefreshRequest,
    RegisterResponse,
    TokenResponse,
   
)
from app.services import auth as auth_service
from app.core.config import settings
from jose import jwt, JWTError
from app.models.user import User


router  = APIRouter()




@router.post("/register", status_code=201)
def register(data:RegisterRequest, db: Session = Depends(get_db)):
  try:
    user = auth_service.register_user(db, data)
  except ValueError as err: 
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail=str(err)
    )
  access_token = auth_service.create_access_token(user)
  refresh_token = auth_service.create_refresh_token(user)

  return {
    "success" : True,
    "data": {
            "user_id":       user.id,
            "user_type":     user.user_type.value,
            "risk_level":    user.risk_level.value if user.risk_level else None,#type:ignore
            "goal":          user.goal.value if user.goal else None,#type:ignore
            "diabetes_type": user.diabetes_type.value if user.diabetes_type else None,#type:ignore
            "access_token":  access_token,
            "refresh_token": refresh_token,
        }
  }


@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):

    try:
        user = auth_service.signin_user(db, data.email, data.password)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )

    access_token  = auth_service.create_access_token(user)
    refresh_token = auth_service.create_refresh_token(user)

    return {
        "success": True,
        "data": {
            "access_token":  access_token,
            "refresh_token": refresh_token,
            "user_type":     user.user_type.value,
            "goal":          user.goal.value if user.goal else None,
            "risk_level":    user.risk_level.value if user.risk_level else None,
            "diabetes_type": user.diabetes_type.value if user.diabetes_type else None,
        }
    }


@router.post("/refresh")
def refresh(data: RefreshRequest, db:Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="유효하지 않은 토큰입니다."
    )
    try:
      payload = jwt.decode(
          data.refresh_token,
          settings.JWT_SECRET_KEY,
          algorithms=[settings.JWT_ALGORITHM]
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
      "success" : True,
      "data":{
        "access_token":access_token,
        "refresh_token":refresh_token
      }
    }
    

@router.post("/signout")
def signout(current_user:dict = Depends(get_current_user)):
      return {
        "success" :True,
        "message" : "로그아웃 되었습니다."
      }