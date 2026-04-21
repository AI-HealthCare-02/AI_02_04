from fastapi import APIRouter, Depends, HTTPException, status,Query,Header
from sqlalchemy.orm import Session
from datetime import datetime,date,timedelta

from app.core.config import settings
from app.core.deps import get_current_user,get_db
from app.models.user import User
from app.models.health import HealthRecord
from app.models.challenge import ChallengeLog, Challenge
from app.services.ai.weekly_report_generator import WeeklyReportGenerator
from app.models.report import WeeklyReport

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



@router.post("/weekly/batch")
async def generate_weekly_report_batch(
    x_internal_key: str = Header(..., alias="X-Internal-Key"),
    db: Session = Depends(get_db)
):
    if x_internal_key != settings.INTERNAL_API_KEY:
        raise HTTPException(status_code=403, detail="권한 없음")

    users = db.query(User).all()
    week_ago = date.today() - timedelta(days=7)
    results = []

    for user in users:
        try:
            health_records = db.query(HealthRecord).filter(
                HealthRecord.user_id == user.id,
                HealthRecord.recorded_at >= week_ago,
            ).all()

            challenge_logs = db.query(ChallengeLog).filter(
                ChallengeLog.user_id == user.id,
                ChallengeLog.created_at >= week_ago
            ).all()

            challenges = db.query(Challenge).filter(
                Challenge.user_id == user.id,
                Challenge.is_active == True
            ).all()

            user_context = {
                "user_type": user.user_type,
                "age": user.age,
                "gender": "M" if user.gender == 1 else "F",
                "conditions": ["diabetes"] if user.user_type == "diabetes" else [],
                "goals": [user.goal.value] if user.goal else [],
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
                    "steps": r.steps,
                    "weight": r.weight,
                    "recorded_at": str(r.recorded_at),
                }
                for r in health_records
            ]
            challenge_logs_dict = [
                {
                    "challenge_id": c.challenge_id,
                    "is_completed": c.is_completed,
                    "value": c.value,
                    "fail_reason": c.fail_reason.value if c.fail_reason else None,
                    "created_at": str(c.created_at),
                }
                for c in challenge_logs
            ]

            wg = WeeklyReportGenerator()
            report = await wg.generate_report(
                user_context=user_context,
                health_records=health_records_dict,
                challenge_logs=challenge_logs_dict,
                challenge_info=challenge_info,
            )

            weekly_report = WeeklyReport(
                user_id=user.id,
                report_content=report,
                week_start=week_ago,
            )
            db.add(weekly_report)
            results.append({"user_id": user.id, "status": "success"})

        except Exception as e:
            results.append({"user_id": user.id, "status": "failed", "error": str(e)})

    db.commit()
    return {"success": True, "data": results}