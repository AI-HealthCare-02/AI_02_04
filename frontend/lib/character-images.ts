import type { CharacterLevel, CharacterMood } from "@/lib/types";

/** 레벨별 이미지 경로 */
export const CHARACTER_IMAGES: Record<CharacterLevel, string> = {
  1: "/character-lv1.png",
  2: "/character-lv2.png",
  3: "/character-lv3.png",
  4: "/character-lv4.png",
  5: "/character-lv5.png",
};

/** happy 말풍선 이미지 */
export const HAPPY_BUBBLE = "/bubble-happy.png";

/** 알 이미지 총 개수 */
const EGG_COUNT = 2;

/** 랜덤 알 이미지 경로 반환 */
export function getRandomEggSrc(): string {
  const n = Math.floor(Math.random() * EGG_COUNT) + 1;
  return `/img-egg-${n}.png`;
}

/** 기분별 애니메이션 클래스 */
export const MOOD_ANIMATIONS: Record<CharacterMood, string> = {
  happy:  "animate-bounce-gentle",
  normal: "animate-float",
  sad:    "animate-shake",
  sick:   "animate-shake",
};
