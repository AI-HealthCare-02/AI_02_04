
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { AlertModal } from "@/components/ui/confirm-dialog";
import { ScrollHeader } from "@/components/ui/scroll-header";
import { useScrollHeader } from "@/hooks/use-scroll-header";
import {
  ArrowLeft,
  Save,
  AlertCircle,
  User,
  Activity,
  Heart,
  ClipboardCheck,
  Edit3,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BackendUserType } from "@/lib/types";

export function EditHealthInfoScreen() {
  const { userProfile, setUserProfile, setScreen } = useAppStore();

  const isScrolled = useScrollHeader();
  const [isEditing, setIsEditing] = useState(false);
  const [showSaveAlert, setShowSaveAlert] = useState(false);

  const [formData, setFormData] = useState({
    ...userProfile,
    age: userProfile?.age || 0,
    height: userProfile?.height || 0,
    weight: userProfile?.weight || 0,
    gender: userProfile?.gender || "male",
    diabetesStatus: userProfile?.diabetesStatus || "none",
    highBp: userProfile?.highBp || false,
    highCholesterol: userProfile?.highCholesterol || false,
    heartDisease: userProfile?.heartDisease || false,
    smoking: userProfile?.smoking || false,
    heavyDrinking: userProfile?.heavyDrinking || false,
    physicalActivity: userProfile?.physicalActivity || "0-10",
  });

  const handleSave = () => {
    if (userProfile) {
      let newHealthType: BackendUserType = userProfile.healthType;
      const bmi = formData.weight / (formData.height / 100) ** 2;
      const isRiskAge = formData.age >= 45;
      const isRiskGroup = bmi >= 25 || isRiskAge;

      if (formData.diabetesStatus === "1") {
        newHealthType = "diabetic_1";
      } else if (formData.diabetesStatus === "2") {
        newHealthType = "diabetic_2";
      } else if (isRiskGroup) {
        newHealthType = "at_risk";
      } else if (["diabetic_1", "diabetic_2", "at_risk"].includes(newHealthType)) {
        newHealthType = "general_health";
      }

      setUserProfile({ ...userProfile, ...formData, healthType: newHealthType });
      setIsEditing(false);
      setShowSaveAlert(true);
    }
  };

  // ── 섹션 타이틀 ──────────────────────────────────────
  const SectionLabel = ({
    icon: Icon,
    title,
    iconBg,
    iconColor,
  }: {
    icon: React.ElementType;
    title: string;
    iconBg: string;
    iconColor: string;
  }) => (
    <div className="flex items-center gap-2.5 px-1 mt-6 mb-3">
      <div
        className="size-7 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: iconBg }}
      >
        <Icon className="size-3.5" style={{ color: iconColor }} strokeWidth={2} />
      </div>
      <p className="text-[12px] font-bold text-[#6A6A6A] uppercase tracking-[0.05em]">
        {title}
      </p>
    </div>
  );

  // ── 읽기 전용 값 표시용 ──────────────────────────────
  const FieldRow = ({
    label,
    value,
    unit,
  }: {
    label: string;
    value: string | number;
    unit?: string;
  }) => (
    <div className="flex items-center justify-between py-3.5 border-b border-[#F5F5F5] last:border-0">
      <p className="text-[13px] font-medium text-[#7A7A7A]">{label}</p>
      <p className="text-[15px] font-bold text-[#2A2A2A]">
        {value}
        {unit && (
          <span className="text-[11px] font-medium text-[#9B9B9B] ms-0.5">
            {unit}
          </span>
        )}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-32">
      {/* ── 스크롤 컴팩트 헤더 ── */}
      <ScrollHeader
        title={isEditing ? "건강 프로필 수정" : "내 건강 정보"}
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
          <div className="ms-1 flex-1">
            <h1 className="text-[18px] font-bold text-[#3C3C3C] leading-snug">
              {isEditing ? "건강 프로필 수정" : "내 건강 정보"}
            </h1>
            <p className="text-[13px] text-[#7A7A7A] font-medium">
              {isEditing ? "정보를 수정하고 저장해 주세요" : "나의 건강 기본 정보"}
            </p>
          </div>
          {/* 편집 모드가 아닐 때 우측 수정 아이콘 */}
          {!isEditing && (
            <button
              className="size-9 rounded-xl bg-[#F0F0F0] flex items-center justify-center text-[#6A6A6A] hover:bg-[#E4E4E4] transition-colors"
              onClick={() => setIsEditing(true)}
            >
              <Edit3 className="size-4" />
            </button>
          )}
        </div>
      </div>

      <div className="px-5 pb-8">
        {/* ── 편집 모드 안내 배너 ── */}
        {isEditing && (
          <div className="mt-4 flex gap-3 bg-[#EBF5FF] border border-[#AEE1F9] rounded-2xl p-4">
            <AlertCircle className="size-4 text-[#2878B0] shrink-0 mt-0.5" />
            <p className="text-[12px] text-[#1A5A8C] leading-relaxed">
              저장 시 AI가 건강 상태를 다시 분석하며, 오늘의 미션이 즉시 새롭게 변경됩니다.
            </p>
          </div>
        )}

        {/* ════════════════════════
            1. 기본 신체 정보
        ════════════════════════ */}
        <SectionLabel icon={User} title="기본 신체 정보" iconBg="#CBF891" iconColor="#3E8C28" />

        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          {isEditing ? (
            /* 편집 모드 */
            <div className="p-5 space-y-4">
              {/* 나이 / 성별 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-[#6A6A6A] uppercase tracking-[0.04em]">나이</p>
                  <Input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                    className="h-11 rounded-xl text-[15px] font-bold border-[#E8E8E8] focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-[#6A6A6A] uppercase tracking-[0.04em]">성별</p>
                  <div className="flex bg-[#F0F0F0] rounded-xl p-1 h-11">
                    {[
                      { value: "male", label: "남성" },
                      { value: "female", label: "여성" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        className={cn(
                          "flex-1 text-[13px] font-bold rounded-lg transition-all",
                          formData.gender === opt.value
                            ? "bg-white text-[#2A2A2A] shadow-sm"
                            : "text-[#9B9B9B]",
                        )}
                        onClick={() => setFormData({ ...formData, gender: opt.value as any })}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 키 / 몸무게 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-[#6A6A6A] uppercase tracking-[0.04em]">키</p>
                  <div className="relative">
                    <Input
                      type="number"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                      className="h-11 rounded-xl text-[15px] font-bold border-[#E8E8E8] focus:border-primary pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#9B9B9B] font-medium">cm</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-[#6A6A6A] uppercase tracking-[0.04em]">몸무게</p>
                  <div className="relative">
                    <Input
                      type="number"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                      className="h-11 rounded-xl text-[15px] font-bold border-[#E8E8E8] focus:border-primary pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#9B9B9B] font-medium">kg</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* 읽기 모드 */
            <div className="px-5">
              <FieldRow label="나이" value={formData.age} unit="세" />
              <FieldRow label="성별" value={formData.gender === "male" ? "남성" : "여성"} />
              <FieldRow label="키" value={formData.height} unit="cm" />
              <FieldRow label="몸무게" value={formData.weight} unit="kg" />
            </div>
          )}
        </div>

        {/* ════════════════════════
            2. 질환 및 위험 요인
        ════════════════════════ */}
        <SectionLabel icon={Heart} title="질환 및 위험 요인" iconBg="#FFB8CA" iconColor="#C0305A" />

        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          {[
            {
              key: "highBp" as const,
              label: "고혈압",
              sub: "진단받았거나 약을 복용 중인가요?",
            },
            {
              key: "highCholesterol" as const,
              label: "고콜레스테롤",
              sub: "혈중 콜레스테롤 수치가 높은가요?",
            },
            {
              key: "heartDisease" as const,
              label: "심장 질환",
              sub: "협심증, 심근경색 등 이력이 있나요?",
            },
          ].map((item, idx) => (
            <div key={item.key}>
              {idx > 0 && <div className="h-px bg-[#F5F5F5] mx-5" />}
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-[15px] font-semibold text-[#2A2A2A]">{item.label}</p>
                  <p className="text-[12px] text-[#9B9B9B] font-medium mt-0.5">{item.sub}</p>
                </div>
                {isEditing ? (
                  <Switch
                    checked={formData[item.key] as boolean}
                    onCheckedChange={(val) => setFormData({ ...formData, [item.key]: val })}
                  />
                ) : (
                  <span
                    className={cn(
                      "text-[12px] font-bold px-2.5 py-1 rounded-full",
                      formData[item.key]
                        ? "bg-[#FFB8CA] text-[#C0305A]"
                        : "bg-[#F0F0F0] text-[#9B9B9B]",
                    )}
                  >
                    {formData[item.key] ? "있음" : "없음"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ════════════════════════
            3. 당뇨병 진단 여부
        ════════════════════════ */}
        <SectionLabel icon={ClipboardCheck} title="당뇨병 진단 여부" iconBg="#A1E8CE" iconColor="#1A7858" />

        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
          {isEditing ? (
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "none", label: "없음" },
                { value: "1", label: "제1형" },
                { value: "2", label: "제2형" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFormData({ ...formData, diabetesStatus: opt.value as any })}
                  className={cn(
                    "h-14 rounded-xl text-[13px] font-bold border-2 transition-all",
                    formData.diabetesStatus === opt.value
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-white text-[#7A7A7A] border-[#E8E8E8] hover:border-primary/40",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-medium text-[#7A7A7A]">당뇨 유형</p>
              <span
                className={cn(
                  "text-[13px] font-bold px-3 py-1.5 rounded-full",
                  formData.diabetesStatus === "none"
                    ? "bg-[#F0F0F0] text-[#9B9B9B]"
                    : "bg-[#A1E8CE] text-[#1A7858]",
                )}
              >
                {formData.diabetesStatus === "none"
                  ? "해당 없음"
                  : formData.diabetesStatus === "1"
                    ? "제1형 당뇨"
                    : "제2형 당뇨"}
              </span>
            </div>
          )}
        </div>

        {/* ════════════════════════
            4. 생활 습관
        ════════════════════════ */}
        <SectionLabel icon={Activity} title="생활 습관" iconBg="#AEE1F9" iconColor="#2878B0" />

        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          {/* 흡연 */}
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-[15px] font-semibold text-[#2A2A2A]">현재 흡연 여부</p>
              <p className="text-[12px] text-[#9B9B9B] font-medium mt-0.5">현재 담배를 피우고 있나요?</p>
            </div>
            {isEditing ? (
              <Switch
                checked={formData.smoking}
                onCheckedChange={(val) => setFormData({ ...formData, smoking: val })}
              />
            ) : (
              <span
                className={cn(
                  "text-[12px] font-bold px-2.5 py-1 rounded-full",
                  formData.smoking
                    ? "bg-[#FFB8CA] text-[#C0305A]"
                    : "bg-[#F0F0F0] text-[#9B9B9B]",
                )}
              >
                {formData.smoking ? "흡연" : "비흡연"}
              </span>
            )}
          </div>

          <div className="h-px bg-[#F5F5F5] mx-5" />

          {/* 과음 */}
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-[15px] font-semibold text-[#2A2A2A]">과음 여부</p>
              <p className="text-[12px] text-[#9B9B9B] font-medium mt-0.5">주 2회 이상 음주하나요?</p>
            </div>
            {isEditing ? (
              <Switch
                checked={formData.heavyDrinking}
                onCheckedChange={(val) => setFormData({ ...formData, heavyDrinking: val })}
              />
            ) : (
              <span
                className={cn(
                  "text-[12px] font-bold px-2.5 py-1 rounded-full",
                  formData.heavyDrinking
                    ? "bg-[#FFB8CA] text-[#C0305A]"
                    : "bg-[#F0F0F0] text-[#9B9B9B]",
                )}
              >
                {formData.heavyDrinking ? "해당" : "해당 없음"}
              </span>
            )}
          </div>

          <div className="h-px bg-[#F5F5F5] mx-5" />

          {/* 신체 활동량 */}
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[15px] font-semibold text-[#2A2A2A]">월간 신체 활동량</p>
                <p className="text-[12px] text-[#9B9B9B] font-medium mt-0.5">한 달 기준 활동한 날수</p>
              </div>
              {!isEditing && (
                <span className="text-[12px] font-bold bg-[#AEE1F9] text-[#2878B0] px-2.5 py-1 rounded-full">
                  {formData.physicalActivity === "21-30" ? "매일 가깝게" : `${formData.physicalActivity}일`}
                </span>
              )}
            </div>
            {isEditing && (
              <div className="flex bg-[#F0F0F0] rounded-xl p-1">
                {(["0-10", "11-20", "21-30"] as const).map((range) => (
                  <button
                    key={range}
                    className={cn(
                      "flex-1 py-2.5 text-[12px] font-bold rounded-lg transition-all",
                      formData.physicalActivity === range
                        ? "bg-white text-primary shadow-sm"
                        : "text-[#9B9B9B]",
                    )}
                    onClick={() => setFormData({ ...formData, physicalActivity: range as any })}
                  >
                    {range === "21-30" ? "매일 가깝게" : `${range}일`}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── 하단 버튼 영역 ── */}
        <div className="mt-8">
          {isEditing ? (
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-14 rounded-2xl text-[14px] font-bold border-[#E0E0E0] text-[#7A7A7A]"
                onClick={() => setIsEditing(false)}
              >
                취소
              </Button>
              <Button
                className="flex-1 h-14 rounded-2xl text-[14px] font-bold gap-2"
                onClick={handleSave}
              >
                <Save className="size-4" />
                저장하기
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full h-14 rounded-2xl text-[14px] font-bold border-primary/40 text-primary gap-2 hover:bg-primary/5"
              onClick={() => setIsEditing(true)}
            >
              <Edit3 className="size-4" />
              건강 정보 수정하기
            </Button>
          )}
        </div>
      </div>

      {/* ── 저장 완료 알림 ── */}
      <AlertModal
        open={showSaveAlert}
        onOpenChange={setShowSaveAlert}
        icon={CheckCircle2}
        iconBg="#CBF891"
        iconColor="#3E8C28"
        title="건강 정보가 업데이트되었습니다"
        description="맞춤 미션이 새로운 건강 정보에 맞게 재설정되었습니다."
        confirmLabel="확인"
      />
    </div>
  );
}
