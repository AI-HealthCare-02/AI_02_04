/* ──────────────────────────────────────────────────────────────
   네이버 OAuth 2.0 로그인
   - VITE_NAVER_CLIENT_ID 설정 시: 실제 팝업 로그인
   - 미설정 시: 개발용 Mock 사용자 반환
────────────────────────────────────────────────────────────── */

export interface NaverUserInfo {
  id: string;
  email?: string;
  name?: string;
  gender?: "M" | "F";
  age?: string;       // e.g. "20-29"
  birthyear?: string;
}

const CLIENT_ID = import.meta.env.VITE_NAVER_CLIENT_ID as string | undefined;

function getRedirectUri(): string {
  return `${typeof window !== "undefined" ? window.location.origin : ""}/naver-callback.html`;
}

/* ──────────────────────────────────────────────────────────────
   로그인
────────────────────────────────────────────────────────────── */
export function naverLogin(): Promise<NaverUserInfo> {
  // 개발 Mock 모드 (CLIENT_ID 없을 때)
  if (!CLIENT_ID || typeof window === "undefined") {
    console.warn("[Naver] VITE_NAVER_CLIENT_ID 없음 → dev mock 반환");
    return Promise.resolve({
      id: "naver_dev_12345",
      email: "naver_dev@example.com",
      name: "네이버유저",
      gender: "M" as const,
      age: "20-29",
      birthyear: "1995",
    });
  }

  return new Promise((resolve, reject) => {
    const state = crypto.randomUUID();
    const redirectUri = getRedirectUri();
    const url =
      `https://nid.naver.com/oauth2.0/authorize` +
      `?response_type=code` +
      `&client_id=${CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${state}`;

    const popup = window.open(url, "naver-login", "width=480,height=640,left=200,top=100");

    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "NAVER_LOGIN") return;

      window.removeEventListener("message", handler);
      clearInterval(timer);

      if (event.data.error) {
        reject(new Error(event.data.error));
      } else {
        resolve(event.data.userInfo ?? { id: "naver_" + event.data.state });
      }
    };

    window.addEventListener("message", handler);

    // 팝업이 닫히면 취소로 처리
    const timer = setInterval(() => {
      if (popup?.closed) {
        clearInterval(timer);
        window.removeEventListener("message", handler);
        reject(new Error("네이버 로그인이 취소되었습니다."));
      }
    }, 500);
  });
}

/* ──────────────────────────────────────────────────────────────
   로그아웃 (네이버는 클라이언트 측 로그아웃 별도 처리 불필요)
────────────────────────────────────────────────────────────── */
export function naverLogout(): Promise<void> {
  return Promise.resolve();
}
