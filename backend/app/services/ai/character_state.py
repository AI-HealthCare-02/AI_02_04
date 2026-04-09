"""
Character State Calculator — 캐릭터 상태 계산 모듈 (모듈 D).

이 모듈이 하는 일:
- 추천 결과 + 식단 분석 + 실패 패턴을 종합하여
  캐릭터의 5축 상태(energy/mood/stability/recovery/growth)를 계산한다.
- 캐릭터의 대사(말풍선 메시지)를 생성한다.
- 프론트엔드 팀원이 JSON을 받아서 캐릭터 표정/애니메이션을 구현한다.

내가 만드는 건 JSON까지. 캐릭터 그림은 프론트 팀원.
"""
import logging
from dataclasses import dataclass
from datetime import datetime

logger = logging.getLogger(__name__)


@dataclass
class CharacterState:
    energy: int        # 0~100 활동/운동 기반
    mood: int          # 0~100 식사 균형 + 성공/실패 기반
    stability: int     # 0~100 혈당 안정도 + 식사 규칙성
    recovery: int      # 0~100 실패 후 회복 행동 여부
    growth: int        # 0~100 장기 누적 개선도
    overall_state: str # "happy" / "energetic" / "tired" / "recovering" / "struggling"
    message: str       # 캐릭터 대사 (말풍선)


class CharacterStateCalculator:
    """
    추천 + 식단 + 실패 패턴 → 캐릭터 상태 JSON 변환.
    프론트엔드는 이 JSON만 받으면 캐릭터를 그릴 수 있다.
    """

    # ── 상태 판정 기준 ──
    STATE_THRESHOLDS = {
        "happy": 75,       # 평균 75 이상
        "energetic": 65,   # 평균 65 이상
        "recovering": 45,  # 평균 45 이상
        "tired": 30,       # 평균 30 이상
        "struggling": 0,   # 평균 30 미만
    }

    # ── 캐릭터 대사 템플릿 ──
    MESSAGES = {
        "happy": [
            "오늘 컨디션 최고! 이 조자 유지하자! 😊",
            "우리 잘하고 있어! 기분 좋다~",
            "오늘 하루도 잘 보내고 있네! 같이 힘내자!",
        ],
        "energetic": [
            "오늘 꽤 괜찮은 하루야! 조금만 더 힘내볼까?",
            "에너지가 좋아! 식후에 같이 걸을래?",
            "좋은 흐름이야! 저녁도 잘 챙겨먹자~",
        ],
        "recovering": [
            "어제는 좀 힘들었지? 괜찮아, 오늘 천천히 회복하자.",
            "조금 피곤하지만... 같이 하면 괜찮을 거야!",
            "회복 중이야! 무리하지 말고 가볍게 시작하자.",
        ],
        "tired": [
            "오늘 좀 힘드네... 그래도 물 한 잔은 마시자!",
            "피곤하지? 나도 좀 축 처져... 같이 쉬면서 하자.",
            "무리하지 마. 오늘은 작은 것 하나만 해보자.",
        ],
        "struggling": [
            "요즘 힘들었구나... 괜찮아, 내가 옆에 있을게.",
            "완벽하지 않아도 돼. 하나만 해보는 것도 대단한 거야.",
            "다시 시작하는 거 자체가 용기야. 같이 가자!",
        ],
    }

    # ── 식단 반응 메시지 ──
    MEAL_REACTIONS = {
        "balanced": {
            "reaction": "happy",
            "message": "오! 균형 잡힌 식사! 나도 기분 좋아~ 😊",
        },
        "high_carb": {
            "reaction": "worried",
            "message": "탄수화물이 좀 많았어... 식후에 잠깐 걸으면 좋겠다!",
        },
        "high_sodium": {
            "reaction": "thirsty",
            "message": "좀 짠 거 먹었지? 나 목마르다~ 물 한 잔 마시자! 💧",
        },
        "high_sugar": {
            "reaction": "worried",
            "message": "당류가 좀 높았어. 다음 끼니는 단백질 위주로 어때?",
        },
        "low_fiber": {
            "reaction": "suggesting",
            "message": "식이섬유가 부족해. 채소 반찬 하나 추가하면 딱 좋겠다!",
        },
        "late_night": {
            "reaction": "sleepy",
            "message": "이 시간에 먹었구나... 괜찮아, 내일 아침 가볍게 먹으면 회복돼!",
        },
    }

    def calculate_state(
        self,
        user_context: dict,
        recommendations: list = None,
        meal_analysis: dict = None,
        failure_patterns: list = None,
    ) -> dict:
        """
        모든 데이터를 종합하여 캐릭터 상태 JSON을 생성한다.

        Args:
            user_context: 사용자 건강 데이터 (recent_7d_data 포함)
            recommendations: AI 추천 결과 리스트
            meal_analysis: 최근 식단 분석 결과
            failure_patterns: 실패 패턴 분석 결과

        Returns:
            캐릭터 상태 JSON (프론트에서 바로 사용 가능)
        """
        # ── 5축 계산 ──
        energy = self._calc_energy(user_context)
        mood = self._calc_mood(user_context, failure_patterns)
        stability = self._calc_stability(user_context, meal_analysis)
        recovery = self._calc_recovery(user_context, failure_patterns)
        growth = self._calc_growth(user_context)

        # ── 종합 상태 판정 ──
        avg_score = (energy + mood + stability + recovery + growth) / 5
        overall_state = self._determine_state(avg_score)

        # ── 대사 생성 ──
        # 실패 패턴을 dict 리스트로 변환 (다양한 입력 형태 대응)
        pattern_dicts = []
        if failure_patterns:
            for fp in failure_patterns:
                if isinstance(fp, dict):
                    pattern_dicts.append(fp)
                elif hasattr(fp, 'detail'):
                    pattern_dicts.append({"detail": fp.detail, "pattern_type": fp.pattern_type})

        message = self._pick_message(overall_state, pattern_dicts)

        state = CharacterState(
            energy=energy,
            mood=mood,
            stability=stability,
            recovery=recovery,
            growth=growth,
            overall_state=overall_state,
            message=message,
        )

        return {
            "character_state": {
                "energy": state.energy,
                "mood": state.mood,
                "stability": state.stability,
                "recovery": state.recovery,
                "growth": state.growth,
                "overall_state": state.overall_state,
                "message": state.message,
                "avg_score": round(avg_score, 1),
            },
            "generated_at": datetime.utcnow().isoformat(),
        }

    def get_meal_reaction(self, meal_analysis: dict) -> dict:
        """
        식단 분석 결과 → 캐릭터 즉시 반응 JSON.
        사용자가 식사 사진을 올리면 캐릭터가 바로 반응하는 용도.
        """
        if not meal_analysis:
            return {
                "reaction": "neutral",
                "message": "오늘 뭐 먹었어? 사진 보여줘!",
                "energy_change": 0,
            }

        nutrition = meal_analysis.get("recommendation_context", {})

        # 우선순위: 야식 > 고당류 > 고나트륨 > 고탄수 > 저섬유 > 균형
        is_late = meal_analysis.get("is_late_night", False)
        is_high_sugar = nutrition.get("is_high_sugar", False)
        is_high_sodium = nutrition.get("is_high_sodium", False)
        is_high_carb = nutrition.get("carb_density", "") == "high"
        is_low_fiber = nutrition.get("fiber_g", 10) < 3

        if is_late:
            template = self.MEAL_REACTIONS["late_night"]
            energy_change = -2
        elif is_high_sugar:
            template = self.MEAL_REACTIONS["high_sugar"]
            energy_change = -2
        elif is_high_sodium:
            template = self.MEAL_REACTIONS["high_sodium"]
            energy_change = -1
        elif is_high_carb:
            template = self.MEAL_REACTIONS["high_carb"]
            energy_change = -1
        elif is_low_fiber:
            template = self.MEAL_REACTIONS["low_fiber"]
            energy_change = 0
        else:
            template = self.MEAL_REACTIONS["balanced"]
            energy_change = +2

        return {
            "reaction": template["reaction"],
            "message": template["message"],
            "energy_change": energy_change,
            "food_name": meal_analysis.get("classification", {}).get(
                "food_name", "음식"
            ),
        }

    def get_failure_reaction(self, failure_reason: str = None) -> dict:
        """
        챌린지 실패 시 → 캐릭터 반응 JSON.
        벌이 아니라 공감 + 회복 미션 제안.
        """
        reactions = {
            "피곤함": {
                "reaction": "empathetic",
                "message": "피곤했구나... 괜찮아. 내일은 점심 시간에 짧게 해볼까?",
                "recovery_mission": "내일 점심 식후 5분 걷기",
                "recovery_difficulty": "easy",
            },
            "시간부족": {
                "reaction": "understanding",
                "message": "바빴구나! 시간이 없을 땐 짧게라도 괜찮아.",
                "recovery_mission": "내일 아무 때나 5분 스트레칭",
                "recovery_difficulty": "easy",
            },
            "날씨": {
                "reaction": "understanding",
                "message": "날씨가 안 좋았구나. 실내에서 할 수 있는 걸 해볼까?",
                "recovery_mission": "실내 계단 오르기 3분",
                "recovery_difficulty": "easy",
            },
        }

        if failure_reason and failure_reason in reactions:
            return reactions[failure_reason]

        # 기본 반응 (사유 미선택 시)
        return {
            "reaction": "empathetic",
            "message": "오늘 좀 힘들었구나... 괜찮아, 내일 같이 다시 하자!",
            "recovery_mission": "내일 가장 편한 시간에 5분만 움직이기",
            "recovery_difficulty": "easy",
        }

    # ── 내부 계산 메서드 ──

    def _calc_energy(self, ctx: dict) -> int:
        """활동/운동 기반 에너지 계산."""
        recent = ctx.get("recent_7d_data", {})
        steps = recent.get("avg_steps", 0)

        if steps >= 7000:
            return 90
        elif steps >= 5000:
            return 70
        elif steps >= 3000:
            return 50
        elif steps >= 1000:
            return 35
        return 20

    def _calc_mood(self, ctx: dict, patterns: list = None) -> int:
        """식사 균형 + 챌린지 성공/실패 기반 기분 계산."""
        recent = ctx.get("recent_7d_data", {})
        completion = recent.get("challenge_completion_rate", 0.5)

        base_mood = int(completion * 80) + 10  # 0.0→10, 1.0→90

        # 실패 패턴이 많으면 기분 하락
        if patterns:
            penalty = min(len(patterns) * 5, 20)
            base_mood -= penalty

        return max(10, min(100, base_mood))

    def _calc_stability(self, ctx: dict, meal: dict = None) -> int:
        """혈당 안정도 + 식사 규칙성 기반 안정감 계산."""
        recent = ctx.get("recent_7d_data", {})
        glucose = recent.get("avg_glucose_fasting", 100)

        # 혈당 기반 안정도
        if glucose <= 100:
            stability = 90
        elif glucose <= 126:
            stability = 70
        elif glucose <= 150:
            stability = 50
        elif glucose <= 200:
            stability = 30
        else:
            stability = 15

        # 고나트륨/고탄수 식사 시 감점
        if meal:
            nutrition = meal.get("recommendation_context", {})
            if nutrition.get("is_high_sodium"):
                stability -= 10
            if nutrition.get("is_high_sugar"):
                stability -= 10

        return max(10, min(100, stability))

    def _calc_recovery(self, ctx: dict, patterns: list = None) -> int:
        """실패 후 회복 행동 여부 기반 회복력 계산."""
        if not patterns:
            return 80  # 패턴 없으면 양호

        # 실패 패턴이 적을수록 회복력 높음
        pattern_count = len(patterns)
        if pattern_count <= 1:
            return 75
        elif pattern_count <= 2:
            return 60
        elif pattern_count <= 3:
            return 45
        return 30

    def _calc_growth(self, ctx: dict) -> int:
        """장기 누적 개선도. MVP에서는 챌린지 달성률 기반 간단 계산."""
        recent = ctx.get("recent_7d_data", {})
        completion = recent.get("challenge_completion_rate", 0.5)

        # 달성률이 높을수록 성장
        return max(10, min(100, int(completion * 90) + 10))

    def _determine_state(self, avg_score: float) -> str:
        """평균 점수로 종합 상태 판정."""
        if avg_score >= 75:
            return "happy"
        elif avg_score >= 65:
            return "energetic"
        elif avg_score >= 45:
            return "recovering"
        elif avg_score >= 30:
            return "tired"
        return "struggling"

    def _pick_message(self, state: str, failure_patterns: list = None) -> str:
        """상태 + 실패 패턴에 맞는 맞춤형 대사를 생성."""
        import random

        # 실패 패턴이 있으면 패턴에 맞춘 공감 대사 우선
        if failure_patterns and state in ("tired", "recovering", "struggling"):
            pattern = failure_patterns[0]  # 가장 주요한 패턴
            detail = pattern.get("detail", "") if isinstance(pattern, dict) else str(pattern)

            # 시간대 실패
            if "저녁" in detail:
                return f"저녁에 힘들었구나... 내일은 점심에 같이 해볼까? 짧게 5분만!"
            elif "아침" in detail:
                return f"아침이 힘들었구나... 점심이나 저녁에 해보는 건 어때?"

            # 요일 실패
            if "요일" in detail:
                day = detail.split("요일")[0][-1] + "요일" if "요일" in detail else ""
                return f"{day}에 자주 힘들었구나... 그날은 목표를 살짝 낮춰볼까?"

            # 트리거 실패
            if "피곤" in detail:
                return "피곤했구나... 괜찮아. 오늘은 물 한 잔만 마시는 것도 충분해!"
            elif "시간" in detail or "바쁘" in detail:
                return "바빴구나! 5분만 투자하면 되는 걸로 바꿔볼까?"
            elif "날씨" in detail:
                return "날씨가 안 좋았구나. 실내에서 스쿼트 5개만 해볼까?"
            elif "스트레스" in detail:
                return "스트레스 받았구나... 심호흡 3번만 같이 하자. 그것도 운동이야!"

            # 연속 실패
            if "연속" in detail:
                return "며칠 힘들었지? 괜찮아. 오늘 딱 하나만 해보자. 내가 응원할게!"

        # 기본 대사 (실패 패턴이 없거나 happy/energetic 상태)
        messages = self.MESSAGES.get(state, self.MESSAGES["recovering"])
        return random.choice(messages)