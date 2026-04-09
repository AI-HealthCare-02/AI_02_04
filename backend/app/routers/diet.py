from fastapi import APIRouter, Depends, HTTPException, status,Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date

from app.core.database import get_db
from app.core.deps import get_current_user
from app.services import diet as diet_service
from app.schemas.diet import ManualInputRequest


router = APIRouter()

@router.get("/history")
def get_diet_history(
  start_date: Optional[date] = Query(None), 
  end_date: Optional[date] = Query(None), 
  limit : int = Query(20, ge=1, le=100),
  current_user: dict = Depends(get_current_user),
  db: Session = Depends(get_db)
):

  logs = diet_service.get_diet_history(db, current_user["user_id"], start_date, end_date, limit)
  return {
    "success" : True,
    "data":[
      {
              "diet_id":    l.id,
                "food_name":  l.food_name,
                "calories":   l.calories,
                "carbs":      l.carbs,
                "protein":    l.protein,
                "diet_score": l.diet_score,
                "image_url":  l.image_url,
                "created_at": l.created_at,
      }
      for l in logs
    ]
  }



@router.put("/{diet_id}/manual")
def update_diet_manual(
    diet_id: int,
    data: ManualInputRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)

):
  result = diet_service.update_diet_manual(db,current_user["user_id"], diet_id, data.food_name)
  return {
      "success" : True,
      "data": {
        "diet_id":    result.id,
        "food_name":  result.food_name,
        "calories":   result.calories,
        "carbs":      result.carbs,
        "protein":    result.protein,
        "diet_score": result.diet_score,
        "image_url":  result.image_url,
        "is_manual":  result.is_manual,
        "created_at": result.created_at,
      }
  }



@router.post("/analyze")
def analyze_diet(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Mock 응답우선 하겠으빈다
    return {
        "success": True,
        "data": {
            "diet_id":    1,
            "food_name":  "비빔밥",
            "calories":   100,
            "carbs":      20,
            "protein":    10,
            "sugar":     2,
            "fiber":      11,
            "gi_index":   12,
            "diet_score": 22,
            "highlight":  "carbs",
            "challenge_achieved": False,
            "points_earned": 0,
        }
    }