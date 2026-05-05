from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
import json

from app.core.database import get_db
from app.core.deps import get_current_user
from app.services import challenge as challenge_service
from app.schemas.challenge import ChallengeLogRequest
from app.core.redis import set_cache, get_cache, delete_cache
router = APIRouter()


@router.get("")
async def get_challenges(
    current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)
):
    user_id = current_user["user_id"]
    cache_key = f"challenges:{user_id}"
    
    cached = await get_cache(cache_key)
    if cached:
        return {"success": True, "data": json.loads(cached)}
    
    challenges = challenge_service.get_challenges(db, user_id)
    
    data = [
        {
            "challenge_id": c.id,
            "name": c.name,
            "category": c.category,
            "target_value": c.target_value,
            "target_unit": c.target_unit,
            "points": c.points,
            "grade": c.grade.value,
            "difficulty": c.difficulty.value,
            "completion_rate": c.completion_rate,
            "redesign_count": c.redesign_count,
            "challenge_type": c.challenge_type.value,
        }
        for c in challenges
    ]
    
    await set_cache(cache_key, json.dumps(data), 300)
    
    return {"success": True, "data": data}


@router.post("/{challenge_id}/log", status_code=201)
async def log_challenge(
    challenge_id: int,
    data: ChallengeLogRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        result = challenge_service.log_challenge(
            db=db,
            user_id=current_user["user_id"],
            challenge_id=challenge_id,
            value=data.value,
            fail_reason=data.fail_reason,
            execution_time=data.execution_time,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    await delete_cache(f"challenges:{current_user['user_id']}")
    return {"success": True, "data": result}


@router.get("/my")
def get_my_challenges(
    current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)
):
    user_id = current_user["user_id"]
    challenges = challenge_service.get_challenges(db, user_id)
    today_logs = challenge_service.get_today_logs(db, user_id)

    return {
        "success": True,
        "data": [
            {
                "challenge_id": c.id,
                "name": c.name,
                "today_value": today_logs[c.id].value if c.id in today_logs else 0,
                "target_value": c.target_value,
                "is_completed": (
                    today_logs[c.id].is_completed if c.id in today_logs else False
                ),
                "streak_count": (
                    today_logs[c.id].streak_count if c.id in today_logs else 0
                ),
                "completion_rate": c.completion_rate,
            }
            for c in challenges
        ],
    }


@router.get("/streak")
def get_streak(
    current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)
):
    result = challenge_service.get_streak_summary(db, current_user["user_id"])

    return {"success": True, "data": result}


