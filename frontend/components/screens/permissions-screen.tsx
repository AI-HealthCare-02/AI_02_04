"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Switch } from "@/components/ui/switch";
import { CharacterEgg } from "@/components/character";
import {
  Activity,
  Heart,
  Smartphone,
  Bell,
  ChevronRight,
  Shield,
  CheckCircle2,
  LockKeyhole,
} from "lucide-react";
import { cn } from "@/lib/utils";

const permissions = [
  {
    id: "health",
    icon: Heart,
    iconBg: "#FFB8CA",
    iconColor: "#C0305A",
    activeBg: "#FFF5F8",
    activeBorder: "#FFB8CA",
    title: "건강 데이터",
    description: "걸음 수, 운동량 등 건강 데이터를 연동합니다",
    required: true,
  },
  {
    id: "activity",
    icon: Activity,
    iconBg: "#D6EEFF",
    iconColor: "#2878B0",
    activeBg: "#F5FBFF",
    activeBorder: "#AEE1F9",
    title: "활동 추적",
    description: "일일 활동량을 자동으로 추적합니다",
    required: true,
  },
  {
    id: "notifications",
    icon: Bell,
    iconBg: "#FFF383",
    iconColor: "#8C7010",
    activeBg: "#FFFDE8",
    activeBorder: "#FFF383",
    title: "알림",
    description: "미션 알림과 캐릭터 상태를 알려드립니다",
    required: false,
  },
  {
    id: "camera",
    icon: Smartphone,
    iconBg: "#E8F9D6",
    iconColor: "#3E8C28",
    activeBg: "#F5FFF0",
    activeBorder: "#CBF891",
    title: "카메라",
    description: "식단 사진 촬영을 위해 필요합니다",
    required: false,
  },
];

export function PermissionsScreen() {
  const { setScreen } = useAppStore();
  const [granted, setGranted] = useState<Record<string, boolean>>({
    health: false,
    activity: false,
    notifications: false,
    camera: false,
  });

  const requiredGranted = permissions
    .filter((p) => p.required)
    .every((p) => granted[p.id]);

  const grantedCount = Object.values(granted).filter(Boolean).length;

  const handleToggle = (id: string) => {
    setGranted((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleContinue = () => {
    setScreen("character-birth");
  };

  return (
    <div className="min-h-screen bg-[#F9FFEF] flex flex-col">
      {/* ── 상단 캐릭터 + 타이틀 ── */}
      <div className="flex flex-col items-center pt-14 pb-6 px-6 gap-5">
        {/* 캐릭터 */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-[#CBF891]/50 blur-2xl scale-125" />
          <div className="relative">
            <CharacterEgg size="md" />
          </div>
        </div>

        {/* 텍스트 */}
        <div className="text-center space-y-1.5">
          <p className="text-[12px] font-bold text-[#87D57B] uppercase tracking-[0.18em]">
            PERMISSIONS
          </p>
          <h1 className="text-[24px] font-black text-[#2A2A2A] tracking-[-0.02em]">
            권한을 허용해주세요
          </h1>
          <p className="text-[14px] font-medium text-[#7A7A7A]">
            최적의 건강 관리를 위해 다음 권한이 필요합니다
          </p>
        </div>

        {/* 허용 현황 요약 */}
        <div className="flex items-center gap-2 bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-4 py-2.5">
          <div className="flex gap-1">
            {permissions.map((p) => (
              <div
                key={p.id}
                className={cn(
                  "size-2 rounded-full transition-colors duration-300",
                  granted[p.id] ? "bg-[#87D57B]" : "bg-[#E8E8E8]",
                )}
              />
            ))}
          </div>
          <span className="text-[12px] font-bold text-[#6A6A6A]">
            {grantedCount} / {permissions.length} 허용됨
          </span>
        </div>
      </div>

      {/* ── 권한 목록 ── */}
      <div className="flex-1 px-5 space-y-2.5 overflow-auto pb-4">
        {permissions.map((permission) => {
          const Icon = permission.icon;
          const isGranted = granted[permission.id];

          return (
            <div
              key={permission.id}
              className={cn(
                "bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-4 py-4 flex items-center gap-4 border-2 transition-all duration-200",
                isGranted ? "border-2" : "border-transparent",
              )}
              style={
                isGranted
                  ? {
                      borderColor: permission.activeBorder,
                      backgroundColor: permission.activeBg,
                    }
                  : {}
              }
            >
              {/* 아이콘 */}
              <div
                className="size-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-200"
                style={{ backgroundColor: permission.iconBg }}
              >
                {isGranted ? (
                  <CheckCircle2
                    className="size-6"
                    style={{ color: permission.iconColor }}
                  />
                ) : (
                  <Icon
                    className="size-6"
                    style={{ color: permission.iconColor }}
                  />
                )}
              </div>

              {/* 텍스트 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-bold text-[#2A2A2A]">
                    {permission.title}
                  </span>
                  {permission.required && (
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: isGranted
                          ? permission.iconBg
                          : "#F0F0F0",
                        color: isGranted ? permission.iconColor : "#9B9B9B",
                      }}
                    >
                      필수
                    </span>
                  )}
                </div>
                <p className="text-[12px] font-medium text-[#9B9B9B] mt-0.5 leading-snug">
                  {permission.description}
                </p>
              </div>

              {/* 토글 */}
              <Switch
                checked={isGranted}
                onCheckedChange={() => handleToggle(permission.id)}
              />
            </div>
          );
        })}
      </div>

      {/* ── 개인정보 안내 ── */}
      <div className="px-5 pb-4">
        <div className="flex items-start gap-3 bg-[#F5F5F5] rounded-2xl px-4 py-3.5">
          <LockKeyhole className="size-4 text-[#9B9B9B] mt-0.5 shrink-0" />
          <p className="text-[12px] font-medium text-[#9B9B9B] leading-relaxed">
            수집된 데이터는 건강 관리 목적으로만 사용되며, 암호화되어 안전하게
            보관됩니다.
          </p>
        </div>
      </div>

      {/* ── 하단 버튼 ── */}
      <div className="px-5 pb-10">
        {/* 필수 권한 미허용 안내 */}
        {!requiredGranted && (
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <Shield className="size-3.5 text-[#C0305A]" />
            <p className="text-[12px] font-semibold text-[#C0305A]">
              건강 데이터, 활동 추적 권한은 필수입니다
            </p>
          </div>
        )}
        <button
          onClick={handleContinue}
          disabled={!requiredGranted}
          className={cn(
            "w-full h-14 rounded-2xl text-[16px] font-bold transition-all flex items-center justify-center gap-1.5",
            requiredGranted
              ? "bg-[#87D57B] hover:bg-[#6DC462] text-white"
              : "bg-[#E8E8E8] text-[#B8B8B8] cursor-not-allowed",
          )}
        >
          {requiredGranted ? "캐릭터 만나러 가기" : "필수 권한을 허용해주세요"}
          <ChevronRight className="size-5" />
        </button>
      </div>
    </div>
  );
}
