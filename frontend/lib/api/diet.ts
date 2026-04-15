import { client } from "./client";
import type { DietAnalyzeResponse, DietManualUpdateRequest } from "./types";

/**
 * 음식 사진을 업로드하여 식단을 분석합니다.
 * - confidence < 0.7이면 프론트에서 [다시분석] / [직접입력] 버튼을 노출하세요.
 */
export async function analyzeDiet(
  imageFile: File,
): Promise<DietAnalyzeResponse> {
  const formData = new FormData();
  formData.append("image", imageFile);

  const res = await fetch(
    `${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"}/diet/analyze`,
    {
      method: "POST",
      body: formData,
      // Content-Type은 브라우저가 multipart/form-data로 자동 설정
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<DietAnalyzeResponse>;
}

/**
 * 직접 입력 모달에서 음식 정보를 수정합니다.
 * (confidence < 0.7이고 사용자가 [직접입력] 선택 시)
 */
export async function updateDietManual(
  dietId: string,
  data: DietManualUpdateRequest,
): Promise<DietAnalyzeResponse> {
  return client.put<DietAnalyzeResponse>(`/diet/${dietId}/manual`, data);
}
