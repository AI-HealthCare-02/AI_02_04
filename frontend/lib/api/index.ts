// 타입
export type {
  // 공통
  Difficulty,
  ApiError,
  // 식단
  HighlightField,
  DietAlternative,
  HealthierAlternative,
  DietClassification,
  DietAnalyzeResponse,
  DietManualUpdateRequest,
  // 추천
  CorrectionStatus,
  Recommendation,
  RecommendationsRequest,
  RecommendationsResponse,
  // 리포트
  ReportType,
  AiBriefing,
  ChallengeRedesignSuggestion,
  WeeklyReportResponse,
  // 캐릭터
  OverallState,
  CharacterState,
  RiskChangeSummary,
  CharacterResponse,
  CharacterTheme,
  RiskChangeType,
} from "./types";

// API 함수
export { analyzeDiet, updateDietManual } from "./diet";
export { fetchRecommendations } from "./recommendations";
export { fetchWeeklyReport } from "./report";
export { fetchCharacter, CHARACTER_THEME, getRiskChangeType } from "./character";

// HTTP 클라이언트 (필요 시 직접 사용)
export { client, HttpError } from "./client";
