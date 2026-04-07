import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
  User,
  Battery,
  Smile,
  Shield,
  Info,
  CheckCircle2,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OfflinePenaltyModal } from "./offline-penalty-modal";

const getUiUserType = (type?: string) => {
  if (!type) return "일반";
  if (type.startsWith("general")) return "일반";
  if (type === "at_risk") return "위험군";
  if (type.startsWith("diabetic")) return "당뇨";
  return "일반";
};

interface Recommendation {
  id: string;
  title: string;
  reason: string;
  source: string;
  confidence: number;
}

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

  const energy = 80;
  const stability = 65;
  const moodValue =
    character?.mood === "happy"
      ? 100
      : character?.mood === "sad"
        ? 30
        : character?.mood === "sick"
          ? 10
          : 70;

  useEffect(() => {
    const interval = setInterval(() => {
      const walkingMission = missions.find((m) => m.category === "walking");
      if (walkingMission && !walkingMission.completed) {
        const newSteps =
          walkingMission.current + Math.floor(Math.random() * 50);
        if (newSteps >= walkingMission.target) {
          completeMission(walkingMission.id);
        } else {
          updateMissionProgress(walkingMission.id, newSteps);
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [missions, updateMissionProgress, completeMission]);

  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const completedMissions = missions.filter((m) => m.completed).length;
  const totalMissions = missions.length > 0 ? missions.length : 1;
  const missionProgress = (completedMissions / totalMissions) * 100;

  // ✨ 미션 찾기 로직 강화: 이름이 달라도 카테고리로 무조건 찾아오게 수정
  const walkingMission = missions.find((m) => m.category === "walking");
  const waterMission = missions.find((m) => m.category === "water");
  const dietMission = missions.find((m) => m.category === "diet");

  const handleWaterAdd = () => {
    if (!waterMission || waterMission.completed) return;
    const newCurrent = waterMission.current + 1;
    if (newCurrent >= waterMission.target) {
      completeMission(waterMission.id);
    } else {
      updateMissionProgress(waterMission.id, newCurrent);
    }
  };

  const hasEnoughData = true;
  const aiRecommendations: Recommendation[] = [
    {
      id: "rec-1",
      title: "점심 시간 15분 걷기로 전환해보세요.",
      reason: "화/수 저녁 미션 실패가 반복되어 시간대를 변경했습니다.",
      source: "대한당뇨병학회 가이드 p.52",
      confidence: 85,
    },
    {
      id: "rec-2",
      title: "저녁 국물 요리를 줄이고 샐러드로 대체해보세요.",
      reason: "최근 나트륨 섭취가 권장량을 초과합니다.",
      source: "고혈압학회 진료지침 p.42",
      confidence: 88,
    },
  ];

  return (
    // ✨ 부모 컨테이너에 flex flex-col 추가 (하단 영역 확장을 위해)
    <div className="min-h-screen bg-[#F0F4F8] relative flex flex-col">
      {/* -------------------------------------------
          1. 캐릭터 풀사이즈 배경 영역
      -------------------------------------------- */}
      <div className="relative w-full h-[45vh] min-h-[450px] shrink-0 bg-gradient-to-b from-blue-100 via-sky-50 to-[#F0F4F8] flex flex-col items-center justify-start pt-16 pb-8 overflow-hidden">
        {/* 좌측 스탯 영역 */}
        <div className="absolute left-4 top-4 z-20 bg-white/50 backdrop-blur-md p-3 rounded-2xl shadow-sm border border-white/60 flex flex-col gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-[11px] font-bold text-foreground/80">
              <Battery className="w-3.5 h-3.5 text-green-600" /> 에너지
            </div>
            <Progress
              value={energy}
              className="h-1.5 w-20 [&>div]:bg-green-500 bg-white/50"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-[11px] font-bold text-foreground/80">
              <Smile className="w-3.5 h-3.5 text-yellow-600" /> 기분
            </div>
            <Progress
              value={moodValue}
              className="h-1.5 w-20 [&>div]:bg-yellow-500 bg-white/50"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-[11px] font-bold text-foreground/80">
              <Shield className="w-3.5 h-3.5 text-blue-600" /> 안정감
            </div>
            <Progress
              value={stability}
              className="h-1.5 w-20 [&>div]:bg-blue-500 bg-white/50"
            />
          </div>
        </div>

        {/* 우측 상단 마이페이지 및 포인트 영역 */}
        <div className="absolute right-4 top-4 flex flex-col items-end gap-2 z-20">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setScreen("mypage")}
            className="bg-white/40 backdrop-blur-md shadow-sm rounded-full hover:bg-white/60"
          >
            <User className="w-5 h-5 text-foreground" />
          </Button>
          <div className="px-3 py-1.5 flex items-center gap-1.5 bg-white/50 backdrop-blur-md rounded-xl shadow-sm border border-white/60">
            <Coins className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-bold text-amber-600">
              {userProfile?.points || 0}P
            </span>
          </div>
        </div>

        {/* 캐릭터 위치 (GIF) */}
        <div className="relative z-10 flex flex-col items-center mt-10">
          <div className="w-48 h-48 flex items-center justify-center mb-2 animate-bounce">
            <img
              src="/created-gif.gif"
              alt="메인 캐릭터"
              className="w-full h-full object-contain drop-shadow-xl"
              style={{ imageRendering: "pixelated" }}
            />
          </div>
          <div className="text-center bg-white/70 backdrop-blur-md px-5 py-2 rounded-full shadow-sm border border-white/50 mb-5">
            <span className="text-primary text-xs font-black mr-1.5">
              Lv.{character?.level || 1}
            </span>
            <span className="font-bold text-foreground">
              {character?.name || "알"}
            </span>
          </div>
        </div>
      </div>

      {/* -------------------------------------------
          2. 하단 둥근 모서리 컨테이너
      -------------------------------------------- */}
      {/* ✨ flex-1 속성을 주어 화면 끝까지 채우고, pb-32로 네비게이션 바와 겹치지 않게 처리 */}
      <div className="relative z-30 w-full bg-[#FFFBF5] rounded-t-[40px] px-5 pt-8 pb-32 -mt-16 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] flex flex-col gap-8 flex-1">
        {/* ✨ 오늘의 추천 (Today's Recommendation) */}
        {hasEnoughData && aiRecommendations.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-[16px] font-black text-foreground flex items-center gap-1.5">
                <Sparkles className="w-[18px] h-[18px] text-emerald-500" />{" "}
                오늘의 추천
              </h3>
              <span className="text-[10px] font-bold bg-indigo-100 text-indigo-600 px-2 py-1 rounded-md">
                AI 분석
              </span>
            </div>

            <div className="space-y-3">
              {aiRecommendations.map((rec, idx) => {
                const isFirst = idx === 0;
                const cardClass = isFirst
                  ? "bg-[#FFD6D6]/60 border-transparent text-[#5C2B2B]"
                  : "bg-[#D6EFD0]/70 border-transparent text-[#264D29]";

                return (
                  <Card
                    key={rec.id}
                    className={cn(
                      "rounded-[24px] shadow-none border-none",
                      cardClass,
                    )}
                  >
                    <CardContent className="p-5">
                      <div className="space-y-2.5">
                        <h4 className="font-bold text-[14px] leading-snug">
                          {rec.title}
                        </h4>
                        <p className="text-xs opacity-80 leading-relaxed">
                          {rec.reason}
                        </p>
                        <div className="pt-2 flex items-center gap-1 text-[10px] opacity-70 border-t border-black/5 mt-2">
                          <BookOpen className="w-3 h-3" />
                          {rec.source}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* ✨ 오늘의 미션 */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-[16px] font-black text-foreground flex items-center gap-1.5">
              <Target className="w-[18px] h-[18px] text-emerald-500" /> 오늘의
              미션
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setScreen("missions")}
              className="text-emerald-600 text-xs font-bold p-0 hover:bg-transparent"
            >
              전체보기 <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Button>
          </div>

          <Card className="border-border/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-[32px] bg-white overflow-hidden">
            <CardContent className="p-5 py-6">
              {/* 상단 통합 달성률 */}
              <div className="mb-8">
                <div className="flex justify-between text-[13px] font-bold text-foreground mb-2 px-1">
                  <span>
                    {completedMissions}/{totalMissions} 완료
                  </span>
                  <span className="text-emerald-500">
                    {Math.round(missionProgress)}%
                  </span>
                </div>
                {/* 메인 프로그레스 바: 에메랄드 색상 */}
                <Progress
                  value={missionProgress}
                  className="h-2.5 bg-muted [&>div]:bg-emerald-500"
                />
              </div>

              {/* 미션 리스트 */}
              <div className="space-y-6">
                {/* 1. 만보 걷기 */}
                {walkingMission && (
                  <div className="flex items-center gap-4">
                    <div className="w-[42px] h-[42px] bg-emerald-50 rounded-full flex items-center justify-center shrink-0">
                      <Footprints className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex justify-between items-end mb-1.5">
                        <h4 className="text-[14px] font-bold text-foreground">
                          만보 걷기
                        </h4>
                        <span className="text-xs font-bold text-muted-foreground">
                          {walkingMission.current.toLocaleString()} /{" "}
                          {walkingMission.target.toLocaleString()}
                        </span>
                      </div>
                      <Progress
                        value={
                          (walkingMission.current / walkingMission.target) * 100
                        }
                        className="h-1.5 bg-muted [&>div]:bg-emerald-500"
                      />
                    </div>
                    <div className="shrink-0 w-14" />{" "}
                    {/* 버튼 없는 자리 맞춤 */}
                  </div>
                )}

                {/* 2. 물 마시기 */}
                {waterMission && (
                  <div className="flex items-center gap-4">
                    <div className="w-[42px] h-[42px] bg-blue-50 rounded-full flex items-center justify-center shrink-0">
                      <Droplets className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex justify-between items-end mb-1.5">
                        <h4 className="text-[14px] font-bold text-foreground">
                          물 마시기
                        </h4>
                        <span className="text-xs font-bold text-muted-foreground">
                          {waterMission.current} / {waterMission.target}잔
                        </span>
                      </div>
                      <Progress
                        value={
                          (waterMission.current / waterMission.target) * 100
                        }
                        className="h-1.5 bg-muted [&>div]:bg-blue-500"
                      />
                    </div>
                    {!waterMission.completed ? (
                      <div className="shrink-0 w-14 flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-0 w-[50px] text-[11px] font-bold rounded-2xl border-border bg-muted/30 text-foreground"
                          onClick={handleWaterAdd}
                        >
                          +1잔
                        </Button>
                      </div>
                    ) : (
                      <div className="shrink-0 w-14" />
                    )}
                  </div>
                )}

                {/* ✨ 3. 식단 기록 (다시 추가됨!) */}
                {dietMission && (
                  <div className="flex items-center gap-4">
                    <div className="w-[42px] h-[42px] bg-orange-50 rounded-full flex items-center justify-center shrink-0">
                      <Apple className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex justify-between items-end mb-1.5">
                        <h4 className="text-[14px] font-bold text-foreground">
                          식단 기록
                        </h4>
                        <span className="text-xs font-bold text-muted-foreground">
                          {dietMission.current} / {dietMission.target}끼
                        </span>
                      </div>
                      <Progress
                        value={(dietMission.current / dietMission.target) * 100}
                        className="h-1.5 bg-muted [&>div]:bg-orange-500"
                      />
                    </div>
                    {!dietMission.completed ? (
                      <div className="shrink-0 w-14 flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-0 w-[50px] text-[11px] font-bold rounded-2xl border-border bg-muted/30 text-foreground"
                          onClick={() => setScreen("diet")}
                        >
                          기록
                        </Button>
                      </div>
                    ) : (
                      <div className="shrink-0 w-14" />
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      <BottomNav />

      {/* 모달 영역 유지 */}
      <OfflinePenaltyModal
        open={showPenaltyModal}
        onClose={() => setShowPenaltyModal(false)}
      />

      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogTitle className="sr-only">주간 건강 리포트 알림</DialogTitle>
          <div className="flex flex-col items-center py-6 space-y-4 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">
              주간 건강 리포트 도착! 💌
            </h2>
            <p className="text-sm text-muted-foreground">
              이번 주 건강 점수와 AI가 분석한
              <br />
              맞춤 피드백이 준비되었어요.
            </p>
            <div className="flex gap-3 w-full pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowReportModal(false)}
              >
                나중에 보기
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setShowReportModal(false);
                  setScreen("report");
                }}
              >
                확인하러 가기
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
