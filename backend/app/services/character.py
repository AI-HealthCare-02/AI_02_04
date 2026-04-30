from sqlalchemy.orm import Session
from sqlalchemy import cast, Date, func
from datetime import datetime, date, timedelta,timezone

from app.models.character import Character,CharacterStatus,CharacterCollection,CharacterHistory
from app.models.challenge import ChallengeLog
from app.models.health import HealthRecord,GlucoseLog



def get_or_create_character(db:Session, user_id:int)->Character:
  character = db.query(Character).filter(
    Character.user_id == user_id,
    Character.is_graduated == False
  ).first()

  if not character:
    character = Character(
      user_id = user_id,
      name= "글루",
      level = 1,
      exp = 0,
      status = CharacterStatus.energetic,
      mood = 50,
      stability=50,
      recovery=50,
      growth=50,
      energy = 50
    )
    db.add(character)
    db.commit()
    db.refresh(character)

  return character



def _calc_status(axec:dict) -> str:
  avg =sum(axec.values()) / len(axec.values())
  if avg >= 75:
        return "happy"
  elif avg >= 65:
        return "energetic"
  elif avg >= 45:
        return "recovering"
  elif avg >= 30:
        return "tired"
  else:
        return "struggling"

# calculate_character_state()
#     ↓ axes 딕셔너리 반환
# _calculate_status(axes)
#     ↓ 평균 계산
# "happy" / "normal" / "sad" / "sick" 반환


def calc_character_state(db:Session, user_id: int)->dict:
    today = date.today()
    week_ago = today - timedelta(days=7)
    recent_steps = db.query(func.avg(HealthRecord.steps)).filter(
        HealthRecord.user_id == user_id,
        HealthRecord.steps.isnot(None),
        cast(HealthRecord.recorded_at, Date) >= week_ago,
    ).scalar() or 0
    energy = min(int((recent_steps / 10000) * 100), 100)


    complited  = db.query(func.count(ChallengeLog.id)).filter(ChallengeLog.user_id==user_id, ChallengeLog.is_completed == True, 
      cast(ChallengeLog.updated_at, Date )>=week_ago
                                                          ).scalar() or 0
    total = db.query(func.count(ChallengeLog.id)).filter(
        ChallengeLog.user_id==user_id, cast(ChallengeLog.updated_at, Date )>=week_ago
    ).scalar() or 0

    mood =int((complited / total)* 100) if total > 0 else 50

    recent_glucose = db.query(GlucoseLog).filter(
        GlucoseLog.user_id == user_id,
        cast(GlucoseLog.measured_at, Date) >= week_ago
    ).all()
    
    if recent_glucose:
      normal_count = sum(
        1 for g in recent_glucose
        if 70 <= g.glucose_level <= 180  #type:ignore
    )
      stability = int((normal_count / len(recent_glucose)) * 100)
    else:
      stability = 50

    fail_logs = db.query(func.count(ChallengeLog.id)).filter(
        ChallengeLog.user_id == user_id,
        ChallengeLog.is_completed ==False,
        ChallengeLog.fail_reason.isnot(None),
        cast(ChallengeLog.updated_at, Date) >= week_ago
    ).scalar() or 0

    recovery = max(100 - (fail_logs *10),0) #type:ignore

    max_streak = db.query(func.max(ChallengeLog.streak_count)).filter(ChallengeLog.user_id == user_id).scalar() or 0
    growth = min(max_streak * 10 , 100)

    return {
        "energy" : energy,
        "mood":mood,
        "stability":stability,
        "recovery":recovery,
        "growth":growth
    }

def update_chracter_state(db: Session, user_id: int) ->Character:
    character = get_or_create_character(db, user_id)
    axes = calc_character_state(db, user_id)
    character.energy    = axes["energy"]
    character.mood      = axes["mood"]
    character.stability = axes["stability"]
    character.recovery  = axes["recovery"]
    character.growth    = axes["growth"]
    character.status    = _calc_status(axec=axes)  # type: ignore
    character.last_visited_at = datetime.now(timezone.utc)# type: ignore


    db.commit()
    db.refresh(character)
    return character


def get_character_collection(db:Session, user_id: int):
    return db.query(CharacterCollection).filter(
        CharacterCollection.user_id == user_id,
      
    ).order_by(CharacterCollection.graduated_at.desc()).all()

def get_character_history(db:Session, user_id:int):
    character = get_or_create_character(db, user_id)
    return db.query(CharacterHistory).filter(
        CharacterHistory.character_id == character.id
    ).order_by(CharacterHistory.leveled_up_at.desc()).all()