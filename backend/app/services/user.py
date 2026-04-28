from sqlalchemy.orm import Session
from app.models.user import User, UserType, GoalType, DiabetesType
from app.schemas.user import UserUpdateRequest
from app.services.auth import calc_bmi
from typing import Optional



def get_user_by_id(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("유저를 찾을 수 없습니다.")
    return user


def get_total_points(db: Session, user_id: int) -> int:
    from app.models.challenge import Point
    point = db.query(Point).filter(Point.user_id == user_id).first()
    return point.total_points if point else 0 #type:ignore



def update_user(db: Session, user_id: int, data: UserUpdateRequest) -> User:
    user = get_user_by_id(db, user_id)

    if data.nickname is not None:
        user.nickname = data.nickname #type:ignore
    if data.weight is not None:
        user.weight = data.weight #type:ignore
        if user.height:#type:ignore
            user.bmi = calc_bmi(user.height, data.weight) #type:ignore
    if data.alcohol_status is not None:
        user.alcohol_status = data.alcohol_status#type:ignore
    if data.general_health is not None:
        user.general_health = data.general_health#type:ignore
    if data.exercise_freq is not None:
        user.exercise_freq = data.exercise_freq#type:ignore
    if data.smoke_status is not None:
        user.smoke_status = data.smoke_status#type:ignore
    if data.fruit_intake is not None:
        user.fruit_intake = data.fruit_intake#type:ignore
    if data.veggie_intake is not None:
        user.veggie_intake = data.veggie_intake#type:ignore
    if data.goal is not None:
        user.goal = GoalType(data.goal)#type:ignore

    db.commit()
    db.refresh(user)
    return user



def update_user_grade(db: Session, user_id: int, user_type: str,
    goal: Optional[str] = None, diabetes_type: Optional[str] = None) -> User:
    user = get_user_by_id(db, user_id)
# 당뇨는 만성질환이라 변경 불가!!
    if user.user_type.value == "diabetes":
        raise ValueError("당뇨 등급은 변경할 수 없습니다.")

    user.user_type = UserType(user_type) #type:ignore

    if user_type == "normal" and goal:
        user.goal = GoalType(goal)#type:ignore
    if user_type == "diabetes" and diabetes_type:
        user.diabetes_type = DiabetesType(diabetes_type)#type:ignore

    db.commit()
    db.refresh(user)
    return user