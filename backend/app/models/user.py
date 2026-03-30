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


class GenderType(str, enum.Enum):
    male = "male"
    female = "female"


class User(Base):
    __tablename__ = "users"

    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=True)
    sex = Column(Enum(GenderType), nullable=True)
    height = Column(Float, nullable=True)
    weight = Column(Float, nullable=True)

    user_type = Column(Enum(UserType), nullable=False, default=UserType.normal)
    goal = Column(Enum(GoalType), nullable=True)
    risk_level = Column(Enum(RiskLevel), nullable=True)
    diabetes_type = Column(Enum(DiabetesType), nullable=True)

    high_bp = Column(Boolean, nullable=True)
    high_chol = Column(Boolean, nullable=True)
    heart_disease = Column(Boolean, nullable=True)
    heavy_alcohol = Column(Boolean, nullable=True)
    gen_hlth = Column(Integer, nullable=True)
    diff_walk = Column(Boolean, nullable=True)

    smoke_status = Column(String(50), nullable=True)
    exercise_freq = Column(String(50), nullable=True)
    fruit_intake = Column(String(50), nullable=True)
    veggie_intake = Column(String(50), nullable=True)
    alcohol_status = Column(String(50), nullable=True)
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
