from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from datetime import timedelta, datetime, timezone,date
from typing import Optional,List

from app.models.health import HealthRecord, GlucoseLog, GlucoseType
from app.models.user import User
from app.services.auth import calc_bmi

def create_health_record(
    db:Session,
    user_id:int,
    water_intake: Optional[float] = None,
    steps: Optional[int]= None,
    weight: Optional[float] = None,
    recorded_at: Optional[datetime]= None
)-> HealthRecord:
  
  record = HealthRecord(
    user_id = user_id,
    water_intake = water_intake,
    steps = steps,
    weight = weight,
    recorded_at = recorded_at or datetime.now(timezone.utc)
  )
  
  if weight:
    user = db.query(User).filter(User.id == user_id).first()
    if user:
      user.weight = weight #type:ignore
      if user.height:#type:ignore
        user.bmi = calc_bmi(user.height, weight) #type:ignore
  
  db.add(record)
  db.commit()
  db.refresh(record)
  return record


def get_health_record(
    db:Session,
    user_id:int,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int =30,
)-> List[HealthRecord]:
  query = db.query(HealthRecord).filter(HealthRecord.user_id == user_id)

  if start_date:
    query = query.filter(HealthRecord.recorded_at >= start_date)
  if end_date:
    query = query.filter(HealthRecord.recorded_at <= start_date)
  
  return query.order_by(HealthRecord.recorded_at.desc()).limit(limit).all()

def create_glucose_log(
    db: Session,
    user_id: int,
    glucose_level:float,
    glucose_type:str,
    measured_at: Optional[datetime]= None,
)->GlucoseLog:
  
  log = GlucoseLog(
    user_id=user_id,
    glucose_level=glucose_level,
    glucose_type= GlucoseType(glucose_type),
    measured_at= measured_at or datetime.now(timezone.utc)
  )

  db.add(log)
  db.commit()
  db.refresh(log)
  return log


def get_glucose_history(
    db: Session,
    user_id : int,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    glucose_type: Optional[str] = None,
    limit: int = 30,
)-> List[GlucoseLog]:
  query = db.query(GlucoseLog).filter(GlucoseLog.user_id == user_id)

  if start_date:
    query = query.filter(GlucoseLog.measured_at >= start_date)

  if end_date:
    query = query.filter(GlucoseLog.measured_at <= start_date)

  if glucose_type:
    query = query.filter(GlucoseLog.glucose_type == GlucoseType(glucose_type))

  return query.order_by(GlucoseLog.measured_at.desc()).limit(limit).all()

