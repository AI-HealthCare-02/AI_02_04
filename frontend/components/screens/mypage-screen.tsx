import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/ui/navigation-menu";
import { ConfirmDialog, AlertModal } from "@/components/ui/confirm-dialog";
import { Character } from "@/components/character";

import {
  ChevronRight,
  Settings,
  Activity,
  FileText,
  Smartphone,
  Bell,
  LogOut,
  UserMinus,
  TriangleAlert,
  Zap,
  Target,
  Trophy,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── 헬스 타입 라벨 ──────────────────────────────────────
const getHealthTypeLabel = (type?: string) => {
  if (!type) return "일반 관리";
  if (type.startsWith("general")) return "일반 관리";
  if (type === "at_risk") return "위험군 관리";
  if (type === "diabetic_1") return "제1형 당뇨 관리";
  if (type === "diabetic_2") return "제2형 당뇨 관리";
  return "일반 관리";
};

const getHealthTypeBadge = (type?: string): { bg: string; color: string } => {
  if (!type || type.startsWith("general"))
    return { bg: "#CBF891", color: "#3E8C28" };
  if (type === "at_risk") return { bg: "#FFF383", color: "#8C7010" };
  if (type.startsWith("diabetic")) return { bg: "#FFB8CA", color: "#C0305A" };
  return { bg: "#CBF891", color: "#3E8C28" };
};

// ── 메뉴 아이템 타입 ─────────────────────────────────────
interface MenuItemDef {
  icon: React.ElementType;
  label: string;
  sub?: string;
  iconBg: string;
  iconColor: string;
  onClick: () => void;
  destructive?: boolean;
}

export function MyPageScreen() {
  const { userProfile, character, missions, setScreen, logout } = useAppStore();

  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [showWithdrawDone, setShowWithdrawDone] = useState(false);

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

  // ── 파생 데이터 ──
  const completedMissions = missions.filter((m) => m.completed).length;
  const totalMissions = missions.length;
  const badge = getHealthTypeBadge(userProfile?.healthType);

  // ── 메뉴 섹션 정의 ──
  const healthMenuItems: MenuItemDef[] = [
    {
      icon: Settings,
      label: "건강 정보 수정",
      sub: "나이·체중·질환 정보 관리",
      iconBg: "#CBF891",
      iconColor: "#3E8C28",
      onClick: () => setScreen("edit-health-info"),
    },
    {
      icon: Activity,
      label: "일일 건강 기록",
      sub: "오늘의 미션 달성 현황",
      iconBg: "#AEE1F9",
      iconColor: "#2878B0",
      onClick: () => setScreen("daily-log"),
    },
    {
      icon: FileText,
      label: "주간 건강 리포트",
      sub: "AI 분석 리포트 열람",
      iconBg: "#A1E8CE",
      iconColor: "#1A7858",
      onClick: () => setScreen("report-list"),
    },
  ];

  const settingsMenuItems: MenuItemDef[] = [
    {
      icon: Smartphone,
      label: "건강 데이터 연동",
      sub: "워치·앱 데이터 동기화",
      iconBg: "#AEE1F9",
      iconColor: "#2878B0",
      onClick: () => setScreen("data-sync"),
    },
    {
      icon: Bell,
      label: "맞춤형 푸시 알림",
      sub: "알림 권한 및 수신 설정",
      iconBg: "#FFF383",
      iconColor: "#8C7010",
      onClick: () => setScreen("notification-settings"),
    },
  ];

  const accountMenuItems: MenuItemDef[] = [
    {
      icon: LogOut,
      label: "로그아웃",
      iconBg: "#F0F0F0",
      iconColor: "#6A6A6A",
      onClick: () => setShowLogoutConfirm(true),
    },
    {
      icon: UserMinus,
      label: "회원탈퇴",
      iconBg: "#FFB8CA",
      iconColor: "#C0305A",
      onClick: () => setShowWithdrawConfirm(true),
      destructive: true,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-28">
      {/* ── TopBar ── */}
      <div className="px-6 pt-12 pb-5">
        <p className="text-[13px] text-[#7A7A7A] font-medium mb-1">
          {greeting}
        </p>
        <div className="flex items-end justify-between">
          <h1 className="text-[28px] font-bold text-[#2A2A2A] leading-tight tracking-[-0.02em]">
            {userProfile?.name}님
          </h1>
          <span
            className="text-[11px] font-bold px-3 py-1.5 rounded-full mb-1"
            style={{ backgroundColor: badge.bg, color: badge.color }}
          >
            {getHealthTypeLabel(userProfile?.healthType)}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* ── 프로필 히어로 카드 ── */}
        <div className="mx-5">
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            {/* 캐릭터 + 상태 */}
            <div className="flex items-center gap-4 px-5 pt-5 pb-4">
              <div className="shrink-0">
                {character ? (
                  <Character
                    mood={character.mood}
                    level={character.level}
                    size="sm"
                    showPlatform={false}
                  />
                ) : (
                  <div className="size-14 rounded-2xl bg-[#F0F0F0] flex items-center justify-center">
                    <Trophy className="size-7 text-[#C8C8C8]" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[16px] font-bold text-[#2A2A2A] leading-snug truncate">
                  {character?.name ?? "캐릭터 없음"}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: badge.bg, color: badge.color }}
                  >
                    Lv.{character?.level ?? 1}
                  </span>
                  <span className="text-[12px] text-[#7A7A7A] font-medium">
                    {getHealthTypeLabel(userProfile?.healthType)}
                  </span>
                </div>
              </div>
              <button
                className="shrink-0 flex items-center gap-1 text-[12px] font-bold text-[#3E8C28] bg-[#F0FDF4] px-3 py-2 rounded-xl"
                onClick={() => setScreen("collection")}
              >
                도감
                <ChevronRight className="size-3.5" />
              </button>
            </div>

            {/* 구분선 */}
            <div className="h-px bg-[#F0F0F0] mx-5" />

            {/* 핵심 스탯 3개 */}
            <div className="grid grid-cols-3 px-5 py-4">
              {[
                {
                  icon: Zap,
                  iconColor: "#6366F1",
                  iconBg: "#EEF2FF",
                  value: (character?.experience ?? 0).toLocaleString(),
                  unit: "XP",
                  label: "누적 경험치",
                },
                {
                  icon: Target,
                  iconColor: "#2878B0",
                  iconBg: "#D6EEFF",
                  value: `${completedMissions}`,
                  unit: `/${totalMissions}`,
                  label: "오늘 미션",
                },
                {
                  icon: TrendingUp,
                  iconColor: "#3E8C28",
                  iconBg: "#E8F9D6",
                  value: `${character?.level ?? 1}`,
                  unit: "레벨",
                  label: "캐릭터",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div
                    className="size-8 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: stat.iconBg }}
                  >
                    <stat.icon
                      className="size-4"
                      style={{ color: stat.iconColor }}
                      strokeWidth={2}
                    />
                  </div>
                  <p className="text-[18px] font-bold text-[#2A2A2A] leading-none">
                    {stat.value}
                    <span className="text-[11px] font-medium text-[#9B9B9B] ms-0.5">
                      {stat.unit}
                    </span>
                  </p>
                  <p className="text-[11px] font-medium text-[#7A7A7A] uppercase tracking-[0.04em]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 내 건강 섹션 ── */}
        <MenuCard label="내 건강" items={healthMenuItems} />

        {/* ── 연동 및 알림 섹션 ── */}
        <MenuCard label="연동 및 알림" items={settingsMenuItems} />

        {/* ── 계정 섹션 ── */}
        <MenuCard label="계정" items={accountMenuItems} />

        {/* 하단 여백 */}
        <div className="h-2" />
      </div>

      <BottomNav />

      {/* ── 로그아웃 확인 ── */}
      <ConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        icon={LogOut}
        iconBg="#CBF891"
        iconColor="#3E8C28"
        title="로그아웃 하시겠습니까?"
        description="로그아웃하면 다시 로그인이 필요합니다."
        confirmLabel="로그아웃"
        cancelLabel="취소"
        onConfirm={logout}
      />

      {/* ── 회원탈퇴 확인 ── */}
      <ConfirmDialog
        open={showWithdrawConfirm}
        onOpenChange={setShowWithdrawConfirm}
        icon={TriangleAlert}
        iconBg="#FFB8CA"
        iconColor="#C0305A"
        title="정말 탈퇴하시겠습니까?"
        description="탈퇴하시면 모든 데이터가 삭제되며 복구할 수 없습니다."
        confirmLabel="탈퇴하기"
        cancelLabel="취소"
        confirmVariant="destructive"
        onConfirm={() => {
          setShowWithdrawConfirm(false);
          setShowWithdrawDone(true);
        }}
      />

      {/* ── 탈퇴 완료 ── */}
      <AlertModal
        open={showWithdrawDone}
        onOpenChange={(open) => {
          if (!open) {
            setShowWithdrawDone(false);
            logout();
          }
        }}
        icon={TriangleAlert}
        iconBg="#FFB8CA"
        iconColor="#C0305A"
        title="탈퇴가 완료되었습니다"
        description="그동안 이용해 주셔서 감사합니다."
        confirmLabel="확인"
      />
    </div>
  );
}

// ── 재사용 메뉴 카드 컴포넌트 ────────────────────────────
function MenuCard({ label, items }: { label: string; items: MenuItemDef[] }) {
  return (
    <div className="mx-5">
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        {/* 카드 내 섹션 레이블 */}
        <div className="px-5 pt-4 pb-3">
          <p className="text-[12px] font-medium text-[#6A6A6A] uppercase tracking-[0.05em]">
            {label}
          </p>
        </div>
        {/* 메뉴 아이템 목록 */}
        {items.map((item, idx) => (
          <div key={item.label}>
            {idx > 0 && <div className="h-px bg-[#F5F5F5] mx-5" />}
            <button
              onClick={item.onClick}
              className="w-full flex items-center gap-3.5 px-5 py-3.5 hover:bg-[#FAFAFA] active:bg-[#F5F5F5] transition-colors text-left"
            >
              {/* 아이콘 배지 */}
              <div
                className="size-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: item.iconBg }}
              >
                <item.icon
                  className="size-[18px]"
                  style={{ color: item.iconColor }}
                  strokeWidth={2}
                />
              </div>
              {/* 텍스트 */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-[15px] font-semibold leading-snug",
                    item.destructive ? "text-[#C0305A]" : "text-[#2A2A2A]",
                  )}
                >
                  {item.label}
                </p>
                {item.sub && (
                  <p className="text-[12px] text-[#9B9B9B] font-medium mt-0.5">
                    {item.sub}
                  </p>
                )}
              </div>
              {/* 화살표 */}
              <ChevronRight
                className="size-4 shrink-0"
                style={{ color: item.destructive ? "#F0A0B8" : "#C8C8C8" }}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
