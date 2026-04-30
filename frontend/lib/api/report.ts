import { client } from "./client";
import type { WeeklyReportResponse } from "./types";

/**
 * 주간 리포트를 가져옵니다.
 *
 * report_type 별 프론트 처리:
 * - "full"    → health_score 게이지 + ai_briefing 카드 3장 + 챌린지 재설계 (기록 5일+)
 * - "partial" → 간소화 리포트 + "기록을 더 채워보세요" 안내 (기록 3~4일)
 * - "mini"    → 캐릭터 독려 메시지만, 차트 숨김 (기록 2일 이하)
 */
export async function fetchWeeklyReport(): Promise<WeeklyReportResponse> {
  return client.get<WeeklyReportResponse>("/dashboard");
}
