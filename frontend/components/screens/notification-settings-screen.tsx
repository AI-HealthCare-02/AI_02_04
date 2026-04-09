
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AlertModal } from "@/components/ui/confirm-dialog";
import { ScrollHeader } from "@/components/ui/scroll-header";
import { useScrollHeader } from "@/hooks/use-scroll-header";
import {
  ArrowLeft,
  Bell,
  BellOff,
  CheckCircle2,
  Settings,
  Megaphone,
  Gift,
  HeartPulse,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function NotificationSettingsScreen() {
  const { setScreen } = useAppStore();
  const isScrolled = useScrollHeader();

  const [systemPushEnabled,  setSystemPushEnabled]  = useState(false);
  const [eventPushEnabled,   setEventPushEnabled]   = useState(false);
  const [missionPushEnabled, setMissionPushEnabled] = useState(false);
  const [healthPushEnabled,  setHealthPushEnabled]  = useState(false);
  const [showPermissionAlert, setShowPermissionAlert] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-12">
      {/* ── 스크롤 컴팩트 헤더 ── */}
      <ScrollHeader
        title="맞춤형 푸시 알림"
        onBack={() => setScreen("mypage")}
        visible={isScrolled}
      />

      {/* ── 기본 헤더 ── */}
      <div className="bg-white border-b border-black/[0.06]">
        <div className="flex items-center gap-1 px-4 pt-12 pb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setScreen("mypage")}
            className="shrink-0 text-[#3C3C3C]"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div className="ms-1">
            <h1 className="text-[18px] font-bold text-[#3C3C3C] leading-snug">맞춤형 푸시 알림</h1>
            <p className="text-[13px] text-[#7A7A7A] font-medium">알림 권한 및 수신 설정</p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-4">

        {/* ── 시스템 알림 상태 카드 ── */}
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
          <div className="flex items-center gap-4">
            {/* 상태 아이콘 */}
            <div
              className={cn(
                "size-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors",
                systemPushEnabled ? "bg-[#CBF891]" : "bg-[#F5F5F5]",
              )}
            >
              {systemPushEnabled ? (
                <Bell className="size-7 text-[#3E8C28]" />
              ) : (
                <BellOff className="size-7 text-[#C8C8C8]" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[16px] font-bold text-[#2A2A2A]">시스템 알림</p>
                <span
                  className={cn(
                    "text-[11px] font-bold px-2 py-0.5 rounded-full",
                    systemPushEnabled
                      ? "bg-[#CBF891] text-[#3E8C28]"
                      : "bg-[#F5F5F5] text-[#9B9B9B]",
                  )}
                >
                  {systemPushEnabled ? "허용됨" : "꺼짐"}
                </span>
              </div>
              <p className="text-[12px] text-[#9B9B9B] font-medium">
                {systemPushEnabled
                  ? "알림을 받을 준비가 됐어요"
                  : "아래 버튼으로 알림 권한을 허용해 주세요"}
              </p>
            </div>
          </div>

          {/* 권한 설정 버튼 */}
          {!systemPushEnabled && (
            <button
              className="mt-4 w-full h-12 rounded-2xl bg-[#F0F0F0] hover:bg-[#E4E4E4] flex items-center justify-center gap-2 text-[14px] font-bold text-[#3C3C3C] transition-colors"
              onClick={() => setShowPermissionAlert(true)}
            >
              <Settings className="size-4" />
              권한 설정 하러 가기
            </button>
          )}
        </div>

        {/* ── 알림 종류별 설정 ── */}
        <div>
          <p className="text-[12px] font-bold text-[#6A6A6A] uppercase tracking-[0.05em] mb-3 px-1">
            알림 종류
          </p>

          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            {[
              {
                icon: HeartPulse,
                iconBg: systemPushEnabled && missionPushEnabled ? "#FFB8CA" : "#F5F5F5",
                iconColor: systemPushEnabled && missionPushEnabled ? "#C0305A" : "#C8C8C8",
                label: "미션 알림",
                desc: "오늘의 미션 시작 및 달성 알림",
                checked: missionPushEnabled,
                onChange: setMissionPushEnabled,
              },
              {
                icon: Megaphone,
                iconBg: systemPushEnabled && eventPushEnabled ? "#FFF383" : "#F5F5F5",
                iconColor: systemPushEnabled && eventPushEnabled ? "#8C7010" : "#C8C8C8",
                label: "이벤트 및 혜택 알림",
                desc: "앱 푸시 이벤트·프로모션 정보",
                checked: eventPushEnabled,
                onChange: setEventPushEnabled,
              },
              {
                icon: Gift,
                iconBg: systemPushEnabled && healthPushEnabled ? "#CBF891" : "#F5F5F5",
                iconColor: systemPushEnabled && healthPushEnabled ? "#3E8C28" : "#C8C8C8",
                label: "건강 리포트 알림",
                desc: "주간 리포트 발행 시 알림",
                checked: healthPushEnabled,
                onChange: setHealthPushEnabled,
              },
            ].map((item, idx) => (
              <div key={item.label}>
                {idx > 0 && <div className="h-px bg-[#F5F5F5] mx-5" />}
                <div
                  className={cn(
                    "flex items-center gap-3.5 px-5 py-4 transition-colors",
                    !systemPushEnabled && "opacity-40 pointer-events-none",
                  )}
                >
                  <div
                    className="size-10 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                    style={{ backgroundColor: item.iconBg }}
                  >
                    <item.icon className="size-5" style={{ color: item.iconColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-[#2A2A2A]">{item.label}</p>
                    <p className="text-[12px] text-[#9B9B9B] font-medium mt-0.5">{item.desc}</p>
                  </div>
                  <Switch
                    checked={item.checked}
                    onCheckedChange={item.onChange}
                    disabled={!systemPushEnabled}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* 시스템 권한 안내 */}
          {!systemPushEnabled && (
            <div className="flex items-center gap-2 mt-3 px-2">
              <div className="size-1.5 rounded-full bg-[#C0305A] shrink-0" />
              <p className="text-[12px] text-[#9B9B9B] font-medium">
                알림을 받으려면 먼저 시스템 알림 권한을 켜주세요.
              </p>
            </div>
          )}
        </div>

        {/* ── 알림 수신 현황 요약 ── */}
        {systemPushEnabled && (
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
            <p className="text-[12px] font-bold text-[#6A6A6A] uppercase tracking-[0.05em] mb-3">
              현재 수신 중인 알림
            </p>
            <div className="space-y-2">
              {[
                { label: "미션 알림",        enabled: missionPushEnabled, color: "#C0305A", bg: "#FFB8CA" },
                { label: "이벤트 및 혜택",   enabled: eventPushEnabled,   color: "#8C7010", bg: "#FFF383" },
                { label: "건강 리포트",      enabled: healthPushEnabled,  color: "#3E8C28", bg: "#CBF891" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="size-1.5 rounded-full"
                      style={{ backgroundColor: item.enabled ? item.bg : "#E8E8E8" }}
                    />
                    <p className="text-[13px] font-medium text-[#3C3C3C]">{item.label}</p>
                  </div>
                  {item.enabled ? (
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: item.bg, color: item.color }}
                    >
                      수신 중
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-[#C8C8C8] bg-[#F5F5F5] px-2 py-0.5 rounded-full">
                      꺼짐
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ── 권한 안내 알림 모달 ── */}
      <AlertModal
        open={showPermissionAlert}
        onOpenChange={(open) => {
          if (!open) {
            setShowPermissionAlert(false);
            setTimeout(() => setSystemPushEnabled(true), 300);
          }
        }}
        icon={Bell}
        iconBg="#CBF891"
        iconColor="#3E8C28"
        title="시스템 설정으로 이동합니다"
        description="시뮬레이션: 확인을 누르면 알림 권한이 허용됩니다."
        confirmLabel="확인"
      />
    </div>
  );
}
