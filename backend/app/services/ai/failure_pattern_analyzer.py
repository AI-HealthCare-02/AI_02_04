"""
Failure Pattern Analyzer — 행동 실패 패턴 분석.

왜 이것이 핵심 차별점인가:
- 기존 건강앱: "이번 주 걷기 달성률 43%" (단순 숫자)
- 이 서비스: "월요일 저녁 걷기 실패 3회 반복, 퇴근 피로도가 원인으로 추정" (구조화된 분석)
- 실패 패턴이 있어야 챌린지 자동 재설계가 가능하다.
"""
from collections import Counter, defaultdict
from datetime import date, timedelta
from dataclasses import dataclass, field
import logging

logger = logging.getLogger(__name__)


@dataclass
class FailurePatternResult:
    pattern_type: str     # time_based, day_based, trigger_based, streak_based
    detail: str           # 사람이 읽을 수 있는 설명
    frequency: int        # 발생 횟수
    confidence: float     # 패턴 확신도 (0~1)
    suggested_action: str # 제안 조치


class FailurePatternAnalyzer:
    """
    챌린지 일일 로그를 분석하여 실패 패턴을 구조화한다.
    Rule-based 분석 (MVP) + LLM 해석 (Advanced).
    """

    # 실패 패턴 감지를 위한 최소 데이터 수
    MIN_LOGS_FOR_ANALYSIS = 5

    def analyze(
        self,
        daily_logs: list[dict],
        challenge_info: dict,
    ) -> list[FailurePatternResult]:
        """
        일일 로그를 분석하여 실패 패턴을 추출한다.

        Args:
            daily_logs: [{"log_date": "2026-03-01", "is_completed": False,
                         "time_of_day": "evening", "failure_reason": "피곤함"}]
            challenge_info: {"name": "매일 7000보", "category": "walking", ...}

        Returns:
            발견된 실패 패턴 리스트 (우선순위순)
        """
        if len(daily_logs) < self.MIN_LOGS_FOR_ANALYSIS:
            return []

        patterns = []

        # ── Pattern 1: 요일 기반 실패 ──
        day_patterns = self._analyze_day_patterns(daily_logs)
        patterns.extend(day_patterns)

        # ── Pattern 2: 시간대 기반 실패 ──
        time_patterns = self._analyze_time_patterns(daily_logs)
        patterns.extend(time_patterns)

        # ── Pattern 3: 연속 실패 (Streak) ──
        streak_patterns = self._analyze_streak_patterns(daily_logs)
        patterns.extend(streak_patterns)

        # ── Pattern 4: 실패 사유 기반 ──
        reason_patterns = self._analyze_reason_patterns(daily_logs)
        patterns.extend(reason_patterns)

        # 확신도순 정렬
        patterns.sort(key=lambda p: p.confidence, reverse=True)
        return patterns[:5]  # 상위 5개만 반환

    def _analyze_day_patterns(
        self, logs: list[dict]
    ) -> list[FailurePatternResult]:
        """요일별 실패 빈도를 분석."""
        WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"]

        day_failures = Counter()
        day_totals = Counter()

        for log in logs:
            log_date = log.get("log_date")
            if isinstance(log_date, str):
                log_date = date.fromisoformat(log_date)
            weekday = log_date.weekday()  # 0=월, 6=일
            day_totals[weekday] += 1
            if not log.get("is_completed", False):
                day_failures[weekday] += 1

        patterns = []
        for day_num, failure_count in day_failures.most_common():
            total = day_totals[day_num]
            if total >= 2 and failure_count >= 2:
                rate = failure_count / total
                if rate >= 0.6:  # 60% 이상 실패
                    day_name = WEEKDAYS[day_num]
                    patterns.append(
                        FailurePatternResult(
                            pattern_type="day_based",
                            detail=(
                                f"{day_name}요일 실패 빈도 높음 "
                                f"({failure_count}/{total}회, {rate:.0%})"
                            ),
                            frequency=failure_count,
                            confidence=min(rate, 0.95),
                            suggested_action=(
                                f"{day_name}요일에는 목표를 낮추거나 "
                                f"다른 시간대로 전환을 고려"
                            ),
                        )
                    )
        return patterns

    def _analyze_time_patterns(
        self, logs: list[dict]
    ) -> list[FailurePatternResult]:
        """시간대별 실패 빈도를 분석."""
        time_failures = Counter()
        time_totals = Counter()

        for log in logs:
            time_of_day = log.get("time_of_day", "unknown")
            if time_of_day == "unknown":
                continue
            time_totals[time_of_day] += 1
            if not log.get("is_completed", False):
                time_failures[time_of_day] += 1

        patterns = []
        TIME_LABELS = {
            "morning": "아침", "afternoon": "점심",
            "evening": "저녁", "night": "밤"
        }

        for time_slot, failure_count in time_failures.most_common():
            total = time_totals[time_slot]
            if total >= 2 and failure_count >= 2:
                rate = failure_count / total
                if rate >= 0.6:
                    label = TIME_LABELS.get(time_slot, time_slot)
                    patterns.append(
                        FailurePatternResult(
                            pattern_type="time_based",
                            detail=(
                                f"{label} 시간대 실패 빈도 높음 "
                                f"({failure_count}/{total}회, {rate:.0%})"
                            ),
                            frequency=failure_count,
                            confidence=min(rate, 0.95),
                            suggested_action=(
                                f"{label} 시간대를 피하고 "
                                f"성공률이 높은 다른 시간대로 전환"
                            ),
                        )
                    )
        return patterns

    def _analyze_streak_patterns(
        self, logs: list[dict]
    ) -> list[FailurePatternResult]:
        """연속 실패 패턴을 분석."""
        sorted_logs = sorted(logs, key=lambda x: x.get("log_date", ""))
        max_streak = 0
        current_streak = 0
        streaks = []

        for log in sorted_logs:
            if not log.get("is_completed", False):
                current_streak += 1
                max_streak = max(max_streak, current_streak)
            else:
                if current_streak >= 3:
                    streaks.append(current_streak)
                current_streak = 0

        if current_streak >= 3:
            streaks.append(current_streak)

        patterns = []
        if max_streak >= 3:
            patterns.append(
                FailurePatternResult(
                    pattern_type="streak_based",
                    detail=(
                        f"최대 {max_streak}일 연속 실패 기록 "
                        f"(3일+ 연속 실패 {len(streaks)}회)"
                    ),
                    frequency=len(streaks),
                    confidence=min(0.5 + max_streak * 0.1, 0.95),
                    suggested_action=(
                        "챌린지 난이도를 낮추어 연속 성공 경험을 "
                        "쌓는 것을 권장"
                    ),
                )
            )
        return patterns

    def _analyze_reason_patterns(
        self, logs: list[dict]
    ) -> list[FailurePatternResult]:
        """실패 사유별 빈도를 분석."""
        reasons = Counter()
        for log in logs:
            reason = log.get("failure_reason")
            if reason and not log.get("is_completed", False):
                reasons[reason] += 1

        patterns = []
        total_failures = sum(reasons.values())
        for reason, count in reasons.most_common(3):
            if count >= 2:
                rate = count / max(total_failures, 1)
                patterns.append(
                    FailurePatternResult(
                        pattern_type="trigger_based",
                        detail=f"실패 사유 '{reason}' 반복 ({count}회, {rate:.0%})",
                        frequency=count,
                        confidence=min(rate + 0.3, 0.90),
                        suggested_action=(
                            f"'{reason}' 상황을 고려한 대안 활동 설계"
                        ),
                    )
                )
        return patterns
