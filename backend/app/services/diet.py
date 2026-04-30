from sqlalchemy.orm import Session
from sqlalchemy import cast, Date, func
from datetime import datetime, date, timedelta,timezone
from typing import Optional, List

from app.models.diet import DietLog

def get_diet_history(
    db: Session,
    user_id: int,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 20,
) -> List[DietLog]:
  query = db.query(DietLog).filter(DietLog.user_id == user_id)

  if start_date:
    query = query.filter(DietLog.created_at >= start_date)
  if end_date:
    query = query.filter(DietLog.created_at <= end_date)
  return query.order_by(DietLog.created_at.desc()).limit(limit).all()


def update_diet_manual(
    db: Session,
    user_id : int,
    diet_id : int,
    food_name: str
)->DietLog:
  diet = db.query(DietLog).filter(
    DietLog.user_id == user_id,
    DietLog.id == diet_id
  ).first()

  if not diet :
    raise ValueError("식단 기록을 찾을 수 없습니다.")
  diet.food_name = food_name #type:ignore
  diet.is_manual = True#type:ignore
  db.commit()
  db.refresh(diet)
  return diet
