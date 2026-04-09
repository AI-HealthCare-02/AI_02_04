"""
Quality Gate — 입력 데이터 품질 검증.

왜 이 모듈이 필요한가:
- 사용자가 혈압 300/200을 입력하면 AI 추천의 기반 데이터가 오염된다.
- '측정의 질 관리'는 이 서비스의 핵심 차별점 중 하나다.
- 이상치를 감지하고, quality_score를 부여하여 AI가 신뢰할 수 있는 데이터만 사용하게 한다.
"""
from dataclasses import dataclass, field


@dataclass
class QualityCheckResult:
    quality_score: float  # 0.0~1.0
    flags: list[str] = field(default_factory=list)
    requires_reentry: bool = False
    escalation_needed: bool = False
    escalation_message: str = ""


class QualityGate:
    """건강 데이터 입력의 품질을 검증하고 점수를 부여한다."""

    # ── 혈압 범위 (정상 범위 밖이면 경고, 극단값이면 재입력 요청) ──
    BP_RANGES = {
        "normal": {"systolic": (90, 140), "diastolic": (60, 90)},
        "warning": {"systolic": (70, 200), "diastolic": (40, 130)},
        "critical": {"systolic": (40, 300), "diastolic": (20, 200)},
    }

    # ── 혈당 범위 ──
    GLUCOSE_RANGES = {
        "normal_fasting": (70, 130),
        "normal_postprandial": (70, 180),
        "warning": (50, 300),
        "critical": (20, 600),
    }

    # ── Escalation 임계값 ──
    ESCALATION_BP_SYSTOLIC = 180
    ESCALATION_BP_DIASTOLIC = 120
    ESCALATION_GLUCOSE_HIGH = 250
    ESCALATION_GLUCOSE_LOW = 50

    def check_blood_pressure(
        self, systolic: int, diastolic: int
    ) -> QualityCheckResult:
        """혈압 데이터 품질 검증."""
        flags = []
        score = 1.0

        # 기본 유효성
        if systolic <= diastolic:
            return QualityCheckResult(
                quality_score=0.0,
                flags=["invalid_bp_relationship"],
                requires_reentry=True,
            )

        # Escalation 감지 (위험 수준)
        if systolic >= self.ESCALATION_BP_SYSTOLIC or diastolic >= self.ESCALATION_BP_DIASTOLIC:
            return QualityCheckResult(
                quality_score=0.8,  # 데이터 자체는 유효할 수 있음
                flags=["escalation_high_bp"],
                escalation_needed=True,
                escalation_message=(
                    "혈압이 매우 높게 측정되었습니다. "
                    "측정값이 정확하다면 담당 의료진과 상담하시길 권장합니다."
                ),
            )

        # Warning 범위
        s_warn = self.BP_RANGES["warning"]["systolic"]
        d_warn = self.BP_RANGES["warning"]["diastolic"]
        if not (s_warn[0] <= systolic <= s_warn[1]):
            flags.append("systolic_out_of_warning_range")
            score = 0.3
        if not (d_warn[0] <= diastolic <= d_warn[1]):
            flags.append("diastolic_out_of_warning_range")
            score = min(score, 0.3)

        # Normal 범위 밖이면 살짝 감점
        s_norm = self.BP_RANGES["normal"]["systolic"]
        d_norm = self.BP_RANGES["normal"]["diastolic"]
        if not (s_norm[0] <= systolic <= s_norm[1]):
            if "systolic_out_of_warning_range" not in flags:
                flags.append("systolic_elevated")
                score = min(score, 0.8)
        if not (d_norm[0] <= diastolic <= d_norm[1]):
            if "diastolic_out_of_warning_range" not in flags:
                flags.append("diastolic_elevated")
                score = min(score, 0.8)

        return QualityCheckResult(
            quality_score=score,
            flags=flags,
            requires_reentry=score < 0.3,
        )

    def check_glucose(
        self, value: float, glucose_type: str = "fasting"
    ) -> QualityCheckResult:
        """혈당 데이터 품질 검증."""
        flags = []
        score = 1.0

        # Escalation
        if value >= self.ESCALATION_GLUCOSE_HIGH:
            return QualityCheckResult(
                quality_score=0.8,
                flags=["escalation_high_glucose"],
                escalation_needed=True,
                escalation_message=(
                    "혈당이 매우 높게 측정되었습니다. "
                    "측정값이 정확하다면 담당 의료진과 상담하시길 권장합니다."
                ),
            )
        if value <= self.ESCALATION_GLUCOSE_LOW:
            return QualityCheckResult(
                quality_score=0.8,
                flags=["escalation_low_glucose"],
                escalation_needed=True,
                escalation_message=(
                    "혈당이 매우 낮게 측정되었습니다. "
                    "저혈당 증상이 있으시면 즉시 의료진과 상담하시길 권장합니다."
                ),
            )

        # 정상 범위 확인
        if glucose_type == "fasting":
            normal = self.GLUCOSE_RANGES["normal_fasting"]
        else:
            normal = self.GLUCOSE_RANGES["normal_postprandial"]

        if not (normal[0] <= value <= normal[1]):
            flags.append(f"{glucose_type}_out_of_normal")
            score = 0.8

        warning = self.GLUCOSE_RANGES["warning"]
        if not (warning[0] <= value <= warning[1]):
            flags.append("glucose_out_of_warning_range")
            score = 0.3

        return QualityCheckResult(
            quality_score=score,
            flags=flags,
            requires_reentry=score < 0.3,
        )

    def check_activity(self, steps: int = 0, exercise_minutes: int = 0) -> QualityCheckResult:
        """활동 데이터 품질 검증."""
        flags = []
        score = 1.0

        if steps > 50000:
            flags.append("unusually_high_steps")
            score = 0.5
        if exercise_minutes > 300:
            flags.append("unusually_long_exercise")
            score = min(score, 0.5)

        return QualityCheckResult(quality_score=score, flags=flags)
