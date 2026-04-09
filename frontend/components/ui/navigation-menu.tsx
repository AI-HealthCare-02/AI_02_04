import { useAppStore } from "@/lib/store";
import { Home, Target, Camera, BookOpen, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppScreen } from "@/lib/types";

const navItems: { id: AppScreen; label: string; icon: React.ElementType }[] = [
  { id: "home",       label: "홈",      icon: Home },
  { id: "missions",   label: "미션",    icon: Target },
  { id: "diet",       label: "식단",    icon: Camera },
  { id: "collection", label: "도감",    icon: BookOpen },
  { id: "mypage",     label: "내 건강", icon: User },
];

const hideOnScreens: AppScreen[] = [
  "splash",
  "login",
  "onboarding",
  "health-info",
  "analysis",
  "permissions",
  "character-birth",
];

export function BottomNav() {
  const { currentScreen, setScreen } = useAppStore();

  if (hideOnScreens.includes(currentScreen)) return null;

  return (
    /* 흰색 배경 + whisper 상단 경계선 */
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-black/[0.07]">
      <div className="flex items-center justify-around px-2 pt-1.5 pb-5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setScreen(item.id)}
              /* 터치 타겟 min 44px 확보 */
              className={cn(
                "flex flex-col items-center gap-1.5 flex-1 py-1",
                "transition-all duration-150 ease-out",
                "active:scale-[0.90]",
                "focus-visible:outline-none",
              )}
            >
              {/* 아이콘 영역 — active 시 연한 민트 pill 배경 */}
              <div className="flex items-center justify-center px-5 py-1">
                <Icon
                  className={cn(
                    "size-[22px] transition-colors duration-150",
                    isActive ? "text-primary" : "text-[#9B9B9B]",
                  )}
                  strokeWidth={isActive ? 2.3 : 1.7}
                />
              </div>

              {/* 라벨 — 10px, active: primary 컬러 / inactive: #9B9B9B */}
              <span
                className={cn(
                  "text-[10px] leading-none transition-colors duration-150",
                  isActive
                    ? "font-bold text-primary"
                    : "font-medium text-[#9B9B9B]",
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
