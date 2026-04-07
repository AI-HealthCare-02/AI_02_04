'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Character, CharacterEgg } from '@/components/character';
import { Heart, Target, Utensils, Trophy, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const slides = [
  {
    icon: Heart,
    title: '건강한 습관을 만들어요',
    description: '매일 조금씩 건강한 습관을 쌓아가면\n당신의 삶이 변화합니다',
    character: 'egg'
  },
  {
    icon: Target,
    title: '미션을 완수하세요',
    description: '걸음 수, 물 마시기, 식단 기록 등\n다양한 미션을 수행해보세요',
    character: 'normal'
  },
  {
    icon: Utensils,
    title: 'AI 식단 분석',
    description: '사진 한 장으로 영양소를 분석하고\n맞춤 식단을 추천받으세요',
    character: 'happy'
  },
  {
    icon: Trophy,
    title: '캐릭터를 성장시키세요',
    description: '미션을 완수할수록 캐릭터가 성장하고\n별나라로 졸업시켜 보세요',
    character: 'happy'
  }
];

export function OnboardingScreen() {
  const { setScreen } = useAppStore();
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      setScreen('health-info');
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
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-background flex flex-col">
      {/* Skip button */}
      <div className="p-4 flex justify-end">
        <Button 
          variant="ghost" 
          onClick={() => setScreen('health-info')}
          className="text-muted-foreground"
        >
          건너뛰기
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        {/* Character or Icon */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl" />
          {slide.character === 'egg' ? (
            <CharacterEgg size="xl" />
          ) : (
            <Character 
              mood={slide.character as 'normal' | 'happy'} 
              level={currentSlide === 3 ? 5 : (currentSlide + 1) as 1 | 2 | 3 | 4 | 5}
              size="xl" 
            />
          )}
        </div>

        {/* Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <Icon className="w-8 h-8 text-primary" />
        </div>

        {/* Text */}
        <div className="text-center space-y-4 max-w-xs">
          <h2 className="text-2xl font-bold text-foreground">
            {slide.title}
          </h2>
          <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
            {slide.description}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-6 space-y-4">
        {/* Dots */}
        <div className="flex justify-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-300',
                index === currentSlide 
                  ? 'w-8 bg-primary' 
                  : 'bg-primary/30'
              )}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          {currentSlide > 0 && (
            <Button 
              variant="outline" 
              onClick={handlePrev}
              className="flex-1"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              이전
            </Button>
          )}
          <Button 
            onClick={handleNext}
            className={cn(
              'flex-1',
              currentSlide === 0 && 'w-full'
            )}
          >
            {currentSlide === slides.length - 1 ? '시작하기' : '다음'}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
