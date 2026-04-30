import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ScrollHeader } from "@/components/ui/scroll-header";
import { useScrollHeader } from "@/hooks/use-scroll-header";
import {
  ArrowLeft,
  Activity,
  HeartPulse,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Footprints,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function DataSyncScreen() {
  const { setScreen, dataSyncSettings, setDataSyncSettings } = useAppStore();
  const isScrolled = useScrollHeader();

  const healthDataEnabled = dataSyncSettings?.healthData ?? true;
  const activityTrackingEnabled = dataSyncSettings?.activityTracking ?? true;

  const setHealthDataEnabled = (v: boolean) =>
    setDataSyncSettings({ healthData: v, activityTracking: activityTrackingEnabled });
  const setActivityTrackingEnabled = (v: boolean) =>
    setDataSyncSettings({ healthData: healthDataEnabled, activityTracking: v });

  const allEnabled = healthDataEnabled && activityTrackingEnabled;

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-12">
      {/* ── 스크롤 컴팩트 헤더 ── */}
      <ScrollHeader
        title="건강 데이터 연동"
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
            <h1 className="text-[18px] font-bold text-[#3C3C3C] leading-snug">
              건강 데이터 연동
            </h1>
            <p className="text-[13px] text-[#7A7A7A] font-medium">
              워치·앱 데이터 동기화
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-4">
        {/* ── 히어로 안내 카드 ── */}
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 flex flex-col items-center text-center">
          {/* 아이콘 */}
          <div className="relative mb-5">
            <div className="absolute inset-0 bg-[#AEE1F9] rounded-full blur-xl opacity-60" />
            <div className="relative size-16 bg-[#D6EEFF] rounded-2xl flex items-center justify-center shadow-sm">
              <ShieldCheck className="size-8 text-[#2878B0]" />
            </div>
          </div>

          <h2 className="text-[17px] font-bold text-[#2A2A2A] mb-2">
            자동으로 편리하게 기록하세요
          </h2>
          <p className="text-[13px] text-[#7A7A7A] leading-relaxed">
            스마트폰의 기본 건강 앱과 연동하면
            <br />
            걸음 수와 활동량이 미션에 자동으로 반영됩니다.
          </p>

          {/* 연동 상태 뱃지 */}
          <div
            className={cn(
              "flex items-center gap-1.5 mt-4 px-4 py-2 rounded-full text-[12px] font-bold",
              allEnabled
                ? "bg-[#E8F9D6] text-[#3E8C28]"
                : "bg-[#F5F5F5] text-[#9B9B9B]",
            )}
          >
            {allEnabled ? (
              <CheckCircle2 className="size-3.5" />
            ) : (
              <AlertCircle className="size-3.5" />
            )}
            {allEnabled ? "모든 데이터 연동 중" : "일부 연동이 꺼져 있어요"}
          </div>
        </div>

        {/* ── 연동 설정 카드 ── */}
        <div>
          <p className="text-[12px] font-bold text-[#6A6A6A] uppercase tracking-[0.05em] mb-3 px-1">
            연동 항목
          </p>
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            {/* 건강 데이터 */}
            <div
              className={cn(
                "flex items-center gap-3.5 px-5 py-4 transition-colors",
                healthDataEnabled,
              )}
            >
              <div
                className={cn(
                  "size-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                  healthDataEnabled ? "bg-[#FFB8CA]" : "bg-[#F5F5F5]",
                )}
              >
                <HeartPulse
                  className="size-5"
                  style={{ color: healthDataEnabled ? "#C0305A" : "#C8C8C8" }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-[#2A2A2A]">
                  건강 데이터 연동
                </p>
                <p className="text-[12px] text-[#9B9B9B] font-medium mt-0.5">
                  Apple Health 또는 Google Fit 접근 권한
                </p>
              </div>
              <Switch
                checked={healthDataEnabled}
                onCheckedChange={setHealthDataEnabled}
              />
            </div>

            <div className="h-px bg-[#F5F5F5] mx-5" />

            {/* 활동 추적 */}
            <div
              className={cn(
                "flex items-center gap-3.5 px-5 py-4 transition-colors",
                activityTrackingEnabled,
              )}
            >
              <div
                className={cn(
                  "size-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                  activityTrackingEnabled ? "bg-[#D6EEFF]" : "bg-[#F5F5F5]",
                )}
              >
                <Activity
                  className="size-5"
                  style={{
                    color: activityTrackingEnabled ? "#2878B0" : "#C8C8C8",
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-[#2A2A2A]">
                  신체 활동 추적
                </p>
                <p className="text-[12px] text-[#9B9B9B] font-medium mt-0.5">
                  센서를 이용한 실시간 걸음 수 측정 권한
                </p>
              </div>
              <Switch
                checked={activityTrackingEnabled}
                onCheckedChange={setActivityTrackingEnabled}
              />
            </div>
          </div>
        </div>

        {/* ── 연동 효과 안내 ── */}
        <div>
          <p className="text-[12px] font-bold text-[#6A6A6A] uppercase tracking-[0.05em] mb-3 px-1">
            연동 시 효과
          </p>
          <div className="bg-white rounded-2xl shadow-[var(--shadow-card)] overflow-hidden">
            {[
              {
                icon: Footprints,
                title: "걸음 수 자동 기록",
                desc: "만보 걷기 미션이 실시간으로 업데이트돼요",
              },
              {
                icon: Activity,
                title: "운동 데이터 연동",
                desc: "운동 미션 달성 여부를 자동으로 체크해요",
              },
              {
                icon: Moon,
                title: "수면 패턴 분석",
                desc: "수면의 질을 AI가 분석해 리포트에 반영해요",
              },
            ].map((item, idx) => {
              const IconComponent = item.icon;

              return (
                <div key={item.title}>
                  {idx > 0 && <div className="h-px bg-[#F5F5F5] mx-6" />}
                  <div className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-[#FAFAFA] transition-colors">
                    <div className="shrink-0 size-10 rounded-xl bg-[#F2F4F6] flex items-center justify-center">
                      <IconComponent
                        className="size-6 text-[#4E5968]"
                        strokeWidth={2.2}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-[#2A2A2A] leading-tight">
                        {item.title}
                      </p>
                      <p className="text-[13px] text-[#9B9B9B] font-medium mt-1">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* ── 개인정보 안내 ── */}
        <div className="flex items-start gap-3 bg-[#F5F5F5] rounded-2xl px-4 py-3.5">
          <Smartphone className="size-4 text-[#9B9B9B] shrink-0 mt-0.5" />
          <p className="text-[12px] text-[#9B9B9B] leading-relaxed font-medium">
            토글을 비활성화하면 앱에서 더 이상 기기의 건강 데이터를 수집하지
            않지만, 스마트폰 설정 앱에서도 권한을 직접 해제해야 완벽하게
            차단됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
