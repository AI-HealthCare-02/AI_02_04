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
