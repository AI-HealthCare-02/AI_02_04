
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Activity,
  HeartPulse,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function DataSyncScreen() {
  const { setScreen } = useAppStore();

  // 기능 토글 상태 (실제 앱에서는 로컬 스토리지나 백엔드 DB와 연동됨)
  const [healthDataEnabled, setHealthDataEnabled] = useState(true);
  const [activityTrackingEnabled, setActivityTrackingEnabled] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-background flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center gap-4 bg-background/80 backdrop-blur-md sticky top-0 z-10 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={() => setScreen("mypage")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">
            건강 데이터 연동
          </h1>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-8">
        {/* 상단 일러스트 및 설명 */}
        <div className="text-center pt-4 pb-2 space-y-3">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
            <div className="relative w-full h-full bg-card border border-border/50 rounded-2xl flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-10 h-10 text-blue-500" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-foreground mt-4">
            자동으로 편리하게 기록하세요
          </h2>
          <p className="text-sm text-muted-foreground leading-snug">
            스마트폰의 기본 건강 앱과 연동하면
            <br />
            걸음 수와 활동량이 미션에 자동으로 반영됩니다.
          </p>
        </div>

        {/* 연동 설정 리스트 */}
        <div className="space-y-4">
          {/* 건강 데이터 설정 */}
          <Card
            className={cn(
              "transition-colors border",
              healthDataEnabled
                ? "border-primary/30 bg-primary/5"
                : "border-border/50 bg-card",
            )}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                  <HeartPulse className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground">
                    건강 데이터 연동
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Apple Health 또는 Google Fit 데이터 접근 권한
                  </p>
                </div>
              </div>
              <Switch
                checked={healthDataEnabled}
                onCheckedChange={setHealthDataEnabled}
              />
            </CardContent>
          </Card>

          {/* 활동 추적 설정 */}
          <Card
            className={cn(
              "transition-colors border",
              activityTrackingEnabled
                ? "border-primary/30 bg-primary/5"
                : "border-border/50 bg-card",
            )}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Activity className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground">
                    신체 활동 추적
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    센서를 이용한 실시간 걸음 수 측정 권한
                  </p>
                </div>
              </div>
              <Switch
                checked={activityTrackingEnabled}
                onCheckedChange={setActivityTrackingEnabled}
              />
            </CardContent>
          </Card>
        </div>

        {/* 하단 안내 문구 */}
        <div className="bg-muted/50 rounded-xl p-4 flex items-start gap-3 border border-border/50">
          <Smartphone className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            토글을 비활성화하면 앱에서 더 이상 기기의 건강 데이터를 수집하지
            않지만, 스마트폰 설정 앱에서도 권한을 직접 해제하셔야 완벽하게
            차단됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
