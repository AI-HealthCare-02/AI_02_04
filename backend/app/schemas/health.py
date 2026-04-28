from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class HealthRecordRequest(BaseModel):
  water_intake: Optional[float]= None
  steps: Optional[int]= None
  weight: Optional[float] = None
  recorede_at: Optional[datetime]= None

class HealthRecordResonse(BaseModel):
  record_id : int
  recorded_at : datetime
  challenge_achieved: bool = False
  points_earned: int = 0

class GlucoseRequest(BaseModel):
  glucose_level: float
  glucose_type: str
  measured_at: Optional[datetime] = None

class GlucoseResponse(BaseModel):
  glucose_id : int
  glucose_level: float
  glucose_type:  str
  measured_at:  datetime
  challenge_achieved: bool = False

