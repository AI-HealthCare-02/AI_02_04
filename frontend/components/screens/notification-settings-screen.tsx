import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ScrollHeader } from "@/components/ui/scroll-header";
import { useScrollHeader } from "@/hooks/use-scroll-header";
import {
  ArrowLeft,
  Bell,
  BellOff,
  Settings,
  Megaphone,
  Gift,
  HeartPulse,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function NotificationSettingsScreen() {
  const { setScreen, notificationSettings, setNotificationSettings } = useAppStore();
  const isScrolled = useScrollHeader();
  const { toast } = useToast();

  // 브라우저 알림 권한 상태
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [showPermissionAlert, setShowPermissionAlert] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  // Zustand에서 설정 불러오기 (없으면 기본값)
  const settings = notificationSettings ?? {
    mission: false,
    event: false,
    health: false,
  };

  // 마운트 시 현재 권한 상태 확인
  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const systemEnabled = permission === "granted";

  // 실제 Web Notification API 권한 요청
  const requestPermission = async () => {
    if (!("Notification" in window)) {
      toast({ title: "이 브라우저는 알림을 지원하지 않습니다." });
      return;
    }
    setIsRequesting(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") {
        toast({ title: "✅ 알림 권한이 허용됐어요!" });
        // 기본 알림 활성화
        setNotificationSettings({ mission: true, event: false, health: true });
        // 웰컴 알림 발송
        new Notification("당마고치 알림 활성화 🔔", {
          body: "이제 미션 알림과 건강 리포트를 받을 수 있어요!",
          icon: "/favicon.ico",
        });
      } else if (result === "denied") {
        toast({ title: "알림 권한이 거부됐어요. 브라우저 설정에서 변경해주세요." });
      }
    } catch {
      toast({ title: "알림 권한 요청 중 오류가 발생했어요." });
    } finally {
      setIsRequesting(false);
      setShowPermissionAlert(false);
    }
  };

  const handleToggle = (key: keyof typeof settings, value: boolean) => {
    if (!systemEnabled) return;
    setNotificationSettings({ ...settings, [key]: value });
  };

  const notificationItems = [
    {
      key: "mission" as const,
      icon: HeartPulse,
      iconBg: systemEnabled && settings.mission ? "#FFB8CA" : "#F5F5F5",
      iconColor: systemEnabled && settings.mission ? "#C0305A" : "#C8C8C8",
      label: "미션 알림",
      desc: "오늘의 미션 시작 및 달성 알림",
    },
    {
      key: "event" as const,
      icon: Megaphone,
      iconBg: systemEnabled && settings.event ? "#FFF383" : "#F5F5F5",
      iconColor: systemEnabled && settings.event ? "#8C7010" : "#C8C8C8",
      label: "이벤트 및 혜택 알림",
      desc: "앱 푸시 이벤트·프로모션 정보",
    },
    {
      key: "health" as const,
      icon: Gift,
      iconBg: systemEnabled && settings.health ? "#CBF891" : "#F5F5F5",
      iconColor: systemEnabled && settings.health ? "#3E8C28" : "#C8C8C8",
      label: "건강 리포트 알림",
      desc: "주간 리포트 발행 시 알림",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-12">
      <ScrollHeader
        title="맞춤형 푸시 알림"
        onBack={() => setScreen("mypage")}
        visible={isScrolled}
      />

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
        {/* 시스템 알림 상태 카드 */}
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "size-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors",
                systemEnabled ? "bg-[#CBF891]" : "bg-[#F5F5F5]",
              )}
            >
              {systemEnabled ? (
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
                    systemEnabled
                      ? "bg-[#CBF891] text-[#3E8C28]"
                      : permission === "denied"
                        ? "bg-[#FFB8CA] text-[#C0305A]"
                        : "bg-[#F5F5F5] text-[#9B9B9B]",
                  )}
                >
                  {systemEnabled ? "허용됨" : permission === "denied" ? "거부됨" : "꺼짐"}
                </span>
              </div>
              <p className="text-[12px] text-[#9B9B9B] font-medium">
                {systemEnabled
                  ? "알림을 받을 준비가 됐어요"
                  : permission === "denied"
                    ? "브라우저 설정에서 직접 허용해주세요"
                    : "아래 버튼으로 알림 권한을 허용해 주세요"}
              </p>
            </div>
          </div>

          {/* 권한 요청 버튼 */}
          {!systemEnabled && permission !== "denied" && (
            <button
              className="mt-4 w-full h-12 rounded-2xl bg-[#CBF891] hover:bg-[#B5E87A] flex items-center justify-center gap-2 text-[14px] font-bold text-[#2A5C34] transition-colors disabled:opacity-50"
              onClick={() => setShowPermissionAlert(true)}
              disabled={isRequesting}
            >
              <Bell className="size-4" />
              {isRequesting ? "권한 요청 중..." : "알림 허용하기"}
            </button>
          )}

          {/* 거부됐을 때 브라우저 설정 안내 */}
          {permission === "denied" && (
            <button
              className="mt-4 w-full h-12 rounded-2xl bg-[#F0F0F0] hover:bg-[#E4E4E4] flex items-center justify-center gap-2 text-[14px] font-bold text-[#3C3C3C] transition-colors"
              onClick={() => {
                toast({ title: "브라우저 주소창 옆 🔒 아이콘 → 알림 → 허용으로 변경해주세요." });
              }}
            >
              <Settings className="size-4" />
              브라우저 설정 안내 보기
            </button>
          )}
        </div>

        {/* 알림 종류별 설정 */}
        <div>
          <p className="text-[12px] font-bold text-[#6A6A6A] uppercase tracking-[0.05em] mb-3 px-1">
            알림 종류
          </p>

          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            {notificationItems.map((item, idx) => (
              <div key={item.key}>
                {idx > 0 && <div className="h-px bg-[#F5F5F5] mx-5" />}
                <div
                  className={cn(
                    "flex items-center gap-3.5 px-5 py-4 transition-colors",
                    !systemEnabled && "opacity-40 pointer-events-none",
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
                    checked={settings[item.key]}
                    onCheckedChange={(v) => handleToggle(item.key, v)}
                    disabled={!systemEnabled}
                  />
                </div>
              </div>
            ))}
          </div>

          {!systemEnabled && (
            <div className="flex items-center gap-2 mt-3 px-2">
              <div className="size-1.5 rounded-full bg-[#C0305A] shrink-0" />
              <p className="text-[12px] text-[#9B9B9B] font-medium">
                알림을 받으려면 먼저 시스템 알림 권한을 켜주세요.
              </p>
            </div>
          )}
        </div>

        {/* 수신 현황 요약 */}
        {systemEnabled && (
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
            <p className="text-[12px] font-bold text-[#6A6A6A] uppercase tracking-[0.05em] mb-3">
              현재 수신 중인 알림
            </p>
            <div className="space-y-2">
              {[
                { label: "미션 알림",      enabled: settings.mission, color: "#C0305A", bg: "#FFB8CA" },
                { label: "이벤트 및 혜택", enabled: settings.event,   color: "#8C7010", bg: "#FFF383" },
                { label: "건강 리포트",    enabled: settings.health,  color: "#3E8C28", bg: "#CBF891" },
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

      {/* 권한 확인 모달 */}
      <ConfirmDialog
        open={showPermissionAlert}
        onOpenChange={(open) => {
          if (!open) setShowPermissionAlert(false);
        }}
        icon={Bell}
        iconBg="#CBF891"
        iconColor="#3E8C28"
        title="알림 권한을 허용할게요"
        description="브라우저가 알림 허용 여부를 물어볼 거예요. '허용'을 눌러주세요."
        confirmLabel="허용하기"
        cancelLabel="취소"
        onConfirm={requestPermission}
      />
    </div>
  );
}
