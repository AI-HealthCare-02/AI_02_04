from pydantic import BaseModel, EmailStr
from typing import Optional

class UserResponse(BaseModel):
  user_id : int
  email: str
  user_type:str
  nickname : str
  goal : Optional[str] = None
  risk_level : Optional[str] = None
  diabetes_type : Optional[str] = None
  age: Optional[int] = None
  gender : Optional[int] = None
  height: Optional[float] = None
  weight: Optional[float] = None
  bmi : Optional[float] = None
  
  is_hypertension: Optional[bool] = None
  is_cholesterol: Optional[bool] = None
  is_heart_disease: Optional[bool] = None
  walking_difficulty: Optional[bool] = None
  general_health: Optional[int] = None
  alcohol_status: Optional[bool] = None
  
  smoke_status: Optional[bool] = None
  exercise_freq: Optional[int] = None
  fruit_intake: Optional[bool] = None
  veggie_intake: Optional[bool] = None

  total_points: int = 0

  class Config:
    from_attributes = True

class UserUpdateRequest(BaseModel):
    nickname: Optional[str] = None
    weight: Optional[float] = None
    alcohol_status: Optional[bool] = None
    general_health: Optional[int] = None
    exercise_freq: Optional[int] = None
    smoke_status: Optional[bool] = None
    fruit_intake: Optional[bool] = None
    veggie_intake: Optional[bool] = None
    goal: Optional[str] = None


class UserGradeUpdateRequest(BaseModel):
    user_type: str
    goal: Optional[str] = None
    diabetes_type: Optional[str] = None
