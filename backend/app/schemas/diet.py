from pydantic import BaseModel
from typing import Optional
from datetime import datetime



class DietLogResponse(BaseModel):
  diet_id: int
  food_name: str
  calories: Optional[float]
  carbs: Optional[float]
  protein: Optional[float]
  diet_score: Optional[int]
  image_url: Optional[str]
  created_at: datetime


class ManualInputRequest(BaseModel):
  food_name : str