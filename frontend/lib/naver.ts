const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export interface NaverLoginResult {
  status: "new" | "existing";
  // 신규 유저
  naverId?: string;
  name?: string;
  email?: string;
  gender?: "M" | "F";
  age?: string;
  birthyear?: string;
  // 기존 유저
  accessToken?: string;
  refreshToken?: string;
}

export function naverLogin(): Promise<NaverLoginResult> {
  return new Promise(async (resolve, reject) => {
    // 1) 백엔드에서 OAuth URL 받기
    const res = await fetch(`${BASE_URL}/auth/naver/login`);
    const json = await res.json();
    const { url } = json.data;

    // 2) 팝업 열기
    const popup = window.open(
      url,
      "naver-login",
      "width=480,height=640,left=200,top=100",
    );

    // 3) 팝업에서 postMessage 수신
    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "NAVER_LOGIN") return;
      window.removeEventListener("message", handler);
      clearInterval(timer);
      event.data.error
        ? reject(new Error(event.data.error))
        : resolve(event.data);
    };
    window.addEventListener("message", handler);

    // 4) 팝업 강제 닫힘 감지
    const timer = setInterval(() => {
      if (popup?.closed) {
        clearInterval(timer);
        window.removeEventListener("message", handler);
        reject(new Error("네이버 로그인이 취소되었습니다."));
      }
    }, 500);
  });
}
