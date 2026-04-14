export type CharacterMood = "happy" | "normal" | "sad" | "sick";
export type CharacterLevel = 1 | 2 | 3 | 4 | 5;

export type BackendUserType =
  | "general_diet"
  | "general_health"
  | "general_fitness"
  | "at_risk"
  | "diabetic_1"
  | "diabetic_2"
  | "pending";

export interface Character {
  id: string;
  name: string;
  level: CharacterLevel;
  mood: CharacterMood;
  experience: number;
  experienceToNextLevel: number;
  createdAt: Date;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  age: number;
  gender: "male" | "female";
  height: number;
  weight: number;

  highBp: boolean;
  highCholesterol: boolean;
  heartDisease: boolean;
  walkingDifficulty: boolean;
  generalHealth: number;
  sickDays: "0-10" | "11-20" | "21-30";
  heavyDrinking: boolean;

  physicalActivity: "0-10" | "11-20" | "21-30";
  dailyFruit: boolean;
  dailyVeggie: boolean;
  smoking: boolean;
  diabetesStatus: "1" | "2" | "none";

  healthGoal: string;
  healthType: BackendUserType;
  points: number;
  streak: number;
  lastActiveDate: Date;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  type: "auto" | "manual";
  category:
    | "walking"
    | "exercise"
    | "water"
    | "medicine"
    | "diet"
    | "sleep"
    | "health_record";
  inputType?: "none" | "text" | "number";
  target: number;
  current: number;
  points: number;
  completed: boolean;
  icon: string;
}

export interface DietEntry {
  id: string;
  imageUrl?: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  feedback: string;
  timestamp: Date;
  /** ML API 응답 필드 — 분석 시에만 존재 */
  food_name?: string;
  health_notes?: string[];
  healthier_alternative?: { name: string; reason: string } | null;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: "background" | "accessory" | "special";
  price: number;
  imageUrl: string;
  owned: boolean;
  equipped: boolean;
}

export interface GraduatedCharacter {
  id: string;
  name: string;
  level: CharacterLevel;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  finalStats: {
    totalSteps: number;
    totalMissions: number;
    totalPoints: number;
  };
}

export type AppScreen =
  | "splash"
  | "login"
  | "onboarding"
  | "health-info"
  | "analysis"
  | "permissions"
  | "character-birth"
  | "home"
  | "missions"
  | "diet"
  | "shop"
  | "collection"
  | "report"
  | "report-list"
  | "daily-log"
  | "data-sync"
  | "notification-settings"
  | "mypage"
  | "edit-health-info"
  | "password-reset";
