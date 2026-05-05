from fastapi import APIRouter, Depends, HTTPException, status 
from sqlalchemy.orm import Session
from typing import Optional
import json

from app.core.database import get_db
from app.core.deps import get_current_user, get_current_user_type
from app.services import dashboard as dashboard_service
from app.core.redis import set_cache, get_cache, delete_cache


router = APIRouter()
import json
from app.core.redis import get_cache, set_cache

@router.get('')
async def get_dashboard(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user["user_id"]
    user_type = current_user.get("payload", {}).get("user_type")
    goal = current_user.get("payload", {}).get("goal")
    cache_key = f"dashboard:{user_id}"

    cached = await get_cache(cache_key)
    if cached:
        return {"success": True, "data": json.loads(cached)}

    if user_type == "normal":
        data = dashboard_service.get_normal_dashboard(db, user_id, goal)
    elif user_type == "risk":
        data = dashboard_service.get_risk_dashboard(db, user_id)
    elif user_type == "diabetes":
        data = dashboard_service.get_diabetes_dashboard(db, user_id)
    else:
        raise HTTPException(status_code=400, detail="잘못된 등급입니다.")

    await set_cache(cache_key, json.dumps(data), 60)

    return {"success": True, "data": data}