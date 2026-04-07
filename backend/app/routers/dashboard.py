from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.deps import get_current_user, get_current_user_type
from app.services import dashboard as dashboard_service

router = APIRouter()

@router.get('')
def get_dashboard(
  current_user: dict = Depends(get_current_user),
  db:Session = Depends(get_db)
):
  user_id = current_user["user_id"]
  user_type = current_user.get("payload",{}).get("user_type")
  goal = current_user.get("payload",{}).get("goal")

  if user_type == "normal":
    data = dashboard_service.get_normal_dashboard(db, user_id, goal)
  elif user_type == "risk":
    data = dashboard_service.get_risk_dashboard(db, user_id)
  elif user_type == "diabetes":
    data = dashboard_service.get_diabetes_dashboard(db, user_id)
  else :
    raise HTTPException(status_code=400, detail="잘못된 등급입니다.")
  
  return {"success": True, "data":  data}