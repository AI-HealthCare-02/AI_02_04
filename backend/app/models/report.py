from sqlalchemy import Column, Integer, String, JSON, ForeignKey,DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base, TimestampMixin

class WeeklyReport(Base, TimestampMixin):
    __tablename__ = "weekly_reports"
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    report_content = Column(JSON, nullable=False)  
    week_start = Column(DateTime, nullable=False)     
    
    user = relationship("User", back_populates="weekly_report")