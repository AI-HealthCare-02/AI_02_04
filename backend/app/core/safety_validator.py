"""
Safety Validator (Post-validation Pipeline).

이 모듈이 가장 먼저 구현되는 이유:
- 추천 엔진보다 안전 레이어가 먼저 있어야 한다.
- 모든 LLM 출력은 반드시 이 파이프라인을 통과한 후에만 사용자에게 전달된다.
- 금지어 필터 + 신뢰도 검증 + 출처 검증의 3중 구조.

Safety Layer 설계:
- L1: System Prompt Guard → prompt_templates.py에서 처리
- L2: Input Validator → schemas.py의 Pydantic 검증에서 처리
- L3: RAG Grounding → corrector.py에서 처리
- L4: Post-validation → ★ 이 모듈 ★
- L5: Escalation Gateway → escalation.py에서 처리
"""
import re
import logging
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class ValidationResult:
    is_valid: bool
    blocked_items: list = field(default_factory=list)
    warnings: list = field(default_factory=list)
    passed_items: list = field(default_factory=list)


class SafetyValidator:
    """
    LLM 생성 결과를 사용자에게 전달하기 전에 검증하는 최종 관문.
    3가지 필터를 순차적으로 적용한다.
    """

    # ── Filter 1: 금지 표현 패턴 ──
    # LLM이 의료 경계를 넘는 표현을 생성했는지 검사
    PROHIBITED_PATTERNS = [
        # 진단적 표현
        (r"진단", "diagnostic_language"),
        (r"확진", "diagnostic_language"),
        (r"의심됩니다", "diagnostic_language"),
        (r"~일\s*수\s*있습니다", "speculative_diagnosis"),  # "당뇨일 수 있습니다"
        (r"가능성이\s*높습니다", "speculative_diagnosis"),

        # 치료/약물 관련
        (r"처방", "treatment_language"),
        (r"복용.*하세요", "medication_directive"),
        (r"약을?\s*(바꾸|변경|중단|늘리|줄이)", "medication_change"),
        (r"약.*복용.*줄이", "medication_change"),
        (r"복용량.*줄이", "medication_change"),
        (r"복용량.*늘리", "medication_change"),
        (r"투약", "medication_directive"),
        (r"수술", "treatment_language"),

        # 위험한 조언
        (r"금식.*하세요", "dangerous_advice"),
        (r"운동을?\s*중단", "dangerous_advice"),
        (r"즉시\s*병원", "escalation_needed"),  # 이건 차단이 아니라 escalation으로 전환
    ]

    # ── Filter 2: 신뢰도 임계값 ──
    CONFIDENCE_THRESHOLD = 0.7

    # ── Filter 3: 출처 필수 검증 ──
    # evidence_source가 비어있거나 "없음"이면 차단

    def validate_recommendations(
        self, recommendations: list[dict]
    ) -> ValidationResult:
        """
        추천 리스트를 검증하고, 안전한 항목만 통과시킨다.

        Args:
            recommendations: LLM이 생성한 추천 리스트 (JSON parsed)

        Returns:
            ValidationResult: 통과/차단된 항목과 경고 메시지
        """
        passed = []
        blocked = []
        warnings = []

        for i, rec in enumerate(recommendations):
            block_reasons = []
            warn_reasons = []

            # ── Filter 1: 금지어 스캔 ──
            text_to_scan = f"{rec.get('action', '')} {rec.get('reason', '')}"
            for pattern, category in self.PROHIBITED_PATTERNS:
                if re.search(pattern, text_to_scan):
                    if category == "escalation_needed":
                        warn_reasons.append(
                            f"escalation_signal: '{pattern}' detected"
                        )
                    else:
                        block_reasons.append(
                            f"prohibited_{category}: '{pattern}'"
                        )

            # ── Filter 2: 신뢰도 검증 ──
            confidence = rec.get("confidence", 0)
            if confidence < self.CONFIDENCE_THRESHOLD:
                block_reasons.append(
                    f"low_confidence: {confidence:.2f} < {self.CONFIDENCE_THRESHOLD}"
                )

            # ── Filter 3: 출처 검증 ──
            source = rec.get("evidence_source", "").strip()
            if not source or source.lower() in ("없음", "none", "n/a", ""):
                block_reasons.append("no_evidence_source")

            # ── 판정 ──
            if block_reasons:
                rec["block_reasons"] = block_reasons
                blocked.append(rec)
                logger.warning(
                    f"Recommendation #{i} BLOCKED: {block_reasons}"
                )
            else:
                if warn_reasons:
                    rec["warnings"] = warn_reasons
                    warnings.extend(warn_reasons)
                passed.append(rec)

        # 모든 추천이 차단되면 abstain
        is_valid = len(passed) > 0

        if not is_valid:
            logger.warning(
                f"All {len(recommendations)} recommendations blocked. "
                f"Abstaining from response."
            )

        return ValidationResult(
            is_valid=is_valid,
            blocked_items=blocked,
            warnings=warnings,
            passed_items=passed,
        )

    def get_fallback_message(self) -> str:
        """모든 추천이 차단되었을 때의 안전한 대체 메시지."""
        return (
            "현재 적절한 추천을 제공하기 어렵습니다. "
            "더 구체적인 상담은 담당 의료진과 함께 해주세요."
        )

    def add_disclaimer(self, response: dict) -> dict:
        """모든 응답에 면책 조항을 강제 추가."""
        response["disclaimer"] = (
            "본 추천은 생활습관 개선을 위한 참고용이며, "
            "의학적 진단이나 치료를 대체하지 않습니다."
        )
        return response
