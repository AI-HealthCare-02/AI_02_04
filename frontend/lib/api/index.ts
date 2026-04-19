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
  RecommendationsData,
  RecommendationsResponse,
  // 리포트
  ReportType,
  AiBriefing,
  ChallengeRedesignSuggestion,
  FailurePatternType,
  FailurePattern,
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
export { registerUser, loginUser, refreshTokens } from "./auth";
export type { RegisterPayload, AuthResponse, AuthResponseData } from "./auth";
export { analyzeDiet, updateDietManual } from "./diet";
export { fetchRecommendations } from "./recommendations";
export { fetchWeeklyReport } from "./report";
export { fetchCharacter, CHARACTER_THEME, getRiskChangeType } from "./character";

// HTTP 클라이언트 (필요 시 직접 사용)
export { client, HttpError, setAuthToken, getAuthToken } from "./client";
