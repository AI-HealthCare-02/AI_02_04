// ─── 공통 ───────────────────────────────────────────────────────────────────

export type Difficulty = "easy" | "medium" | "hard";

// ─── 식단 분석 (POST /diet/analyze) ─────────────────────────────────────────

export type HighlightField = "calories" | "protein" | "carbs";

export interface DietAlternative {
  name: string;
  confidence: number;
}

export interface HealthierAlternative {
  name: string;
  reason: string;
}

export interface DietClassification {
  confidence: number;
  alternatives: DietAlternative[];
}

export interface DietAnalyzeResponse {
  food_name: string;
  calories: number;
  carbs: number;
  protein: number;
  sugar: number;
  fiber: number;
  gi_index: number;
  diet_score: number;
  /** 강조할 영양소 필드 */
  highlight: HighlightField;
  health_notes: string[];
  /** null이면 숨김 */
  healthier_alternative: HealthierAlternative | null;
  classification: DietClassification;
}

export interface DietManualUpdateRequest {
  food_name: string;
  calories?: number;
  carbs?: number;
  protein?: number;
}

// ─── 추천 (POST /recommend) ──────────────────────────────────────────────────

export type CorrectionStatus =
  | "CONFIDENT"
  | "CONFIDENT_AFTER_RETRY"
  | "REDUCED"
  | "INSUFFICIENT"
  | "ESCALATED";

export interface Recommendation {
  action: string;
  reason: string;
  evidence_source: string;
  confidence: number;
  difficulty: Difficulty;
}

export interface RecommendationsData {
  recommendations: Recommendation[];
  correction_status: CorrectionStatus;
  safety_flags: string[];
  disclaimer: string;
  generated_at: string;
  /** ESCALATED일 때만 존재 */
  escalation_message?: string;
  /** INSUFFICIENT 또는 safety 차단 시 존재 */
  fallback_message?: string;
  /** CRAG-lite caveat 메시지 */
  caveat?: string;
}

/** 백엔드 응답 래퍼: { success: true, data: RecommendationsData } */
export interface RecommendationsResponse {
  success: boolean;
  data: RecommendationsData;
}

// ─── 주간 리포트 (GET /report/weekly) ───────────────────────────────────────

export type ReportType = "full" | "partial" | "mini";

export interface AiBriefing {
  good: string;
  bad: string;
  next_week: string;
}

export interface ChallengeRedesignSuggestion {
  current_challenge: string;
  suggested_change: string;
}

export interface WeeklyReportResponse {
  report_type: ReportType;
  /** full 타입일 때만 존재 */
  health_score?: number;
  /** full 타입일 때만 존재 */
  ai_briefing?: AiBriefing;
  /** full 타입일 때만 존재 */
  challenge_redesign_suggestions?: ChallengeRedesignSuggestion[];
  /** mini/partial 타입에서 캐릭터 독려 메시지 */
  character_message?: string;
}

// ─── 캐릭터 (GET /character) ─────────────────────────────────────────────────

export type OverallState =
  | "happy"
  | "energetic"
  | "recovering"
  | "tired"
  | "struggling";

export interface CharacterState {
  energy: number;
  mood: number;
  stability: number;
  recovery: number;
  growth: number;
  overall_state: OverallState;
  message: string;
  avg_score: number;
}

export interface RiskChangeSummary {
  previous_probability: number;
  current_probability: number;
  /** 절댓값 변화량 */
  change: number;
  improved: boolean;
  /** 예: "68% → 52%" */
  message: string;
}

export interface CharacterResponse {
  character_state: CharacterState;
  /** 재예측 시에만 존재, 없으면 null */
  risk_change_summary: RiskChangeSummary | null;
  generated_at: string;
}

// ─── 캐릭터 UI 헬퍼 타입 ────────────────────────────────────────────────────

export interface CharacterTheme {
  bgColor: string;
  label: string;
}

export type RiskChangeType =
  | "big_improvement"
  | "small_improvement"
  | "small_worsening"
  | "big_worsening"
  | "none";

// ─── API 에러 ────────────────────────────────────────────────────────────────

export interface ApiError {
  status: number;
  message: string;
  code?: string;
}
