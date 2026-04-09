
import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { CharacterEgg } from "@/components/character";

export function SplashScreen() {
  const { setScreen, userProfile, character, autoLogin } = useAppStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (userProfile && character) {
        setScreen(autoLogin ? "home" : "login");
      } else {
        setScreen("onboarding");
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
            HEALTHY FRIEND
          </p>
          <h1 className="text-[36px] font-black text-[#2A2A2A] tracking-[-0.03em] leading-none">
            헬시프렌드
          </h1>
          <p className="text-[14px] font-medium text-[#9B9B9B] mt-1">
            건강한 습관, 귀여운 친구
          </p>
        </div>

        {/* 캐릭터 */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-[#CBF891]/50 blur-2xl scale-110" />
          <div className="relative">
            <CharacterEgg size="xl" animated />
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
        © 2025 HealthyFriend. All rights reserved.
      </p>
    </div>
  );
}
