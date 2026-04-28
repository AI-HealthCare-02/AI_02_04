"use client";

import { useAppStore } from "@/lib/store";
import type { CharacterMood, CharacterLevel } from "@/lib/types";
import {
  CHARACTER_IMAGES,
  HAPPY_BUBBLE,
  MOOD_ANIMATIONS,
} from "@/lib/character-images";
import { cn } from "@/lib/utils";

interface CharacterProps {
  mood?: CharacterMood;
  level?: CharacterLevel;
  size?: "sm" | "md" | "lg" | "xl";
  showPlatform?: boolean;
  animated?: boolean;
  className?: string;
}

const sizeClasses: Record<string, string> = {
  sm: "w-12 h-12",
  md: "w-20 h-20",
  lg: "w-28 h-28",
  xl: "w-40 h-40",
};

export function Character({
  mood: propMood,
  level: propLevel,
  size = "lg",
  showPlatform = true,
  animated = true,
  className,
}: CharacterProps) {
  const { character } = useAppStore();

  const mood = propMood ?? character?.mood ?? "normal";
  const level = propLevel ?? character?.level ?? 1;

  const src = CHARACTER_IMAGES[level];
  const animationClass = animated ? MOOD_ANIMATIONS[mood] : "";

  return (
    <div className={cn("relative flex flex-col items-center", className)}>
      {/* happy 말풍선 — 캐릭터 위 우측 */}
      {mood === "happy" && (
        <img
          src={HAPPY_BUBBLE}
          alt="happy bubble"
          className="w-20 h-20 object-contain animate-bounce-gentle pointer-events-none"
          style={{ imageRendering: "pixelated" }}
        />
      )}

      {/* 레벨 5 스파클 */}
      {level === 5 && (
        <>
          <div
            className="absolute -top-2 -left-2 w-2 h-2 bg-yellow-300 rounded-full animate-sparkle"
            style={{ animationDelay: "0s" }}
          />
          <div
            className="absolute -top-3 right-1  w-1.5 h-1.5 bg-yellow-300 rounded-full animate-sparkle"
            style={{ animationDelay: "0.3s" }}
          />
          <div
            className="absolute top-0  -right-3 w-2 h-2 bg-yellow-300 rounded-full animate-sparkle"
            style={{ animationDelay: "0.6s" }}
          />
        </>
      )}

      <img
        src={src}
        alt={`캐릭터 Lv.${level}`}
        className={cn(
          sizeClasses[size],
          "object-contain transition-all duration-500",
          animationClass,
        )}
        style={{
          imageRendering: "pixelated",
          mixBlendMode: "multiply",
        }}
      />

      {showPlatform && (
        <div className="mt-1 w-3/4 h-2 bg-foreground/10 rounded-full blur-sm" />
      )}
    </div>
  );
}

export function CharacterEgg({
  size = "lg",
  animated = true,
  className,
}: {
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center",
        sizeClasses[size],
        className,
      )}
    >
      <div className={cn("relative", animated && "animate-bounce-gentle")}>
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
