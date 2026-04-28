"""
Escalation Gateway.

왜 이 모듈이 필요한가:
- 급격한 혈압/혈당 변화 감지 시 AI 추천을 중단하고 '의료진 상담 안내'로 전환한다.
- RAG 파이프라인 진입 전에 실행되어, 위험 상황에서 불필요한 AI 호출을 방지한다.
- Safety Layer의 L5(최종 방어선) 역할.
"""
from dataclasses import dataclass
from datetime import date, timedelta
import logging

logger = logging.getLogger(__name__)


@dataclass
class EscalationCheckResult:
    should_escalate: bool
    reason: str = ""
    message: str = ""
    severity: str = "info"  # info, warning, critical


class EscalationGateway:
    """
    사용자 건강 데이터의 위험 신호를 감지한다.
    이 모듈이 'escalate'를 반환하면, AI 추천 파이프라인을 실행하지 않고
    즉시 '의료진 상담 안내' 메시지를 반환한다.
    """

    def check_vital_signs(self, user_context: dict) -> EscalationCheckResult:
        """최근 건강 데이터에서 위험 신호를 감지."""

        recent_data = user_context.get("recent_7d_data", {})

        # ── Check 1: 혈압 위험 수준 ──
        avg_bp = recent_data.get("avg_bp", {})
        systolic = avg_bp.get("systolic", 0)
        diastolic = avg_bp.get("diastolic", 0)

        if systolic >= 180 or diastolic >= 120:
            return EscalationCheckResult(
                should_escalate=True,
                reason="critical_high_bp",
                severity="critical",
                message=(
                    "최근 혈압 측정값이 매우 높습니다 "
                    f"({systolic}/{diastolic}mmHg). "
                    "담당 의료진과 상담하시길 권장합니다. "
                    "AI 생활습관 추천은 혈압이 안정된 후에 제공됩니다."
                ),
            )

        # ── Check 2: 혈당 위험 수준 ──
        avg_glucose = recent_data.get("avg_glucose_fasting", 0)

        if avg_glucose >= 250:
            return EscalationCheckResult(
                should_escalate=True,
                reason="critical_high_glucose",
                severity="critical",
                message=(
                    f"최근 공복 혈당 평균이 매우 높습니다 ({avg_glucose}mg/dL). "
                    "담당 의료진과 상담하시길 권장합니다."
                ),
            )
        if 0 < avg_glucose <= 50:
            return EscalationCheckResult(
                should_escalate=True,
                reason="critical_low_glucose",
                severity="critical",
                message=(
                    f"최근 공복 혈당 평균이 매우 낮습니다 ({avg_glucose}mg/dL). "
                    "저혈당 위험이 있으므로 담당 의료진과 상담하시길 권장합니다."
                ),
            )

        # ── Check 3: 장기 미측정 ──
        days_since_last = recent_data.get("days_since_last_measurement", 0)
        if days_since_last >= 7:
            return EscalationCheckResult(
                should_escalate=False,  # escalation은 아니지만 경고
                reason="long_measurement_gap",
                severity="warning",
                message=(
                    f"{days_since_last}일 동안 측정 기록이 없습니다. "
                    "정기적인 측정은 건강 관리의 첫걸음입니다. "
                    "오늘 혈압/혈당을 측정해보세요."
                ),
            )

        # ── Check 4: 급격한 변화 추이 ──
        bp_trend = recent_data.get("bp_trend_direction", "stable")
        if bp_trend == "rapidly_increasing":
            return EscalationCheckResult(
                should_escalate=True,
                reason="rapid_bp_increase",
                severity="warning",
                message=(
                    "최근 7일간 혈압이 급격히 상승하는 추세입니다. "
                    "담당 의료진과 상담하여 현재 관리 방법을 점검하시길 권장합니다."
                ),
            )

        return EscalationCheckResult(should_escalate=False)
