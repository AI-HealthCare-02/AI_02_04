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

from app.core.database import Base


class GlucoseType(str, enum.Enum):
    fasting = "fasting"
    postprandial = "postprandial"


class HealthRecord:
    __tablename__ = "health_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    weight = Column(Float, nullable=True)
    water_intake = Column(Float, nullable=True)
    steps = Column(Integer, nullable=True)

    recorded_at = Column(DateTime, default=func.now(), nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)

    user = relationship("User", back_populates="health_records")


class GlucoseLog(Base):
    __tablename__ = "glucose_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    glucose_level = Column(Float, nullable=False)
    glucose_type = Column(Enum(GlucoseType), nullable=False)
    memo = Column(String(255), nullable=True)

    measured_at = Column(DateTime, default=func.now(), nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)

    user = relationship("User", back_populates="glucose_logs")


class DiabetsPrediction(Base):
    __tablename__ = "diabetes_predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
