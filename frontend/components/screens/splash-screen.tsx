import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Character } from "@/components/character";
import { initKakao } from "@/lib/kakao";

export function SplashScreen() {
  const { setScreen, userProfile, character, autoLogin } = useAppStore();

  useEffect(() => {
    initKakao(); // 카카오 SDK 초기화

    const timer = setTimeout(() => {
      if (userProfile && character && autoLogin) {
        setScreen("home"); // 재방문 + 자동로그인 ON → 홈 바로
      } else if (userProfile && character) {
        setScreen("login"); // 재방문 + 자동로그인 OFF → 로그인
      } else {
        setScreen("onboarding"); // 신규 유저 (프로필 없음) → 온보딩
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [setScreen, userProfile, character, autoLogin]);

  return (
    <div className="min-h-screen bg-[#F9FFEF] flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center gap-10">
        {/* 로고 영역 */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-[13px] font-bold text-[#87D57B] uppercase tracking-[0.18em]">
            Dangmagotchi
          </p>
          <h1 className="text-[36px] font-black text-[#2A2A2A] tracking-[-0.03em] leading-none">
            당마고치
          </h1>
          <p className="text-[14px] font-medium text-[#9B9B9B] mt-1">
            건강한 습관, 귀여운 친구
          </p>
        </div>

        {/* 캐릭터 또는 알 */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-[#CBF891]/50 blur-2xl scale-110" />
          <div className="relative">
            {character ? (
              <Character size="xl" animated showPlatform={false} />
            ) : (
              <img
                src="/img-egg-1.png"
                alt="알"
                className="w-40 h-40 object-contain animate-bounce-gentle"
                style={{ imageRendering: "pixelated" }}
              />
            )}
          </div>
        </div>

        {/* 로딩 점 */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="size-2 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>

      {/* 하단 카피 */}
      <p className="absolute bottom-10 text-[11px] font-medium text-[#C8C8C8]">
        © 2026 Dangmagotchi. All rights reserved.
      </p>
    </div>
  );
}
