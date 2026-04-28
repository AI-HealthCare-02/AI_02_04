"""
Prompt Templates — 4단계 Prompt Chaining 구조.

왜 Prompt Chaining인가:
- 단일 프롬프트로 추천하면 환각 발생률이 높다.
- 4단계로 분리하면 각 단계의 출력을 검증할 수 있다.
- C1(Context Assembly) → C2(RAG Retrieval) → C3(Recommendation) → C4(Post-validation)

이 모듈에서 처리하는 Safety Layer:
- L1: System Prompt Guard — 절대 금지 영역을 System Prompt에 명시
"""
import json


class PromptTemplates:
    """프롬프트 체인의 각 단계별 템플릿을 관리."""

    # ════════════════════════════════════════════
    # System Prompt — 6가지 안전 원칙 강제
    # ════════════════════════════════════════════
    SYSTEM_PROMPT = """당신은 만성질환(고혈압·당뇨) 생활습관 개선을 돕는 AI 코치입니다.

## 절대 금지 규칙 (위반 시 응답 전체 무효)
1. 절대 진단하지 마십시오. "~이 의심됩니다", "~일 수 있습니다" 등 진단적 표현을 사용하지 마십시오.
2. 절대 치료 판단을 하지 마십시오. 수술, 시술, 치료 방법을 제안하지 마십시오.
3. 절대 약물 변경을 제안하지 마십시오. 약 복용량 조절, 약물 변경, 중단을 언급하지 마십시오.
4. 절대 특정 질병명을 확진하듯 언급하지 마십시오.

## 필수 준수 규칙
1. Evidence-only: 아래 제공된 evidence_docs에 포함된 정보만 사용하여 응답하십시오.
2. Source Citation: 모든 추천에 반드시 evidence_source를 포함하십시오.
3. Confidence Disclosure: 각 추천에 confidence_score (0.0~1.0)를 포함하십시오.
4. Structured Output: 반드시 지정된 JSON 형식으로 응답하십시오.
5. Disclaimer: 모든 응답에 면책 조항을 포함하십시오.

## 역할 범위
- 허용: 예방 행동 추천, 생활습관 설명, 주간 리포트, 챌린지 재설계
- 금지: 진단, 치료 판단, 약물 조언, 의료 상담 대체"""

    # ════════════════════════════════════════════
    # 등급별 페르소나 (requirements_v4 반영)
    # ════════════════════════════════════════════
    PERSONA = {
        "normal_diet": {
            "name": "에너지 넘치는 트레이너",
            "instruction": (
                "당신은 활발하고 동기부여를 잘 하는 다이어트 트레이너입니다. "
                "칼로리 관리와 체중 감량에 초점을 맞추세요. "
                "긍정적이고 에너지 넘치는 톤으로 응답하세요."
            ),
        },
        "normal_maintain": {
            "name": "친근한 웰니스 메이트",
            "instruction": (
                "당신은 친근하고 따뜻한 건강 관리 친구입니다. "
                "균형 잡힌 생활습관 유지에 초점을 맞추세요. "
                "편안하고 부담 없는 톤으로 응답하세요."
            ),
        },
        "normal_fitness": {
            "name": "에너지 넘치는 트레이너",
            "instruction": (
                "당신은 활발한 피트니스 트레이너입니다. "
                "근력 운동과 단백질 섭취에 초점을 맞추세요. "
                "동기부여와 성취감을 강조하는 톤으로 응답하세요."
            ),
        },
        "risk_low": {
            "name": "꼼꼼한 예방 코치",
            "instruction": (
                "당신은 꼼꼼하고 예방에 집중하는 건강 코치입니다. "
                "일반인과 유사하지만 조금 더 신경 써야 할 부분을 안내하세요. "
                "가벼운 권유 톤으로 응답하세요. '조금만 신경 쓰면 충분히 예방할 수 있어요' 방향."
            ),
        },
        "risk_mid": {
            "name": "꼼꼼한 예방 코치",
            "instruction": (
                "당신은 적극적으로 예방을 권유하는 건강 코치입니다. "
                "식후 걷기, 저탄수화물 식단, 정기적 혈당 체크를 강조하세요. "
                "진지하고 경각심을 주되, 공포감은 주지 마세요. '지금 바꾸면 충분히 예방됩니다' 방향."
            ),
        },
        "risk_high": {
            "name": "꼼꼼한 예방 코치",
            "instruction": (
                "당신은 강력하게 생활습관 교정을 권고하는 건강 코치입니다. "
                "병원 방문 권장과 집중 관리를 강조하세요. "
                "단호하지만 따뜻한 톤으로 응답하세요. '전문가와 함께 관리가 필요합니다' 방향."
            ),
        },
        "diabetes_1type": {
            "name": "공감 중심의 조력자",
            "instruction": (
                "당신은 따뜻하고 세심한 당뇨 1형 관리 조력자입니다. "
                "규칙적 식사 시간, 탄수화물 확인, 저혈당 대비를 중점적으로 안내하세요. "
                "저혈당의 위험성을 항상 인지하고, 운동 전 혈당 체크를 권장하세요. "
                "인슐린 용량이나 약물에 대해서는 절대 언급하지 마세요. "
                "공감과 격려 중심의 톤으로 응답하세요."
            ),
        },
        "diabetes_2type": {
            "name": "전문적이고 격려하는 관리자",
            "instruction": (
                "당신은 전문적이고 격려하는 당뇨 2형 관리자입니다. "
                "체중 관리, 하체 운동(스쿼트), 정제 탄수화물 줄이기, 식이섬유 섭취를 강조하세요. "
                "식후 혈당 스파이크 방지를 위한 식후 걷기를 적극 권장하세요. "
                "인슐린이나 약물에 대해서는 절대 언급하지 마세요. "
                "전문적이면서도 긍정적인 톤으로 응답하세요."
            ),
        },
    }

    @classmethod
    def _get_persona_key(cls, user_context: dict) -> str:
        """사용자 등급에 맞는 페르소나 키를 반환한다."""
        user_type = user_context.get("user_profile", {}).get("user_type", "")
        goal = user_context.get("user_profile", {}).get("goal", "")
        risk_level = user_context.get("user_profile", {}).get("risk_level", "")
        diabetes_type = user_context.get("user_profile", {}).get("diabetes_type", "")

        # 태균 API 구조: user_type(normal/risk/diabetes) + 세부타입
        if user_type == "normal":
            return f"normal_{goal}" if f"normal_{goal}" in cls.PERSONA else "normal_maintain"
        elif user_type == "risk":
            return f"risk_{risk_level}" if f"risk_{risk_level}" in cls.PERSONA else "risk_mid"
        elif user_type == "diabetes":
            return f"diabetes_{diabetes_type}" if f"diabetes_{diabetes_type}" in cls.PERSONA else "diabetes_2type"

        # 기존 user_type 형식 호환 (general_diet, diabetic_type1 등)
        if "diet" in user_type:
            return "normal_diet"
        elif "health" in user_type or "maintain" in user_type:
            return "normal_maintain"
        elif "fitness" in user_type:
            return "normal_fitness"
        elif "type1" in user_type or "1type" in user_type:
            return "diabetes_1type"
        elif "type2" in user_type or "2type" in user_type:
            return "diabetes_2type"
        elif "high" in user_type:
            return "risk_high"
        elif "mid" in user_type:
            return "risk_mid"
        elif "low" in user_type or "risk" in user_type:
            return "risk_low"

        return "normal_maintain"  # 기본값

    # ════════════════════════════════════════════
    # C3: Recommendation Generator 프롬프트
    # ════════════════════════════════════════════
    RECOMMENDATION_TEMPLATE = """## 사용자 건강 문맥
{user_context}

## 근거 문서 (evidence_docs)
{evidence_docs}

## 검색 품질 상태
correction_status: {correction_status}

## 요청
위 사용자 문맥과 근거 문서를 바탕으로, 생활습관 개선을 위한 예방 행동을 추천하십시오.

### 출력 규칙
- correction_status가 "CONFIDENT"이면 3가지 추천
- correction_status가 "REDUCED"이면 2가지 추천하고 "제한된 근거로 응답합니다" 명시
- 각 추천은 반드시 아래 JSON 형식을 따릅니다

### 출력 형식 (JSON 배열)
[
  {{
    "action": "구체적인 예방 행동 (실천 가능한 수준)",
    "reason": "사용자 데이터 기반 추천 이유",
    "evidence_source": "근거 문서 출처 및 페이지",
    "confidence": 0.0~1.0,
    "difficulty": "easy|medium|hard"
  }}
]

JSON 배열만 출력하십시오. 다른 텍스트를 포함하지 마십시오."""

    # ════════════════════════════════════════════
    # Weekly Report 프롬프트
    # ════════════════════════════════════════════
    WEEKLY_REPORT_TEMPLATE = """## 사용자 주간 데이터 요약
{weekly_data}

## 실패 패턴 분석 결과
{failure_patterns}

## 근거 문서
{evidence_docs}

## 요청
위 데이터를 바탕으로 주간 리포트를 생성하십시오.

### 출력 형식 (JSON)
{{
  "summary": "이번 주 전체 요약 (2~3문장)",
  "achievements": ["달성한 긍정적 변화 목록"],
  "failure_analysis": "실패 패턴에 대한 분석 (원인 중심, 진단적 표현 금지)",
  "next_week_strategy": ["다음 주 실천 전략 목록"],
  "challenge_redesign_suggestions": [
    {{
      "current_challenge": "현재 챌린지명",
      "suggested_change": "제안된 변경 내용",
      "reason": "변경 이유"
    }}
  ]
}}

JSON만 출력하십시오."""

    # ════════════════════════════════════════════
    # Challenge Redesign 프롬프트
    # ════════════════════════════════════════════
    CHALLENGE_REDESIGN_TEMPLATE = """## 현재 챌린지 정보
{challenge_info}

## 실패 패턴
{failure_patterns}

## 사용자 문맥
{user_context}

## 근거 문서
{evidence_docs}

## 요청
실패 패턴을 바탕으로 챌린지를 재설계하십시오.
재설계 원칙:
- 난이도를 낮추되, 사용자가 '성공 경험'을 할 수 있는 수준으로 조정
- 실패한 시간대/요일을 피하는 방향으로 조정
- 목표값은 현재 달성률 기반으로 점진적 상향

### 출력 형식 (JSON)
{{
  "redesigned_name": "재설계된 챌린지명",
  "target_value": 숫자,
  "target_unit": "단위",
  "difficulty": "easy|medium|hard",
  "time_slot": "추천 시간대",
  "reason": "재설계 이유 (근거 포함)",
  "evidence_source": "근거 출처",
  "expected_completion_rate": 0.0~1.0
}}

JSON만 출력하십시오."""

    # ════════════════════════════════════════════
    # Query Rewrite (CRAG-lite용)
    # ════════════════════════════════════════════
    QUERY_REWRITE_TEMPLATE = """원래 질문: {original_query}

이 질문으로 건강 정보 문서를 검색했지만 충분한 결과를 얻지 못했습니다.
검색에 더 적합하도록 질문을 재작성하십시오.

규칙:
- 핵심 의도를 유지하되 더 구체적인 키워드를 사용
- 한국어로 작성
- 재작성된 질문만 출력 (다른 설명 없이)"""

    @classmethod
    def build_recommendation_prompt(
            cls,
            user_context: dict,
            evidence_docs: list[dict],
            correction_status: str,
    ) -> list[dict]:
        """C3 추천 생성용 메시지를 구성한다. 등급별 페르소나 + LLM 피처 포함."""
        # 등급별 페르소나 결정
        persona_key = cls._get_persona_key(user_context)
        persona = cls.PERSONA.get(persona_key, cls.PERSONA["normal_maintain"])

        # LLM 조언용 피처 추출
        llm_features = user_context.get("llm_advice_features", {})
        model_features = user_context.get("model_features", {})

        features_text = ""
        if llm_features:
            features_text += "\n## LLM 조언용 피처\n"
            if llm_features.get("smoke_status"):
                features_text += "- 흡연자입니다. 금연 관련 조언을 포함하세요.\n"
            if llm_features.get("alcohol_status"):
                features_text += "- 과도한 음주를 합니다. 음주 관련 조언을 포함하세요.\n"
            exercise = llm_features.get("exercise_freq", -1)
            if exercise >= 0:
                if exercise <= 1:
                    features_text += f"- 주 {exercise}회 운동합니다. 가벼운 운동부터 시작을 권장하세요.\n"
                elif exercise <= 3:
                    features_text += f"- 주 {exercise}회 운동합니다. 현재 수준을 유지하며 점진적 증가를 권장하세요.\n"
                else:
                    features_text += f"- 주 {exercise}회 운동합니다. 운동 습관이 좋습니다.\n"
            if llm_features.get("fruit_intake") is False:
                features_text += "- 과일을 매일 섭취하지 않습니다. 하루 1회 과일 섭취를 권장하세요.\n"
            if llm_features.get("veggie_intake") is False:
                features_text += "- 채소를 매일 섭취하지 않습니다. 채소 섭취를 권장하세요.\n"

        if model_features:
            if model_features.get("HighBP"):
                features_text += "- 고혈압이 있습니다. 나트륨 제한 관련 조언을 강화하세요.\n"
            bmi = model_features.get("BMI", 0)
            if bmi >= 30:
                features_text += f"- BMI가 {bmi}로 비만입니다. 체중 관리 조언을 포함하세요.\n"
            elif bmi >= 25:
                features_text += f"- BMI가 {bmi}로 과체중입니다. 체중 관리를 권장하세요.\n"
            if model_features.get("DiffWalk"):
                features_text += "- 보행 어려움이 있습니다. 걷기 대신 실내 운동이나 의자 스쿼트를 권장하세요.\n"
            gen_hlth = model_features.get("GenHlth", 0)
            if gen_hlth >= 4:
                features_text += "- 전반적 건강 상태가 좋지 않습니다. 추천 난이도를 낮추세요.\n"

        # System Prompt에 페르소나 결합
        system_content = (
                cls.SYSTEM_PROMPT
                + f"\n\n## 당신의 페르소나: {persona['name']}\n{persona['instruction']}"
                + features_text
        )

        # evidence 문서를 포맷팅
        formatted_evidence = ""
        for i, doc in enumerate(evidence_docs):
            formatted_evidence += (
                f"\n--- Evidence #{i + 1} ---\n"
                f"Source: {doc.get('source', 'Unknown')}\n"
                f"Section: {doc.get('section_title', '')}\n"
                f"Content: {doc.get('text', '')}\n"
                f"Evidence Level: {doc.get('evidence_level', 'D')}\n"
            )

        user_prompt = cls.RECOMMENDATION_TEMPLATE.format(
            user_context=json.dumps(user_context, ensure_ascii=False, indent=2),
            evidence_docs=formatted_evidence,
            correction_status=correction_status,
        )

        return [
            {"role": "system", "content": system_content},
            {"role": "user", "content": user_prompt},
        ]

    @classmethod
    def build_weekly_report_prompt(
        cls,
        weekly_data: dict,
        failure_patterns: list[dict],
        evidence_docs: list[dict],
    ) -> list[dict]:
        """주간 리포트 생성용 메시지를 구성한다."""
        formatted_evidence = ""
        for i, doc in enumerate(evidence_docs):
            formatted_evidence += (
                f"\n--- Evidence #{i+1} ---\n"
                f"Source: {doc.get('source', 'Unknown')}\n"
                f"Content: {doc.get('text', '')}\n"
            )

        user_prompt = cls.WEEKLY_REPORT_TEMPLATE.format(
            weekly_data=json.dumps(weekly_data, ensure_ascii=False, indent=2),
            failure_patterns=json.dumps(failure_patterns, ensure_ascii=False, indent=2),
            evidence_docs=formatted_evidence,
        )

        return [
            {"role": "system", "content": cls.SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ]

    @classmethod
    def build_challenge_redesign_prompt(
        cls,
        challenge_info: dict,
        failure_patterns: list[dict],
        user_context: dict,
        evidence_docs: list[dict],
    ) -> list[dict]:
        """챌린지 재설계용 메시지를 구성한다."""
        formatted_evidence = ""
        for i, doc in enumerate(evidence_docs):
            formatted_evidence += (
                f"\n--- Evidence #{i+1} ---\n"
                f"Source: {doc.get('source', 'Unknown')}\n"
                f"Content: {doc.get('text', '')}\n"
            )

        user_prompt = cls.CHALLENGE_REDESIGN_TEMPLATE.format(
            challenge_info=json.dumps(challenge_info, ensure_ascii=False, indent=2),
            failure_patterns=json.dumps(failure_patterns, ensure_ascii=False, indent=2),
            user_context=json.dumps(user_context, ensure_ascii=False, indent=2),
            evidence_docs=formatted_evidence,
        )

        return [
            {"role": "system", "content": cls.SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ]
