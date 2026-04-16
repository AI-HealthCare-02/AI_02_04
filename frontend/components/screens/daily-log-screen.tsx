import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollHeader } from "@/components/ui/scroll-header";
import { useScrollHeader } from "@/hooks/use-scroll-header";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Flame,
  Zap,
  Clock,
  Edit3,
  Footprints,
  Droplets,
  Dumbbell,
  Apple,
  MessageSquareHeart,
  TrendingUp,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChallengeLog {
  log_id: string;
  title: string;
  icon: React.ElementType;
  value: string;
  is_completed: boolean;
  fail_reason?: "tired" | "no_time" | "weather" | "other" | null;
  execution_time?: "morning" | "afternoon" | "evening" | null;
  exp_earned: number;
  streak_count: number;
}

const FAIL_REASON_LABELS = {
  tired: "너무 피곤했어요 😫",
  no_time: "시간이 부족했어요 ⏱️",
  weather: "날씨가 안 좋았어요 🌧️",
  other: "기타 다른 이유 🤔",
};

const EXECUTION_TIME_LABELS = {
  morning: "아침 🌅",
  afternoon: "오후 ☀️",
  evening: "저녁 🌙",
};

// 요일별 색상 (오늘 = primary, 완료일 = 연초록, 미완 = 기본)
const weekDays = ["월", "화", "수", "목", "금", "토", "일"];
const todayIndex = 2; // 수요일 가정

export function DailyLogScreen() {
  const { setScreen } = useAppStore();
  const isScrolled = useScrollHeader();

  const [logs, setLogs] = useState<ChallengeLog[]>([
    {
      log_id: "1",
      title: "만보 걷기",
      icon: Footprints,
      value: "10,500 / 10,000 걸음",
      is_completed: true,
      execution_time: "afternoon",
      exp_earned: 100,
      streak_count: 5,
    },
    {
      log_id: "2",
      title: "물 마시기",
      icon: Droplets,
      value: "8 / 8 잔",
      is_completed: true,
      execution_time: "morning",
      exp_earned: 50,
      streak_count: 12,
    },
    {
      log_id: "3",
      title: "운동 30분",
      icon: Dumbbell,
      value: "0 / 30 분",
      is_completed: false,
      fail_reason: "tired",
      execution_time: "evening",
      exp_earned: 0,
      streak_count: 0,
    },
    {
      log_id: "4",
      title: "건강한 저녁 식단",
      icon: Apple,
      value: "미기록",
      is_completed: false,
      fail_reason: null,
      execution_time: null,
      exp_earned: 0,
      streak_count: 0,
    },
  ]);

  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [tempReason, setTempReason] =
    useState<ChallengeLog["fail_reason"]>(null);
  const [tempTime, setTempTime] =
    useState<ChallengeLog["execution_time"]>(null);

  // 요약 계산
  const completedCount = logs.filter((l) => l.is_completed).length;
  const totalCount = logs.length;
  const progressPercent = (completedCount / totalCount) * 100;
  const todayExps = logs.reduce((sum, l) => sum + l.exp_earned, 0);
  const maxStreak = Math.max(...logs.map((l) => l.streak_count));

  const handleSaveReason = () => {
    if (!selectedLogId || !tempReason) return;
    setLogs(
      logs.map((log) =>
        log.log_id === selectedLogId
          ? {
              ...log,
              fail_reason: tempReason,
              execution_time: tempTime,
              exp_earned: 10,
            }
          : log,
      ),
    );
    setSelectedLogId(null);
    setTempReason(null);
    setTempTime(null);
  };

  const openModal = (logId: string) => {
    setSelectedLogId(logId);
    setTempReason(null);
    setTempTime(null);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-10">
      {/* ── 스크롤 컴팩트 헤더 ── */}
      <ScrollHeader
        title="일일 건강 기록"
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
              일일 건강 기록
            </h1>
            <p className="text-[13px] text-[#7A7A7A] font-medium">
              오늘의 미션 달성 현황
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-4">
        {/* ── 1. 주간 캘린더 스트립 ── */}
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-4 py-3">
          <div className="flex justify-between items-center">
            {weekDays.map((day, idx) => {
              const isToday = idx === todayIndex;
              const isPast = idx < todayIndex;
              return (
                <div
                  key={day}
                  className={cn(
                    "flex flex-col items-center gap-1 w-10 py-2 rounded-xl transition-colors",
                    isToday ? "bg-primary" : isPast ? "bg-[#F0FDF4]" : "",
                  )}
                >
                  <span
                    className={cn(
                      "text-[11px] font-bold",
                      isToday
                        ? "text-white"
                        : isPast
                          ? "text-[#3E8C28]"
                          : "text-[#9B9B9B]",
                    )}
                  >
                    {day}
                  </span>
                  <span
                    className={cn(
                      "text-[14px] font-bold leading-none",
                      isToday
                        ? "text-white"
                        : isPast
                          ? "text-[#3E8C28]"
                          : "text-[#3C3C3C]",
                    )}
                  >
                    {15 + idx}
                  </span>
                  {/* 완료 점 */}
                  {isPast && (
                    <div className="size-1.5 rounded-full bg-[#87D57B]" />
                  )}
                  {isToday && (
                    <div className="size-1.5 rounded-full bg-white/60" />
                  )}
                  {!isPast && !isToday && (
                    <div className="size-1.5 rounded-full bg-transparent" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 2. 오늘 요약 대시보드 ── */}
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
          {/* 달성률 */}
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-[12px] font-bold text-[#6A6A6A] uppercase tracking-[0.05em] mb-1">
                오늘의 달성률
              </p>
              <p className="text-[13px] text-[#7A7A7A] font-medium">
                {completedCount} / {totalCount}개 미션 완료
              </p>
            </div>
            <p className="text-[36px] font-bold text-[#2A2A2A] leading-none tracking-[-0.02em]">
              {Math.round(progressPercent)}
              <span className="text-[18px] font-bold text-[#9B9B9B] ms-0.5">
                %
              </span>
            </p>
          </div>

          {/* 프로그레스 바 */}
          <div className="h-2.5 bg-[#E8E8E8] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progressPercent}%`,
                background: "linear-gradient(90deg, #5FC952 0%, #87D57B 100%)",
              }}
            />
          </div>

          {/* 구분선 + 스탯 */}
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[#F5F5F5]">
            <div className="flex items-center gap-3 bg-[#FFFBE7] rounded-xl px-3.5 py-3">
              <div className="size-8 rounded-lg bg-[#FFF383] flex items-center justify-center">
                <Zap className="size-4 text-[#6366F1]" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-[#7A7A7A]">
                  획득 경험치
                </p>
                <p className="text-[16px] font-black text-[#8C7010] leading-none">
                  +{todayExps}
                  <span className="text-[10px] ms-0.5">XP</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-[#FFF5F0] rounded-xl px-3.5 py-3">
              <div className="size-8 rounded-lg bg-[#FFD8C2] flex items-center justify-center">
                <Flame className="size-4 text-[#C0502A]" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-[#7A7A7A]">
                  최고 연속
                </p>
                <p className="text-[16px] font-black text-[#C0502A] leading-none">
                  {maxStreak}
                  <span className="text-[10px] ms-0.5">일</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. 챌린지 기록 리스트 ── */}
        <div>
          <p className="text-[12px] font-bold text-[#6A6A6A] uppercase tracking-[0.05em] mb-3 px-1">
            오늘의 기록 상세
          </p>

          <div className="space-y-2.5">
            {logs.map((log) => {
              const Icon = log.icon;
              const isCompleted = log.is_completed;
              const hasReason = !isCompleted && log.fail_reason;
              const needsReason = !isCompleted && !log.fail_reason;

              return (
                <div
                  key={log.log_id}
                  className={cn(
                    "bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 border-l-4",
                    isCompleted
                      ? "border-l-[#87D57B]"
                      : needsReason
                        ? "border-l-[#F09BB0]"
                        : "border-l-[#E8E8E8]",
                  )}
                >
                  <div className="flex items-start gap-3.5">
                    {/* 아이콘 */}
                    <div
                      className={cn(
                        "size-11 rounded-2xl flex items-center justify-center shrink-0",
                      )}
                      style={{
                        backgroundColor: isCompleted ? "#E8F9D6" : "#F5F5F5",
                      }}
                    >
                      <Icon
                        className="size-5"
                        style={{ color: isCompleted ? "#3E8C28" : "#9B9B9B" }}
                      />
                    </div>

                    {/* 내용 */}
                    <div className="flex-1 min-w-0">
                      {/* 제목 + 완료 아이콘 */}
                      <div className="flex items-center justify-between mb-1">
                        <p
                          className={cn(
                            "text-[15px] font-bold",
                            isCompleted ? "text-[#2A2A2A]" : "text-[#3C3C3C]",
                          )}
                        >
                          {log.title}
                        </p>
                        {isCompleted ? (
                          <CheckCircle2 className="size-5 text-[#87D57B] shrink-0" />
                        ) : (
                          <XCircle className="size-5 text-[#C8C8C8] shrink-0" />
                        )}
                      </div>

                      {/* 수치 + 시간대 */}
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={cn(
                            "text-[13px] font-semibold",
                            isCompleted ? "text-[#3E8C28]" : "text-[#7A7A7A]",
                          )}
                        >
                          {log.value}
                        </span>
                        {log.execution_time && (
                          <span className="flex items-center gap-1 text-[10px] font-bold bg-[#F5F5F5] text-[#9B9B9B] px-2 py-0.5 rounded-full">
                            <Clock className="size-2.5" />
                            {EXECUTION_TIME_LABELS[log.execution_time]}
                          </span>
                        )}
                      </div>

                      {/* 하단 상태 영역 */}
                      {isCompleted ? (
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-[11px] font-bold text-[#3E8C28] bg-[#E8F9D6] px-2.5 py-1 rounded-full">
                            <Zap className="size-3" />+{log.exp_earned}XP 획득
                          </span>
                          {log.streak_count > 0 && (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-[#C0502A] bg-[#FFF5F0] px-2.5 py-1 rounded-full">
                              <Flame className="size-3" />
                              {log.streak_count}일 연속
                            </span>
                          )}
                        </div>
                      ) : hasReason ? (
                        <span className="text-[11px] font-medium text-[#9B9B9B] bg-[#F5F5F5] px-2.5 py-1 rounded-full inline-block">
                          실패 사유: {FAIL_REASON_LABELS[log.fail_reason!]}
                        </span>
                      ) : (
                        <button
                          className="flex items-center gap-1.5 text-[12px] font-bold text-[#C0305A] bg-[#FFE8EE] hover:bg-[#FFB8CA] px-3 py-2 rounded-xl transition-colors w-full justify-center mt-1"
                          onClick={() => openModal(log.log_id)}
                        >
                          <Edit3 className="size-3.5" />
                          미달성 사유 기록하고 +10P 받기
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 4. 하단 요약 인사이트 ── */}
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
          <p className="text-[12px] font-bold text-[#6A6A6A] uppercase tracking-[0.05em] mb-3">
            오늘의 한마디
          </p>
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-xl bg-[#CBF891] flex items-center justify-center shrink-0">
              <TrendingUp className="size-4 text-[#3E8C28]" strokeWidth={2.5} />
            </div>
            <p className="text-[13px] text-[#3C3C3C] font-medium leading-relaxed">
              {completedCount === totalCount
                ? "🎉 오늘 모든 미션을 달성했어요! 정말 대단해요."
                : completedCount >= totalCount / 2
                  ? "👍 절반 이상 달성했어요. 조금만 더 힘내봐요!"
                  : "💪 오늘은 쉽지 않았네요. 내일 다시 도전해봐요!"}
            </p>
          </div>
        </div>
      </div>

      {/* ── 미달성 사유 입력 모달 ── */}
      <Dialog
        open={!!selectedLogId}
        onOpenChange={(open) => !open && setSelectedLogId(null)}
      >
        <DialogContent showCloseButton={false}>
          {/* 아이콘 헤더 */}
          <div className="size-14 rounded-full bg-[#FFB8CA] flex items-center justify-center mx-auto mb-1">
            <MessageSquareHeart
              className="size-7 text-[#C0305A]"
              strokeWidth={2}
            />
          </div>

          <DialogTitle className="text-center">
            앗, 오늘은 아쉽네요! 🥲
          </DialogTitle>
          <p className="text-[13px] text-[#7A7A7A] leading-normal text-center mt-1">
            내일 더 꼭 맞는 AI 건강 조언을 해드리기 위해
            <br />못 하신 이유를 살짝 알려주세요.
          </p>

          <div className="space-y-4 mt-5">
            {/* 사유 선택 */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-[#6A6A6A] uppercase tracking-[0.05em]">
                어떤 이유 때문이었나요?
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(
                  Object.keys(FAIL_REASON_LABELS) as Array<
                    keyof typeof FAIL_REASON_LABELS
                  >
                ).map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setTempReason(reason)}
                    className={cn(
                      "py-3 px-2 text-[13px] font-semibold rounded-2xl border-2 transition-all text-center",
                      tempReason === reason
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-white text-[#7A7A7A] border-[#E8EEE9] hover:border-primary/40 hover:bg-[#F9FFEF]",
                    )}
                  >
                    {FAIL_REASON_LABELS[reason]}
                  </button>
                ))}
              </div>
            </div>

            {/* 시간대 선택 */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-[#6A6A6A] uppercase tracking-[0.05em]">
                원래 언제 하려고 하셨나요?{" "}
                <span className="normal-case font-normal">(선택)</span>
              </p>
              <div className="flex gap-2">
                {(
                  Object.keys(EXECUTION_TIME_LABELS) as Array<
                    keyof typeof EXECUTION_TIME_LABELS
                  >
                ).map((time) => (
                  <button
                    key={time}
                    onClick={() => setTempTime(time)}
                    className={cn(
                      "flex-1 py-2.5 text-[13px] font-semibold rounded-2xl border-2 transition-all",
                      tempTime === time
                        ? "bg-[#CBF891] text-[#2A5C34] border-[#87D57B]"
                        : "bg-white text-[#7A7A7A] border-[#E8EEE9] hover:border-primary/40 hover:bg-[#F9FFEF]",
                    )}
                  >
                    {EXECUTION_TIME_LABELS[time]}
                  </button>
                ))}
              </div>
            </div>

            {/* 버튼 행 */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-12 text-[14px] font-bold rounded-2xl"
                onClick={() => setSelectedLogId(null)}
              >
                취소
              </Button>
              <Button
                className="flex-1 h-12 text-[14px] font-bold rounded-2xl"
                disabled={!tempReason}
                onClick={handleSaveReason}
              >
                기록하고 경험치 받기
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
