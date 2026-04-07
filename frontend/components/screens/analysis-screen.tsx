
import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  Brain,
  Heart,
  Zap,
  AlertTriangle,
  Target,
  CheckCircle2,
  Dumbbell,
} from "lucide-react";
import type { BackendUserType } from "@/lib/types";
import { cn } from "@/lib/utils";

const analysisSteps = [
  { icon: Heart, text: "기초 건강 데이터 분석 중...", duration: 1500 },
  { icon: Brain, text: "AI 대사 질환 위험도 평가 중...", duration: 1500 },
  { icon: Activity, text: "신체 밸런스 측정 중...", duration: 1500 },
  { icon: Zap, text: "맞춤형 관리 플랜 생성 중...", duration: 1000 },
];

export function AnalysisScreen() {
  const { setScreen, userProfile, setUserProfile } = useAppStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showResult, setShowResult] = useState(false);

  // 결과 데이터
  const [isRiskGroup, setIsRiskGroup] = useState(false);
  const [riskLevel, setRiskLevel] = useState<"Low" | "Mid" | "High">("Low");
  const [bmi, setBmi] = useState(0);

  useEffect(() => {
    let totalDuration = 0;
    const stepDurations = analysisSteps.map((step) => {
      const start = totalDuration;
      totalDuration += step.duration;
      return { start, end: totalDuration };
    });

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 1;
        if (next >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return next;
      });
    }, totalDuration / 100);

    const stepTimeouts = analysisSteps.map((_, index) => {
      return setTimeout(() => {
        setCurrentStep(index);
      }, stepDurations[index].start);
    });

    const finishTimeout = setTimeout(() => {
      if (userProfile) {
        // ✨ 1. 사용자가 직접 입력한 당뇨 상태 확인 (최우선순위)
        if (
          userProfile.diabetesStatus === "1" ||
          userProfile.diabetesStatus === "2"
        ) {
          setIsRiskGroup(true);
          setRiskLevel("High"); // 당뇨 환자는 무조건 위험군(High)으로 UI 표시
        } else {
          // ✨ 2. 당뇨가 아닐 때만 기존 BMI/나이 로직 실행
          const calculatedBmi =
            userProfile.weight / (userProfile.height / 100) ** 2;
          setBmi(calculatedBmi);

          const isRiskAge = userProfile.age >= 45;
          const risk = calculatedBmi >= 25 || isRiskAge;

          setIsRiskGroup(risk);

          if (risk) {
            if (calculatedBmi >= 30) setRiskLevel("High");
            else if (calculatedBmi >= 27) setRiskLevel("Mid");
            else setRiskLevel("Low");
          }
        }
      }
      setShowResult(true);
    }, totalDuration + 500);

    return () => {
      clearInterval(progressInterval);
      stepTimeouts.forEach(clearTimeout);
      clearTimeout(finishTimeout);
    };
  }, [userProfile]);

  const handleProceed = (type: BackendUserType) => {
    if (userProfile) {
      setUserProfile({ ...userProfile, healthType: type });
      // 분석이 끝난 후 권한 설정(permissions) 또는 홈 화면으로 이동
      // 정보 수정을 통해 다시 온 경우를 대비해 바로 홈으로 보내는 것도 가능하지만,
      // 일단 기존 흐름대로 유지합니다. (온보딩이 끝났다면 permissions에서 자동으로 홈으로 갈 것입니다)
      setScreen("permissions");
    }
  };

  if (!showResult) {
    const CurrentIcon = analysisSteps[currentStep].icon;
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-background flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8 animate-in fade-in duration-500">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-foreground">AI 건강 진단</h2>
            <p className="text-muted-foreground">
              {userProfile?.name}님의 데이터를 분석하고 있어요
            </p>
          </div>

          <div className="relative h-48 flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl" />
            <div className="relative flex flex-col items-center gap-4 animate-in zoom-in duration-300">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                <CurrentIcon className="w-10 h-10 text-primary animate-pulse" />
              </div>
              <span className="text-lg font-medium text-foreground">
                {analysisSteps[currentStep].text}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>진행률</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-background flex flex-col p-6 animate-in fade-in zoom-in duration-500">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-8">
        {isRiskGroup ? (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-orange-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                건강 관리가 필요해요!
              </h2>
              <p className="text-muted-foreground">
                AI 분석 결과, 맞춤형 집중 관리가 필요합니다.
              </p>
            </div>

            <Card className="border-orange-500/30 bg-orange-500/5">
              <CardContent className="p-6 text-center space-y-4">
                <div className="text-sm text-muted-foreground">
                  AI 건강 위험도 평가
                </div>
                <div
                  className={cn(
                    "text-4xl font-bold",
                    riskLevel === "High"
                      ? "text-red-500"
                      : riskLevel === "Mid"
                        ? "text-orange-500"
                        : "text-amber-500",
                  )}
                >
                  {riskLevel}
                </div>
                <p className="text-sm text-muted-foreground pt-2 border-t border-border">
                  지금부터 꾸준한 습관을 만들면
                  <br />
                  충분히 건강을 회복할 수 있어요!
                </p>
              </CardContent>
            </Card>

            {/* ✨ 3. 당뇨 타입에 따른 버튼 분기 처리 */}
            {userProfile?.diabetesStatus === "1" ? (
              <Button
                onClick={() => handleProceed("diabetic_1")}
                className="w-full h-14 text-lg"
              >
                제1형 당뇨 관리 시작하기
              </Button>
            ) : userProfile?.diabetesStatus === "2" ? (
              <Button
                onClick={() => handleProceed("diabetic_2")}
                className="w-full h-14 text-lg"
              >
                제2형 당뇨 관리 시작하기
              </Button>
            ) : (
              <Button
                onClick={() => handleProceed("at_risk")}
                className="w-full h-14 text-lg"
              >
                위험군 건강 관리 시작하기
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                건강한 상태입니다!
              </h2>
              <p className="text-muted-foreground">
                현재 상태를 유지하기 위해 어떤 목표를 원하시나요?
              </p>
            </div>

            <div className="grid gap-3 pt-4">
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-1 border-primary/20 hover:bg-primary/5 hover:border-primary"
                onClick={() => handleProceed("general_diet")}
              >
                <Target className="w-6 h-6 text-primary" />
                <span className="font-semibold text-foreground">
                  체중 감량 및 다이어트
                </span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-1 border-primary/20 hover:bg-primary/5 hover:border-primary"
                onClick={() => handleProceed("general_health")}
              >
                <Activity className="w-6 h-6 text-primary" />
                <span className="font-semibold text-foreground">
                  체력 증진 및 건강 개선
                </span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-1 border-primary/20 hover:bg-primary/5 hover:border-primary"
                onClick={() => handleProceed("general_fitness")}
              >
                <Dumbbell className="w-6 h-6 text-primary" />
                <span className="font-semibold text-foreground">
                  근력 증진 및 몸만들기
                </span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
