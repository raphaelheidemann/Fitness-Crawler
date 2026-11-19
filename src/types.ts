export type UnitSystem = 'metric' | 'imperial';

export type RecipeCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type MealSlot =
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'snack'
  | 'meal_1'
  | 'meal_2'
  | 'meal_3'
  | 'meal_4'
  | 'meal_5'
  | 'meal_6'
  | 'meal_7'
  | 'meal_8'
  | 'meal_9'
  | 'meal_10'
  | 'on_the_spot';

export type NavSection =
  | 'overview'
  | 'gym'
  | 'diet'
  | 'recipes'
  | 'measurements'
  | 'charts'
  | 'guild';

export type CardioType = 'none' | 'walk' | 'run';

export interface CardioLog {
  activityType: CardioType;
  distance: number;
  durationMinutes: number;
  caloriesBurned: number;
  paceOrIncline: string;
  completed: boolean;
}

export interface SetLog {
  reps: number;
  load: number;
  rpe: number; // 0 = not rated
  done: boolean;
}

export interface ExerciseItem {
  id: string;
  name: string;
  sets: number;
  reps: string;
  targetLoad: number;
  actualLoad: number;
  rpe: number;
  completed: boolean;
  restSeconds?: number;
  setLog?: SetLog[]; // one entry per set; absent on legacy exercises
  muscleGroup?: string;
  imageUrl?: string;
  notes?: string;
}

export interface ExerciseCatalogItem {
  id: string;
  name: string;
  muscleGroup: string;
  secondaryMuscles: string[];
  equipment: string;
  level: string;
  category: string;
  images: string[];
  instructions: string[];
}

export type Sex = 'male' | 'female' | 'unspecified';
export type CrawlerStyle = 'masculine' | 'feminine' | 'neutral';

export interface UserProfile {
  ownerId: string;
  displayName: string;
  currentWeek: number;
  phaseName: string;
  unitSystem: UnitSystem;
  startDate: string;
  targetWeight: number;
  dailyCalorieTarget: number;
  proteinTargetG: number;
  carbsTargetG: number;
  fatTargetG: number;
  weeklyWorkoutTarget: number;
  mealsPerDay?: number;
  dailyWaterGoalMl?: number;
  sex?: Sex; // drives BMR; 'unspecified' uses the average of both formulas
  crawlerStyle?: CrawlerStyle;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface WorkoutDay {
  id: string;
  ownerId: string;
  weekNumber: number;
  dayIndex: number; // 0 = Mon .. 6 = Sun
  focus: string;
  planId?: string;
  planName?: string;
  isRestDay: boolean;
  completed: boolean;
  exercises: ExerciseItem[];
  cardio?: CardioLog;
  notes: string;
  durationSec?: number; // gym session length from Start/Finish workout
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface WorkoutPlan {
  id: string;
  ownerId: string;
  name: string;
  scheduledTime: string;
  defaultDays: number[];
  isRestDay: boolean;
  exercises: ExerciseItem[];
  cardio: CardioLog;
  notes: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface HydrationLog {
  id: string;
  ownerId: string;
  weekNumber: number;
  dayIndex: number; // 0 = Mon .. 6 = Sun
  amountMl: number;
  goalMl: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type HabitColor =
  | 'emerald'
  | 'sky'
  | 'amber'
  | 'rose'
  | 'violet'
  | 'teal'
  | 'orange'
  | 'indigo';

export const HABIT_COLOR_OPTIONS: HabitColor[] = [
  'emerald',
  'sky',
  'amber',
  'rose',
  'violet',
  'teal',
  'orange',
  'indigo',
];

export interface Habit {
  id: string;
  ownerId: string;
  title: string;
  color: HabitColor;
  weeklyGoal: number;
  sortOrder: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface HabitLog {
  id: string;
  ownerId: string;
  date: string; // YYYY-MM-DD
  completedHabitIds: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface MealLog {
  id: string;
  ownerId: string;
  weekNumber: number;
  dayIndex: number; // 0 = Mon .. 6 = Sun
  slot: MealSlot;
  title: string;
  recipeId: string;
  servings: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  consumed: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Recipe {
  id: string;
  ownerId: string;
  title: string;
  category: RecipeCategory;
  prepMinutes: number;
  servings: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  imageUrl: string;
  ingredients: string[];
  instructions: string[];
  isFavorite: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Measurement {
  id: string;
  ownerId: string;
  weekNumber: number;
  date: string;
  weight: number;
  bodyFatPct: number;
  waist: number;
  chest: number;
  hips: number;
  arms: number;
  thighs: number;
  neck: number;
  notes: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export const DAY_FULL = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export const RECIPE_CATEGORIES: { key: RecipeCategory; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snack', label: 'Snack' },
];

export function buildDailyMealSlots(mealsPerDay: number): { key: MealSlot; label: string }[] {
  const count = Math.min(10, Math.max(1, Math.round(mealsPerDay || 6)));
  const slots: { key: MealSlot; label: string }[] = [];
  for (let i = 1; i <= count; i++) {
    slots.push({ key: `meal_${i}` as MealSlot, label: `Meal ${i}` });
  }
  slots.push({ key: 'on_the_spot', label: 'On-the-Spot / Extra Food' });
  return slots;
}

export function normalizeSlotToBucket(slot: MealSlot, mealsPerDay: number): MealSlot {
  if (slot === 'breakfast') return 'meal_1';
  if (slot === 'lunch') return mealsPerDay >= 2 ? 'meal_2' : 'on_the_spot';
  if (slot === 'dinner') return mealsPerDay >= 3 ? 'meal_3' : 'on_the_spot';
  if (slot === 'snack') return mealsPerDay >= 4 ? 'meal_4' : 'on_the_spot';
  if (slot.startsWith('meal_')) {
    const n = parseInt(slot.replace('meal_', ''), 10);
    if (Number.isFinite(n) && n >= 1 && n <= mealsPerDay) return slot;
    return 'on_the_spot';
  }
  return 'on_the_spot';
}

export function getMealSlotLabel(slot: MealSlot): string {
  if (slot === 'on_the_spot') return 'On-the-Spot';
  if (slot === 'breakfast') return 'Breakfast';
  if (slot === 'lunch') return 'Lunch';
  if (slot === 'dinner') return 'Dinner';
  if (slot === 'snack') return 'Snack';
  if (slot.startsWith('meal_')) {
    return `Meal ${slot.replace('meal_', '')}`;
  }
  return slot;
}

export const SCHEMA_LIMITS = {
  ID_PATTERN: /^[a-zA-Z0-9_-]+$/,
  DATE_PATTERN: /^\d{4}-\d{2}-\d{2}$/,
  DISPLAY_NAME_MAX: 100,
  PHASE_NAME_MAX: 80,
  FOCUS_MAX: 80,
  NOTES_MAX: 500,
  TITLE_MAX: 120,
  IMAGE_URL_MAX: 500,
  RECIPE_ID_MAX: 128,
  EXERCISES_MAX: 25,
  EXERCISE_NOTES_MAX: 180,
  PLAN_NAME_MAX: 80,
  PLAN_TIME_MAX: 30,
  INGREDIENTS_MAX: 40,
  INSTRUCTIONS_MAX: 25,
  PACE_OR_INCLINE_MAX: 60,
  HABIT_TITLE_MAX: 60,
  HABITS_MAX: 20,
  GEAR_ID_MAX: 60,
  CRAWLER_NAME_MAX: 32,
  CRAWLER_CLASS_MAX: 32,
  CRAWLER_MOTTO_MAX: 80,
  GUILD_NAME_MAX: 40,
  GUILD_MOTTO_MAX: 100,
} as const;

export type GearSlot = 'weapon' | 'armor' | 'accessory' | 'aura';
export type LootBoxTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type BannerTheme = 'amber' | 'crimson' | 'emerald' | 'sky' | 'violet';

export const BANNER_THEME_OPTIONS: BannerTheme[] = [
  'amber',
  'crimson',
  'emerald',
  'sky',
  'violet',
];

export interface CrawlerState {
  id: string;
  ownerId: string;
  xp: number;
  level: number;
  weeklyClears: number;
  currentStreak: number;
  bestStreak: number;
  streakFreezes: number;
  lastActiveDate: string;
  recoveryQuestActive: boolean;
  equippedSpriteTier: 1 | 2 | 3 | 4;
  equippedWeapon: string;
  equippedArmor: string;
  equippedAccessory: string;
  equippedAura: string;
  unlockedGearIds: string[];
  unlockedAchievementIds: string[];
  pendingLootBoxes: LootBoxTier[];
  rewardedActionKeys: string[];
  clearedWeekKeys: string[];
  sfxEnabled: boolean;
  crawlerName?: string;
  crawlerClass?: string;
  crawlerMotto?: string;
  bannerTheme?: BannerTheme;
  guildId?: string;
  guildName?: string;
  isPublicProfile?: boolean;
  look?: string; // encoded appearance, see lib/crawlerLook
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PublicCrawler {
  id: string;
  ownerId: string;
  crawlerName: string;
  crawlerClass: string;
  crawlerMotto: string;
  bannerTheme: BannerTheme;
  xp: number;
  level: number;
  weeklyClears: number;
  currentStreak: number;
  bestStreak: number;
  equippedSpriteTier: 1 | 2 | 3 | 4;
  equippedWeapon: string;
  equippedArmor: string;
  equippedAccessory: string;
  equippedAura: string;
  unlockedAchievementIds: string[];
  unlockedGearCount: number;
  guildId: string;
  guildName: string;
  isPublic: boolean;
  look?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Guild {
  id: string;
  ownerId: string;
  name: string;
  motto: string;
  bannerTheme: BannerTheme;
  inviteCode: string;
  isPublic: boolean;
  memberCount: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface GuildMember {
  id: string;
  ownerId: string;
  guildId: string;
  role: 'leader' | 'member';
  crawlerName: string;
  crawlerClass: string;
  crawlerMotto: string;
  bannerTheme: BannerTheme;
  xp: number;
  level: number;
  weeklyClears: number;
  currentStreak: number;
  bestStreak: number;
  equippedSpriteTier: 1 | 2 | 3 | 4;
  equippedWeapon: string;
  equippedArmor: string;
  equippedAccessory: string;
  equippedAura: string;
  unlockedAchievementIds: string[];
  unlockedGearCount: number;
  look?: string;
  joinedAt?: unknown;
  updatedAt?: unknown;
}

export interface CrawlerRewardEvent {
  id: string;
  xpAdded: number;
  isCrit: boolean;
  reason: string;
  leveledUpTo?: number;
  newAchievements?: string[];
  newLootBox?: LootBoxTier;
}
