from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ChallengeResoponse(BaseModel):
    challenge_id: int
    name: str
    category: str
    target_value: float
    target_unit: str
    points: int
    grade: str
    difficulty: str
    completion_rate: float
    redesign_count: int
    challenge_type: str


class ChallengeLogRequest(BaseModel):
    value: float
    fail_reason: Optional[str] = None
    execution_time: Optional[str] = None


class ChallengeLogResponse(BaseModel):
    challenge_type: str
    today_total: float
    target_value: float
    is_completed: bool
    points_earned: int
    streak_count: int
    total_points: int


class MyChallengeResponse(BaseModel):
    challenge_id: int
    name: str
    today_value: float
    target_value: float
    is_completed: bool
    streak_count: int
    completion_rate: float


class StreakResponse(BaseModel):
    current_streak: int
    max_streak: int
    last_completed_at: Optional[str] = None
