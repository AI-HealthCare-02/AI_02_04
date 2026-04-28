from sqlalchemy.orm import Session
from sqlalchemy import cast, Date, func
from datetime import datetime, date, timedelta,timezone

from app.models.health import HealthRecord,DiabetesPrediction,GlucoseLog
from app.models.challenge import ChallengeLog


def get_normal_dashboard(db:Session, user_id:int, goal:str)->dict:
  weekly_steps_avg = _get_weekly_steps_avg(db, user_id)
  challenge_rate = _get_challenge_rate(db,user_id)
  week_ago = date.today() - timedelta(days=7)

  weight_records = db.query(HealthRecord).filter(
    HealthRecord.user_id == user_id,
    HealthRecord.weight.isnot(None),
    cast(HealthRecord.recorded_at, Date)>= week_ago
  ).order_by(HealthRecord.recorded_at.asc()).all()

  weight_trend = [
    {
      "date" : str(r.recorded_at.date()),
      "value" : r.weight
    }
    for r in weight_records
  ]
  return {
    "user_type" : "normal",
    "goal" : goal,
    "weekly_steps_avg" : weekly_steps_avg,
    "challenge_rate" : challenge_rate,
    "weight_trend" : weight_trend
  }


def get_risk_dashboard(db:Session, user_id:int)->dict:
  weekly_steps_avg = _get_weekly_steps_avg(db, user_id)
  challenge_rate = _get_challenge_rate(db,user_id)

  latest = db.query(DiabetesPrediction).filter(
    DiabetesPrediction.user_id == user_id
  ).order_by(DiabetesPrediction.created_at.desc()).first()
  
  predictions = db.query(DiabetesPrediction).filter(
        DiabetesPrediction.user_id == user_id
    ).order_by(DiabetesPrediction.created_at.asc()).limit(10).all()

  risk_trend = [
        {
            "date":       str(p.created_at.date()),
            "risk_level": p.risk_level,
            "risk_score": p.risk_score,
        }
        for p in predictions
    ]

  return {
        "user_type":        "risk",
        "risk_score":       latest.risk_score if latest else None,
        "risk_level":       latest.risk_level if latest else None,
        "weekly_steps_avg": weekly_steps_avg,
        "challenge_rate":   challenge_rate,
        "risk_trend":       risk_trend,
    }


def get_diabetes_dashboard(db:Session, user_id:int)->dict:
  week_ago = date.today() - timedelta(days=7)
  weekly_steps_avg = _get_weekly_steps_avg(db, user_id)
  challenge_rate = _get_challenge_rate(db,user_id)

  latest_glucose_log = db.query(GlucoseLog).filter(
    GlucoseLog.user_id == user_id
  ).order_by(GlucoseLog.measured_at.desc()).first()

  glucose_logs = db.query(GlucoseLog).filter(
    GlucoseLog.user_id == user_id,
    cast(GlucoseLog.measured_at, Date)>=week_ago
  ).order_by(GlucoseLog.measured_at.asc()).all()

  glucose_by_date ={}

  for g in glucose_logs:
    d = str(g.measured_at.date())
    if d not in glucose_by_date:
      glucose_by_date[d] = {"date": d, "fasting": None, "postprandial": None}
    if g.glucose_type.value == "fasting":
      glucose_by_date[d]["fasting"] = g.glucose_level
    else:
      glucose_by_date[d]["postprandial"] = g.glucose_level
        
  glucose_trend = list(glucose_by_date.values())
  return {
        "user_type":        "diabetes",
        "latest_glucose":   latest_glucose_log.glucose_level if latest_glucose_log else None,
        "weekly_steps_avg": weekly_steps_avg,
        "challenge_rate":   challenge_rate,
        "glucose_trend":    glucose_trend,
    }



def _get_weekly_steps_avg(db:Session, user_id:int)->int:
  week_ago = date.today() - timedelta(days=7)
  avg = db.query(func.avg(HealthRecord.steps)).filter(
    HealthRecord.user_id==user_id,
    HealthRecord.steps.isnot(None),
  cast(HealthRecord.recorded_at, Date) >= week_ago,
  ).scalar() or 0
  return int(avg)



def _get_challenge_rate(db: Session, user_id: int) -> float:
  week_ago = date.today() - timedelta(days=7)
  total_challenge_logs = db.query(func.count(ChallengeLog.id)).filter(
    ChallengeLog.user_id == user_id,
    cast(ChallengeLog.updated_at, Date) >= week_ago
  ).scalar() or 0
  complited_challenge_logs = db.query(func.count(ChallengeLog.id)).filter(
    ChallengeLog.user_id == user_id,
    cast(ChallengeLog.updated_at, Date) >= week_ago,
    ChallengeLog.is_completed == True
  ).scalar() or 0
  return complited_challenge_logs / total_challenge_logs if total_challenge_logs >0 else 0.0