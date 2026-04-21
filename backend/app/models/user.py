from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base, TimestampMixin


class UserType(str, enum.Enum):
    normal = "normal"
    risk = "risk"
    diabetes = "diabetes"


class GoalType(str, enum.Enum):
    diet = "diet"
    maintain = "maintain"
    fitness = "fitness"


class DiabetesType(str, enum.Enum):
    type1 = "1type"
    type2 = "2type"


class RiskLevel(str, enum.Enum):
    low = "low"
    mid = "mid"
    high = "high"


class User(Base, TimestampMixin):
    __tablename__ = "users"

    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    kakao_id = Column(String, unique=True, nullable=True)

    nickname = Column(String(100), nullable=False)
    age = Column(Integer, nullable=True)
    gender = Column(Integer, nullable=True)  # 0=여, 1=남
    height = Column(Float, nullable=True)
    weight = Column(Float, nullable=True)
    bmi = Column(Float, nullable=True)

    # 등급 체계
    user_type = Column(Enum(UserType), nullable=False, default=UserType.normal)
    goal = Column(Enum(GoalType), nullable=True)
    risk_level = Column(Enum(RiskLevel), nullable=True)
    diabetes_type = Column(Enum(DiabetesType), nullable=True)

    # ML 피처
    is_hypertension = Column(Boolean, nullable=True)
    is_cholesterol = Column(Boolean, nullable=True)
    is_heart_disease = Column(Boolean, nullable=True)
    walking_difficulty = Column(Boolean, nullable=True)
    general_health = Column(Integer, nullable=True)
    alcohol_status = Column(Boolean, nullable=True)

    # LLM 피처
    smoke_status = Column(Boolean, nullable=True)
    exercise_freq = Column(Integer, nullable=True)
    fruit_intake = Column(Boolean, nullable=True)
    veggie_intake = Column(Boolean, nullable=True)
    occupation = Column(String(100), nullable=True)

    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    health_records = relationship("HealthRecord", back_populates="user")
    glucose_logs = relationship("GlucoseLog", back_populates="user")
    diabetes_predictions = relationship("DiabetesPrediction", back_populates="user")
    diet_logs = relationship("DietLog", back_populates="user")
    challenges = relationship("Challenge", back_populates="user")
    challenge_logs = relationship("ChallengeLog", back_populates="user")
    character = relationship("Character", back_populates="user", uselist=False)
    points = relationship("Point", back_populates="user", uselist=False)
    point_history = relationship("PointHistory", back_populates="user")

    weekly_reports = relationship("WeeklyReport", back_populates="user")
