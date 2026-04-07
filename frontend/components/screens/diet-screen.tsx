import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BottomNav } from "@/components/ui/navigation-menu";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Camera,
  ArrowLeft,
  Upload,
  Scan,
  Utensils,
  Flame,
  Wheat,
  Beef,
  Droplet,
  Lightbulb,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DietEntry } from "@/lib/types";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";
type AnalysisState = "idle" | "uploading" | "analyzing" | "complete";

const mealTypeLabels: Record<MealType, string> = {
  breakfast: "아침",
  lunch: "점심",
  dinner: "저녁",
  snack: "간식",
};

export function DietScreen() {
  const {
    userProfile,
    setScreen,
    dietEntries,
    addDietEntry,
    removeDietEntry,
    completeMission,
    updateMissionProgress,
    missions,
  } = useAppStore();

  const { toast } = useToast();

  const [viewMode, setViewMode] = useState<"main" | "detail">("main");

  const [selectedMeal, setSelectedMeal] = useState<MealType>("lunch");
  const [analysisState, setAnalysisState] = useState<AnalysisState>("idle");
  const [analysisResult, setAnalysisResult] = useState<DietEntry | null>(null);

  const [showManualModal, setShowManualModal] = useState(false);
  const [manualFoodName, setManualFoodName] = useState("");

  const [selectedEntry, setSelectedEntry] = useState<DietEntry | null>(null);

  const todayEntries = dietEntries.filter(
    (e) => new Date(e.timestamp).toDateString() === new Date().toDateString(),
  );

  const totalCalories = todayEntries.reduce((sum, e) => sum + e.calories, 0);
  const totalCarbs = todayEntries.reduce((sum, e) => sum + e.carbs, 0);
  const totalProtein = todayEntries.reduce((sum, e) => sum + e.protein, 0);
  const totalFat = todayEntries.reduce((sum, e) => sum + e.fat, 0);

  // 일일 권장 칼로리 계산 (기본값 2000)
  let dailyCalories = 2000;
  if (
    userProfile &&
    userProfile.height &&
    userProfile.weight &&
    userProfile.age
  ) {
    // Mifflin-St Jeor 기초대사량 공식 적용
    let bmr =
      10 * userProfile.weight + 6.25 * userProfile.height - 5 * userProfile.age;
    bmr += userProfile.gender === "male" ? 5 : -161;

    // 활동량에 따른 가중치
    let activityMultiplier = 1.2;
    if (userProfile.physicalActivity === "11-20") activityMultiplier = 1.375;
    if (userProfile.physicalActivity === "21-30") activityMultiplier = 1.55;

    dailyCalories = Math.round(bmr * activityMultiplier);
  }

  const dailyGoal = {
    calories: dailyCalories,
    carbs: Math.round((dailyCalories * 0.5) / 4), // 탄수화물 50%
    protein: Math.round((dailyCalories * 0.3) / 4), // 단백질 30%
    fat: Math.round((dailyCalories * 0.2) / 9), // 지방 20%
  };

  const handleUpload = () => {
    setAnalysisState("uploading");
    setTimeout(() => {
      setAnalysisState("analyzing");
      setTimeout(() => {
        const mockResult: DietEntry = {
          id: crypto.randomUUID(),
          mealType: selectedMeal,
          calories: 420,
          carbs: 25,
          protein: 31,
          fat: 7,
          feedback:
            "단백질과 탄수화물이 다소 부족합니다. 다음 식사에서 조금 더 섭취해 주세요!",
          timestamp: new Date(),
        };
        setAnalysisResult(mockResult);
        setAnalysisState("complete");
      }, 2000);
    }, 1000);
  };

  const handleManualSubmit = () => {
    if (!manualFoodName.trim()) return;
    setShowManualModal(false);
    setAnalysisState("analyzing");

    setTimeout(() => {
      const mockResult: DietEntry = {
        id: crypto.randomUUID(),
        mealType: selectedMeal,
        calories: 350,
        carbs: 45,
        protein: 20,
        fat: 10,
        feedback: `'${manualFoodName}'을(를) 드셨군요! 건강하게 잘 챙겨 드셨습니다.`,
        timestamp: new Date(),
      };
      setAnalysisResult(mockResult);
      setAnalysisState("complete");
      setManualFoodName("");
    }, 1500);
  };

  // AI 분석 결과값을 바탕으로 미션 달성 여부를 체크하는 함수
  const checkDietMissions = (analysisData: {
    calories: number;
    carbs: number;
    protein: number;
  }) => {
    const newlyAchieved: string[] = [];

    missions.forEach((mission) => {
      if (mission.completed) return;

      // 1. 단순 횟수 카운트 미션 ('기록', '분석', '조절' 등이 들어간 다회성 식단 미션)
      const isCountingMission =
        mission.category === "diet" &&
        mission.type === "auto" &&
        (mission.title.includes("기록") ||
          mission.title.includes("분석") ||
          mission.title.includes("조절"));

      if (isCountingMission) {
        const newCurrent = mission.current + 1;
        if (newCurrent >= mission.target) {
          completeMission(mission.id); // 목표 달성 시 확실하게 완료 및 포인트 지급!
          newlyAchieved.push(mission.title);
        } else {
          updateMissionProgress(mission.id, newCurrent); // 아직 부족하면 카운트만 +1
        }
      }
      // 2. 단일 조건 달성 미션 (저칼로리)
      else if (
        mission.title.includes("저칼로리") &&
        analysisData.calories <= 500
      ) {
        completeMission(mission.id);
        newlyAchieved.push(mission.title);
      }
      // 3. 단일 조건 달성 미션 (저탄수화물)
      else if (
        mission.title.includes("저탄수화물") &&
        analysisData.carbs <= 50
      ) {
        completeMission(mission.id);
        newlyAchieved.push(mission.title);
      }
      // 4. 단백질 조건이 포함된 다회성 미션 (예: 단백질 식단 2회)
      else if (mission.title.includes("단백질") && analysisData.protein >= 30) {
        const newCurrent = mission.current + 1;
        if (newCurrent >= mission.target) {
          completeMission(mission.id);
          newlyAchieved.push(mission.title);
        } else {
          updateMissionProgress(mission.id, newCurrent);
        }
      }
    });

    if (newlyAchieved.length > 0) {
      toast({
        title: "🎉 식단 미션 자동 달성!",
        description: newlyAchieved.map((m) => `• ${m}`).join("\n"),
        variant: "default",
      });
    }
  };

  const handleSaveEntry = () => {
    if (analysisResult) {
      addDietEntry(analysisResult);
      checkDietMissions({
        calories: analysisResult.calories,
        carbs: analysisResult.carbs,
        protein: analysisResult.protein,
      });

      toast({
        title: "저장 완료",
        description: "식단이 성공적으로 기록되었습니다.",
      });

      setAnalysisResult(null);
      setAnalysisState("idle");
    }
  };

  const handleDeleteEntry = (id: string) => {
    removeDietEntry(id);
    setViewMode("main");
    setSelectedEntry(null);
    toast({
      title: "삭제 완료",
      description: "식단 기록이 삭제되었습니다.",
      variant: "destructive",
    });
  };

  const openDetailView = (entry: DietEntry) => {
    setSelectedEntry(entry);
    setViewMode("detail");
  };

  // ==========================================
  // ✨ 영양소 프로그레스 바 컴포넌트 (Top4 영역 제거)
  // ==========================================
  const NutrientBar = ({
    label,
    amount,
    minTarget,
    maxTarget,
    colorClass,
  }: {
    label: string;
    amount: number;
    minTarget: number;
    maxTarget: number;
    colorClass: string;
  }) => {
    const isLacking = amount < minTarget;
    const isExcess = amount > maxTarget;
    const status = isLacking ? "부족" : isExcess ? "과다" : "적정";
    const statusBg =
      isLacking || isExcess
        ? "bg-red-50 text-red-500"
        : "bg-primary/10 text-primary";

    const maxValue = Math.max(maxTarget * 1.5, amount * 1.2, 1);
    const fillPercent = Math.min((amount / maxValue) * 100, 100);
    const targetLeft = (minTarget / maxValue) * 100;
    const targetWidth = ((maxTarget - minTarget) / maxValue) * 100;

    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-bold text-lg text-foreground flex items-center gap-1">
            {label} {amount}g
            <span className="w-4 h-4 rounded-full border border-muted-foreground/30 text-muted-foreground/60 text-[10px] flex items-center justify-center font-normal ml-1">
              i
            </span>
          </h4>
          <span
            className={cn("text-xs px-2.5 py-1 rounded-md font-bold", statusBg)}
          >
            {status}
          </span>
        </div>

        <div className="relative h-4 bg-muted/50 rounded-full mb-1">
          <div
            className="absolute h-full border-x border-dashed border-muted-foreground/40 bg-muted-foreground/10 z-10"
            style={{ left: `${targetLeft}%`, width: `${targetWidth}%` }}
          />
          <div
            className={cn(
              "absolute h-full rounded-full transition-all z-20",
              colorClass,
            )}
            style={{ width: `${fillPercent}%` }}
          />
        </div>

        <div className="relative h-4 text-xs font-medium text-muted-foreground">
          <span
            className="absolute -translate-x-1/2"
            style={{ left: `${targetLeft}%` }}
          >
            {minTarget}
          </span>
          <span
            className="absolute -translate-x-1/2"
            style={{ left: `${targetLeft + targetWidth}%` }}
          >
            {maxTarget}
          </span>
        </div>
      </div>
    );
  };

  // ==========================================
  // ✨ [상세 화면] 렌더링
  // ==========================================
  if (viewMode === "detail" && selectedEntry) {
    const score = 68; // (추후 AI 채점 결과 연동)

    // ✨ 해당 끼니당 권장량 (하루 권장량의 1/3)
    // 약간의 여유 범위를 주어 Min은 85%, Max는 115%로 설정
    const mealCarbs = dailyGoal.carbs / 3;
    const targetCarbsMin = Math.round(mealCarbs * 0.85);
    const targetCarbsMax = Math.round(mealCarbs * 1.15);

    const mealProtein = dailyGoal.protein / 3;
    const targetProteinMin = Math.round(mealProtein * 0.85);
    const targetProteinMax = Math.round(mealProtein * 1.15);

    const mealFat = dailyGoal.fat / 3;
    const targetFatMin = Math.round(mealFat * 0.85);
    const targetFatMax = Math.round(mealFat * 1.15);

    // ✨ 원형 프로그레스 계산식
    const radius = 56;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
      <div className="min-h-screen bg-background pb-32 animate-in slide-in-from-right-4 duration-300 flex flex-col relative">
        {/* 헤더 (삭제 버튼 제거) */}
        <div className="p-4 flex items-center gap-4 sticky top-0 bg-background/90 backdrop-blur-md z-10 border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode("main")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold">
            {mealTypeLabels[selectedEntry.mealType]} 식단 분석
          </h1>
        </div>

        {/* 상단: 점수 요약 영역 (원형 프로그레스 적용) */}
        <div className="p-8 flex flex-col items-center justify-center border-b">
          <div className="relative w-32 h-32 mb-4 flex items-center justify-center">
            {/* 배경 원 */}
            <svg className="w-full h-full transform -rotate-90 absolute">
              <circle
                cx="64"
                cy="64"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-primary/10"
              />
              {/* 채워지는 원 */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-primary transition-all duration-1000 ease-out"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            {/* 점수 텍스트 */}
            <span className="text-4xl font-black text-primary relative z-10">
              {score}
              <span className="text-lg">점</span>
            </span>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-1">
            영양소가 조금 부족해요!
          </h2>
          <p className="text-sm text-muted-foreground text-center px-4">
            {selectedEntry.feedback}
          </p>
        </div>

        {/* 하단: 영양소 상세 프로그레스 영역 (AI 수치 연동됨) */}
        <div className="p-6 space-y-4 flex-1">
          <NutrientBar
            label="탄수화물"
            amount={selectedEntry.carbs}
            minTarget={targetCarbsMin}
            maxTarget={targetCarbsMax}
            colorClass="bg-pink-400"
          />
          <NutrientBar
            label="단백질"
            amount={selectedEntry.protein}
            minTarget={targetProteinMin}
            maxTarget={targetProteinMax}
            colorClass="bg-pink-400"
          />
          <NutrientBar
            label="지방"
            amount={selectedEntry.fat}
            minTarget={targetFatMin}
            maxTarget={targetFatMax}
            colorClass="bg-pink-400"
          />
        </div>

        {/* ✨ 하단 50:50 고정 버튼 영역 */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t flex gap-3 z-50">
          <Button
            variant="outline"
            className="flex-1 h-14 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200 text-lg font-bold"
            onClick={() => handleDeleteEntry(selectedEntry.id)}
          >
            삭제
          </Button>
          <Button
            className="flex-1 h-14 text-lg font-bold"
            onClick={() => setViewMode("main")}
          >
            확인
          </Button>
        </div>
      </div>
    );
  }

  // ==========================================
  // [메인 화면] 렌더링
  // ==========================================
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-background pb-24">
      {/* (중략 - 기존 메인 화면 코드 동일 유지) */}
      <div className="p-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setScreen("home")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">식단 분석</h1>
          <p className="text-sm text-muted-foreground">
            AI가 영양성분을 분석해드려요
          </p>
        </div>
      </div>

      <div className="px-4 mb-6">
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold text-foreground">오늘의 영양 섭취</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-sm">칼로리</span>
                </div>
                <span className="text-sm font-medium">
                  {totalCalories} / {dailyGoal.calories} kcal
                </span>
              </div>
              <Progress
                value={(totalCalories / dailyGoal.calories) * 100}
                className="h-2"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-amber-500/10 rounded-xl">
                <Wheat className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-amber-600">
                  {totalCarbs}g
                </div>
                <div className="text-xs text-muted-foreground">탄수화물</div>
              </div>
              <div className="text-center p-3 bg-red-500/10 rounded-xl">
                <Beef className="w-5 h-5 text-red-500 mx-auto mb-1" />
                <div className="text-lg font-bold text-red-500">
                  {totalProtein}g
                </div>
                <div className="text-xs text-muted-foreground">단백질</div>
              </div>
              <div className="text-center p-3 bg-blue-500/10 rounded-xl">
                <Droplet className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <div className="text-lg font-bold text-blue-500">
                  {totalFat}g
                </div>
                <div className="text-xs text-muted-foreground">지방</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="px-4 mb-4">
        <div className="flex gap-2">
          {(Object.keys(mealTypeLabels) as MealType[]).map((meal) => (
            <button
              key={meal}
              onClick={() => setSelectedMeal(meal)}
              className={cn(
                "flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all",
                selectedMeal === meal
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {mealTypeLabels[meal]}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mb-6">
        {analysisState === "idle" && (
          <Card className="border-dashed border-2">
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">
                    {mealTypeLabels[selectedMeal]} 사진 업로드
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    음식 사진을 촬영하거나 앨범에서 선택하세요
                  </p>
                </div>
                <div className="flex gap-3 w-full">
                  <Button onClick={handleUpload} className="flex-1">
                    <Camera className="w-4 h-4 mr-2" /> 촬영하기
                  </Button>
                  <Button
                    onClick={handleUpload}
                    variant="outline"
                    className="flex-1"
                  >
                    <Upload className="w-4 h-4 mr-2" /> 앨범에서
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {(analysisState === "uploading" || analysisState === "analyzing") && (
          <Card>
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Scan className="w-8 h-8 text-primary animate-pulse" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">
                    {analysisState === "uploading"
                      ? "업로드 중..."
                      : "AI 분석 중..."}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {analysisState === "uploading"
                      ? "사진을 업로드하고 있어요"
                      : "음식 종류와 영양성분을 분석하고 있어요"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {analysisState === "complete" && analysisResult && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">분석 결과</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setAnalysisState("idle");
                    setAnalysisResult(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
                <Utensils className="w-12 h-12 text-muted-foreground" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-orange-500/10 rounded-xl">
                  <div className="text-xl font-bold text-orange-500">
                    {analysisResult.calories}
                  </div>
                  <div className="text-xs text-muted-foreground">kcal</div>
                </div>
                <div className="text-center p-3 bg-amber-500/10 rounded-xl">
                  <div className="text-xl font-bold text-amber-600">
                    {analysisResult.carbs}g
                  </div>
                  <div className="text-xs text-muted-foreground">탄수화물</div>
                </div>
                <div className="text-center p-3 bg-red-500/10 rounded-xl">
                  <div className="text-xl font-bold text-red-500">
                    {analysisResult.protein}g
                  </div>
                  <div className="text-xs text-muted-foreground">단백질</div>
                </div>
                <div className="text-center p-3 bg-blue-500/10 rounded-xl">
                  <div className="text-xl font-bold text-blue-500">
                    {analysisResult.fat}g
                  </div>
                  <div className="text-xs text-muted-foreground">지방</div>
                </div>
              </div>

              <div className="flex gap-2 w-full pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setAnalysisState("idle");
                    setAnalysisResult(null);
                  }}
                >
                  다시 분석하기
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowManualModal(true)}
                >
                  직접 입력
                </Button>
              </div>

              <Button onClick={handleSaveEntry} className="w-full">
                저장하기
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {todayEntries.length > 0 && (
        <div className="px-4">
          <h3 className="font-semibold text-foreground mb-3">오늘의 식단</h3>
          <div className="space-y-2">
            {todayEntries.map((entry) => (
              <Card
                key={entry.id}
                className="cursor-pointer hover:border-primary/50 transition-colors shadow-sm"
                onClick={() => openDetailView(entry)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Utensils className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          {mealTypeLabels[entry.mealType]}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {entry.calories} kcal
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <BottomNav />

      <Dialog open={showManualModal} onOpenChange={setShowManualModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>음식 직접 입력</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              사진 분석이 부정확한가요? 드신 음식을 직접 적어주시면 AI가
              영양소를 계산해 드립니다.
            </p>
            <Input
              placeholder="예: 닭가슴살 샐러드 1인분"
              value={manualFoodName}
              onChange={(e) => setManualFoodName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
            />
            <Button className="w-full" onClick={handleManualSubmit}>
              AI 분석하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
