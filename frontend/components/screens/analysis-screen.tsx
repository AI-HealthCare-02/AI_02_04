import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import {
  Activity,
  Brain,
  Heart,
  Zap,
  AlertTriangle,
  Target,
  CheckCircle2,
  Dumbbell,
  Sparkles,
} from "lucide-react";
import type { BackendUserType } from "@/lib/types";
import { cn } from "@/lib/utils";

const analysisSteps = [
  {
    icon: Heart,
    text: "기초 건강 데이터 분석 중...",
    duration: 1500,
    color: "#C0305A",
    bg: "#FFB8CA",
  },
  {
    icon: Brain,
    text: "AI 대사 질환 위험도 평가 중...",
    duration: 1500,
    color: "#2878B0",
    bg: "#D6EEFF",
  },
  {
    icon: Activity,
    text: "신체 밸런스 측정 중...",
    duration: 1500,
    color: "#3E8C28",
    bg: "#E8F9D6",
  },
  {
    icon: Zap,
    text: "맞춤형 관리 플랜 생성 중...",
    duration: 1000,
    color: "#8C7010",
    bg: "#FFF383",
  },
];

const goalOptions = [
  {
    type: "general_diet" as BackendUserType,
    icon: Target,
    iconBg: "#FFB8CA",
    iconColor: "#C0305A",
    activeBorder: "#FFB8CA",
    activeBg: "#FFF5F8",
    label: "체중 감량 및 다이어트",
    desc: "건강한 식단과 유산소 중심 미션",
  },
  {
    type: "general_health" as BackendUserType,
    icon: Activity,
    iconBg: "#D6EEFF",
    iconColor: "#2878B0",
    activeBorder: "#AEE1F9",
    activeBg: "#F5FBFF",
    label: "체력 증진 및 건강 개선",
    desc: "일상 활동량과 수면 질 향상 미션",
  },
  {
    type: "general_fitness" as BackendUserType,
    icon: Dumbbell,
    iconBg: "#E8F9D6",
    iconColor: "#3E8C28",
    activeBorder: "#CBF891",
    activeBg: "#F5FFF0",
    label: "근력 증진 및 몸만들기",
    desc: "근력 운동과 단백질 섭취 중심 미션",
  },
];

export function AnalysisScreen() {
  const { setScreen, userProfile, setUserProfile } = useAppStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<BackendUserType | null>(
    null,
  );

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

    const stepTimeouts = analysisSteps.map((_, index) =>
      setTimeout(() => setCurrentStep(index), stepDurations[index].start),
    );

    const finishTimeout = setTimeout(() => {
      if (userProfile) {
        if (
          userProfile.diabetesStatus === "1" ||
          userProfile.diabetesStatus === "2"
        ) {
          setIsRiskGroup(true);
          setRiskLevel("High");
        } else {
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
      setScreen("permissions");
    }
  };

  /* ── 로딩 화면 ── */
  if (!showResult) {
    const step = analysisSteps[currentStep];
    const StepIcon = step.icon;
    return (
      <div className="min-h-screen bg-[#F9FFEF] flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-10">
          {/* 타이틀 */}
          <div className="text-center space-y-1.5">
            <p className="text-[12px] font-bold text-[#87D57B] uppercase tracking-[0.18em]">
              AI ANALYSIS
            </p>
            <h2 className="text-[26px] font-black text-[#2A2A2A] tracking-[-0.02em]">
              AI 건강 진단
            </h2>
            <p className="text-[14px] font-medium text-[#7A7A7A]">
              {userProfile?.name}님의 데이터를 분석하고 있어요
            </p>
          </div>

          {/* 현재 단계 아이콘 */}
          <div className="flex justify-center">
            <div className="relative">
              <div
                className="absolute inset-0 rounded-full blur-2xl scale-150 opacity-50 transition-colors duration-500"
                style={{ backgroundColor: step.bg }}
              />
              <div
                className="relative size-24 rounded-3xl flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-colors duration-500"
                style={{ backgroundColor: step.bg }}
              >
                <StepIcon
                  className="size-11 animate-pulse transition-colors duration-500"
                  style={{ color: step.color }}
                />
              </div>
            </div>
          </div>

          {/* 단계 리스트 */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            {analysisSteps.map((s, idx) => {
              const SIcon = s.icon;
              const isDone = idx < currentStep;
              const isActive = idx === currentStep;
              return (
                <div key={idx}>
                  {idx > 0 && <div className="h-px bg-[#F5F5F5] mx-5" />}
                  <div
                    className={cn(
                      "flex items-center gap-3.5 px-5 py-3.5 transition-colors duration-300",
                      isActive && "bg-[#F9FFEF]",
                    )}
                  >
                    <div
                      className="size-9 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300"
                      style={{
                        backgroundColor: isDone || isActive ? s.bg : "#F5F5F5",
                      }}
                    >
                      {isDone ? (
                        <CheckCircle2
                          className="size-4.5"
                          style={{ color: s.color }}
                        />
                      ) : (
                        <SIcon
                          className={cn(
                            "size-4.5 transition-colors duration-300",
                            isActive && "animate-pulse",
                          )}
                          style={{
                            color: isDone || isActive ? s.color : "#C8C8C8",
                          }}
                        />
                      )}
                    </div>
                    <p
                      className={cn(
                        "text-[14px] font-semibold transition-colors duration-300",
                        isActive
                          ? "text-[#2A2A2A]"
                          : isDone
                            ? "text-[#9B9B9B]"
                            : "text-[#C8C8C8]",
                      )}
                    >
                      {s.text}
                    </p>
                    {isDone && (
                      <span className="ml-auto text-[11px] font-bold text-[#3E8C28] bg-[#E8F9D6] px-2 py-0.5 rounded-full">
                        완료
                      </span>
                    )}
                    {isActive && (
                      <span className="ml-auto text-[11px] font-bold text-[#8C7010] bg-[#FFF383] px-2 py-0.5 rounded-full animate-pulse">
                        진행 중
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 프로그레스 바 */}
          <div className="space-y-2">
            <div className="h-2 bg-[#E8E8E8] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#87D57B] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-[12px] font-medium text-[#9B9B9B]">
              <span>분석 진행률</span>
              <span className="font-bold text-[#3E8C28]">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── 결과 화면 - 위험군 ── */
  if (isRiskGroup) {
    const riskConfig = {
      High: {
        label: "고위험",
        bg: "#FFE8EE",
        color: "#FA7070",
        barColor: "#FF8787",
        barWidth: "w-full",
      },
      Mid: {
        label: "중위험",
        bg: "#fff2f8",
        color: "#FF9F9F",
        barColor: "#fbadad",
        barWidth: "w-2/3",
      },
      Low: {
        label: "저위험",
        bg: "#FAF7F0",
        color: "#DBA39A",
        barColor: "#DBA39A",
        barWidth: "w-1/3",
      },
    }[riskLevel];

    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col px-5 py-12">
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-5">
          {/* 헤더 */}
          <div className="text-center space-y-3">
            <div
              className="size-18 rounded-2xl flex items-center justify-center mx-auto shadow-[0_2px_10px_rgba(0,0,0,0.06)]"
              style={{ backgroundColor: riskConfig.bg }}
            >
              <AlertTriangle
                className="size-9"
                style={{ color: riskConfig.color }}
              />
            </div>
            <h2 className="text-[24px] font-black text-[#2A2A2A] tracking-[-0.02em]">
              건강 관리가 필요해요!
            </h2>
            <p className="text-[14px] font-medium text-[#7A7A7A]">
              AI 분석 결과, 맞춤형 집중 관리가 필요합니다.
            </p>
          </div>

          {/* 위험도 카드 */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 space-y-4">
            <p className="text-[12px] font-bold text-[#6A6A6A] uppercase tracking-[0.05em]">
              AI 건강 위험도 평가
            </p>
            <div className="flex items-end justify-between">
              <div>
                <p
                  className="text-[42px] font-black leading-none tracking-[-0.02em]"
                  style={{ color: riskConfig.color }}
                >
                  {riskLevel}
                </p>
                <p
                  className="text-[14px] font-bold mt-1"
                  style={{ color: riskConfig.color }}
                >
                  {riskConfig.label}
                </p>
              </div>
              {bmi > 0 && (
                <div className="text-right">
                  <p className="text-[12px] font-medium text-[#9B9B9B]">
                    측정 BMI
                  </p>
                  <p className="text-[22px] font-black text-[#2A2A2A] leading-tight">
                    {bmi.toFixed(1)}
                    <span className="text-[12px] font-medium ms-0.5 text-[#9B9B9B]">
                      kg/m²
                    </span>
                  </p>
                </div>
              )}
            </div>
            {/* 위험도 바 */}
            <div className="h-2 bg-[#F0F0F0] rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  riskConfig.barWidth,
                )}
                style={{ backgroundColor: riskConfig.barColor }}
              />
            </div>
            <div className="h-px bg-[#F5F5F5]" />
            <p className="text-[13px] font-medium text-[#7A7A7A] text-center leading-relaxed">
              지금부터 꾸준한 습관을 만들면
              <br />
              충분히 건강을 회복할 수 있어요!
            </p>
          </div>

          {/* CTA 버튼 */}
          <button
            onClick={() =>
              handleProceed(
                userProfile?.diabetesStatus === "1"
                  ? "diabetic_1"
                  : userProfile?.diabetesStatus === "2"
                    ? "diabetic_2"
                    : "at_risk",
              )
            }
            className="w-full h-14 rounded-2xl text-[16px] font-bold text-white transition-colors"
            style={{ backgroundColor: riskConfig.color }}
          >
            {userProfile?.diabetesStatus === "1"
              ? "제1형 당뇨 관리 시작하기"
              : userProfile?.diabetesStatus === "2"
                ? "제2형 당뇨 관리 시작하기"
                : "위험군 건강 관리 시작하기"}
          </button>
        </div>
      </div>
    );
  }

  /* ── 결과 화면 - 건강군 ── */
  return (
    <div className="min-h-screen bg-[#F9FFEF] flex flex-col px-5 py-12">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-5">
        {/* 헤더 */}
        <div className="text-center space-y-3">
          <div className="size-18 rounded-2xl bg-[#E8F9D6] flex items-center justify-center mx-auto shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
            <CheckCircle2 className="size-9 text-[#3E8C28]" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 bg-[#E8F9D6] px-3 py-1.5 rounded-full mb-2">
              <Sparkles className="size-3.5 text-[#3E8C28]" />
              <span className="text-[12px] font-bold text-[#3E8C28]">
                건강한 상태!
              </span>
            </div>
            <h2 className="text-[24px] font-black text-[#2A2A2A] tracking-[-0.02em]">
              건강한 상태입니다!
            </h2>
            <p className="text-[14px] font-medium text-[#7A7A7A] mt-1">
              현재 상태를 유지하기 위해 목표를 선택해주세요
            </p>
          </div>
        </div>

        {/* 목표 선택 카드들 */}
        <div>
          <p className="text-[12px] font-bold text-[#6A6A6A] uppercase tracking-[0.05em] mb-3 px-1">
            건강 목표 선택
          </p>
          <div className="space-y-2.5">
            {goalOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selectedGoal === opt.type;
              return (
                <button
                  key={opt.type}
                  onClick={() => setSelectedGoal(opt.type)}
                  className={cn(
                    "w-full bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-4 py-4 flex items-center gap-4 text-left transition-all duration-200",
                    isSelected
                      ? "border-2 ring-0"
                      : "border-2 border-transparent hover:border-[#E8E8E8]",
                  )}
                  style={
                    isSelected
                      ? {
                          borderColor: opt.activeBorder,
                          backgroundColor: opt.activeBg,
                        }
                      : {}
                  }
                >
                  <div
                    className="size-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors"
                    style={{ backgroundColor: opt.iconBg }}
                  >
                    <Icon className="size-6" style={{ color: opt.iconColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold text-[#2A2A2A]">
                      {opt.label}
                    </p>
                    <p className="text-[12px] font-medium text-[#9B9B9B] mt-0.5">
                      {opt.desc}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                      isSelected ? "border-transparent" : "border-[#D8D8D8]",
                    )}
                    style={isSelected ? { backgroundColor: opt.iconColor } : {}}
                  >
                    {isSelected && (
                      <div className="size-2 rounded-full bg-white" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 시작 버튼 */}
        <button
          onClick={() => selectedGoal && handleProceed(selectedGoal)}
          disabled={!selectedGoal}
          className="w-full h-14 rounded-2xl bg-[#87D57B] hover:bg-[#6DC462] disabled:opacity-40 disabled:cursor-not-allowed text-[16px] font-bold text-white transition-colors"
        >
          {selectedGoal
            ? `${goalOptions.find((o) => o.type === selectedGoal)?.label} 시작하기`
            : "목표를 선택해주세요"}
        </button>
      </div>
    </div>
  );
}
