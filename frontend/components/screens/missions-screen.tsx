import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Zap,
  Target,
  Droplets,
  Footprints,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/components/ui/navigation-menu";
import type { Mission } from "@/lib/types";

export function MissionsScreen() {
  const { setScreen, missions, completeMission, updateMissionProgress } =
    useAppStore();

  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [inputValue, setInputValue] = useState("");

  // ✨ 혈당 측정 시점을 저장할 상태 (기본값: 식전)
  const [sugarTag, setSugarTag] = useState<"premeal" | "postmeal" | "sleep">(
    "premeal",
  );

  const completedCount = missions.filter((m) => m.completed).length;
  const progressPercent =
    missions.length > 0 ? (completedCount / missions.length) * 100 : 0;

  const handleMissionClick = (mission: Mission) => {
    if (mission.completed) return;

    if (mission.id === "c1" || mission.id === "c2") return;

    if (mission.type === "auto") {
      if (
        confirm(
          `'${mission.title}' 미션은 건강 데이터 및 식단 분석과 자동으로 연동됩니다.\n(테스트: 강제로 완료하시겠습니까?)`,
        )
      ) {
        completeMission(mission.id);
      }
      return;
    }

    if (mission.inputType && mission.inputType !== "none") {
      setSelectedMission(mission);
      setInputValue("");
    } else {
      completeMission(mission.id);
    }
  };

  const handleModalSubmit = () => {
    if (!selectedMission) return;
    if (!inputValue.trim()) {
      alert("기록할 값을 입력해 주세요.");
      return;
    }

    // 💡 나중에 백엔드 API를 연동할 때, 아래처럼 sugarTag를 함께 전송할 수 있습니다.
    // if (selectedMission.title.includes('혈당')) {
    //   api.post('/health/glucose', { value: inputValue, type: sugarTag });
    // }

    completeMission(selectedMission.id, inputValue);
    setSelectedMission(null);
    setInputValue("");
  };

  const handleWaterAdd = (mission: Mission) => {
    if (mission.completed) return;
    const newCurrent = mission.current + 1;
    if (newCurrent >= mission.target) {
      completeMission(mission.id);
    } else {
      updateMissionProgress(mission.id, newCurrent);
    }
  };

  const handleStepSync = (mission: Mission) => {
    if (mission.completed) return;
    const newCurrent = Math.min(mission.current + 2500, mission.target);
    if (newCurrent >= mission.target) {
      completeMission(mission.id);
    } else {
      updateMissionProgress(mission.id, newCurrent);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-background pb-24">
      {/* <div className="p-4 pt-10 pb-6 bg-background/80 backdrop-blur-md sticky top-0 z-10 border-b border-border/50">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Target className="w-6 h-6 text-primary" />
          오늘의 미션
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          건강한 하루를 위해 미션을 달성해 보세요!
        </p>
      </div> */}

      <div className="p-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setScreen("home")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">오늘의 미션</h1>
          <p className="text-sm text-muted-foreground">
            건강한 하루를 위해 미션을 달성해 보세요!
          </p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-foreground">달성률</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {completedCount} / {missions.length}개 완료
                </p>
              </div>
              <div className="text-2xl font-black text-primary">
                {Math.round(progressPercent)}%
              </div>
            </div>
            <Progress value={progressPercent} className="h-2.5" />
          </CardContent>
        </Card>

        <div className="space-y-4">
          {missions.map((mission) => {
            // 🔥 [특수 UI] 만보 걷기 & 물 마시기
            if (mission.id === "c1" || mission.id === "c2") {
              const isWater = mission.id === "c2";
              return (
                <Card
                  key={mission.id}
                  className={cn(
                    "overflow-hidden transition-all border-border/50 shadow-sm",
                    mission.completed ? "bg-muted/30 opacity-75" : "bg-card",
                  )}
                >
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="shrink-0">
                          {mission.completed ? (
                            <CheckCircle2 className="w-7 h-7 text-success" />
                          ) : (
                            <span className="text-2xl">{mission.icon}</span>
                          )}
                        </div>
                        <div>
                          <h3
                            className={cn(
                              "font-bold text-foreground",
                              mission.completed &&
                                "line-through text-muted-foreground",
                            )}
                          >
                            {mission.title}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {mission.description}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-amber-500 flex items-center gap-0.5 bg-amber-500/10 px-2 py-0.5 rounded-md">
                        <Zap className="w-3 h-3" /> {mission.points}P
                      </span>
                    </div>

                    <div className="space-y-1.5 bg-muted/30 p-3 rounded-xl">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-muted-foreground">진행률</span>
                        <span
                          className={isWater ? "text-blue-500" : "text-primary"}
                        >
                          {mission.current.toLocaleString()} /{" "}
                          {mission.target.toLocaleString()}{" "}
                          {isWater ? "잔" : "걸음"}
                        </span>
                      </div>
                      <Progress
                        value={(mission.current / mission.target) * 100}
                        className={cn(
                          "h-2.5",
                          isWater ? "[&>div]:bg-blue-500" : "",
                        )}
                      />
                    </div>

                    {!mission.completed && (
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full h-12 shadow-sm",
                          isWater
                            ? "text-blue-600 border-blue-200 hover:bg-blue-50"
                            : "text-primary border-primary/30 hover:bg-primary/5",
                        )}
                        onClick={() =>
                          isWater
                            ? handleWaterAdd(mission)
                            : handleStepSync(mission)
                        }
                      >
                        {isWater ? (
                          <>
                            <Droplets className="w-4 h-4 mr-2" /> 1잔 마시기
                          </>
                        ) : (
                          <>
                            <Footprints className="w-4 h-4 mr-2" /> 헬스 데이터
                            연동 (테스트 +2500)
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            }

            // 🎯 [일반 UI] 그 외의 체크형 / 입력형 미션 렌더링
            return (
              <Card
                key={mission.id}
                className={cn(
                  "overflow-hidden transition-all cursor-pointer border-border/50 shadow-sm hover:border-primary/50",
                  mission.completed ? "bg-muted/30 opacity-75" : "bg-card",
                )}
                onClick={() => handleMissionClick(mission)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="shrink-0">
                    {mission.completed ? (
                      <CheckCircle2 className="w-7 h-7 text-success" />
                    ) : (
                      <Circle className="w-7 h-7 text-muted-foreground/30" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{mission.icon}</span>
                      <h3
                        className={cn(
                          "font-bold text-foreground truncate",
                          mission.completed &&
                            "line-through text-muted-foreground",
                        )}
                      >
                        {mission.title}
                      </h3>
                      {!mission.completed && mission.target > 1 && (
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
                          {mission.current} / {mission.target}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {mission.description}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs font-bold text-amber-500 flex items-center gap-0.5 bg-amber-500/10 px-2 py-0.5 rounded-md">
                      <Zap className="w-3 h-3" /> {mission.points}P
                    </span>
                    {!mission.completed &&
                      mission.inputType &&
                      mission.inputType !== "none" && (
                        <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-md mt-1">
                          기록 필요
                        </span>
                      )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 혈당 값 입력 모달 */}
      <Dialog
        open={!!selectedMission}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedMission(null);
            setInputValue("");
          }
        }}
      >
        <DialogContent className="sm:max-w-sm rounded-3xl p-6">
          <DialogTitle className="text-xl font-bold text-center">
            {selectedMission?.title}
          </DialogTitle>

          <div className="space-y-6 pt-2">
            <div className="text-center space-y-1">
              <span className="text-4xl">{selectedMission?.icon}</span>
              <p className="text-sm text-muted-foreground pt-2">
                {selectedMission?.description}
              </p>
            </div>

            {/* ✨ '식전/식후 혈당 기록' 미션일 경우에만 버튼 2개가 나타남! */}
            {selectedMission?.title.includes("식전/식후") && (
              <div className="space-y-2 bg-primary/5 p-3 rounded-xl border border-primary/10">
                <Label className="text-xs font-bold text-primary">
                  측정 시점 선택
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={sugarTag === "premeal" ? "default" : "outline"}
                    className="h-10 text-xs"
                    onClick={() => setSugarTag("premeal")}
                  >
                    식사 전
                  </Button>
                  <Button
                    variant={sugarTag === "postmeal" ? "default" : "outline"}
                    className="h-10 text-xs"
                    onClick={() => setSugarTag("postmeal")}
                  >
                    식사 후
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label
                htmlFor="mission-input"
                className="text-xs text-muted-foreground"
              >
                {selectedMission?.inputType === "number"
                  ? "수치를 입력해 주세요 (숫자)"
                  : "상태를 기록해 주세요 (텍스트)"}
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
                  className="h-14 text-lg font-bold pr-12"
                  autoFocus
                />
                {/* 혈당 단위 표시 */}
                {selectedMission?.title.includes("혈당") && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                    mg/dL
                  </span>
                )}
                {/* 체중 단위 표시 (추가 디테일) */}
                {selectedMission?.title.includes("체중") && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                    kg
                  </span>
                )}
              </div>
            </div>

            <Button
              className="w-full h-14 text-lg rounded-xl shadow-md"
              onClick={handleModalSubmit}
            >
              기록하고 완료하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
