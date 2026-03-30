from sqlalchemy import (
    Column,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    String,
    Enum,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class HighlightType(str, enum.Enum):
    calories = "calories"  # normal + 다이어트
    protein = "protein"  # normal + 운동
    carbs = "carbs"  # risk / 당뇨


# 1. Refresh Token 저장
#    → 로그아웃 시 토큰 무효화 필요
#    → DB에 저장하면 매 요청마다 DB 조회 → 느림
#    → Redis에 저장하면 빠름

# 2. Rate Limiting
#    → API 요청 횟수 제한 (재측정 하루 1회 등)
#    → POST /predict 하루 1회 제한

# 3. 캐싱
#    → GET /health/dashboard 집계 쿼리 → 매번 계산 비용 큼
#    → Redis 캐싱으로 빠르게


class DietLog(Base):
    __tablename___ = "diet_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    food_name = Column(String(255), nullable=False)
    image_url = Column(String(500), nullable=True)

    calories = Column(Float, nullable=True)
    carbs = Column(Float, nullable=True)
    protein = Column(Float, nullable=True)
    sugar = Column(Float, nullable=True)
    fiber = Column(Float, nullable=True)
    gi_index = Column(Integer, nullable=True)

    diet_score = Column(Integer, nullable=True)
    highlight = Column(
        Enum(HighlightType), nullable=True
    )  # 등급별 강조 영양소 프론트에서 ㅂ보여줄 것
    challenge_achieved = Column(Boolean, default=False)
    points_earned = Column(Integer, default=0)

    is_manual = Column(Boolean, default=False)

    created_at = Column(DateTime, default=func.now(), nullable=False)

    user = relationship("User", back_populates="diet_logs")
