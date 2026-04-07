
import { useAppStore } from "@/lib/store";
import { Home, Target, Camera, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppScreen } from "@/lib/types";

export function BottomNav() {
  const { currentScreen, setScreen } = useAppStore();

  // 💡 여기에 메뉴를 정의해두면, 앞으로 메뉴를 수정할 때 이 파일 딱 하나만 고치면 전체 앱에 반영됩니다!
  // (만약 도감(컬렉션)을 빼고 싶다면 해당 줄만 지우시면 됩니다)
  const navItems: { id: AppScreen; label: string; icon: React.ElementType }[] =
    [
      { id: "home", label: "홈", icon: Home },
      { id: "missions", label: "미션", icon: Target },
      { id: "diet", label: "식단", icon: Camera },
      { id: "collection", label: "도감", icon: Trophy },
      { id: "mypage", label: "내 건강", icon: User },
    ];

  // 숨겨야 하는 화면들 (스플래시, 로그인, 온보딩 등에서는 하단 바가 안 보이도록 처리)
  const hideOnScreens: AppScreen[] = [
    "splash",
    "login",
    "onboarding",
    "health-info",
    "analysis",
    "permissions",
    "character-birth",
  ];
  if (hideOnScreens.includes(currentScreen)) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id; // 현재 화면과 id가 일치하면 자동 활성화!

          return (
            <button
              key={item.id}
              onClick={() => setScreen(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary/70",
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
