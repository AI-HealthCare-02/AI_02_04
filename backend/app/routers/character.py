from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.deps import get_current_user
from app.services import character as character_service


router = APIRouter()

@router.get("")
def get_character(
  current_user: dict = Depends(get_current_user),
  db: Session = Depends(get_db)
):
  user_id = current_user["user_id"]
  character = character_service.update_chracter_state(db, user_id)

  return {
    "success" : True,
    "data" :{
      "char_id" :character.id ,
      "name" : character.name,
      "level" : character.level,
      "exp"  : character.exp,
      "status" : character.status.value,
      "energy" : character.energy,
      "mood":       character.mood,
      "stability":  character.stability,
      "recovery":   character.recovery,
      "growth":     character.growth,
      "last_message": character.last_message,
      "last_login_streak" : character.last_login_streak,
      "last_visited_at":  character.last_visited_at,
      "is_graduated" : character.is_graduated,
      "graduated_at" : character.graduated_at,
      "created_at": character.created_at,
      "char_image_url": character.char_img_url
    }
  }


@router.get("/collection")
def get_collection(
  current_user: dict = Depends(get_current_user),
  db: Session = Depends(get_db)
):
  collections = character_service.get_character_collection(db, current_user["user_id"])
  return {
        "success": True,
        "data": [
            {
                "collection_id": c.id,
                "char_id":       c.character_id,
                "name":          c.name,
                "char_img_url":  c.char_img_url,
                "graduated_at":  c.graduated_at,
                "period_start":  c.period_start,
                "period_end":    c.period_end,
            }
            for c in collections
        ]
    }



@router.get('/history')
def get_history(
  current_user: dict = Depends(get_current_user),
  db: Session = Depends(get_db)
):
  history = character_service.get_character_history(db,user_id )
  return {
        "success": True,
        "data": [
            {
                "level":         h.level,
                "leveled_up_at": h.leveled_up_at,
            }
            for h in history
        ]
  }

