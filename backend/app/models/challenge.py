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

from app.core.database import Base, TimestampMixin


class ChallengeType(str, enum.Enum):
    accumulate = "accumulate"  # 누적형 (물, 걸음수 등)
    toggle = "toggle"  # 토글형 (야식 금지 등)


class ChallengeGrade(str, enum.Enum):
    all = "all"
    normal = "normal"
    risk = "risk"
    diabetes = "diabets"


class DifficultType(str, enum.Enum):
    easy = "easy"
    normal = "normal"
    hard = "hard"


class FailReason(str, enum.Enum):
    tired = "tired"
    no_time = "no_time"
    weather = "weather"
    other = "other"


class ExecutionTime(str, enum.Enum):
    morning = "morning"
    afternoon = "afternoon"
    evening = "evening"


class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)  # activity / diet / health 등
    target_value = Column(Float, nullable=False)  # 목표값
    target_unit = Column(String(20), nullable=False)  # steps / L / min 등
    points = Column(Integer, nullable=False)  # 달성 시 포인트
    grade = Column(Enum(ChallengeGrade), nullable=False, default=ChallengeGrade.all)
    difficulty = Column(
        Enum(DifficultType), nullable=False, default=DifficultType.normal
    )
    challenge_type = Column(Enum(ChallengeType), nullable=False)

    is_active = Column(Boolean, default=True)

    completion_rate = Column(Float, default=0.0)
    redesign_count = Column(Integer, default=0)

    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(
        DateTime, default=func.now(), onupdate=func.now(), nullable=False
    )

    user = relationship("User", back_populates="challenges")
    challenge_logs = relationship("ChallengeLog", back_populates="challenge")


# 챌린지 로그
class ChallengeLog(Base, TimestampMixin):
    __tablename__ = "challenge_logs"

    challenge_id = Column(
        Integer, ForeignKey("challenges.id"), nullable=False, index=True
    )
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    value = Column(Float, nullable=False)  # 누적값 or 1/0
    is_completed = Column(Boolean, default=False)  # 달성 여부
    points_earned = Column(Integer, default=0)  # 획득 포인트
    streak_count = Column(Integer, default=0)  # 연속 달성 수

    fail_reason = Column(Enum(FailReason), nullable=True)  # 실패 이유
    execution_time = Column(Enum(ExecutionTime), nullable=True)  # 실행 시간대

    challenge = relationship("Challenge", back_populates="challenge_logs")
    user = relationship("User", back_populates="challenge_logs")


# 포인트
class Point(Base, TimestampMixin):
    __tablename__ = "points"

    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    total_points = Column(Integer, default=0)
    this_week_earned = Column(Integer, default=0)  # 이번 주 획득 포인트

    user = relationship("User", back_populates="points")


class PointHistory(Base, TimestampMixin):
    __tablename__ = "point_history"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    amount = Column(Integer, nullable=False)
    reason = Column(String(255), nullable=False)

    user = relationship("User", back_populates="point_history")
