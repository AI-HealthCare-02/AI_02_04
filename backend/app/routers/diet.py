from fastapi import APIRouter, Depends, HTTPException, status,Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
import os 

from app.core.database import get_db
from app.core.deps import get_current_user
from app.services import diet as diet_service
from app.schemas.diet import ManualInputRequest
from app.services.analysis.food_classifier import FoodImageClassifier

import tempfile, shutil

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
async def analyze_diet(
    image: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
  
):
    user_type = current_user.get('payload',{}).get('user_type')
    goal = current_user.get('payload',{}).get('goal') or ""

    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
      shutil.copyfileobj(image.file, tmp)
      tmp_path = tmp.name

    try:
        fc = FoodImageClassifier(mode="vision")
        result = await fc.analyze(tmp_path)
        api_res = fc.to_api_response(result, user_type, goal)
        from app.models.diet import DietLog

        diet_log = DietLog(
        user_id=current_user["user_id"],
        food_name=api_res.get("food_name"),
        calories=api_res.get("calories"),
        carbs=api_res.get("carbs"),
        protein=api_res.get("protein"),
        sugar=api_res.get("sugar"),
        fiber=api_res.get("fiber"),
        gi_index=api_res.get("gi_index"),
        diet_score=api_res.get("diet_score"),
        highlight=api_res.get("highlight"),
        is_manual=False,
        )
        db.add(diet_log)
        db.commit()
        db.refresh(diet_log)

        api_res["diet_id"] = diet_log.id

        return {
          "success": True,
          "data": api_res
        }
    finally:
      os.unlink(tmp_path)


