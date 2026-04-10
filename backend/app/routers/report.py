from fastapi import APIRouter, Depends, HTTPException, status,Query
from sqlalchemy.orm import Session
from datetime import datetime,date,timedelta

from app.core.deps import get_current_user,get_db
from app.models.user import User
from app.models.health import HealthRecord
from app.models.challenge import ChallengeLog, Challenge
from app.services.ai.weekly_report_generator import WeeklyReportGenerator

router = APIRouter()

@router.get('/weekly')
async def get_weekly_report(
  db: Session = Depends(get_db),
  current_user: dict = Depends(get_current_user)
):
  user_id = current_user["user_id"]
  user_type = current_user.get("payload",{}).get("user_type")

  week_ago = date.today() -  timedelta(days=7)

  user = db.query(User).filter(User.id == user_id).first()
  health_records = db.query(HealthRecord).filter(
    HealthRecord.recorded_at >= week_ago,
    HealthRecord.user_id == user_id
  ).all()

  challenge_logs = db.query(ChallengeLog).filter(
    ChallengeLog.user_id == user_id,
    ChallengeLog.created_at >= week_ago
  ).all()

  challenges = db.query(Challenge).filter(
    Challenge.user_id == user_id,
    Challenge.is_active == True
  ).all()

  user_context = {
    "user_type":     user_type,
    "age":           user.age,        # type: ignore
    "gender":        "M" if user.gender == 1 else "F",  # type: ignore
    "conditions":    ["diabetes"] if user_type == "diabetes" else [],
    "goals":         [user.goal.value] if user.goal else [],  # type: ignore
  }
  challenge_info = {
    "challenges": [
        {
            "name": c.name,
            "category": c.category,
            "target_value": c.target_value,
            "completion_rate": c.completion_rate,
        }
        for c in challenges
    ]
  }
  health_records_dict = [
    {
        "record_type": "health",
        "water_intake": r.water_intake,
        "steps":        r.steps,
        "weight":       r.weight,
        "recorded_at":  str(r.recorded_at),
    }
    for r in health_records
  ]
  challenge_logs_dict = [
    {
        "challenge_id":  c.challenge_id,
        "is_completed":  c.is_completed,
        "value":         c.value,
        "fail_reason":   c.fail_reason.value if c.fail_reason else None,#type:ignore
        "created_at":    str(c.created_at),
    }
    for c in challenge_logs
]

  wg = WeeklyReportGenerator()
  report = await wg.generate_report(
    user_context= user_context,
    health_records=health_records_dict,
        challenge_logs=challenge_logs_dict,
        challenge_info=challenge_info,
  )

  return {"success" : True, "data": report }