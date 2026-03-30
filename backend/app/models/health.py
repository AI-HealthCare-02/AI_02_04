from sqlalchemy import (
    Column,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Enum,
    String,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base, TimestampMixin


class GlucoseType(str, enum.Enum):
    fasting = "fasting"
    postprandial = "postprandial"


class HealthRecord(Base, TimestampMixin):
    __tablename__ = "health_records"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    weight = Column(Float, nullable=True)
    water_intake = Column(Float, nullable=True)
    steps = Column(Integer, nullable=True)

    recorded_at = Column(DateTime, default=func.now(), nullable=False)

    user = relationship("User", back_populates="health_records")


class GlucoseLog(Base, TimestampMixin):
    __tablename__ = "glucose_logs"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    glucose_level = Column(Float, nullable=False)
    glucose_type = Column(Enum(GlucoseType), nullable=False)
    memo = Column(String(255), nullable=True)

    measured_at = Column(DateTime, default=func.now(), nullable=False)

    user = relationship("User", back_populates="glucose_logs")


class DiabetesPrediction(Base, TimestampMixin):
    __tablename__ = "diabetes_predictions"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    risk_score = Column(Float, nullable=False)
    risk_level = Column(String(10), nullable=False)
    top_factors = Column(String(500), nullable=True)
    is_improved = Column(Boolean, default=False)

    user = relationship("User", back_populates="diabetes_predictions")
