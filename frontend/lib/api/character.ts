import { client } from "./client";
import type { CharacterResponse, CharacterTheme, OverallState, RiskChangeType } from "./types";

/**
 * 캐릭터 상태와 위험도 변화 요약을 가져옵니다.
 *
 * risk_change_summary가 null이면 위험도 변화 영역을 숨기세요.
 * null이 아니면 위험도 변화 대사 + 수치를 함께 표시하세요.
 */
export async function fetchCharacter(): Promise<CharacterResponse> {
  return client.get<CharacterResponse>("/character");
}

// ─── UI 헬퍼 ─────────────────────────────────────────────────────────────────

/** overall_state → 배경색 + 라벨 */
export const CHARACTER_THEME: Record<OverallState, CharacterTheme> = {
  happy:      { bgColor: "#D5F5E3", label: "최고" },
  energetic:  { bgColor: "#EAFAF1", label: "좋음" },
  recovering: { bgColor: "#FEF9E7", label: "회복중" },
  tired:      { bgColor: "#FDEBD0", label: "피곤" },
  struggling: { bgColor: "#FADBD8", label: "힘듦" },
};

/**
 * 위험도 변화 크기에 따라 캐릭터 대사 유형을 반환합니다.
 * - 개선 15%+  → "big_improvement"
 * - 개선 5%+   → "small_improvement"
 * - 악화 5%+   → "small_worsening"
 * - 악화 15%+  → "big_worsening"
 */
export function getRiskChangeType(change: number, improved: boolean): RiskChangeType {
  const abs = Math.abs(change);
  if (improved) {
    return abs >= 15 ? "big_improvement" : "small_improvement";
  } else {
    return abs >= 15 ? "big_worsening" : "small_worsening";
  }
}
