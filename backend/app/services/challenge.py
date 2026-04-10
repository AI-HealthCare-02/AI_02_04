from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from datetime import date, datetime
from typing import Optional, List

from app.models.challenge import (
    Challenge,
    ChallengeLog,
    ChallengeType,
    ChallengeGrade,
    DifficultType,
    FailReason,
    ExecutionTime,
    Point,
    PointHistory,
)

from app.models.character import Character
from app.models.user import User, UserType, GoalType

LEVEL_EXP = {1: 200, 2: 500, 3: 1000, 4: 2000}

DEFAULT_CHALLENGES = {
    "all": [
        {
            "name": "만보 걷기",
            "category": "activity",
            "target_value": 10000,
            "target_unit": "steps",
            "points": 10,
            "challenge_type": "accumulate",
            "difficulty": "normal",
        },
        {
            "name": "물 2L 마시기",
            "category": "health",
            "target_value": 2.0,
            "target_unit": "L",
            "points": 10,
            "challenge_type": "accumulate",
            "difficulty": "normal",
        },
        {
            "name": "야식 금지",
            "category": "diet",
            "target_value": 1,
            "target_unit": "check",
            "points": 10,
            "challenge_type": "toggle",
            "difficulty": "normal",
        },
        {
            "name": "30분 운동",
            "category": "activity",
            "target_value": 1,
            "target_unit": "check",
            "points": 10,
            "challenge_type": "toggle",
            "difficulty": "normal",
        },
    ],
    "risk": [
        {
            "name": "탄수화물 줄이기",
            "category": "diet",
            "target_value": 1,
            "target_unit": "check",
            "points": 15,
            "challenge_type": "toggle",
            "difficulty": "normal",
        },
    ],
    "diabetes": [
        {
            "name": "혈당 기록하기",
            "category": "health",
            "target_value": 1,
            "target_unit": "check",
            "points": 15,
            "challenge_type": "toggle",
            "difficulty": "normal",
        },
        {
            "name": "인슐린 체크",
            "category": "health",
            "target_value": 1,
            "target_unit": "check",
            "points": 20,
            "challenge_type": "toggle",
            "difficulty": "normal",
        },
    ],
}


def create_default_challenges(db: Session, user: User) -> None:
    challenges_to_create = DEFAULT_CHALLENGES["all"].copy()

    if user.user_type.value == "rist":
        challenges_to_create += DEFAULT_CHALLENGES["risk"]
    elif user.user_type.value == "diabetes":
        challenges_to_create += DEFAULT_CHALLENGES["risk"]
        challenges_to_create += DEFAULT_CHALLENGES["diabetes"]

    for c in challenges_to_create:
        challenge = Challenge(
            user_id=user.id,
            name=c["name"],
            category=c["category"],
            target_value=c["target_value"],
            target_unit=c["target_unit"],
            points=c["points"],
            grade=ChallengeGrade.all,
            difficulty=DifficultType(c["difficulty"]),
            challenge_type=ChallengeType(c["challenge_type"]),
        )

        db.add(challenge)

    existing_point = db.query(Point).filter(Point.user_id == user.id).first()
    if not existing_point:
        point = Point(user_id=user.id, total_points=0, this_week_earned=0)
        db.add(point)

        db.commit()


def get_challenges(db: Session, user_id: int) -> List[Challenge]:
    return (
        db.query(Challenge)
        .filter(Challenge.user_id == user_id, Challenge.is_active == True)
        .all()
    )


def get_today_logs(db: Session, user_id: int) -> dict:
    today = date.today()
    logs = (
        db.query(ChallengeLog)
        .filter(
            ChallengeLog.user_id == user_id,
            cast(ChallengeLog.created_at, Date) == today,
        )
        .all()
    )
    return {log.challenge_id: log for log in logs}


def log_challenge(
    db: Session,
    user_id: int,
    challenge_id: int,
    value: float,
    fail_reason: Optional[str] = None,
    execution_time: Optional[str] = None,
) -> dict:
    challenge = (
        db.query(Challenge)
        .filter(
            Challenge.id == challenge_id,
            Challenge.user_id == user_id,
            Challenge.is_active == True,
        )
        .first()
    )

    if not challenge:
        raise ValueError("챌린지를 찾을 수 없습니다.")

    today = date.today()

    existing_log = (
        db.query(ChallengeLog)
        .filter(
            ChallengeLog.challenge_id == challenge_id,
            ChallengeLog.user_id == user_id,
            cast(ChallengeLog.created_at, Date) == today,
        )
        .first()
    )

    if challenge.challenge_type == ChallengeType.accumulate: #type:ignore
        if existing_log:
            existing_log.value += value  # type:ignore
            today_total = existing_log.value
        else:
            existing_log = ChallengeLog(
                challenge_id=challenge_id,
                user_id=user_id,
                value=value,
                fail_reason=FailReason(fail_reason) if fail_reason else None,
                execution_time=(
                    ExecutionTime(execution_time) if execution_time else None
                ),
            )
            db.add(existing_log)
            today_total = value

        is_completed = today_total >= challenge.target_value
        existing_log.is_completed = is_completed  # type: ignore
    else:
        if existing_log:
            existing_log.value = value  # type: ignore
            existing_log.is_completed = value == 1  # type: ignore
        else:
            existing_log = ChallengeLog(
                challenge_id=challenge_id,
                user_id=user_id,
                value=value,
                is_completed=value == 1,
                points_earned=0,
                fail_reason=FailReason(fail_reason) if fail_reason else None,
                execution_time=(
                    ExecutionTime(execution_time) if execution_time else None
                ),
            )
            db.add(existing_log)
            db.flush()

        today_total = value
        is_completed = value == 1
    points_earned = 0
    if is_completed and existing_log.points_earned == 0: #type:ignore
        points_earned = challenge.points
        existing_log.points_earned = points_earned  # type: ignore

        point = db.query(Point).filter(Point.user_id == user_id).first()
        if point:
            point.total_points += points_earned  # type: ignore
            point.this_week_earned += points_earned  # type: ignore

        from app.models.challenge import PointHistory

        history = PointHistory(
            user_id=user_id,
            amount=points_earned,
            reason=f"{challenge.name} 달성",
        )
        db.add(history)

        _update_character_exp(db, user_id, points_earned)# type: ignore

    # streak 계산
    streak_count = _calculate_streak(db, user_id, challenge_id)
    existing_log.streak_count = streak_count  # type: ignore

    # streak 보너스
    if is_completed and streak_count in [3, 7]:  # type: ignore
        bonus = 50 if streak_count == 3 else 150
        _add_bonus_exp(db, user_id, bonus, f"{streak_count}일 연속 달성 보너스")

    db.commit()
    db.refresh(existing_log)

    # 총 포인트 조회
    point = db.query(Point).filter(Point.user_id == user_id).first()
    total_points = point.total_points if point else 0  # type: ignore

    return {
        "challenge_type": challenge.challenge_type.value,
        "today_total": today_total,
        "target_value": challenge.target_value,
        "is_completed": is_completed,
        "points_earned": points_earned,
        "streak_count": streak_count,
        "total_points": total_points,
    }


def _calculate_streak(db: Session, user_id: int, challenge_id: int) -> int:
    logs = (
        db.query(ChallengeLog)
        .filter(
            ChallengeLog.challenge_id == challenge_id,
            ChallengeLog.user_id == user_id,
            ChallengeLog.is_completed == True,
        )
        .order_by(ChallengeLog.created_at.desc())
        .limit(30)
        .all()
    )

    if not logs:
        return 0

    streak = 1
    prev_date = logs[0].created_at.date()

    for log in logs[1:]:
        log_date = log.created_at.date()
        diff = (prev_date - log_date).days
        if diff == 1:
            streak += 1
            prev_date = log_date
        else:
            break

    return streak


def _update_character_exp(db: Session, user_id: int, exp: int) -> None:
    character = db.query(Character).filter(Character.user_id == user_id).first()

    if not character:
        return

    character.exp += exp  # type: ignore

    while character.level < 5:  # type: ignore
        required_exp = LEVEL_EXP.get(character.level, 9999)  # type: ignore
        if character.exp >= required_exp:  # type: ignore
            character.level += 1  # type: ignore
            character.exp -= required_exp  # type: ignore

            if character.level >= 5:  # type: ignore
                character.is_graduated = True  # type: ignore
                character.graduated_at = datetime.utcnow()  # type: ignore
        else:
            break


def _add_bonus_exp(db: Session, user_id: int, bonus: int, reason: str) -> None:
    point = db.query(Point).filter(Point.user_id == user_id).first()
    if point:
        point.total_points += bonus  # type: ignore

    from app.models.challenge import PointHistory

    history = PointHistory(user_id=user_id, amount=bonus, reason=reason)
    db.add(history)

    _update_character_exp(db, user_id, bonus)


def get_streak_summary(db: Session, user_id: int) -> dict:
    logs = (
        db.query(ChallengeLog)
        .filter(
            ChallengeLog.user_id == user_id,
            ChallengeLog.is_completed == True,
        )
        .order_by(ChallengeLog.created_at.desc())
        .all()
    )

    if not logs:
        return {"current_streak": 0, "max_streak": 0, "last_completed_at": None}

    # 날짜별 달성 여부
    completed_dates = sorted(set(log.created_at.date() for log in logs), reverse=True)

    # 현재 streak
    current_streak = 1
    for i in range(1, len(completed_dates)):
        diff = (completed_dates[i - 1] - completed_dates[i]).days
        if diff == 1:
            current_streak += 1
        else:
            break

    # 최대 streak
    max_streak = 1
    temp = 1
    for i in range(1, len(completed_dates)):
        diff = (completed_dates[i - 1] - completed_dates[i]).days
        if diff == 1:
            temp += 1
            max_streak = max(max_streak, temp)
        else:
            temp = 1

    return {
        "current_streak": current_streak,
        "max_streak": max_streak,
        "last_completed_at": str(completed_dates[0]) if completed_dates else None,
    }
