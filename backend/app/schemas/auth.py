from pydantic import BaseModel, EmailStr
from typing import Optional


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    nickname: str
    user_type: str
    goal: Optional[str] = None
    diabetes_type: Optional[str] = None
    gender: int
    age: int
    height: float
    weight: float

    is_hypertension: bool
    is_cholesterol: bool
    is_heart_disease: bool
    walking_difficulty: bool
    general_health: int
    alcohol_status: bool

    smoke_status: Optional[bool] = None
    exercise_freq: Optional[int] = None
    fruit_intake: Optional[bool] = None
    veggie_intake: Optional[bool] = None

    occupation: Optional[str] = None

class KakaoRegisterRequest(BaseModel):
    kakao_id: str
    nickname: str
    user_type: str
    goal: Optional[str] = None
    diabetes_type: Optional[str] = None
    gender: int
    age: int
    height: float
    weight: float
    is_hypertension: bool
    is_cholesterol: bool
    is_heart_disease: bool
    walking_difficulty: bool
    general_health: int
    alcohol_status: bool
    smoke_status: Optional[bool] = None
    exercise_freq: Optional[int] = None
    fruit_intake: Optional[bool] = None
    veggie_intake: Optional[bool] = None

    occupation: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    user_type: str
    goal: Optional[str] = None
    risk_level: Optional[str] = None
    diabetes_type: Optional[str] = None


class RegisterResponse(BaseModel):
    user_id: int
    user_type: str
    goal: Optional[str] = None
    risk_level: Optional[str] = None
    diabetes_type: Optional[str] = None
    access_token: str
    refresh_token: str


# { "success": true, "data": { ... }, "message": "ok" }
class SuccessResponse(BaseModel):
    success: bool = True
    data: dict
    message: str = "ok"

    # { "success": false, "error": "UNAUTHORIZED", "message": "토큰이 만료되었습니다" }
    class ErrorResponse(BaseModel):
        success: bool = False
        error: str
        message: str
