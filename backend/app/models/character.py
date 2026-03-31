from sqlalchemy import (
    Column,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    String,
    Enum,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base, TimestampMixin


class CharacterStatus(str, enum.Enum):
    happy= "happy"
    energetic = "energetic"
    recovering = "recovering"
    tired = "tired"
    struggling ="struggling"


class Character(Base):
    __tablename__ = "characters"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    name = Column(String(50), nullable=False, default="글루")
    char_img_url = Column(String(500), nullable=True)

    level = Column(Integer, default=1, nullable=False)
    exp = Column(Integer, default=0, nullable=False)

    status = Column(
        Enum(CharacterStatus), default=CharacterStatus.energetic, nullable=False
    )

    energy = Column(Integer, default=50)  # 걸음수 기반
    mood = Column(Integer, default=50)  # 챌린지 달성 + 연속 로그인
    stability = Column(Integer, default=50)  # 혈당 기반 (diabetes)
    recovery = Column(Integer, default=50)  # 실패 패턴 기반
    growth = Column(Integer, default=50)  # streak 기반

    # 메시지
    last_message = Column(String(255), nullable=True)  # 캐릭터 한마디

    # 로그인 streak
    last_login_streak = Column(Integer, default=0)
    last_visited_at = Column(DateTime, nullable=True)

    # 졸업 여부 (레벨 5 달성 시)
    is_graduated = Column(Boolean, default=False)
    graduated_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(
        DateTime, default=func.now(), onupdate=func.now(), nullable=False
    )

    user = relationship("User", back_populates="character")
    collection = relationship("CharacterCollection", back_populates="character")
    history = relationship("CharacterHistory", back_populates="character")


class CharacterCollection(Base, TimestampMixin):
    __tablename__ = "character_collections"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    character_id = Column(Integer, ForeignKey("characters.id"), nullable=False)

    name = Column(String(50), nullable=False)  # "글루 1세"
    char_img_url = Column(String(500), nullable=True)  # S3 URL

    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    graduated_at = Column(DateTime, nullable=False)

    character = relationship("Character", back_populates="collection")


class CharacterHistory(Base, TimestampMixin):
    __tablename__ = "character_history"

    character_id = Column(
        Integer, ForeignKey("characters.id"), nullable=False, index=True
    )
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    level = Column(Integer, nullable=False)  # 달성한 레벨
    leveled_up_at = Column(DateTime, default=func.now(), nullable=False)

    character = relationship("Character", back_populates="history")
