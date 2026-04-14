import { client } from "./client";
import type {
  RecommendationsRequest,
  RecommendationsResponse,
} from "./types";

/**
 * LLM 맞춤 추천 3개 + 위험요인 TOP 3를 요청합니다.
 *
 * ⚠️ correction_status === "ESCALATED"이면
 *    recommendations 배열을 절대 렌더링하지 마세요.
 *    escalation_message와 빨간 경고 배너만 표시해야 합니다.
 */
export async function fetchRecommendations(
  body: RecommendationsRequest
): Promise<RecommendationsResponse> {
  return client.post<RecommendationsResponse>("/recommend", body);
}
