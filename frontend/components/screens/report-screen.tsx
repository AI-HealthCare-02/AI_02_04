
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  TrendingUp,
  AlertCircle,
  ThumbsUp,
  Target as TargetIcon,
  Info,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function ReportScreen() {
  const { setScreen } = useAppStore();
  const [missionAdjusted, setMissionAdjusted] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // 모의 데이터
  const weeklyScore = 85;
  const wordCloudData = [
    { text: "샐러드", weight: "text-3xl", color: "text-blue-500" },
    { text: "라면", weight: "text-xl", color: "text-red-500" },
    { text: "닭가슴살", weight: "text-2xl", color: "text-blue-400" },
    { text: "믹스커피", weight: "text-lg", color: "text-red-400" },
    { text: "현미밥", weight: "text-xl", color: "text-blue-500" },
    { text: "빵", weight: "text-2xl", color: "text-red-500" },
    { text: "아몬드", weight: "text-lg", color: "text-blue-400" },
  ];

  const handleAdjustMission = () => {
    setMissionAdjusted(true);
    setShowConfirmModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-background pb-12">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md p-4 flex items-center gap-4 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={() => setScreen("home")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">
            주간 건강 리포트
          </h1>
          <p className="text-sm text-muted-foreground">3월 3주차 분석 결과</p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* 섹션 1: 주간 요약 (Hero) */}
        <section className="flex flex-col items-center justify-center py-6">
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg
              className="w-full h-full transform -rotate-90"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted/30"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - weeklyScore / 100)}`}
                className="text-primary transition-all duration-1000 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-bold text-primary">
                {weeklyScore}
              </span>
              <span className="text-sm text-muted-foreground">/ 100점</span>
            </div>
          </div>
          <h2 className="mt-4 text-xl font-bold text-foreground">
            이번 주 건강 점수는 {weeklyScore}점!
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            지난주보다 5점 상승했어요 👏
          </p>
        </section>

        {/* 섹션 2: 일일 미션 달성도 */}
        <section className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            미션 달성 현황
          </h3>
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between items-center bg-primary/5 p-3 rounded-xl">
                <span className="font-medium">
                  🔥 3주 연속 주간 목표 달성 중!
                </span>
              </div>

              <div>
                <span className="text-xs text-muted-foreground mb-2 block">
                  요일별 활동량
                </span>
                <div className="flex justify-between gap-1">
                  {["월", "화", "수", "목", "금", "토", "일"].map((day, i) => (
                    <div key={day} className="flex flex-col items-center gap-1">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-md",
                          i === 1 || i === 2 ? "bg-primary/20" : "bg-primary",
                        )}
                      />
                      <span className="text-xs text-muted-foreground">
                        {day}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-orange-700 dark:text-orange-400 mb-1">
                      AI 챌린지 조정 제안
                    </h4>
                    <p className="text-sm text-orange-600/80 dark:text-orange-300 mb-3">
                      화/수요일에 '10,000보 걷기' 미션 달성에 어려움이
                      있었습니다. 무리한 목표는 스트레스를 줄 수 있어요.
                    </p>
                    <div className="flex items-center gap-2 bg-background/50 p-2 rounded-lg mb-3">
                      <span className="text-sm line-through text-muted-foreground">
                        10,000보
                      </span>
                      <ArrowLeft className="w-4 h-4 rotate-180 text-orange-500" />
                      <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                        5,000보 (조정)
                      </span>
                    </div>
                    {missionAdjusted ? (
                      <div className="text-sm font-medium text-success flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> 목표가 성공적으로
                        조정되었습니다!
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 bg-background"
                          onClick={() => setShowConfirmModal(true)}
                        >
                          유지하기
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                          onClick={handleAdjustMission}
                        >
                          적용하기
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 섹션 3: AI 식단 및 영양 분석 */}
        <section className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            주간 식단 & 영양 분석
          </h3>
          <Card>
            <CardContent className="p-4 space-y-6">
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="4"
                      strokeDasharray="50 50"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="4"
                      strokeDasharray="30 70"
                      strokeDashoffset="-50"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="4"
                      strokeDasharray="20 80"
                      strokeDashoffset="-80"
                    />
                  </svg>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-amber-500 font-medium">
                      탄수화물 50%
                    </span>
                    <span className="text-muted-foreground text-xs">
                      권장 45%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-500 font-medium">단백질 30%</span>
                    <span className="text-muted-foreground text-xs">
                      권장 30%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-500 font-medium">지방 20%</span>
                    <span className="text-muted-foreground text-xs">
                      권장 25%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                <span className="text-xs text-muted-foreground mb-3 block">
                  이번 주 자주 먹은 음식
                </span>
                <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2">
                  {wordCloudData.map((word, index) => (
                    <span
                      key={index}
                      className={cn(
                        "font-bold transition-all hover:scale-110",
                        word.weight,
                        word.color,
                      )}
                    >
                      {word.text}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 섹션 4: LLM 주간 브리핑 */}
        <section className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            AI 주간 브리핑
          </h3>
          <div className="space-y-3">
            <Card className="bg-blue-500/5 border-blue-500/20">
              <CardContent className="p-4 flex gap-3">
                <ThumbsUp className="w-5 h-5 text-blue-500 shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-1">
                    정말 잘하셨어요!
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    수요일과 목요일에 식이섬유가 풍부한 식단을 완벽히
                    지켜주셨어요! 혈당 관리에 아주 좋은 습관입니다.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-500/5 border-red-500/20">
              <CardContent className="p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <div>
                  <h4 className="font-semibold text-red-700 dark:text-red-400 mb-1">
                    조금 아쉬워요
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    주말에 정제 탄수화물(빵, 면) 섭취 빈도가 평일 대비 40%
                    증가했습니다. 다음 주말엔 통곡물 빵으로 대체해 보는 건
                    어떨까요?
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 flex gap-3">
                <TargetIcon className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <h4 className="font-semibold text-primary mb-1">
                    다음 주 전략 제안
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    다음 주에는 식후 15분 걷기 미션을 매일 달성하여 식후 혈당
                    스파이크를 잡아볼까요?
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 섹션 5: 면책 조항 */}
        <p className="text-[10px] text-muted-foreground text-center pt-4 pb-8">
          본 리포트는 생활 습관 참고용이며, 의학적 진단을 대체하지 않습니다.
          <br />
          필요시 반드시 전문 의료진과 상담하시기 바랍니다.
        </p>
      </div>

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>기존 목표를 유지할까요?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              무리한 목표는 금방 지칠 수 있어요. 하지만 할 수 있다면 기존
              10,000보 목표를 유지해 보겠습니다!
            </p>
          </div>
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowConfirmModal(false)}
            >
              다시 생각할래요
            </Button>
            <Button
              className="flex-1"
              onClick={() => setShowConfirmModal(false)}
            >
              유지하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
