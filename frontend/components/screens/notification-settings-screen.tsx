
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function NotificationSettingsScreen() {
  const { setScreen } = useAppStore();

  // 상태 관리
  const [systemPushEnabled, setSystemPushEnabled] = useState(false);
  const [eventPushEnabled, setEventPushEnabled] = useState(false);

  // 시스템 설정으로 이동하는 시뮬레이션 함수
  const handleOpenSystemSettings = () => {
    // 실제 모바일 앱 환경(React Native 등)에서는 Linking API를 사용해 OS 설정 앱으로 이동시킵니다.
    alert(
      "시스템 설정 창으로 이동합니다.\n(시뮬레이션: 확인을 누르면 권한이 허용됩니다.)",
    );

    // 사용자가 기기 설정에서 권한을 허용하고 돌아왔다고 가정
    setTimeout(() => {
      setSystemPushEnabled(true);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center gap-4 bg-background sticky top-0 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setScreen("mypage")}
          className="shrink-0 -ml-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-foreground">알림 설정</h1>
        </div>
      </div>

      <div className="flex-1 flex flex-col pt-4">
        {/* Section 1: 시스템 알림 상태 */}
        <section className="px-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[15px] font-medium text-foreground">
              시스템 알림 상태
            </span>
            <span
              className={cn(
                "text-[15px] transition-colors",
                systemPushEnabled
                  ? "text-foreground font-bold"
                  : "text-muted-foreground/60",
              )}
            >
              {systemPushEnabled ? "켜짐" : "꺼짐"}
            </span>
          </div>

          <Button
            variant="outline"
            onClick={handleOpenSystemSettings}
            className="w-full h-12 bg-muted/40 hover:bg-muted/60 border-border/60 text-foreground font-medium rounded-xl transition-all"
          >
            권한 설정 하러 가기
          </Button>
        </section>

        {/* 구분선 (Thick Divider) */}
        <div className="h-2 w-full bg-muted/30 my-8" />

        {/* Section 2: 이벤트 및 혜택 알림 */}
        <section className="px-6 space-y-4">
          <h3 className="text-[15px] font-medium text-foreground">
            이벤트 및 혜택 알림
          </h3>

          <div className="flex items-center justify-between border border-foreground/20 rounded-[20px] p-4 bg-card">
            <span className="text-[15px] font-medium text-foreground">
              앱 푸시
            </span>
            <Switch
              checked={eventPushEnabled}
              onCheckedChange={setEventPushEnabled}
              disabled={!systemPushEnabled} // 시스템 권한이 꺼져있으면 조작 불가 (옵션)
            />
          </div>

          {!systemPushEnabled && (
            <p className="text-xs text-muted-foreground px-2">
              * 이벤트 알림을 받으려면 먼저 시스템 알림 권한을 켜주세요.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
