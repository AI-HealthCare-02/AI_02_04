"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Character, CharacterEgg } from "@/components/character";
import {
  Heart,
  Target,
  Utensils,
  Trophy,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const slides = [
  {
    icon: Heart,
    iconBg: "#FFB8CA",
    iconColor: "#C0305A",
    title: "건강한 습관을 만들어요",
    description: "매일 조금씩 건강한 습관을 쌓아가면\n당신의 삶이 변화합니다",
    character: "egg",
    glowColor: "#CBF891",
  },
  {
    icon: Target,
    iconBg: "#D6EEFF",
    iconColor: "#2878B0",
    title: "미션을 완수하세요",
    description: "걸음 수, 물 마시기, 식단 기록 등\n다양한 미션을 수행해보세요",
    character: "normal",
    glowColor: "#AEE1F9",
  },
  {
    icon: Utensils,
    iconBg: "#E8F9D6",
    iconColor: "#3E8C28",
    title: "AI 식단 분석",
    description: "사진 한 장으로 영양소를 분석하고\n맞춤 식단을 추천받으세요",
    character: "happy",
    glowColor: "#CBF891",
  },
  {
    icon: Trophy,
    iconBg: "#FFF383",
    iconColor: "#8C7010",
    title: "캐릭터를 성장시키세요",
    description:
      "미션을 완수할수록 캐릭터가 성장합니다\n다양한 캐릭터를 수집해 보세요",
    character: "happy",
    glowColor: "#FFF383",
  },
];

export function OnboardingScreen() {
  const { setScreen } = useAppStore();
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      setScreen("health-info");
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="min-h-screen bg-[#F9FFEF] flex flex-col">
      {/* 건너뛰기 버튼 */}
      <div className="flex justify-end px-5 pt-12 pb-2">
        <button
          onClick={() => setScreen("health-info")}
          className="text-[13px] font-semibold text-[#9B9B9B] hover:text-[#3C3C3C] transition-colors px-3 py-1.5"
        >
          건너뛰기
        </button>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-4 gap-8">
        {/* 캐릭터 */}
        <div className="relative">
          <div
            className="absolute inset-0 rounded-full blur-2xl scale-110 opacity-60"
            style={{ backgroundColor: slide.glowColor }}
          />
          <div className="relative">
            {slide.character === "egg" ? (
              <CharacterEgg size="xl" animated />
            ) : (
              <Character
                mood={slide.character as "normal" | "happy"}
                level={
                  currentSlide === 3
                    ? 5
                    : ((currentSlide + 1) as 1 | 2 | 3 | 4 | 5)
                }
                size="xl"
              />
            )}
          </div>
        </div>

        {/* 텍스트 */}
        <div className="text-center space-y-3 max-w-xs">
          <h2 className="text-[24px] font-black text-[#2A2A2A] tracking-[-0.02em] leading-snug">
            {slide.title}
          </h2>
          <p className="text-[14px] font-medium text-[#7A7A7A] whitespace-pre-line leading-relaxed">
            {slide.description}
          </p>
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <div className="px-6 pb-10 space-y-5">
        {/* 점 인디케이터 */}
        <div className="flex justify-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === currentSlide
                  ? "w-8 bg-[#87D57B]"
                  : "w-2 bg-[#CBF891]",
              )}
            />
          ))}
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          {currentSlide > 0 && (
            <button
              onClick={handlePrev}
              className="flex-1 h-13 rounded-2xl border-2 border-[#CBF891] bg-white flex items-center justify-center gap-1 text-[15px] font-bold text-[#3C3C3C] hover:bg-[#F9FFEF] transition-colors"
            >
              <ChevronLeft className="size-4" />
              이전
            </button>
          )}
          <button
            onClick={handleNext}
            className={cn(
              "h-13 rounded-2xl bg-[#87D57B] hover:bg-[#6DC462] flex items-center justify-center gap-1 text-[15px] font-bold text-white transition-colors",
              currentSlide === 0 ? "w-full" : "flex-1",
            )}
          >
            {currentSlide === slides.length - 1 ? "시작하기" : "다음"}
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
