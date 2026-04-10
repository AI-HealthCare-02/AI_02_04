import { useState, useEffect } from "react";
import "@/src/home.css";
import { useAppStore } from "@/lib/store";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { BottomNav } from "@/components/ui/navigation-menu";
import {
  Coins,
  Droplets,
  Footprints,
  Apple,
  ChevronRight,
  Sparkles,
  BookOpen,
  TrendingUp,
  CheckCircle2,
  Flame,
  Zap,
  Smile,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OfflinePenaltyModal } from "./offline-penalty-modal";
import { Button } from "@/components/ui/button";

/* ─────────────────────────────────────────────────────────────
   타입 & 상수
───────────────────────────────────────────────────────────── */
interface Recommendation {
  id: string;
  title: string;
  reason: string;
  source: string;
}

const AI_RECOMMENDATIONS: Recommendation[] = [
  {
    id: "rec-1",
    title: "점심 시간 15분 걷기로 전환해보세요.",
    reason: "화/수 저녁 미션 실패가 반복되어 시간대를 변경했습니다.",
    source: "대한당뇨병학회 가이드 p.52",
  },
  {
    id: "rec-2",
    title: "저녁 국물 요리를 줄이고 샐러드로 대체해보세요.",
    reason: "최근 나트륨 섭취가 권장량을 초과합니다.",
    source: "고혈압학회 진료지침 p.42",
  },
];

const MOOD_EMOJI: Record<string, string> = {
  happy: "😊",
  normal: "😐",
  sad: "😢",
  sick: "🤒",
};

const MOOD_STAT: Record<string, number> = {
  happy: 95,
  normal: 72,
  sad: 38,
  sick: 18,
};

/* ─────────────────────────────────────────────────────────────
   StatChip — 캐릭터 스탯 칩
───────────────────────────────────────────────────────────── */
function StatChip({
  label,
  value,
  icon: Icon,
  iconColor,
  iconBg,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <div
      className="flex-1 rounded-2xl px-3 py-3 flex flex-col items-center gap-1.5"
      style={{
        background: "rgba(255,255,255,0.72)",
        border: "1px solid rgba(255,255,255,0.9)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
      }}
    >
      {/* 아이콘 원형 배경 */}
      <div
        className="size-8 rounded-full flex items-center justify-center"
        style={{ backgroundColor: iconBg }}
      >
        <Icon
          className="size-4"
          style={{ color: iconColor }}
          strokeWidth={2.2}
        />
      </div>
      <p className="text-[16px] font-black text-[#1A2E1C] leading-none">
        {value}
      </p>
      <p
        className="text-[9px] font-bold uppercase tracking-[0.07em]"
        style={{ color: iconColor }}
      >
        {label}
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MissionRow 서브 컴포넌트
───────────────────────────────────────────────────────────── */
interface MissionRowProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  valueLabel: string;
  progress: number;
  barColor: string;
  completed: boolean;
  action?: React.ReactNode;
}

function MissionRow({
  icon,
  iconBg,
  title,
  valueLabel,
  progress,
  barColor,
  completed,
  action,
}: MissionRowProps) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <div
        className={cn(
          "size-10 rounded-xl flex items-center justify-center shrink-0",
          iconBg,
        )}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[14px] font-bold leading-none text-[#3C3C3C]">
            {title}
          </p>
          <span className="text-[12px] font-medium text-[#9B9B9B]">
            {valueLabel}
          </span>
        </div>
        <div className="h-2 bg-[#E8E6E1] rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              barColor,
            )}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
      <div className="shrink-0 w-[52px] flex justify-end">
        {completed ? (
          <CheckCircle2 className="size-5 text-[#87D57B]" />
        ) : action ? (
          action
        ) : null}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   HomeScreen 메인 컴포넌트
───────────────────────────────────────────────────────────── */
export function HomeScreen() {
  const {
    userProfile,
    character,
    missions,
    setScreen,
    updateMissionProgress,
    completeMission,
  } = useAppStore();

  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  /* ── 걷기 미션 자동 증가 ── */
  useEffect(() => {
    const interval = setInterval(() => {
      const walkingMission = missions.find((m) => m.category === "walking");
      if (walkingMission && !walkingMission.completed) {
        const next = walkingMission.current + Math.floor(Math.random() * 50);
        if (next >= walkingMission.target) completeMission(walkingMission.id);
        else updateMissionProgress(walkingMission.id, next);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [missions, updateMissionProgress, completeMission]);

  /* ── 시계 ── */
  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  /* ── 파생 값 ── */
  const completedMissions = missions.filter((m) => m.completed).length;
  const totalMissions = missions.length > 0 ? missions.length : 1;
  const missionProgress = (completedMissions / totalMissions) * 100;

  const walkingMission = missions.find((m) => m.category === "walking");
  const waterMission = missions.find((m) => m.category === "water");
  const dietMission = missions.find((m) => m.category === "diet");

  const expPercent = character
    ? Math.min(
        Math.round(
          (character.experience / character.experienceToNextLevel) * 100,
        ),
        100,
      )
    : 0;

  /* ── 캐릭터 스탯 파생 ── */
  const energyVal = walkingMission
    ? Math.max(
        30,
        Math.round((walkingMission.current / walkingMission.target) * 100),
      )
    : 50;
  const moodVal = MOOD_STAT[character?.mood ?? "normal"];
  const stabilityVal = Math.max(30, Math.round(missionProgress));

  /* ── 물 한 잔 추가 ── */
  const handleWaterAdd = () => {
    if (!waterMission || waterMission.completed) return;
    const next = waterMission.current + 1;
    if (next >= waterMission.target) completeMission(waterMission.id);
    else updateMissionProgress(waterMission.id, next);
  };

  /* ═══════════════════════════════════════════════════════════
     렌더
  ══════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen flex flex-col bg-[#F9FFEF]">
      {/* ════════════════════════════════════════
          HERO — 캐릭터 영역
      ════════════════════════════════════════ */}
      <div className="retro-scene relative flex flex-col items-center px-5 pt-14 pb-7">
        {/* ── 떠다니는 도형들 ── */}
        {/* 좌상단 영역 */}
        <span
          className="retro-shape rs-triangle rc-blue   rz-sm ra-1"
          style={{ top: "10%", left: "8%", animationDelay: "0s" }}
        />
        <span
          className="retro-shape rs-triangle rc-blue   rz-xs ra-2"
          style={{ top: "18%", left: "22%", animationDelay: "0.8s" }}
        />
        <span
          className="retro-shape rs-square   rc-green  rz-sm ra-2"
          style={{ top: "14%", left: "6%", animationDelay: "0.4s" }}
        />
        <span
          className="retro-shape rs-dot      rc-white  rz-xs ra-6"
          style={{ top: "8%", left: "38%", animationDelay: "1.2s" }}
        />

        {/* 우상단 영역 */}
        <span
          className="retro-shape rs-diamond  rc-green  rz-sm ra-1"
          style={{ top: "12%", right: "10%", animationDelay: "0.6s" }}
        />
        <span
          className="retro-shape rs-square   rc-green  rz-md ra-5"
          style={{ top: "22%", right: "6%", animationDelay: "1.5s" }}
        />
        <span
          className="retro-shape rs-ring     rc-white  rz-sm ra-3"
          style={{ top: "8%", right: "28%", animationDelay: "0.3s" }}
        />

        {/* 좌중앙 영역 */}
        <span
          className="retro-shape rs-circle   rc-red    rz-md ra-3"
          style={{ top: "42%", left: "4%", animationDelay: "2.1s" }}
        />
        <span
          className="retro-shape rs-diamond  rc-yellow rz-xs ra-4"
          style={{ top: "36%", left: "16%", animationDelay: "1.0s" }}
        />
        <span
          className="retro-shape rs-dot      rc-green  rz-xs ra-6"
          style={{ top: "52%", left: "10%", animationDelay: "0.2s" }}
        />

        {/* 우중앙 영역 */}
        <span
          className="retro-shape rs-circle   rc-red    rz-lg ra-5"
          style={{ top: "48%", right: "3%", animationDelay: "1.8s" }}
        />
        <span
          className="retro-shape rs-ring     rc-yellow rz-sm ra-2"
          style={{ top: "38%", right: "18%", animationDelay: "0.7s" }}
        />
        <span
          className="retro-shape rs-triangle rc-blue   rz-xs ra-1"
          style={{ top: "30%", right: "30%", animationDelay: "2.4s" }}
        />

        {/* 하단 영역 */}
        <span
          className="retro-shape rs-square   rc-green  rz-lg ra-2"
          style={{ bottom: "24%", left: "3%", animationDelay: "1.3s" }}
        />
        <span
          className="retro-shape rs-circle   rc-red    rz-xl ra-5"
          style={{ bottom: "18%", left: "18%", animationDelay: "0.9s" }}
        />
        <span
          className="retro-shape rs-circle   rc-red    rz-lg ra-3"
          style={{ bottom: "16%", right: "8%", animationDelay: "2.0s" }}
        />
        <span
          className="retro-shape rs-dot      rc-yellow rz-xs ra-6"
          style={{ bottom: "30%", right: "22%", animationDelay: "0.5s" }}
        />
        {/* 최상단: 스트릭 + 포인트 */}
        <div className="w-full flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] font-bold text-[#2A5C34]/60 uppercase tracking-[0.10em] mb-0.5">
              Streak days
            </p>
            <div className="flex items-center gap-1.5">
              <Flame className="size-5 text-[#F97316]" />
              <span className="text-[30px] font-black text-[#1A2E1C] leading-none">
                {userProfile?.streak ?? 0}
              </span>
            </div>
          </div>

          {/* 포인트 배지 */}
          {/* <div className="flex items-center gap-1.5 bg-white/50 backdrop-blur-sm rounded-full px-3.5 py-2 border border-white/70 shadow-[0_1px_8px_rgba(0,0,0,0.08)]">
            <Coins className="size-3.5 text-[#D97706]" />
            <span className="text-[13px] font-bold text-[#1A2E1C]">
              {(userProfile?.points ?? 0).toLocaleString()}
              <span className="text-[11px] font-semibold text-[#3A6B44] ms-0.5">P</span>
            </span>
          </div> */}
        </div>

        {/* 캐릭터 GIF — 크게 중앙 */}
        <div
          className="flex items-center justify-center"
          style={{ width: 210, height: 210 }}
        >
          <img
            src="/created-gif.gif"
            alt={character?.name ?? "캐릭터"}
            className="w-full h-full object-contain drop-shadow-xl"
            style={{ imageRendering: "pixelated" }}
          />
        </div>

        {/* 캐릭터 이름 + 레벨 + 기분 */}
        <div className="flex items-center gap-2.5 mt-3 mb-4">
          <h1 className="text-[22px] font-black text-[#1A2E1C] leading-none tracking-[-0.5px]">
            {character?.name ?? "알"}
          </h1>
          <span className="bg-[#3AAE5A] text-white text-[11px] font-bold px-2.5 py-[5px] rounded-full leading-none">
            Lv.{character?.level ?? 1}
          </span>
        </div>

        {/* XP 바 — 두꺼운 스트라이프 스타일 */}
        <div className="w-full mb-5">
          {/* 라벨 행 */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#3E8C28] uppercase tracking-[0.06em]">
              EXP
            </span>
            <span className="text-[11px] font-semibold text-[#3E8C28]">
              {character?.experience ?? 0}
              <span className="text-[#87D57B] font-medium">
                {" "}
                / {character?.experienceToNextLevel ?? 100}
              </span>
            </span>
          </div>
          {/* 바 */}
          <div
            className="relative h-8 rounded-full overflow-hidden"
            style={{ background: "#E4EFD2" }}
          >
            {/* Fill */}
            <div
              className="absolute left-0 top-0 h-full rounded-full overflow-hidden"
              style={{
                width: `${expPercent}%`,
                background: "linear-gradient(90deg, #5FC952 0%, #87D57B 100%)",
              }}
            >
              {/* 스트라이프 오버레이 */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(45deg, transparent, transparent 9px, rgba(255,255,255,0.22) 9px, rgba(255,255,255,0.22) 18px)",
                }}
              />
            </div>
            {/* 수치 텍스트 — 항상 선명하게 */}
            <span
              className="absolute inset-0 flex items-center justify-center text-[12px] font-black"
              style={{
                color: expPercent > 45 ? "#fff" : "#2A5C34",
                textShadow:
                  expPercent > 45 ? "0 1px 4px rgba(0,0,0,0.20)" : "none",
              }}
            >
              {expPercent}%
            </span>
          </div>
          <p className="text-[11px] font-medium text-[#3E8C28] text-center mt-1.5">
            다음 레벨까지{" "}
            <span className="font-bold text-[#2A5C34]">
              {(character?.experienceToNextLevel ?? 100) -
                (character?.experience ?? 0)}
            </span>{" "}
            XP 남았어요
          </p>
        </div>

        {/* 캐릭터 스탯 3종 */}
        <div className="flex gap-2.5 w-full">
          {/* 에너지 — Accent Yellow 톤 */}
          <StatChip
            label="에너지"
            value={energyVal}
            icon={Zap}
            iconColor="#EDA35A"
            iconBg="#FFF383"
          />
          {/* 기분 — Pastel Pink 톤 */}
          <StatChip
            label="기분"
            value={moodVal}
            icon={Smile}
            iconColor="#647FBC"
            iconBg="#CFECF3"
          />
          {/* 안정감 — Primary Green 톤 */}
          <StatChip
            label="안정감"
            value={stabilityVal}
            icon={ShieldCheck}
            iconColor="#3E8C28"
            iconBg="#E9FBA4"
          />
        </div>
      </div>

      {/* ════════════════════════════════════════
          SCROLL CONTENT — 흰색 카드 영역
          (배경 컬러가 양옆에 보이도록 mx-4 패딩)
      ════════════════════════════════════════ */}
      <div className="flex-1 px-4 pb-28 space-y-4">
        {/* ── 오늘의 추천 ── */}
        {AI_RECOMMENDATIONS.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-2.5 px-1">
              <h2 className="text-[17px] font-bold text-[#1A2E1C]">
                오늘의 추천
              </h2>
              <span className="text-[10px] font-bold text-[#2A5C34] uppercase tracking-[0.06em] badge-tint px-2.5 py-1 rounded-full border border-white/70">
                AI 분석
              </span>
            </div>

            <div className="space-y-3">
              {AI_RECOMMENDATIONS.map((rec, idx) => {
                const isFirst = idx === 0;
                return (
                  <div
                    key={rec.id}
                    className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.07)] p-5"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "size-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                          isFirst ? "bg-[#FFDBFD]" : "bg-[#CBF891]",
                        )}
                      >
                        <Sparkles
                          className={cn(
                            "size-4",
                            isFirst ? "text-[#C85A54]" : "text-[#6B9B7A]",
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-bold text-[#3C3C3C] leading-snug mb-1.5">
                          {rec.title}
                        </p>
                        <p className="text-[13px] text-[#7A7A7A] leading-normal mb-3">
                          {rec.reason}
                        </p>
                        <div className="flex items-center gap-1.5 pt-2.5 border-t border-black/[0.05]">
                          <BookOpen className="size-3 text-[#9B9B9B]" />
                          <span className="text-[11px] text-[#9B9B9B] font-medium">
                            {rec.source}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── 오늘의 미션 ── */}
        <section>
          <div className="flex items-center justify-between mb-2.5 px-1">
            <h2 className="text-[17px] font-bold text-[#1A2E1C]">
              오늘의 미션
            </h2>
            <button
              onClick={() => setScreen("missions")}
              className="flex items-center gap-0.5 text-[13px] font-semibold text-[#2A5C34] min-h-10 min-w-10 justify-end"
            >
              전체보기
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.07)] overflow-hidden">
            {/* 달성률 요약 */}
            <div className="px-5 pt-5 pb-4 border-b border-black/[0.05]">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[13px] font-bold text-[#3C3C3C]">
                  {completedMissions}
                  <span className="text-[#9B9B9B] font-medium">
                    /{totalMissions} 완료
                  </span>
                </p>
                <p className="text-[13px] font-bold text-[#3C3C3C]">
                  {Math.round(missionProgress)}%
                </p>
              </div>
              <div className="h-2 bg-[#E8E6E1] rounded-full overflow-hidden">
                <div
                  className="h-full bg-ring rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${missionProgress}%` }}
                />
              </div>
            </div>

            {/* 미션 개별 행 */}
            <div className="divide-y divide-black/[0.04]">
              {/* 만보 걷기 — Sub Green #CBF891 */}
              {walkingMission && (
                <MissionRow
                  icon={<Footprints className="size-4 text-[#3E8C28]" />}
                  iconBg="bg-[#ADEED9]"
                  title="만보 걷기"
                  valueLabel={`${walkingMission.current.toLocaleString()} / ${walkingMission.target.toLocaleString()}`}
                  progress={
                    (walkingMission.current / walkingMission.target) * 100
                  }
                  barColor="bg-[#ADEED9]"
                  completed={walkingMission.completed}
                />
              )}

              {/* 물 마시기 — Accent Blue #AEE1F9 */}
              {waterMission && (
                <MissionRow
                  icon={<Droplets className="size-4 text-[#2878B0]" />}
                  iconBg="bg-[#AEE1F9]"
                  title="물 마시기"
                  valueLabel={`${waterMission.current} / ${waterMission.target}잔`}
                  progress={(waterMission.current / waterMission.target) * 100}
                  barColor="bg-[#AEE1F9]"
                  completed={waterMission.completed}
                  action={
                    <button
                      onClick={handleWaterAdd}
                      className="h-8 px-3 text-[12px] font-bold text-[#2878B0] bg-[#AEE1F9] rounded-full border border-[#2878B0]/15 min-w-[48px]"
                    >
                      +1잔
                    </button>
                  }
                />
              )}

              {/* 식단 기록 — Accent Yellow #FFF383 */}
              {dietMission && (
                <MissionRow
                  icon={<Apple className="size-4 text-[#8C7010]" />}
                  iconBg="bg-[#FFF383]"
                  title="식단 기록"
                  valueLabel={`${dietMission.current} / ${dietMission.target}끼`}
                  progress={(dietMission.current / dietMission.target) * 100}
                  barColor="bg-[#F4F683]"
                  completed={dietMission.completed}
                  action={
                    <button
                      onClick={() => setScreen("diet")}
                      className="h-8 px-3 text-[12px] font-bold text-[#8C7010] bg-[#FFF9A0] rounded-full border border-[#8C7010]/15 min-w-[48px]"
                    >
                      기록
                    </button>
                  }
                />
              )}
            </div>
          </div>
        </section>
      </div>

      {/* ── 하단 내비게이션 ── */}
      <BottomNav />

      {/* ── 모달 ── */}
      <OfflinePenaltyModal
        open={showPenaltyModal}
        onClose={() => setShowPenaltyModal(false)}
      />

      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent showCloseButton={false} className="text-center">
          <DialogTitle className="sr-only">주간 건강 리포트 알림</DialogTitle>

          {/* 아이콘 헤더 */}
          <div className="size-14 rounded-full bg-[#CBF891] flex items-center justify-center mx-auto mb-1">
            <TrendingUp className="size-7 text-[#3E8C28]" strokeWidth={2} />
          </div>

          {/* 제목 */}
          <p className="text-[18px] font-bold text-[#3C3C3C] leading-snug">
            주간 건강 리포트 도착! 💌
          </p>

          {/* 설명 */}
          <p className="text-[13px] text-[#7A7A7A] leading-normal mt-2">
            이번 주 건강 점수와 AI가 분석한
            <br />
            맞춤 피드백이 준비되었어요.
          </p>

          {/* 버튼 */}
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              className="flex-1 h-12 text-[14px] font-bold rounded-2xl"
              onClick={() => setShowReportModal(false)}
            >
              나중에 보기
            </Button>
            <Button
              className="flex-1 h-12 text-[14px] font-bold rounded-2xl"
              onClick={() => {
                setShowReportModal(false);
                setScreen("report");
              }}
            >
              확인하러 가기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
