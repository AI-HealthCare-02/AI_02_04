"""
Weekly Report Generator — 주간 AI 리포트 자동 생성.

왜 이것이 단순 통계 대시보드와 다른가:
- 기존 앱: "이번 주 평균 혈압 138/88, 걸음 4200보" (숫자 나열)
- 이 서비스: "월/화 저녁 걸음 실패가 반복됩니다. 점심 시간으로 전환하면
  달성률이 71%까지 올라갈 수 있습니다. 챌린지를 자동 재설계했습니다."

구조:
1. 주간 데이터 집계 (코드 레벨)
2. 실패 패턴 분석 (FailurePatternAnalyzer 호출)
3. RAG 근거 검색
4. LLM 리포트 생성
5. 챌린지 자동 재설계 제안
6. Safety 검증
"""
import logging
from datetime import date, timedelta
from typing import Optional

from .failure_pattern_analyzer import FailurePatternAnalyzer
from .prompt_templates import PromptTemplates
from ..rag.retriever import HybridRetriever, MetadataFilter
from ..rag.corrector import CRAGLiteCorrector
from ...core.safety_validator import SafetyValidator

logger = logging.getLogger(__name__)


class WeeklyReportGenerator:
    """주간 AI 리포트를 생성한다."""

    def __init__(self, llm_client=None):
        self.pattern_analyzer = FailurePatternAnalyzer()
        self.retriever = HybridRetriever()
        self.corrector = CRAGLiteCorrector(retriever=self.retriever)
        self.safety_validator = SafetyValidator()
        self.llm_client = llm_client

    async def generate_report(
        self,
        user_context: dict,
        health_records: list[dict],
        challenge_logs: list[dict],
        challenge_info: dict,
    ) -> dict:
        """
        주간 리포트를 생성한다.

        Args:
            user_context: 사용자 프로필
            health_records: 이번 주 건강 기록 리스트
            challenge_logs: 이번 주 챌린지 일일 로그
            challenge_info: 현재 챌린지 정보

        Returns:
            주간 리포트 (JSON)
        """
        # ── Step 1: 주간 데이터 집계 ──
        weekly_summary = self._aggregate_weekly_data(health_records)

        # ── Step 1.5: 기록일 기반 리포트 타입 결정 ──
        recording_days = weekly_summary.get("steps_total_days", 0)
        if recording_days <= 2:
            return self._mini_report(weekly_summary, user_context)
        elif recording_days <= 4:
            report = await self._generate_partial_report(weekly_summary, user_context)
            report["report_type"] = "partial"
            return self.safety_validator.add_disclaimer(report)

        # ── Step 2: 실패 패턴 분석 ──
        failure_patterns = self.pattern_analyzer.analyze(
            challenge_logs, challenge_info
        )
        pattern_dicts = [
            {
                "pattern_type": p.pattern_type,
                "detail": p.detail,
                "frequency": p.frequency,
                "confidence": p.confidence,
                "suggested_action": p.suggested_action,
            }
            for p in failure_patterns
        ]

        # ── Step 3: RAG 근거 검색 ──
        search_query = self._build_report_query(weekly_summary, failure_patterns)
        filters = MetadataFilter(
            conditions=user_context.get("conditions", []) + ["both"],
            evidence_levels=["A", "B", "C"],
        )
        raw_results = self.retriever.retrieve(search_query, filters=filters)
        correction = self.corrector.correct(search_query, raw_results, filters)

        evidence_docs = [
            {
                "text": chunk.text,
                "source": chunk.metadata.source,
                "section_title": chunk.metadata.section_title,
                "evidence_level": chunk.metadata.evidence_level,
            }
            for chunk in correction.chunks[:5]
        ]

        # ── Step 4: 리포트 생성 (LLM 또는 더미) ──
        report = await self._generate_report_content(
            weekly_summary, pattern_dicts, evidence_docs
        )

        # ── Step 5: 챌린지 재설계 제안 ──
        redesign_suggestions = self._suggest_challenge_redesign(
            challenge_info, failure_patterns, weekly_summary
        )
        report["challenge_redesign_suggestions"] = redesign_suggestions

        # ── Step 6: Safety 검증 (리포트 내 위험 표현 필터링) ──
        report = self.safety_validator.add_disclaimer(report)

        return report

    def _aggregate_weekly_data(self, records: list[dict]) -> dict:
        """주간 건강 기록을 집계한다."""
        bp_systolics = []
        bp_diastolics = []
        glucose_values = []
        steps_list = []
        sleep_hours_list = []
        meal_count = 0

        for r in records:
            rtype = r.get("record_type", "")
            if rtype == "bp":
                if r.get("bp_systolic"):
                    bp_systolics.append(r["bp_systolic"])
                if r.get("bp_diastolic"):
                    bp_diastolics.append(r["bp_diastolic"])
            elif rtype == "glucose":
                if r.get("glucose_value"):
                    glucose_values.append(r["glucose_value"])
            elif rtype == "activity":
                if r.get("steps"):
                    steps_list.append(r["steps"])
            elif rtype == "sleep":
                if r.get("sleep_hours"):
                    sleep_hours_list.append(r["sleep_hours"])
            elif rtype == "meal":
                meal_count += 1

        def safe_avg(lst):
            return round(sum(lst) / len(lst), 1) if lst else None

        return {
            "bp_avg": {
                "systolic": safe_avg(bp_systolics),
                "diastolic": safe_avg(bp_diastolics),
                "measurement_count": len(bp_systolics),
            },
            "glucose_avg": safe_avg(glucose_values),
            "glucose_measurement_count": len(glucose_values),
            "steps_avg": safe_avg(steps_list),
            "steps_total_days": len(steps_list),
            "sleep_avg": safe_avg(sleep_hours_list),
            "meals_logged": meal_count,
            "total_records": len(records),
        }

    def _build_report_query(
        self, weekly_summary: dict, patterns: list
    ) -> str:
        """리포트용 검색 쿼리 생성."""
        parts = ["생활습관 개선 주간 관리"]

        # 혈압이 높으면 관련 키워드
        bp = weekly_summary.get("bp_avg", {})
        if bp.get("systolic") and bp["systolic"] >= 135:
            parts.append("고혈압 혈압 낮추기")

        # 실패 패턴 키워드
        for p in patterns[:2]:
            if "걷기" in p.detail or "운동" in p.detail:
                parts.append("운동 습관 만들기")
            elif "식단" in p.detail or "나트륨" in p.detail:
                parts.append("식단 관리 나트륨")

        parts.extend(["생활습관", "운동", "식단"])
        return " ".join(parts)

    async def _generate_report_content(
        self,
        weekly_summary: dict,
        failure_patterns: list[dict],
        evidence_docs: list[dict],
    ) -> dict:
        """LLM으로 리포트를 생성하거나 더미 리포트를 반환."""
        if self.llm_client:
            # Production: LLM 호출
            messages = PromptTemplates.build_weekly_report_prompt(
                weekly_data=weekly_summary,
                failure_patterns=failure_patterns,
                evidence_docs=evidence_docs,
            )
            # response = await self.llm_client.chat(messages=messages)
            # return json.loads(response.content)
            pass

        # MVP: 더미 리포트
        return self._dummy_report(weekly_summary, failure_patterns)

    def _dummy_report(
        self, summary: dict, patterns: list[dict]
    ) -> dict:
        """MVP용 더미 주간 리포트."""
        bp = summary.get("bp_avg", {})
        steps = summary.get("steps_avg", 0)

        # 요약 생성
        parts = []
        if bp.get("systolic"):
            if bp["systolic"] >= 140:
                parts.append(
                    f"이번 주 평균 혈압이 {bp['systolic']}/{bp['diastolic']}mmHg로 "
                    f"목표보다 높았습니다."
                )
            else:
                parts.append(
                    f"이번 주 평균 혈압 {bp['systolic']}/{bp['diastolic']}mmHg로 "
                    f"양호한 편입니다."
                )
        if steps:
            parts.append(f"일평균 걸음 수는 {steps:.0f}보입니다.")

        achievements = []
        if bp.get("measurement_count", 0) >= 5:
            achievements.append("혈압을 꾸준히 측정했습니다 (주 5회 이상)")
        if summary.get("meals_logged", 0) >= 10:
            achievements.append("식단 기록을 성실히 했습니다")

        # 실패 분석
        failure_analysis = ""
        if patterns:
            top_pattern = patterns[0]
            failure_analysis = (
                f"가장 두드러진 패턴: {top_pattern['detail']}. "
                f"{top_pattern.get('suggested_action', '')}"
            )
        else:
            failure_analysis = "뚜렷한 실패 패턴이 감지되지 않았습니다."

        return {
            "summary": " ".join(parts) if parts else "이번 주 데이터가 충분하지 않습니다.",
            "achievements": achievements,
            "bp_trend": {
                "avg_systolic": bp.get("systolic"),
                "avg_diastolic": bp.get("diastolic"),
                "measurements": bp.get("measurement_count", 0),
            },
            "glucose_trend": {
                "avg": summary.get("glucose_avg"),
                "measurements": summary.get("glucose_measurement_count", 0),
            },
            "activity_summary": {
                "avg_steps": steps,
                "days_recorded": summary.get("steps_total_days", 0),
            },
            "failure_analysis": failure_analysis,
            "failure_patterns": patterns,
            "next_week_strategy": [
                "실패 빈도가 높은 시간대를 피해 활동 시간을 조정해보세요",
                "성공 경험을 쌓기 위해 목표를 살짝 낮추는 것도 좋습니다",
                "측정을 꾸준히 유지하면 더 정확한 분석이 가능합니다",
            ],
            "report_type": "full",
            "ai_briefing": {
                "good": (
                    f"{'혈압을 꾸준히 측정하셨습니다.' if bp.get('measurement_count', 0) >= 5 else ''}"
                    f"{'식단 기록을 성실히 하셨습니다.' if summary.get('meals_logged', 0) >= 10 else ''}"
                    if bp.get('measurement_count', 0) >= 5 or summary.get('meals_logged', 0) >= 10
                    else "기록을 시작한 것 자체가 좋은 습관입니다."
                ),
                "bad": failure_analysis if failure_analysis else "뚜렷한 아쉬운 점이 없습니다.",
                "next_week": "다음 주에는 실패 빈도가 높은 시간대를 피해 활동 시간을 조정해보세요.",
            },
            "health_score": min(100, max(0,
                50
                + (10 if bp.get('measurement_count', 0) >= 5 else 0)
                + (10 if summary.get('meals_logged', 0) >= 10 else 0)
                + (10 if steps and steps >= 7000 else 0)
                + (10 if not patterns else -10)
                + (10 if summary.get('sleep_avg') and 7 <= summary['sleep_avg'] <= 9 else 0)
            )),
        }

    def _suggest_challenge_redesign(
        self,
        challenge_info: dict,
        patterns: list,
        weekly_summary: dict,
    ) -> list[dict]:
        """
        실패 패턴 기반 챌린지 자동 재설계 제안.
        핵심 원칙: 난이도를 낮춰서 성공 경험을 누적시킨다.
        """
        if not patterns:
            return []

        suggestions = []
        current_target = challenge_info.get("target_value", 0)
        completion_rate = challenge_info.get("completion_rate", 0)
        category = challenge_info.get("category", "")

        for pattern in patterns[:2]:
            suggestion = {
                "current_challenge": challenge_info.get("name", ""),
                "pattern_detected": pattern.detail,
            }

            if pattern.pattern_type == "time_based":
                # 시간대 실패 → 다른 시간대로 전환
                if "저녁" in pattern.detail:
                    suggestion["suggested_change"] = (
                        f"저녁 대신 점심 시간으로 전환, "
                        f"목표를 {current_target}에서 "
                        f"{int(current_target * 0.7)}으로 조정"
                    )
                    suggestion["new_target_value"] = int(current_target * 0.7)
                    suggestion["new_time_slot"] = "afternoon"
                elif "아침" in pattern.detail:
                    suggestion["suggested_change"] = (
                        f"아침 대신 점심/저녁으로 전환"
                    )
                    suggestion["new_time_slot"] = "evening"

            elif pattern.pattern_type == "day_based":
                # 요일 실패 → 해당 요일 목표 완화
                suggestion["suggested_change"] = (
                    f"해당 요일({pattern.detail.split('요일')[0]}요일)의 "
                    f"목표를 {int(current_target * 0.5)}로 완화"
                )
                suggestion["new_target_value"] = int(current_target * 0.5)

            elif pattern.pattern_type == "streak_based":
                # 연속 실패 → 전체 난이도 하향
                new_target = int(current_target * 0.6)
                suggestion["suggested_change"] = (
                    f"연속 실패가 감지되어 목표를 {new_target}으로 "
                    f"하향 조정 후 점진적 상향"
                )
                suggestion["new_target_value"] = new_target
                suggestion["new_difficulty"] = "easy"

            elif pattern.pattern_type == "trigger_based":
                # 트리거 실패 → 대안 활동 제안
                trigger = pattern.detail
                suggestion["suggested_change"] = (
                    f"'{trigger}' 상황에서는 짧은 대안 활동(5분 스트레칭 등)으로 대체"
                )

            suggestion["reason"] = (
                f"실패 패턴 '{pattern.detail}'에 기반한 재설계. "
                f"현재 달성률 {completion_rate:.0%}에서 "
                f"성공 경험을 쌓기 위해 난이도를 조정합니다."
            )
            suggestions.append(suggestion)

        return suggestions

    def _mini_report(self, summary: dict, user_context: dict) -> dict:
        """기록 2일 이하: 독려형 미니 리포트. 캐릭터가 말하는 형식."""
        return {
            "report_type": "mini",
            "summary": "이번 주는 기록이 많지 않았어요. 다음 주엔 같이 해봐요!",
            "character_message": "나 좀 심심했어... 내일부터 같이 하자! 하루 1개만 기록해도 돼!",
            "encouragement": [
                "완벽하지 않아도 괜찮아요. 하루 1개 기록만으로도 충분합니다.",
                "기록이 쌓이면 AI가 더 정확한 분석을 해줄 수 있어요.",
                "내일 물 마시기 하나만 도전해볼까요?",
            ],
            "next_step": "내일 챌린지 1개만 달성해보기",
            "achievements": [],
            "failure_patterns": [],
            "challenge_redesign_suggestions": [],
            "disclaimer": (
                "본 서비스는 생활습관 개선을 위한 참고용이며, "
                "의학적 진단이나 치료를 대체하지 않습니다."
            ),
        }

    async def _generate_partial_report(self, summary: dict, user_context: dict) -> dict:
        """기록 3~4일: 간소화 리포트 + 기록 독려."""
        steps = summary.get("steps_avg", 0)
        glucose = summary.get("glucose_avg")

        parts = []
        if steps:
            parts.append(f"이번 주 평균 {steps:.0f}보 걸었어요.")
        if glucose:
            parts.append(f"평균 혈당은 {glucose:.0f}mg/dL이었어요.")
        parts.append("기록이 조금 더 쌓이면 정확한 분석이 가능해요!")

        return {
            "summary": " ".join(parts),
            "character_message": "이번 주 좀 아쉬웠지만, 기록한 날은 잘했어! 다음 주도 화이팅!",
            "achievements": ["기록을 시작한 것 자체가 좋은 습관이에요!"],
            "failure_patterns": [],
            "challenge_redesign_suggestions": [],
            "next_week_strategy": [
                "기록을 5일 이상 채우면 상세한 주간 분석을 받을 수 있어요",
                "챌린지 알림을 켜두면 잊지 않고 기록할 수 있어요",
            ],
        }
