from fastapi import APIRouter, Depends, HTTPException, status,Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.services.ai.recommendation_engine import RecommendationEngine
router = APIRouter()

@router.post("")
async def get_recommendations(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user["user_id"]
    user_type = current_user.get("payload",{}).get("user_type")
    goal = current_user.get("payload",{}).get("goal")
    # 나중에 좀더 세밀하게 분류할떄 사용할듯??
    # risk_level = current_user.get("payload",{}).get("risk_level")
    # diabetes_type = current_user.get("payload",{}).get("diabetes_type")

    user = db.query(User).filter(
        User.id == user_id
    ).first()
    engine = RecommendationEngine()

    if user_type == "diabetes":
        conditions = ["diabetes"]
    elif user_type == "risk":
        conditions = ["prediabetes"]
    else:
        conditions = []

    if user_type == "diabetes":
        goals = ["혈당 관리"]
    elif user_type == "risk":
        goals = ["당뇨관리"]
    else:
        goals = [goal] if goal else ["건강 관리"]

    result = await engine.generate_recommendations({
        "age":           user.age, #type:ignore
        "gender":        "M" if user.gender == 1 else "F", #type:ignore
        "user_type":     user_type,
        "conditions":    conditions,
        "goals":         goals,  
    })
 
    return {
        "success": True,
        "data":result
    }