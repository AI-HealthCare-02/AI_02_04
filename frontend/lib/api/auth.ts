import { client } from "./client";

/* ── 요청 타입 ── */
export interface RegisterPayload {
  email: string;
  password: string;
  nickname: string;
  user_type: "normal" | "risk" | "diabetes";
  goal?: "diet" | "maintain" | "fitness" | null;
  diabetes_type?: "1type" | "2type" | null;
  gender: number;          // 0=여, 1=남
  age: number;
  height: number;
  weight: number;
  is_hypertension: boolean;
  is_cholesterol: boolean;
  is_heart_disease: boolean;
  walking_difficulty: boolean;
  general_health: number;  // 1~5
  alcohol_status: boolean;
  smoke_status?: boolean | null;
  exercise_freq?: number | null;
  fruit_intake?: boolean | null;
  veggie_intake?: boolean | null;
}

/* ── 응답 타입 ── */
export interface AuthResponseData {
  access_token: string;
  refresh_token: string;
  user_type: string;
  goal?: string | null;
  risk_level?: string | null;
  diabetes_type?: string | null;
  user_id?: number;
}

export interface AuthResponse {
  success: boolean;
  data: AuthResponseData;
}

/* ── API 함수 ── */
export async function registerUser(payload: RegisterPayload): Promise<AuthResponse> {
  return client.post<AuthResponse>("/auth/register", payload);
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  return client.post<AuthResponse>("/auth/login", { email, password });
}

export async function refreshTokens(refreshToken: string): Promise<AuthResponse> {
  return client.post<AuthResponse>("/auth/refresh", { refresh_token: refreshToken });
}

export interface CheckEmailResponse {
  success: boolean;
  data: {
    available: boolean;
  };
}

/**
 * 이메일 중복 확인
 * 백엔드 응답: { success: true, data: { available: true | false } }
 */
export async function checkEmail(email: string): Promise<CheckEmailResponse> {
  return client.get<CheckEmailResponse>(
    `/auth/check-email?email=${encodeURIComponent(email)}`,
  );
}
