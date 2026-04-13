/* ──────────────────────────────────────────────────────────────
   카카오 SDK 타입 선언
────────────────────────────────────────────────────────────── */
declare global {
  interface Window {
    Kakao: {
      init: (appKey: string) => void;
      isInitialized: () => boolean;
      Auth: {
        login: (options: {
          success: (authObj: { access_token: string }) => void;
          fail: (error: unknown) => void;
          scope?: string;
        }) => void;
        logout: (callback?: () => void) => void;
      };
      API: {
        request: (options: {
          url: string;
          success: (response: KakaoUserInfo) => void;
          fail: (error: unknown) => void;
        }) => void;
      };
    };
  }
}

export interface KakaoUserInfo {
  id: number;
  kakao_account?: {
    email?: string;
    gender?: "male" | "female";
    age_range?: string; // e.g. "20~29"
    profile?: {
      nickname?: string;
      profile_image_url?: string;
    };
  };
}

/* ──────────────────────────────────────────────────────────────
   초기화
────────────────────────────────────────────────────────────── */
const APP_KEY = import.meta.env.VITE_KAKAO_APP_KEY as string | undefined;

export function initKakao(): void {
  if (!APP_KEY) return; // 키 없으면 dev mock 모드로 동작
  if (typeof window !== "undefined" && window.Kakao && !window.Kakao.isInitialized()) {
    window.Kakao.init(APP_KEY);
    console.info("[Kakao] SDK initialized");
  }
}

/* ──────────────────────────────────────────────────────────────
   로그인
   - APP_KEY 설정 시: 실제 카카오 로그인 팝업
   - APP_KEY 미설정 시: 개발용 Mock 사용자 반환
────────────────────────────────────────────────────────────── */
export function kakaoLogin(): Promise<KakaoUserInfo> {
  // 개발 Mock 모드
  if (!APP_KEY || !window.Kakao?.Auth) {
    console.warn("[Kakao] APP_KEY 없음 → dev mock 반환");
    return Promise.resolve({
      id: 9999999999,
      kakao_account: {
        email: "kakao_dev@example.com",
        gender: "male" as const,
        age_range: "20~29",
        profile: {
          nickname: "카카오유저",
          profile_image_url: "",
        },
      },
    });
  }

  return new Promise((resolve, reject) => {
    window.Kakao.Auth.login({
      scope: "profile_nickname,account_email,gender,age_range",
      success: () => {
        window.Kakao.API.request({
          url: "/v2/user/me",
          success: resolve,
          fail: reject,
        });
      },
      fail: reject,
    });
  });
}

export function kakaoLogout(): Promise<void> {
  return new Promise((resolve) => {
    if (!window.Kakao?.Auth) {
      resolve();
      return;
    }
    window.Kakao.Auth.logout(() => resolve());
  });
}
