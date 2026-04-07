from pydantic import BaseModel
from typing import Optional, List

class WeightTrend(BaseModel):
  date: str
  value : float

class RiskTrend(BaseModel):
    date: str
    risk_level: str
    risk_score: float

class GlucoseTrend(BaseModel):
    date: str
    fasting: Optional[float] = None
    postprandial: Optional[float] = None

class NormalDashboard(BaseModel):
  user_type: str
  goal: Optional[str]
  weekly_steps_avg: int
  challenge_rate : float
  weight_trend : List[WeightTrend]

class RiskDashboard(BaseModel):
  risk_score: float
  risk_level : str
  weekly_steps_avg: int
  challenge_rate : float
  risk_trend: List[RiskTrend]

class DiabetesDashboard(BaseModel):
  latest_glucose : float
  weekly_steps_avg :int
  challenge_rate: float
  glucose_trend: List[GlucoseTrend]  