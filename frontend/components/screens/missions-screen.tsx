import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog, AlertModal } from "@/components/ui/confirm-dialog";
import { ScrollHeader } from "@/components/ui/scroll-header";
import { useScrollHeader } from "@/hooks/use-scroll-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  CheckCircle2,
  Zap,
  Droplets,
  Footprints,
  Dumbbell,
  Pill,
  Apple,
  BedDouble,
  ClipboardList,
  Check,
  ActivitySquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/components/ui/navigation-menu";
import type { Mission } from "@/lib/types";

// XP에 따른 난이도 라벨 반환
function getDifficultyLabel(exp: number): {
  label: string;
  color: string;
  bg: string;
} {
  if (exp >= 60) return { label: "Hard", color: "#C0305A", bg: "#FFE4ED" };
  if (exp >= 30) return { label: "Medium", color: "#D97706", bg: "#FEF9EE" };
  return { label: "Easy", color: "#3E8C28", bg: "#E8F9D6" };
}

export function MissionsScreen() {
  const { setScreen, missions, completeMission, updateMissionProgress } =
    useAppStore();
  const { toast } = useToast();

  const isScrolled = useScrollHeader();

  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [autoConfirmMission, setAutoConfirmMission] = useState<Mission | null>(
    null,
  );
  const [showEmptyInputAlert, setShowEmptyInputAlert] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [sugarTag, setSugarTag] = useState<"premeal" | "postmeal" | "sleep">(
    "premeal",
  );

  /* ── 파생 값 ── */
  const completedCount = missions.filter((m) => m.completed).length;
  const progressPercent =
    missions.length > 0 ? (completedCount / missions.length) * 100 : 0;

  /* ── 미션 분류 ── */
  const walkingMission = missions.find((m) => m.id === "c1");
  const waterMission = missions.find((m) => m.id === "c2");
  const generalMissions = missions.filter(
    (m) => m.id !== "c1" && m.id !== "c2",
  );

  /* ── XP 획득 토스트 ── */
  const showXpToast = (mission: Mission) => {
    toast({
      title: `+${mission.exp} XP 획득!`,
      description: `"${mission.title}" 미션 완료`,
    });
  };

  /* ── 핸들러 ── */
  const handleMissionClick = (mission: Mission) => {
    if (mission.completed) return;
    if (mission.id === "c1" || mission.id === "c2") return;
    if (mission.type === "auto") {
      setAutoConfirmMission(mission);
      return;
    }
    if (mission.inputType && mission.inputType !== "none") {
      setSelectedMission(mission);
      setInputValue("");
    } else {
      completeMission(mission.id);
      showXpToast(mission);
    }
  };

  const handleModalSubmit = () => {
    if (!selectedMission) return;
    if (!inputValue.trim()) {
      setShowEmptyInputAlert(true);
      return;
    }
    completeMission(selectedMission.id, inputValue);
    showXpToast(selectedMission);
    setSelectedMission(null);
    setInputValue("");
  };

  const handleWaterAdd = (mission: Mission) => {
    if (mission.completed) return;
    const next = mission.current + 1;
    if (next >= mission.target) {
      completeMission(mission.id);
      showXpToast(mission);
    } else {
      updateMissionProgress(mission.id, next);
    }
  };

  const handleStepSync = (mission: Mission) => {
    if (mission.completed) return;
    const next = Math.min(mission.current + 2500, mission.target);
    if (next >= mission.target) {
      completeMission(mission.id);
      showXpToast(mission);
    } else {
      updateMissionProgress(mission.id, next);
    }
  };

  /* ═══════════════════════════════════════════════════
     렌더
  ══════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#F9FFEF] flex flex-col">
      {/* ── 스크롤 시 나타나는 컴팩트 헤더 ── */}
      <ScrollHeader
        title="오늘의 미션"
        onBack={() => setScreen("home")}
        visible={isScrolled}
      />

      {/* ── 기본 헤더 (default) ── */}
      <div className="bg-white border-b border-black/[0.06]">
        <div className="flex items-center gap-1 px-4 pt-12 pb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setScreen("home")}
            className="shrink-0 text-[#3C3C3C]"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div className="ms-1">
            <h1 className="text-[18px] font-bold text-[#3C3C3C] leading-snug">
              오늘의 미션
            </h1>
            <p className="text-[13px] text-[#7A7A7A] font-medium">
              건강한 하루를 위해 미션을 달성해 보세요!
            </p>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          PAGE CONTENT
      ════════════════════════════════════════ */}
      <div className="flex-1 px-6 pt-5 pb-28 space-y-5">
        {/* ── 달성률 요약 카드 ── */}
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
          <div className="flex items-start justify-between">
            <div>
              {/* Label — uppercase, 12px, #6A6A6A */}
              <p className="text-[12px] font-semibold text-[#6A6A6A] uppercase tracking-[0.05em] mb-1">
                달성률
              </p>
              {/* "N / M개 완료" — Body 14px #7A7A7A */}
              <p className="text-[14px] font-medium text-[#7A7A7A]">
                {completedCount} / {missions.length}개 완료
              </p>
            </div>
            {/* KPI 숫자 — Headline 36px bold (DESIGN-LANGUAGE.md 2:1 비율 규칙) */}
            <p className="text-[36px] font-bold text-[#3C3C3C] leading-none tracking-[-0.02em]">
              {Math.round(progressPercent)}
              <span className="text-[18px] font-bold text-[#9B9B9B] ms-0.5">
                %
              </span>
            </p>
          </div>

          {/* 전체 게이지 — h-2, rounded-full, ring color fill */}
          <div className="mt-4 h-2 bg-[#E8E6E1] rounded-full overflow-hidden">
            <div
              className="h-full bg-ring rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* ── 만보 걷기 (c1) — 특수 카드 ── */}
        {/* 만보 걷기 — Sub Green #CBF891 */}
        {walkingMission && (
          <SpecialMissionCard
            mission={walkingMission}
            accentColor="#3E8C28"
            barColor="bg-[#87D57B]"
            iconBg="bg-[#CBF891]"
            icon={<Footprints className="size-5 text-[#3E8C28]" />}
            unitLabel="걸음"
            actionButton={
              !walkingMission.completed ? (
                <Button
                  variant="outline"
                  className="w-full h-12 text-[#3E8C28] border-[#3E8C28]/25 hover:bg-[#CBF891] font-bold"
                  onClick={() => handleStepSync(walkingMission)}
                >
                  <Footprints className="size-4 me-2" />
                  헬스 데이터 연동 (테스트 +2500)
                </Button>
              ) : null
            }
          />
        )}

        {/* ── 물 마시기 (c2) — Accent Blue #AEE1F9 ── */}
        {waterMission && (
          <SpecialMissionCard
            mission={waterMission}
            accentColor="#2878B0"
            barColor="bg-[#AEE1F9]"
            iconBg="bg-[#AEE1F9]"
            icon={<Droplets className="size-5 text-[#2878B0]" />}
            unitLabel="잔"
            actionButton={
              !waterMission.completed ? (
                <Button
                  variant="outline"
                  className="w-full h-12 text-[#2878B0] border-[#2878B0]/25 hover:bg-[#AEE1F9] font-bold"
                  onClick={() => handleWaterAdd(waterMission)}
                >
                  <Droplets className="size-4 me-2" />
                  1잔 마시기
                </Button>
              ) : null
            }
          />
        )}

        {/* ── 일반 미션 목록 — 단일 화이트 카드 + 행 구분선 ── */}
        {generalMissions.length > 0 && (
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            {generalMissions.map((mission, idx) => (
              <div
                key={mission.id}
                className={cn(
                  "flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors",
                  "hover:bg-[#FAFAFA] active:bg-[#F5F5F5]",
                  idx > 0 && "border-t border-black/[0.04]",
                )}
                onClick={() => handleMissionClick(mission)}
              >
                {/* 미션 아이콘 서클 */}
                <MissionIconCircle
                  category={mission.category}
                  completed={mission.completed}
                />

                {/* 텍스트 영역 — flex-1로 가능한 모든 너비 사용, truncate 없음 */}
                <div className="flex-1 min-w-0">
                  {/* 첫째 줄: 제목 + 경험치 뱃지 */}
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    {/* 제목 — truncate 제거, 줄바꿈 허용 */}
                    <p
                      className={cn(
                        "text-[14px] font-bold text-[#3C3C3C] leading-snug",
                        mission.completed && "line-through text-[#9B9B9B]",
                      )}
                    >
                      {mission.title}
                    </p>
                    {/* XP + 난이도 뱃지 */}
                    <div className="shrink-0 flex items-center gap-1.5">
                      {(() => {
                        const d = getDifficultyLabel(mission.exp);
                        return (
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ color: d.color, backgroundColor: d.bg }}
                          >
                            {d.label}
                          </span>
                        );
                      })()}
                      <span className="flex items-center gap-0.5 text-[11px] font-bold text-[#6366F1] bg-[#EEF2FF] px-2 py-1 rounded-full border border-[#6366F1]/15">
                        <Zap className="size-3" />
                        {mission.exp}XP
                      </span>
                    </div>
                  </div>

                  {/* 둘째 줄: 설명 — truncate 제거, 전체 노출 */}
                  <p
                    className={cn(
                      "text-[13px] leading-normal",
                      mission.completed ? "text-[#B0B0B0]" : "text-[#7A7A7A]",
                    )}
                  >
                    {mission.description}
                  </p>

                  {/* 셋째 줄: 진행률 뱃지 + 기록 필요 (있을 때만) */}
                  {!mission.completed &&
                    (mission.target > 1 ||
                      (mission.inputType && mission.inputType !== "none")) && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {mission.target > 1 && (
                          <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            {mission.current} / {mission.target}
                          </span>
                        )}
                        {mission.inputType && mission.inputType !== "none" && (
                          <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            기록 필요
                          </span>
                        )}
                      </div>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════
          미션 기록 입력 모달
      ════════════════════════════════════════ */}
      <Dialog
        open={!!selectedMission}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedMission(null);
            setInputValue("");
          }
        }}
      >
        <DialogContent showCloseButton={false}>
          <div className="size-14 rounded-full bg-[#CBF891] flex items-center justify-center mx-auto mb-1">
            <ActivitySquare className="size-7 text-[#3E8C28]" strokeWidth={2} />
          </div>
          <DialogTitle className="text-center">
            {selectedMission?.title}
          </DialogTitle>
          <p className="text-[13px] text-[#7A7A7A] leading-normal text-center mt-1">
            {selectedMission?.description}
          </p>
          <div className="space-y-4 mt-4">
            {selectedMission?.title.includes("식전/식후") && (
              <div className="space-y-2 bg-[#F9FFEF] p-4 rounded-2xl border border-[#CBF891]/60">
                <Label className="text-[11px] font-bold text-[#6A6A6A] uppercase tracking-[0.05em]">
                  측정 시점 선택
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={sugarTag === "premeal" ? "default" : "outline"}
                    className="h-10 text-[13px] font-bold rounded-xl"
                    onClick={() => setSugarTag("premeal")}
                  >
                    식사 전
                  </Button>
                  <Button
                    variant={sugarTag === "postmeal" ? "default" : "outline"}
                    className="h-10 text-[13px] font-bold rounded-xl"
                    onClick={() => setSugarTag("postmeal")}
                  >
                    식사 후
                  </Button>
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label
                htmlFor="mission-input"
                className="text-[12px] font-semibold text-[#6A6A6A]"
              >
                {selectedMission?.inputType === "number"
                  ? "수치를 입력해 주세요"
                  : "상태를 기록해 주세요"}
              </Label>
              <div className="relative">
                <Input
                  id="mission-input"
                  type={
                    selectedMission?.inputType === "number" ? "number" : "text"
                  }
                  placeholder={
                    selectedMission?.inputType === "number"
                      ? "예: 120"
                      : "예: 상처 없음, 양호함"
                  }
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="h-14 text-[18px] font-bold pr-16 rounded-xl"
                  autoFocus
                />
                {selectedMission?.title.includes("혈당") && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-[#9B9B9B] font-medium">
                    mg/dL
                  </span>
                )}
                {selectedMission?.title.includes("체중") && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-[#9B9B9B] font-medium">
                    kg
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-12 text-[14px] font-bold rounded-2xl"
                onClick={() => {
                  setSelectedMission(null);
                  setInputValue("");
                }}
              >
                취소
              </Button>
              <Button
                className="flex-1 h-12 text-[14px] font-bold rounded-2xl"
                onClick={handleModalSubmit}
              >
                기록하고 완료하기
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!autoConfirmMission}
        onOpenChange={(open) => {
          if (!open) setAutoConfirmMission(null);
        }}
        icon={ActivitySquare}
        iconBg="#CBF891"
        iconColor="#3E8C28"
        title="건강 데이터 연동 미션"
        description={`'${autoConfirmMission?.title}' 미션은 건강 데이터 및 식단 분석과 자동으로 연동됩니다.\n테스트로 강제 완료하시겠습니까?`}
        confirmLabel="완료 처리"
        cancelLabel="취소"
        onConfirm={() => {
          if (autoConfirmMission) {
            completeMission(autoConfirmMission.id);
            showXpToast(autoConfirmMission);
          }
          setAutoConfirmMission(null);
        }}
      />

      <AlertModal
        open={showEmptyInputAlert}
        onOpenChange={setShowEmptyInputAlert}
        icon={ActivitySquare}
        iconBg="#FFF383"
        iconColor="#8C7010"
        title="입력값이 없어요"
        description="기록할 값을 입력해 주세요."
        confirmLabel="확인"
      />

      <BottomNav />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MissionIconCircle — 카테고리별 SVG 아이콘 서클
   • 미완료: 연한 배경 원 + 컬러 아이콘
   • 완료:   진한 배경 원 + 흰색 아이콘 + 우하단 초록 체크 배지
───────────────────────────────────────────────────────────── */
type MissionCategory =
  | "walking"
  | "exercise"
  | "water"
  | "medicine"
  | "diet"
  | "sleep"
  | "health_record";

const categoryConfig: Record<
  MissionCategory,
  {
    Icon: React.ElementType;
    lightBg: string;
    iconColor: string;
  }
> = {
  /* 그린 계열 — Sub 컬러 팔레트 사용 */
  walking: { Icon: Footprints, lightBg: "#CBF891", iconColor: "#3E8C28" },
  /* 블루 계열 — Accent Blue #AEE1F9 톤 */
  water: { Icon: Droplets, lightBg: "#AEE1F9", iconColor: "#2878B0" },
  sleep: { Icon: BedDouble, lightBg: "#daf3fe", iconColor: "#579BB1" },
  /* 옐로우 계열 — Accent Yellow #FFF383 톤 */
  diet: { Icon: Apple, lightBg: "#FFF6BF", iconColor: "#f7b488" },
  /* 민트 계열 — Accent Mint #A1E8CE 톤 */
  health_record: {
    Icon: ClipboardList,
    lightBg: "#E0FBE2",
    iconColor: "#A6D0DD",
  },
  /* 파스텔 핑크 — 동일 명도/채도 톤 매칭 */
  medicine: { Icon: Pill, lightBg: "#FFE1E1", iconColor: "#FFACC7" },
  /* 파스텔 라벤더 — 동일 명도/채도 톤 매칭 */
  exercise: { Icon: Dumbbell, lightBg: "#F5EFFF", iconColor: "#A294F9" },
};

function MissionIconCircle({
  category,
  completed,
}: {
  category: MissionCategory | string;
  completed: boolean;
}) {
  const cfg =
    categoryConfig[category as MissionCategory] ?? categoryConfig.health_record;
  const { Icon, lightBg, iconColor } = cfg;

  return (
    <div className="relative shrink-0 size-12">
      {/* 미완료 / 완료 공통: 연한 배경 원 + 컬러 아이콘
          완료 시 두꺼운 컬러 border 추가 */}
      <div
        className="size-12 rounded-full flex items-center justify-center transition-all duration-200"
        style={{
          backgroundColor: lightBg,
          border: completed
            ? `2px solid ${iconColor}`
            : "2.5px solid transparent",
        }}
      >
        <Icon
          className="size-[22px]"
          style={{ color: iconColor }}
          strokeWidth={completed ? 2 : 1.8}
        />
      </div>

      {/* 체크 배지 — 완료 시 우하단 */}
      {completed && (
        <div
          className="absolute -bottom-0.5 -right-0.5 size-[18px] rounded-full border-2 border-white flex items-center justify-center"
          style={{ backgroundColor: iconColor }}
        >
          <Check className="size-2.5 text-white" strokeWidth={3.5} />
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SpecialMissionCard — 만보/물 전용 카드 (c1, c2)
───────────────────────────────────────────────────────────── */
interface SpecialMissionCardProps {
  mission: Mission;
  accentColor: string;
  barColor: string;
  iconBg: string;
  icon: React.ReactNode;
  unitLabel: string;
  actionButton: React.ReactNode;
}

function SpecialMissionCard({
  mission,
  barColor,
  iconBg,
  icon,
  unitLabel,
  actionButton,
}: SpecialMissionCardProps) {
  const pct = Math.min((mission.current / mission.target) * 100, 100);

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden",
        mission.completed && "opacity-70",
      )}
    >
      {/* 상단: 아이콘 + 제목 + 경험치 */}
      <div className="flex items-start gap-4 p-5 pb-4">
        {/* 아이콘 or 완료 체크 */}
        <div
          className={cn(
            "size-11 rounded-xl flex items-center justify-center shrink-0",
            iconBg,
          )}
        >
          {mission.completed ? (
            <CheckCircle2 className="size-6 text-[#6B9B7A]" />
          ) : (
            icon
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-[15px] font-bold text-[#3C3C3C] mb-0.5",
              mission.completed && "line-through text-[#9B9B9B]",
            )}
          >
            {mission.title}
          </p>
          <p className="text-[13px] text-[#7A7A7A]">{mission.description}</p>
        </div>

        {/* XP + 난이도 뱃지 */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          {(() => {
            const d = getDifficultyLabel(mission.exp);
            return (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ color: d.color, backgroundColor: d.bg }}
              >
                {d.label}
              </span>
            );
          })()}
          <span className="flex items-center gap-0.5 text-[11px] font-bold text-[#6366F1] bg-[#EEF2FF] px-2.5 py-1 rounded-full border border-[#6366F1]/15">
            <Zap className="size-3" />
            {mission.exp}XP
          </span>
        </div>
      </div>

      {/* 진행 영역 */}
      <div className="mx-5 mb-4 bg-[#FAFAFA] rounded-xl px-4 py-3 border border-black/[0.04]">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[12px] font-semibold text-[#6A6A6A] uppercase tracking-[0.05em]">
            진행률
          </p>
          {/* 수치 표시 — Body 13px */}
          <p className="text-[13px] font-bold text-[#3C3C3C]">
            {mission.current.toLocaleString()}
            <span className="text-[#9B9B9B] font-medium">
              {" "}
              / {mission.target.toLocaleString()} {unitLabel}
            </span>
          </p>
        </div>
        {/* 게이지 — h-2, rounded-full, category color */}
        <div className="h-2 bg-[#E8E6E1] rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              barColor,
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* 액션 버튼 영역 */}
      {actionButton && <div className="px-5 pb-5">{actionButton}</div>}
    </div>
  );
}
