'use client';

import { useAppStore } from '@/lib/store';
import type { CharacterMood, CharacterLevel } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CharacterProps {
  mood?: CharacterMood;
  level?: CharacterLevel;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showPlatform?: boolean;
  animated?: boolean;
  className?: string;
}

const moodColors = {
  happy: 'from-amber-300 to-orange-400',
  normal: 'from-teal-300 to-cyan-400',
  sad: 'from-slate-400 to-blue-400',
  sick: 'from-pink-300 to-purple-400'
};

const moodFaces = {
  happy: { eyes: '◠', mouth: '◡' },
  normal: { eyes: '•', mouth: '‿' },
  sad: { eyes: '•', mouth: '︵' },
  sick: { eyes: 'x', mouth: '﹏' }
};

const levelSizes = {
  1: { body: 'w-16 h-16', scale: 'scale-75' },
  2: { body: 'w-20 h-20', scale: 'scale-85' },
  3: { body: 'w-24 h-24', scale: 'scale-95' },
  4: { body: 'w-28 h-28', scale: 'scale-100' },
  5: { body: 'w-32 h-32', scale: 'scale-110' }
};

const sizeClasses = {
  sm: 'scale-50',
  md: 'scale-75',
  lg: 'scale-100',
  xl: 'scale-125'
};

export function Character({ 
  mood: propMood, 
  level: propLevel, 
  size = 'lg',
  showPlatform = true,
  animated = true,
  className 
}: CharacterProps) {
  const { character } = useAppStore();
  
  const mood = propMood || character?.mood || 'normal';
  const level = propLevel || character?.level || 1;
  
  const face = moodFaces[mood];
  const levelSize = levelSizes[level];
  
  const animationClass = animated 
    ? mood === 'happy' 
      ? 'animate-bounce-gentle' 
      : mood === 'sad' || mood === 'sick'
        ? 'animate-shake'
        : 'animate-float'
    : '';

  return (
    <div className={cn('relative flex flex-col items-center', sizeClasses[size], className)}>
      {/* Character body */}
      <div className={cn(
        'relative',
        animationClass
      )}>
        {/* Glow effect for happy mood */}
        {mood === 'happy' && (
          <div className="absolute inset-0 rounded-full bg-yellow-300/30 blur-xl animate-pulse-ring" />
        )}
        
        {/* Main body */}
        <div className={cn(
          'relative rounded-full bg-gradient-to-br shadow-lg',
          moodColors[mood],
          levelSize.body,
          'flex items-center justify-center transition-all duration-500'
        )}>
          {/* Inner highlight */}
          <div className="absolute top-2 left-3 w-1/4 h-1/4 rounded-full bg-white/40" />
          
          {/* Face */}
          <div className="flex flex-col items-center gap-1">
            {/* Eyes */}
            <div className="flex gap-3 text-lg font-bold text-foreground/80">
              <span className={cn(mood === 'happy' && 'transform -rotate-6')}>
                {face.eyes}
              </span>
              <span className={cn(mood === 'happy' && 'transform rotate-6')}>
                {face.eyes}
              </span>
            </div>
            
            {/* Blush for happy */}
            {mood === 'happy' && (
              <div className="absolute top-1/2 flex w-full justify-between px-1">
                <div className="w-3 h-2 rounded-full bg-pink-300/60" />
                <div className="w-3 h-2 rounded-full bg-pink-300/60" />
              </div>
            )}
            
            {/* Mouth */}
            <span className={cn(
              'text-xl font-bold text-foreground/80',
              mood === 'sad' && 'transform rotate-180'
            )}>
              {face.mouth}
            </span>
          </div>
          
          {/* Sweat drop for sick */}
          {mood === 'sick' && (
            <div className="absolute -top-1 -right-1 w-3 h-4 bg-blue-400 rounded-full opacity-70" />
          )}
          
          {/* Sparkles for level 5 */}
          {level === 5 && (
            <>
              <div className="absolute -top-2 -left-2 w-2 h-2 bg-yellow-300 rounded-full animate-sparkle" style={{ animationDelay: '0s' }} />
              <div className="absolute -top-3 right-0 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-sparkle" style={{ animationDelay: '0.3s' }} />
              <div className="absolute top-0 -right-3 w-2 h-2 bg-yellow-300 rounded-full animate-sparkle" style={{ animationDelay: '0.6s' }} />
            </>
          )}
        </div>
        
        {/* Little feet */}
        <div className="flex justify-center gap-4 -mt-1">
          <div className={cn(
            'w-4 h-3 rounded-b-full bg-gradient-to-br',
            moodColors[mood]
          )} />
          <div className={cn(
            'w-4 h-3 rounded-b-full bg-gradient-to-br',
            moodColors[mood]
          )} />
        </div>
      </div>
      
      {/* Platform/Shadow */}
      {showPlatform && (
        <div className="mt-2 w-20 h-3 bg-foreground/10 rounded-full blur-sm" />
      )}
    </div>
  );
}

export function CharacterEgg({ 
  size = 'lg',
  animated = true,
  className 
}: { 
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('relative flex flex-col items-center', sizeClasses[size], className)}>
      <div className={cn(
        'relative',
        animated && 'animate-bounce-gentle'
      )}>
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
        
        {/* Egg shape */}
        <div className="relative w-24 h-32 bg-gradient-to-br from-primary/80 to-primary rounded-[50%] shadow-lg flex items-center justify-center">
          {/* Highlight */}
          <div className="absolute top-4 left-4 w-6 h-8 rounded-full bg-white/30" />
          
          {/* Crack pattern */}
          <svg className="absolute w-full h-full" viewBox="0 0 100 130">
            <path 
              d="M30,65 L40,55 L35,70 L50,60 L45,75 L55,68 L50,80 L60,72 L55,85" 
              stroke="white" 
              strokeWidth="2" 
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.5"
            />
          </svg>
          
          {/* Question mark */}
          <span className="text-3xl text-white/80">?</span>
        </div>
      </div>
      
      {/* Shadow */}
      <div className="mt-2 w-16 h-3 bg-foreground/10 rounded-full blur-sm" />
    </div>
  );
}
