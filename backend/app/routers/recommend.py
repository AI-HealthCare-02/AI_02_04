from fastapi import APIRouter, Depends, HTTPException, status,Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date

from app.core.database import get_db
from app.core.deps import get_current_user
router = APIRouter()

@router.post("")
def get_recommendations(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Mock
    return {
        "success": True,
        "data": {
            "recommendations": [
                {
                    "action": "식후 15분 걷기를 해보세요",
                    "reason": "식후 혈당 스파이크 억제에 효과적입니다",
                    "difficulty": "easy"
                }
            ],
            "disclaimer": "본 추천은 생활습관 개선을 위한 참고용입니다."
        }
    }