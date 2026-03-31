from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.services import user as user_service
from app.services import auth as auth_service
from app.schemas.user import UserUpdateRequest, UserGradeUpdateRequest

router = APIRouter()


@router.get("/me")
def get_me(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user["user_id"]
    user = user_service.get_user_by_id(db, user_id)
    total_points = user_service.get_total_points(db, user_id)

    return {
        "success": True,
        "data": {
            "user_id":          user.id,
            "email":            user.email,
            "nickname":         user.nickname,
            "user_type":        user.user_type.value,
            "goal":             user.goal.value if user.goal else None,#type:ignore
            "risk_level":       user.risk_level.value if user.risk_level else None,#type:ignore
            "diabetes_type":    user.diabetes_type.value if user.diabetes_type else None,#type:ignore
            "age":              user.age,
            "gender":           user.gender,
            "height":           user.height,
            "weight":           user.weight,
            "bmi":              user.bmi,
            "is_hypertension":  user.is_hypertension,
            "is_cholesterol":   user.is_cholesterol,
            "is_heart_disease": user.is_heart_disease,
            "walking_difficulty": user.walking_difficulty,
            "general_health":   user.general_health,
            "alcohol_status":   user.alcohol_status,
            "smoke_status":     user.smoke_status,
            "exercise_freq":    user.exercise_freq,
            "fruit_intake":     user.fruit_intake,
            "veggie_intake":    user.veggie_intake,
            "total_points":     total_points,
        }
    }


@router.put("/me")
def update_me(
    data: UserUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user["user_id"]
    try:
        user = user_service.update_user(db, user_id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "success": True,
        "data": {
            "bmi": user.bmi
        }
    }


@router.put("/me/grade")
def update_grade(
    data: UserGradeUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user["user_id"]
    try:
        user = user_service.update_user_grade(
            db, user_id, data.user_type, data.goal, data.diabetes_type
        )
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))

    access_token  = auth_service.create_access_token(user)
    refresh_token = auth_service.create_refresh_token(user)

    return {
        "success": True,
        "data": {
            "user_type":     user.user_type.value,
            "diabetes_type": user.diabetes_type.value if user.diabetes_type else None,#type:ignore
            "access_token":  access_token,
            "refresh_token": refresh_token,
        }
    }