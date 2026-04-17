"""
Recommendation Engine — 4단계 Prompt Chaining 오케스트레이터.

이 모듈이 서비스의 핵심 경쟁력이다:
- C1: Context Assembly (코드 레벨, LLM 미사용)
- C2: RAG Retrieval + CRAG-lite Correction (LLM 미사용)
- C3: LLM 추천 생성 (LLM 1회 호출)
- C4: Post-validation (코드 레벨, LLM 미사용)

실제 LLM 호출은 C3에서 1회만 발생 → 비용 최적화.
MVP에서는 더미 LLM 응답을 사용하고, 실제 API로 교체 가능.
"""
import json
import os
import logging
from datetime import datetime
from dotenv import load_dotenv

from ..rag.retriever import HybridRetriever, MetadataFilter
from ..rag.corrector import CRAGLiteCorrector
from .prompt_templates import PromptTemplates
from ...core.safety_validator import SafetyValidator
from ...core.escalation import EscalationGateway

logger = logging.getLogger(__name__)


class RecommendationEngine:
    """
    4단계 Prompt Chaining으로 근거 기반 예방 행동을 추천한다.
    모든 추천은 Safety Validator를 통과한 후에만 사용자에게 전달된다.
    """

    def __init__(self, llm_client=None):
        self.retriever = HybridRetriever()
        self.corrector = CRAGLiteCorrector(retriever=self.retriever)
        self.safety_validator = SafetyValidator()
        self.escalation_gateway = EscalationGateway()
        self.llm_client = llm_client  # None이면 더미 모드

    async def generate_recommendations(
        self, user_context: dict
    ) -> dict:
        """
        4단계 Prompt Chaining을 실행하여 추천을 생성한다.

        Args:
            user_context: 사용자 프로필 + 최근 7일 데이터 + 실패 패턴

        Returns:
            추천 응답 (JSON) — safety 검증 완료된 상태
        """
        # ══ L5: Escalation Check (RAG 전에 실행) ══
        escalation = self.escalation_gateway.check_vital_signs(user_context)
        if escalation.should_escalate:
            logger.warning(f"ESCALATION: {escalation.reason}")
            return {
                "recommendations": [],
                "correction_status": "ESCALATED",
                "escalation_message": escalation.message,
                "safety_flags": [escalation.reason],
                "disclaimer": (
                    "본 서비스는 생활습관 개선을 위한 참고용이며, "
                    "의학적 진단이나 치료를 대체하지 않습니다."
                ),
                "generated_at": datetime.utcnow().isoformat(),
            }

        # ══ C1: Context Assembly (코드 레벨) ══
        assembled_context = self._assemble_context(user_context)

        # ══ C2: RAG Retrieval + CRAG-lite ══
        filters = self._build_filters(user_context)
        query = self._build_search_query(user_context)

        raw_results = self.retriever.retrieve(query, filters=filters)
        correction = self.corrector.correct(query, raw_results, filters)

        # INSUFFICIENT → fallback (LLM 미호출)
        if correction.status == "INSUFFICIENT":
            return {
                "recommendations": [],
                "correction_status": "INSUFFICIENT",
                "fallback_message": correction.fallback_message,
                "safety_flags": [],
                "disclaimer": (
                    "본 서비스는 생활습관 개선을 위한 참고용이며, "
                    "의학적 진단이나 치료를 대체하지 않습니다."
                ),
                "generated_at": datetime.utcnow().isoformat(),
            }

        # ══ C3: LLM 추천 생성 ══
        evidence_docs = [
            {
                "text": chunk.text,
                "source": chunk.metadata.source,
                "section_title": chunk.metadata.section_title,
                "evidence_level": chunk.metadata.evidence_level,
            }
            for chunk in correction.chunks[:5]
        ]

        messages = PromptTemplates.build_recommendation_prompt(
            user_context=assembled_context,
            evidence_docs=evidence_docs,
            correction_status=correction.status,
        )

        raw_recommendations = await self._call_llm(messages)

        # ══ C4: Post-validation (Safety Filter) ══
        validation = self.safety_validator.validate_recommendations(
            raw_recommendations
        )

        if not validation.is_valid:
            return {
                "recommendations": [],
                "correction_status": correction.status,
                "fallback_message": self.safety_validator.get_fallback_message(),
                "safety_flags": [
                    item.get("block_reasons", [])
                    for item in validation.blocked_items
                ],
                "disclaimer": (
                    "본 서비스는 생활습관 개선을 위한 참고용이며, "
                    "의학적 진단이나 치료를 대체하지 않습니다."
                ),
                "generated_at": datetime.utcnow().isoformat(),
            }

        # 성공: 검증된 추천 반환
        result = {
            "recommendations": validation.passed_items,
            "correction_status": correction.status,
            "safety_flags": validation.warnings,
            "disclaimer": (
                "본 추천은 생활습관 개선을 위한 참고용이며, "
                "의학적 진단이나 치료를 대체하지 않습니다."
            ),
            "generated_at": datetime.utcnow().isoformat(),
        }

        if correction.caveat:
            result["caveat"] = correction.caveat

        return result

    def _assemble_context(self, user_context: dict) -> dict:
        """C1: 사용자 데이터를 구조화된 컨텍스트로 조합."""
        context = {
            "user_profile": {
                "age": user_context.get("age"),
                "gender": user_context.get("gender"),
                "conditions": user_context.get("conditions", []),
                "medications": user_context.get("medications", []),
                "goals": user_context.get("goals", []),
                "user_type": user_context.get("user_type", ""),
                "goal": user_context.get("goal", ""),
                "risk_level": user_context.get("risk_level", ""),
                "diabetes_type": user_context.get("diabetes_type", ""),
            },
            "recent_7d_data": user_context.get("recent_7d_data", {}),
            "failure_patterns": user_context.get("failure_patterns", []),
            "current_challenge": user_context.get("current_challenge", {}),
            "llm_advice_features": user_context.get("llm_advice_features", {}),
            "model_features": user_context.get("model_features", {}),
        }

        # CatBoost 위험 요인 TOP 3 추출
        context["risk_factors"] = self._extract_risk_factors(user_context)

        # 이전 예측 결과 대비 변화 요인 (재예측 시)
        context["risk_changes"] = self._extract_risk_changes(user_context)

        return context

    def _extract_risk_factors(self, user_context: dict) -> list:
        """CatBoost 모델 피처에서 위험 요인 TOP 3 추출."""
        mf = user_context.get("model_features", {})
        if not mf:
            return []

        risk_factors = []

        if mf.get("HighBP", 0) == 1:
            risk_factors.append({
                "factor": "고혈압",
                "field": "HighBP",
                "severity": "high",
                "advice": "저염식 + 규칙적 유산소 운동이 필요합니다",
            })
        if mf.get("BMI", 0) >= 25:
            bmi = mf.get("BMI", 0)
            level = "비만" if bmi >= 30 else "과체중"
            risk_factors.append({
                "factor": f"BMI {bmi} ({level})",
                "field": "BMI",
                "severity": "high" if bmi >= 30 else "medium",
                "advice": "체중의 5~7% 감량으로 당뇨 위험 58% 감소 가능",
            })
        if mf.get("HighChol", 0) == 1:
            risk_factors.append({
                "factor": "고콜레스테롤",
                "field": "HighChol",
                "severity": "medium",
                "advice": "포화지방 줄이기 + 식이섬유 섭취 증가",
            })
        if mf.get("HeartDiseaseorAttack", 0) == 1:
            risk_factors.append({
                "factor": "심장질환 이력",
                "field": "HeartDiseaseorAttack",
                "severity": "high",
                "advice": "정기적 심혈관 검진 + 저강도 운동",
            })
        if mf.get("GenHlth", 0) >= 4:
            risk_factors.append({
                "factor": "건강 상태 불량",
                "field": "GenHlth",
                "severity": "medium",
                "advice": "소규모 생활습관 개선부터 시작",
            })
        if mf.get("DiffWalk", 0) == 1:
            risk_factors.append({
                "factor": "보행 어려움",
                "field": "DiffWalk",
                "severity": "medium",
                "advice": "실내 스트레칭, 의자 운동부터 시작",
            })
        if mf.get("HvyAlcoholConsump", 0) == 1:
            risk_factors.append({
                "factor": "과음 습관",
                "field": "HvyAlcoholConsump",
                "severity": "medium",
                "advice": "음주량 줄이기 — 남성 2잔, 여성 1잔 이내",
            })

        # severity 순서: high > medium > low
        severity_order = {"high": 0, "medium": 1, "low": 2}
        risk_factors.sort(key=lambda x: severity_order.get(x["severity"], 2))

        return risk_factors[:3]

    def _extract_risk_changes(self, user_context: dict) -> list:
        """재예측 시 이전 결과와 비교하여 변화 요인 추출."""
        prev = user_context.get("previous_prediction", {})
        curr = user_context.get("model_features", {})

        if not prev or not curr:
            return []

        changes = []
        check_fields = {
            "BMI": {"name": "BMI", "lower_is_better": True},
            "HighBP": {"name": "고혈압", "lower_is_better": True},
            "HighChol": {"name": "고콜레스테롤", "lower_is_better": True},
            "GenHlth": {"name": "전반적 건강", "lower_is_better": True},
            "DiffWalk": {"name": "보행 능력", "lower_is_better": True},
            "HvyAlcoholConsump": {"name": "음주 습관", "lower_is_better": True},
        }

        for field, info in check_fields.items():
            prev_val = prev.get(field)
            curr_val = curr.get(field)
            if prev_val is None or curr_val is None:
                continue
            if prev_val == curr_val:
                continue

            if info["lower_is_better"]:
                improved = curr_val < prev_val
            else:
                improved = curr_val > prev_val

            changes.append({
                "factor": info["name"],
                "previous": prev_val,
                "current": curr_val,
                "improved": improved,
                "message": f"{info['name']}: {prev_val} → {curr_val} ({'개선' if improved else '주의 필요'})",
            })

        return changes

    def _build_filters(self, user_context: dict) -> MetadataFilter:
        """사용자 프로필 기반 메타데이터 필터 구성."""
        conditions = user_context.get("conditions", [])
        filter_conditions = list(conditions) + ["both"]

        return MetadataFilter(
            conditions=filter_conditions,
            evidence_levels=["A", "B", "C"],  # D(내부 문서)는 기본 제외
        )

    def _build_search_query(self, user_context: dict) -> str:
        """사용자 문맥에서 검색 쿼리를 생성."""
        parts = []

        conditions = user_context.get("conditions", [])
        for cond in conditions:
            if cond == "hypertension":
                parts.append("고혈압")
            elif cond in ("diabetes", "prediabetes"):
                parts.append("당뇨")

        # 실패 패턴이 있으면 관련 키워드 추가
        failure_patterns = user_context.get("failure_patterns", [])
        for pattern in failure_patterns[:2]:
            detail = pattern.get("detail", "")
            if "걷기" in detail or "걸음" in detail:
                parts.append("걷기 운동")
            elif "식단" in detail or "식사" in detail:
                parts.append("식단 관리")
            elif "수면" in detail:
                parts.append("수면")

        # 현재 챌린지 카테고리
        challenge = user_context.get("current_challenge", {})
        category = challenge.get("category", "")
        if category:
            parts.append(f"{category} 생활습관 개선")

        if not parts:
            parts = ["생활습관 개선 예방 행동"]

        # 기본 건강 키워드 추가 (검색 품질 향상)
        parts.extend(["생활습관", "운동", "식단", "관리"])

        return " ".join(parts)

    async def _call_llm(self, messages: list[dict]) -> list[dict]:
        """
        LLM을 호출하여 추천을 생성한다.
        llm_client가 없으면 OpenAI API를 직접 호출한다.
        """
        if self.llm_client is not None:
            # 외부에서 주입한 클라이언트 사용
            response = await self.llm_client.chat(messages=messages)
            return json.loads(response.content)

        # OpenAI API 직접 호출
        try:
            load_dotenv()
            from openai import OpenAI
            client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                temperature=0.3,
                max_tokens=2000,
            )

            content = response.choices[0].message.content
            logger.info(f"LLM 응답 수신 (길이: {len(content)})")

            # JSON 파싱
            parsed = json.loads(content)

            # 응답이 리스트면 그대로, dict면 recommendations 키 추출
            if isinstance(parsed, list):
                return parsed
            elif isinstance(parsed, dict) and "recommendations" in parsed:
                return parsed["recommendations"]
            else:
                logger.warning("LLM 응답 형식 불일치, 더미 응답 사용")
                return self._dummy_llm_response()

        except Exception as e:
            logger.error(f"LLM 호출 실패: {e}, 더미 응답으로 대체")
            return self._dummy_llm_response()

    def _dummy_llm_response(self) -> list[dict]:
        """MVP용 더미 LLM 응답. 실제 배포 시 제거."""
        return [
            {
                "action": (
                    "월요일과 화요일 저녁 걷기 대신, "
                    "점심 시간에 15분 걷기로 전환해보세요"
                ),
                "reason": (
                    "최근 2주간 월/화 저녁 걷기 챌린지 실패가 반복되었습니다. "
                    "퇴근 후 피로도가 높은 시간대를 피하면 "
                    "성공 확률이 높아집니다."
                ),
                "evidence_source": "대한고혈압학회 진료지침 2023, p.48 - 운동요법",
                "confidence": 0.85,
                "difficulty": "easy",
            },
            {
                "action": (
                    "저녁 식사 시 국물 요리를 줄이고, "
                    "나트륨이 낮은 샐러드로 대체해보세요"
                ),
                "reason": (
                    "최근 식단 분석에서 나트륨 섭취가 "
                    "하루 평균 3,200mg으로 권장량(2,000mg)을 초과합니다."
                ),
                "evidence_source": (
                    "대한고혈압학회 진료지침 2023, p.42 - 나트륨 제한"
                ),
                "confidence": 0.88,
                "difficulty": "medium",
            },
            {
                "action": (
                    "저녁 식사 후 10분 가벼운 산책을 추가해보세요"
                ),
                "reason": (
                    "식후 혈당이 평균 165mg/dL로 목표(150 이하)를 초과합니다. "
                    "식후 걷기는 혈당 상승을 효과적으로 억제할 수 있습니다."
                ),
                "evidence_source": (
                    "대한당뇨병학회 생활습관 가이드 2023, p.52 - 식후 걷기"
                ),
                "confidence": 0.82,
                "difficulty": "easy",
            },
        ]
