from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CharacterStateResponse(BaseModel):
    char_id: int
    name: str
    char_img_url: Optional[str] = None
    level: int
    exp: int
    status: str
    energy: int
    mood: int
    stability: int
    recovery: int
    growth: int
    last_message: Optional[str] = None
    last_login_streak: int
    is_graduated: bool
    last_visited_at: Optional[datetime] = None


class CharacterCollectionResponse(BaseModel):
    collection_id :int
    char_id : int
    name : str
    char_img_url : Optional[str] = None
    graduated_at :datetime
    period_start :datetime
    period_end :datetime

class CharacterHistoryResponse(BaseModel):
    level: int
    leveled_up_at: datetime


