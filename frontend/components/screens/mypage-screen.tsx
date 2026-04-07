
import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { BottomNav } from "@/components/ui/navigation-menu";

import {
  Home,
  Target,
  Camera,
  User as UserIcon,
  ChevronRight,
  Settings,
  Activity,
  FileText,
  Smartphone,
  Bell,
  LogOut,
  UserMinus,
} from "lucide-react";
import { cn } from "@/lib/utils";

// 유저 타입(당뇨/위험군/일반) 매핑 함수
const getUiUserType = (type?: string) => {
  if (!type) return "일반";
  if (type.startsWith("general")) return "일반";
  if (type === "at_risk") return "위험군";
  if (type === "diabetic_1") return "제1형 당뇨";
  if (type === "diabetic_2") return "제2형 당뇨";
  return "일반";
};

export function MyPageScreen() {
  const { userProfile, setScreen, logout } = useAppStore();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // 기능 토글 상태 (UI 시뮬레이션용)
  const [syncHealthData, setSyncHealthData] = useState(false);

  useEffect(() => {
    setCurrentTime(new Date());
  }, []);

  const greeting = !currentTime
    ? "반가워요"
    : currentTime.getHours() < 12
      ? "좋은 아침이에요"
      : currentTime.getHours() < 18
        ? "좋은 오후에요"
        : "좋은 저녁이에요";

  const handleLogout = () => {
    if (confirm("정말 로그아웃 하시겠습니까?")) {
      logout();
    }
  };

  const handleWithdrawal = () => {
    if (
      confirm("탈퇴하시면 모든 데이터가 삭제됩니다. 정말 탈퇴하시겠습니까?")
    ) {
      alert("탈퇴 처리가 완료되었습니다.");
      logout(); // 테스트용으로 로그아웃 처리
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-background pb-24">
      {/* 최상단: 인사말 및 유저 정보 */}
      <div className="p-6 pt-10 pb-6">
        <p className="text-sm text-muted-foreground mb-1">{greeting}</p>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-foreground">
            {userProfile?.name}님
          </h1>
          <span className="text-xs font-semibold bg-primary/15 text-primary px-2.5 py-1 rounded-full">
            {getUiUserType(userProfile?.healthType)} 관리
          </span>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* 1. 내 건강 */}
        <section className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground px-2">
            내 건강
          </h3>
          <Card className="overflow-hidden border-border/50 shadow-sm">
            <div className="flex flex-col">
              <MenuItem
                icon={Settings}
                label="건강 정보 수정"
                onClick={() => setScreen("edit-health-info")}
              />
              <div className="h-[1px] bg-border/50 mx-4" />
              <MenuItem
                icon={Activity}
                label="일일 건강 기록"
                onClick={() => setScreen("daily-log")}
              />
              <div className="h-[1px] bg-border/50 mx-4" />
              <MenuItem
                icon={FileText}
                label="주간 건강 리포트"
                onClick={() => setScreen("report-list")}
              />
            </div>
          </Card>
        </section>

        {/* 2. 연동 및 맞춤 알림 설정 */}
        <section className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground px-2">
            연동 및 맞춤 알림 설정
          </h3>
          <Card className="overflow-hidden border-border/50 shadow-sm">
            <div className="flex flex-col">
              <MenuItem
                icon={Smartphone}
                label="건강 데이터 연동"
                iconColor="text-blue-500"
                iconBg="bg-blue-500/10"
                onClick={() => setScreen("data-sync")}
              />
              <div className="h-[1px] bg-border/50 mx-4" />
              <MenuItem
                icon={Bell}
                label="맞춤형 푸시 알림 설정"
                iconColor="text-amber-500"
                iconBg="bg-amber-500/10"
                onClick={() => setScreen("notification-settings")}
              />
            </div>
          </Card>
        </section>

        {/* 3. 계정 */}
        <section className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground px-2">
            계정
          </h3>
          <Card className="overflow-hidden border-border/50 shadow-sm">
            <div className="flex flex-col">
              <MenuItem
                icon={LogOut}
                label="로그아웃"
                iconColor="text-muted-foreground"
                iconBg="bg-muted"
                onClick={handleLogout}
              />
              <div className="h-[1px] bg-border/50 mx-4" />
              <MenuItem
                icon={UserMinus}
                label="회원탈퇴"
                iconColor="text-destructive"
                iconBg="bg-destructive/10"
                textColor="text-destructive"
                onClick={handleWithdrawal}
              />
            </div>
          </Card>
        </section>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

// 재사용 가능한 메뉴 아이템 컴포넌트
function MenuItem({
  icon: Icon,
  label,
  onClick,
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
  textColor = "text-foreground",
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  iconColor?: string;
  iconBg?: string;
  textColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between p-4 bg-card hover:bg-muted/50 transition-colors w-full text-left"
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            iconBg,
          )}
        >
          <Icon className={cn("w-4 h-4", iconColor)} />
        </div>
        <span className={cn("font-medium text-sm", textColor)}>{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </button>
  );
}
