from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


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


class User(Base):
    __tablename__ = "users"

    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)

    name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=True)
    sex = Column(Integer, nullable=True)
    height = Column(Float, nullable=True)
    weight = Column(Float, nullable=True)
    bmi = Column(Float, nullable=True)

    user_type = Column(Enum(UserType), nullable=False, default=UserType.normal)
    goal = Column(Enum(GoalType), nullable=True)
    risk_level = Column(Enum(RiskLevel), nullable=True)
    diabetes_type = Column(Enum(DiabetesType), nullable=True)
    # 입력 피쳐입니다
    is_hypertension = Column(Boolean, nullable=True)
    is_cholesterol = Column(Boolean, nullable=True)
    is_heart_disease = Column(Boolean, nullable=True)
    walking_difficulty = Column(Boolean, nullable=True)
    general_health = Column(Integer, nullable=True)
    alcohol_status = Column(Boolean, nullable=True)
    # llm 전용 피쳐입니다
    smoke_status = Column(String(50), nullable=True)
    exercise_freq = Column(String(50), nullable=True)
    fruit_intake = Column(String(50), nullable=True)
    veggie_intake = Column(String(50), nullable=True)
    occupation = Column(String(100), nullable=True)

    isActive = Column(Boolean, defalut=True, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(
        DateTime, default=func.now(), onupdate=func.now(), nullable=False
    )

    health_records = relationship("HealthRecord", back_populates="user")
    glucose_logs = relationship("GlucoseLog", back_populates="user")
    diabetes_predictions = relationship("DiabetesPrediction", back_populates="user")
    diet_logs = relationship("DietLog", back_populates="user")
    challenges = relationship("Challenge", back_populates="user")
    challenge_logs = relationship("ChallengeLog", back_populates="user")
    character = relationship("Character", back_populates="user", uselist=False)
    points = relationship("Point", back_populates="user", uselist=False)
    point_history = relationship("PointHistory", back_populates="user")
