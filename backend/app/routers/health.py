from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional

from app.core.database import get_db
from app.core.deps import get_current_user
from app.services import health as health_service
from app.schemas.health import HealthRecordRequest, GlucoseRequest

router = APIRouter()

@router.post('/records', status_code=201)
def create_health_record(
  data: HealthRecordRequest,
  current_user: dict = Depends(get_current_user),
  db: Session = Depends(get_db)
):
  user_id = current_user["user_id"]

  record = health_service.create_health_record(
    db=db,
    user_id=user_id,
    water_intake=data.water_intake,
    steps=data.steps,
    weight=data.weight,
    recorded_at=data.recorede_at
  )

  return {
    "success": True,
    "data":{
      "record_id" : record.id,
      "recorded_at" : record.recorded_at,
      "challenge_achieved" : False,
      "points_earned" : 0
    },
  }


@router.get('/records')
def get_health_records(
  start_date: Optional[date]= Query(None),
  end_date : Optional[date] = Query(None),
  limit : int = Query(30, ge=1, le=100),
  current_user : dict = Depends(get_current_user),
  db :Session = Depends(get_db)
):
  user_id = current_user["user_id"]
  records = health_service.get_health_record(
    db, user_id, start_date, end_date, limit
  )

  return {
    "success" : True,
    "data":[
      {
                "record_id":    r.id,
                "water_intake": r.water_intake,
                "steps":        r.steps,
                "weight":       r.weight,
                "recorded_at":  r.recorded_at,
      }
      for r in records
    ]
  }

@router.post('/glucose', status_code=201)
def create_glucose(
  data:GlucoseRequest, 
  current_user: dict = Depends(get_current_user),
  db: Session = Depends(get_db)
):
  user_type = current_user.get("user_type")

  if user_type != "diabetes":
    raise HTTPException(
      status_code=status.HTTP_403_FORBIDDEN,
      detail="당뇨환자만 혈당 기록할 수 있습니다."
    )
  
  log = health_service.create_glucose_log(
    db=db,
    user_id=current_user["user_id"],
    glucose_level=data.glucose_level,
    glucose_type=data.glucose_type,
    measured_at=data.measured_at
  )

  return {
    "success": True,
    "data":{
            "glucose_id": log.id,
            "glucose_level": log.glucose_level,
            "glucose_type": log.glucose_type.value,
            "measured_at": log.measured_at,
            "challenge_achieved": False,
            "points_earned":     0,
    }
  }


@router.get("/glucose/history")
def get_glucose_history(
  start_date: Optional[date] = Query(None),
  end_date: Optional[date] = Query(None),
  glucose_type :Optional[str] = Query(None),
  limit : int = Query(30, ge=1, le=100),
  current_user :dict = Depends(get_current_user),
  db: Session = Depends(get_db)
):
    user_type = current_user.get("user_type")
    if user_type != "diabetes":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="당뇨 환자만 혈당 이력을 조회할 수 있습니다."
        )

    logs = health_service.get_glucose_history(
        db, current_user["user_id"],
        start_date, end_date, glucose_type, limit
    )

    return {
        "success": True,
        "data": [
            {
                "glucose_id":    l.id,
                "glucose_level": l.glucose_level,
                "glucose_type":  l.glucose_type.value,
                "measured_at":   l.measured_at,
            }
            for l in logs
        ]
    }