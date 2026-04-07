
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Flame,
  Coins,
  Clock,
  Edit3,
  Footprints,
  Droplets,
  Dumbbell,
  Apple,
} from "lucide-react";
import { cn } from "@/lib/utils";

// DB 스키마를 모방한 Mock 데이터 타입
interface ChallengeLog {
  log_id: string;
  title: string;
  icon: React.ElementType;
  value: string;
  is_completed: boolean;
  fail_reason?: "tired" | "no_time" | "weather" | "other" | null;
  execution_time?: "morning" | "afternoon" | "evening" | null;
  points_earned: number;
  streak_count: number;
}

// 실패 사유 라벨 매핑
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

export function DailyLogScreen() {
  const { setScreen } = useAppStore();

  // DB에서 가져왔다고 가정하는 오늘자 챌린지 기록들
  const [logs, setLogs] = useState<ChallengeLog[]>([
    {
      log_id: "1",
      title: "만보 걷기",
      icon: Footprints,
      value: "10,500 / 10,000 걸음",
      is_completed: true,
      execution_time: "afternoon",
      points_earned: 100,
      streak_count: 5,
    },
    {
      log_id: "2",
      title: "물 마시기",
      icon: Droplets,
      value: "8 / 8 잔",
      is_completed: true,
      execution_time: "morning",
      points_earned: 50,
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
      points_earned: 0,
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
      points_earned: 0,
      streak_count: 0,
    },
  ]);

  // 모달 제어 상태
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [tempReason, setTempReason] =
    useState<ChallengeLog["fail_reason"]>(null);
  const [tempTime, setTempTime] =
    useState<ChallengeLog["execution_time"]>(null);

  // 요약 데이터 계산
  const completedCount = logs.filter((l) => l.is_completed).length;
  const totalCount = logs.length;
  const progressPercent = (completedCount / totalCount) * 100;
  const todayPoints = logs.reduce((sum, l) => sum + l.points_earned, 0);
  const maxStreak = Math.max(...logs.map((l) => l.streak_count));

  // 간단한 주간 달력 데이터 (UI용)
  const weekDays = ["월", "화", "수", "목", "금", "토", "일"];
  const todayIndex = 2; // 수요일이라 가정

  // 사유 저장 핸들러
  const handleSaveReason = () => {
    if (!selectedLogId || !tempReason) return;

    setLogs(
      logs.map((log) =>
        log.log_id === selectedLogId
          ? {
              ...log,
              fail_reason: tempReason,
              execution_time: tempTime,
              points_earned: 10,
            } // 사유 기록 시 위로 포인트 10점 지급!
          : log,
      ),
    );

    // 초기화 및 닫기
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
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-background pb-8 flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center gap-4 sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={() => setScreen("mypage")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">일일 건강 기록</h1>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-6 overflow-auto">
        {/* 1. 주간 캘린더 스트립 */}
        <div className="flex justify-between items-center bg-card p-3 rounded-2xl shadow-sm border border-border/50">
          {weekDays.map((day, idx) => (
            <div
              key={day}
              className={cn(
                "flex flex-col items-center justify-center w-10 h-12 rounded-xl transition-colors",
                idx === todayIndex
                  ? "bg-primary text-primary-foreground font-bold shadow-md"
                  : "text-muted-foreground",
              )}
            >
              <span className="text-xs">{day}</span>
              <span className="text-sm mt-0.5">{15 + idx}</span>
            </div>
          ))}
        </div>

        {/* 2. 하루 요약 대시보드 */}
        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-foreground">오늘의 달성률</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {completedCount} / {totalCount}개 미션 완료
                </p>
              </div>
              <div className="text-2xl font-black text-primary">
                {Math.round(progressPercent)}%
              </div>
            </div>
            <Progress value={progressPercent} className="h-2.5" />

            <div className="flex gap-3 pt-2">
              <div className="flex-1 bg-card rounded-xl p-3 flex flex-col items-center border border-border/50">
                <Coins className="w-5 h-5 text-amber-500 mb-1" />
                <span className="text-xs text-muted-foreground">
                  획득 포인트
                </span>
                <span className="font-bold text-foreground">
                  +{todayPoints}P
                </span>
              </div>
              <div className="flex-1 bg-card rounded-xl p-3 flex flex-col items-center border border-border/50">
                <Flame className="w-5 h-5 text-orange-500 mb-1" />
                <span className="text-xs text-muted-foreground">
                  최고 연속 달성
                </span>
                <span className="font-bold text-foreground">
                  {maxStreak}일 🔥
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. 챌린지 기록 리스트 */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground px-1">
            오늘의 기록 상세
          </h3>

          {logs.map((log) => {
            const Icon = log.icon;
            const isCompleted = log.is_completed;
            const hasReason = !isCompleted && log.fail_reason;
            const needsReason = !isCompleted && !log.fail_reason;

            return (
              <Card
                key={log.log_id}
                className={cn(
                  "overflow-hidden transition-all",
                  isCompleted
                    ? "border-success/30 bg-success/5"
                    : needsReason
                      ? "border-destructive/30 bg-destructive/5"
                      : "border-border/50 bg-card opacity-80",
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                        isCompleted
                          ? "bg-success/20 text-success"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon className="w-6 h-6" />
                    </div>

                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-foreground truncate">
                          {log.title}
                        </h4>
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-muted-foreground shrink-0" />
                        )}
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-foreground">
                          {log.value}
                        </span>
                        {log.execution_time && (
                          <span className="flex items-center text-[10px] bg-background/50 px-1.5 py-0.5 rounded text-muted-foreground border border-border/50">
                            <Clock className="w-3 h-3 mr-1" />
                            {EXECUTION_TIME_LABELS[log.execution_time]}
                          </span>
                        )}
                      </div>

                      {/* 상태에 따른 하단 영역 */}
                      {isCompleted ? (
                        <div className="flex items-center gap-2 text-xs font-semibold text-success bg-success/10 w-fit px-2 py-1 rounded-md">
                          <Coins className="w-3 h-3" /> +{log.points_earned}P
                          획득
                        </div>
                      ) : hasReason ? (
                        <div className="text-xs text-muted-foreground bg-muted w-fit px-2 py-1 rounded-md border border-border/50">
                          실패 사유: {FAIL_REASON_LABELS[log.fail_reason!]}
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full mt-1 border-primary/50 text-primary hover:bg-primary/10"
                          onClick={() => openModal(log.log_id)}
                        >
                          <Edit3 className="w-4 h-4 mr-1.5" />
                          미달성 사유 기록하고 +10P 받기
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 4. 미달성 사유 입력 모달 */}
      <Dialog
        open={!!selectedLogId}
        onOpenChange={(open) => !open && setSelectedLogId(null)}
      >
        <DialogContent className="sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-6">
          <DialogTitle className="sr-only">미달성 사유 기록</DialogTitle>

          <div className="text-center space-y-2 mb-6">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-2">
              <Edit3 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground">
              앗, 오늘은 아쉽네요! 🥲
            </h3>
            <p className="text-sm text-muted-foreground leading-snug">
              내일 더 꼭 맞는 AI 건강 조언을 해드리기 위해
              <br />못 하신 이유를 살짝 알려주세요.
            </p>
          </div>

          <div className="space-y-4">
            {/* 사유 선택 (Radio 역할) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground px-1">
                어떤 이유 때문이었나요?
              </label>
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
                      "py-3 px-2 text-sm font-medium rounded-xl border transition-all text-center",
                      tempReason === reason
                        ? "bg-primary text-primary-foreground border-primary shadow-md"
                        : "bg-card text-muted-foreground border-border/60 hover:bg-muted/50",
                    )}
                  >
                    {FAIL_REASON_LABELS[reason]}
                  </button>
                ))}
              </div>
            </div>

            {/* 시간대 선택 */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-muted-foreground px-1">
                원래 언제 하려고 하셨나요? (선택)
              </label>
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
                      "flex-1 py-2 text-sm font-medium rounded-xl border transition-all",
                      tempTime === time
                        ? "bg-primary/10 text-primary border-primary"
                        : "bg-card text-muted-foreground border-border/60 hover:bg-muted/50",
                    )}
                  >
                    {EXECUTION_TIME_LABELS[time]}
                  </button>
                ))}
              </div>
            </div>

            <Button
              className="w-full h-12 text-base mt-2"
              disabled={!tempReason}
              onClick={handleSaveReason}
            >
              기록 완료하고 포인트 받기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
