'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Character, CharacterEgg } from '@/components/character';
import { Sparkles, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

type BirthStage = 'egg' | 'hatching' | 'born' | 'named';

export function CharacterBirthScreen() {
  const { setScreen, setCharacter, userProfile } = useAppStore();
  const [stage, setStage] = useState<BirthStage>('egg');
  const [characterName, setCharacterName] = useState('');
  const [showSparkles, setShowSparkles] = useState(false);

  const handleTapEgg = () => {
    if (stage === 'egg') {
      setStage('hatching');
      
      // Simulate hatching animation
      setTimeout(() => {
        setShowSparkles(true);
        setTimeout(() => {
          setStage('born');
        }, 500);
      }, 1500);
    }
  };

  const handleNameSubmit = () => {
    if (!characterName.trim()) return;
    
    setCharacter({
      id: crypto.randomUUID(),
      name: characterName,
      level: 1,
      mood: 'happy',
      experience: 0,
      experienceToNextLevel: 200,
      createdAt: new Date()
    });
    
    setStage('named');
    
    setTimeout(() => {
      setScreen('home');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/20 via-background to-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background sparkles */}
      {showSparkles && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-sparkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 1}s`
              }}
            />
          ))}
        </div>
      )}

      <div className="w-full max-w-sm space-y-8">
        {/* Character Display */}
        <div className="flex justify-center">
          <div 
            className={cn(
              'relative cursor-pointer transition-transform',
              stage === 'egg' && 'hover:scale-105 active:scale-95'
            )}
            onClick={handleTapEgg}
          >
            {/* Glow effect */}
            <div className={cn(
              'absolute inset-0 bg-primary/30 rounded-full blur-3xl transition-opacity',
              (stage === 'hatching' || stage === 'born' || stage === 'named') && 'opacity-100 bg-yellow-300/40',
              stage === 'egg' && 'animate-pulse'
            )} />
            
            {stage === 'egg' || stage === 'hatching' ? (
              <div className={cn(
                'transition-all',
                stage === 'hatching' && 'animate-shake'
              )}>
                <CharacterEgg size="xl" animated={stage !== 'hatching'} />
              </div>
            ) : (
              <Character mood="happy" level={1} size="xl" />
            )}
          </div>
        </div>

        {/* Instructions / Name Input */}
        <div className="text-center space-y-6">
          {stage === 'egg' && (
            <>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">
                  알을 터치해보세요!
                </h1>
                <p className="text-muted-foreground">
                  당신만의 캐릭터가 태어날 거예요
                </p>
              </div>
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center animate-bounce">
                  <span className="text-2xl">👆</span>
                </div>
              </div>
            </>
          )}

          {stage === 'hatching' && (
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground animate-pulse">
                부화 중...
              </h1>
              <p className="text-muted-foreground">
                조금만 기다려주세요!
              </p>
            </div>
          )}

          {stage === 'born' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                  <h1 className="text-2xl font-bold text-foreground">
                    축하합니다!
                  </h1>
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                </div>
                <p className="text-muted-foreground">
                  캐릭터가 태어났어요! 이름을 지어주세요
                </p>
              </div>
              
              <div className="space-y-4">
                <input
                  type="text"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  placeholder="캐릭터 이름"
                  className="w-full h-14 px-4 text-center text-lg rounded-xl border border-input bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                  maxLength={10}
                />
                <Button 
                  onClick={handleNameSubmit}
                  disabled={!characterName.trim()}
                  className="w-full h-14 text-lg"
                >
                  <Heart className="w-5 h-5 mr-2 fill-current" />
                  이름 짓기
                </Button>
              </div>
            </div>
          )}

          {stage === 'named' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">
                  {characterName}
                </h1>
                <p className="text-muted-foreground">
                  {userProfile?.name}님과 함께할 준비가 됐어요!
                </p>
              </div>
              <div className="flex justify-center gap-1">
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
