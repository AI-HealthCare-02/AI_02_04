import { client } from "./client";
import type { RecommendationsData, RecommendationsResponse } from "./types";

/**
 * POST /recommend
 * - JWT 토큰으로 유저 인증 (요청 바디 불필요)
 * - 백엔드 응답: { success: true, data: { recommendations, correction_status, ... } }
 *
 * ⚠️ correction_status === "ESCALATED"이면
 *    recommendations 배열을 절대 렌더링하지 마세요.
 *    escalation_message와 빨간 경고 배너만 표시해야 합니다.
 */
export async function fetchRecommendations(): Promise<RecommendationsData> {
  const res = await client.post<RecommendationsResponse>("/recommend", {});
  return res.data;
}
