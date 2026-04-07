
import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { CharacterEgg } from "@/components/character";
import { Heart } from "lucide-react";

export function SplashScreen() {
  const { setScreen, userProfile, character, autoLogin } = useAppStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      // 회원가입 및 캐릭터 생성까지 완벽하게 마친 유저인지 확인
      if (userProfile && character) {
        if (autoLogin) {
          setScreen("home"); // 자동 로그인
        } else {
          setScreen("login"); // 로그인 화면으로 이동
        }
      } else {
        // 처음 앱을 켰거나, 가입 도중 나간 유저는 온보딩부터
        setScreen("onboarding");
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [setScreen, userProfile, character, autoLogin]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/20 via-background to-background flex flex-col items-center justify-center p-6">
      <div className="flex flex-col items-center gap-8">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/30 rounded-full blur-3xl animate-pulse" />
          <CharacterEgg size="xl" animated />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground flex items-center gap-2 justify-center">
            헬시프렌드
            <Heart className="w-8 h-8 text-primary fill-primary animate-pulse" />
          </h1>
          <p className="text-muted-foreground text-lg">
            건강한 습관, 귀여운 친구
          </p>
        </div>
        <div className="flex gap-1">
          <div
            className="w-2 h-2 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <div
            className="w-2 h-2 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <div
            className="w-2 h-2 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}
