import {
  BannerTheme,
  CrawlerRewardEvent,
  CrawlerState,
  GearSlot,
  Habit,
  HabitLog,
  HydrationLog,
  LootBoxTier,
  MealLog,
  UserProfile,
  WorkoutDay,
} from '../types';
import { todayIsoDate } from './sanitize';

const WORLD_ASSETS = import.meta.glob('/src/assets/world/**/*.jpg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const BASE_ASSETS = import.meta.glob('/src/assets/images/*.jpg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

function worldAsset(subpath: string, fallback: string): string {
  return WORLD_ASSETS[`/src/assets/world/${subpath}`] ?? fallback;
}

function baseAsset(filename: string): string {
  return BASE_ASSETS[`/src/assets/images/${filename}`] ?? `/src/assets/images/${filename}`;
}

export const HUNTING_GROUNDS_BG = baseAsset('hunting_grounds_forest_bg_1795014578958.jpg');
export const BOSS_MANTIS_IMG = baseAsset('boss_razor_mantis_1795014583793.jpg');
export const LOOT_CHEST_IMG = baseAsset('dungeon_loot_chest_1795014581405.jpg');

export const WORLD_BACKGROUNDS = {
  bg_1: HUNTING_GROUNDS_BG,
  bg_2: worldAsset('bg_2.jpg', HUNTING_GROUNDS_BG),
  bg_3: worldAsset('bg_3.jpg', HUNTING_GROUNDS_BG),
  bg_4: worldAsset('bg_4.jpg', HUNTING_GROUNDS_BG),
  bg_5: worldAsset('bg_5.jpg', HUNTING_GROUNDS_BG),
} as const;

export const LOOT_CHEST_IMAGES: Record<LootBoxTier, string> = {
  bronze: worldAsset('chest_bronze.jpg', LOOT_CHEST_IMG),
  silver: worldAsset('chest_silver.jpg', LOOT_CHEST_IMG),
  gold: worldAsset('chest_gold.jpg', LOOT_CHEST_IMG),
  platinum: worldAsset('chest_platinum.jpg', LOOT_CHEST_IMG),
};

export function getLootChestImg(tier?: LootBoxTier): string {
  return tier ? (LOOT_CHEST_IMAGES[tier] ?? LOOT_CHEST_IMG) : LOOT_CHEST_IMG;
}

export function getGearIconUrl(gearId: string): string | undefined {
  return WORLD_ASSETS[`/src/assets/world/gear/${gearId}.jpg`];
}

export const CRAWLER_SPRITES: Record<1 | 2 | 3 | 4, string> = {
  1: baseAsset('crawler_tier_1_novice_1795014577229.jpg'),
  2: baseAsset('crawler_tier_2_brawler_1795014578134.jpg'),
  3: baseAsset('crawler_tier_3_hunter_1795014604794.jpg'),
  4: baseAsset('crawler_tier_4_warden_1795014580315.jpg'),
};

export const CRAWLER_CLASS_PRESETS = [
  'Ironclad Vanguard',
  'Emberhand Brawler',
  'Trailstride Scout',
  'Stonewall Sentinel',
  'Hearthkeeper Cook',
  'Torchblade Hunter',
  'Runeforge Warden',
  'Dawnrunner Nomad',
  'Anvilborn Bruiser',
  'Mistwalker Ranger',
  'Obsidian Champion',
  'Wellspring Templar',
] as const;

export const BANNER_THEME_STYLES: Record<
  BannerTheme,
  { label: string; border: string; accentText: string; badgeBg: string; swatch: string }
> = {
  amber: {
    label: 'Torch Amber',
    border: 'border-amber-500/50',
    accentText: 'text-amber-400',
    badgeBg: 'bg-amber-500/15',
    swatch: 'bg-amber-400',
  },
  crimson: {
    label: 'Mantis Crimson',
    border: 'border-rose-500/50',
    accentText: 'text-rose-400',
    badgeBg: 'bg-rose-500/15',
    swatch: 'bg-rose-500',
  },
  emerald: {
    label: 'Venom Emerald',
    border: 'border-emerald-500/50',
    accentText: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/15',
    swatch: 'bg-emerald-400',
  },
  sky: {
    label: 'Sanctuary Sky',
    border: 'border-sky-500/50',
    accentText: 'text-sky-400',
    badgeBg: 'bg-sky-500/15',
    swatch: 'bg-sky-400',
  },
  violet: {
    label: 'Arcane Violet',
    border: 'border-violet-500/50',
    accentText: 'text-violet-400',
    badgeBg: 'bg-violet-500/15',
    swatch: 'bg-violet-400',
  },
};

export interface LevelTierDef {
  level: number;
  title: string;
  xpRequired: number;
  spriteTier: 1 | 2 | 3 | 4;
  unlockSummary: string;
  autoGearIds: string[];
}

export const CRAWLER_LEVELS: LevelTierDef[] = [
  {
    level: 1,
    title: 'Barefoot Novice',
    xpRequired: 0,
    spriteTier: 1,
    unlockSummary: 'Scuffed Leather Jacket & Spiked Knuckle Wraps',
    autoGearIds: ['wpn_spiked_wraps', 'arm_leather_jacket', 'acc_tousled_grit', 'aur_none'],
  },
  {
    level: 2,
    title: 'Sanctuary Brawler',
    xpRequired: 300,
    spriteTier: 1,
    unlockSummary: 'Iron-Studded Gauntlets & Torchlight Ember',
    autoGearIds: ['wpn_iron_gauntlets', 'aur_torch_ember'],
  },
  {
    level: 3,
    title: 'Ruins Path Scout',
    xpRequired: 750,
    spriteTier: 2,
    unlockSummary: 'Scout Sprite Evolution & Serrated Hunting Knife',
    autoGearIds: ['wpn_serrated_blade', 'arm_reinforced_coat'],
  },
  {
    level: 4,
    title: 'Mantis Tracker',
    xpRequired: 1400,
    spriteTier: 2,
    unlockSummary: 'Torchbearer Bandana & Mantis Hunter Crimson',
    autoGearIds: ['acc_amber_headband', 'aur_mantis_crimson'],
  },
  {
    level: 5,
    title: 'Ember-Gauntlet Veteran',
    xpRequired: 2300,
    spriteTier: 3,
    unlockSummary: 'Hunter Sprite Evolution & Crimson Mantis Scythe',
    autoGearIds: ['wpn_mantis_scythe', 'arm_runed_obsidian'],
  },
  {
    level: 6,
    title: 'Hunting Grounds Stalker',
    xpRequired: 3500,
    spriteTier: 3,
    unlockSummary: 'Night-Stalker Visor & Venom Mist Emerald',
    autoGearIds: ['acc_emerald_visor', 'aur_forest_emerald'],
  },
  {
    level: 7,
    title: 'Boss Room Challenger',
    xpRequired: 5000,
    spriteTier: 4,
    unlockSummary: 'Apex Warden Sprite Evolution & Emerald-Flame Greatsword',
    autoGearIds: ['wpn_blazing_greatsword', 'arm_warden_plate'],
  },
  {
    level: 8,
    title: 'Apex Floor Warden',
    xpRequired: 7000,
    spriteTier: 4,
    unlockSummary: 'Horned Obsidian Crown & Legendary Loot Gold',
    autoGearIds: ['acc_horned_crown', 'aur_celestial_gold'],
  },
];

export interface GearItemDef {
  id: string;
  name: string;
  slot: GearSlot;
  rarity: LootBoxTier;
  description: string;
  badgeColor: string;
}

export const CRAWLER_GEAR_CATALOG: GearItemDef[] = [
  // Weapons
  {
    id: 'wpn_spiked_wraps',
    name: 'Spiked Knuckle Wraps',
    slot: 'weapon',
    rarity: 'bronze',
    description: 'Starter brawling wraps stained from Sanctuary sparring.',
    badgeColor: 'text-amber-300 border-amber-600/60 bg-amber-950/50',
  },
  {
    id: 'wpn_iron_gauntlets',
    name: 'Iron-Studded Gauntlets',
    slot: 'weapon',
    rarity: 'bronze',
    description: 'Heavy dungeon iron built for PR deadlifts and skullcrushing.',
    badgeColor: 'text-slate-200 border-slate-500 bg-slate-800/80',
  },
  {
    id: 'wpn_serrated_blade',
    name: 'Serrated Hunting Knife',
    slot: 'weapon',
    rarity: 'silver',
    description: 'Notched steel carried by seasoned Hunting Grounds scouts.',
    badgeColor: 'text-sky-300 border-sky-500/60 bg-sky-950/50',
  },
  {
    id: 'wpn_mantis_scythe',
    name: 'Crimson Mantis Scythe',
    slot: 'weapon',
    rarity: 'gold',
    description: 'Forged from an elite Razor Mantis forelimb. Glows near bosses.',
    badgeColor: 'text-rose-300 border-rose-500/70 bg-rose-950/60',
  },
  {
    id: 'wpn_blazing_greatsword',
    name: 'Emerald-Flame Greatsword',
    slot: 'weapon',
    rarity: 'platinum',
    description: 'Searing relic blade awarded to elite weekly floor clearers.',
    badgeColor: 'text-emerald-300 border-emerald-500/70 bg-emerald-950/60',
  },
  {
    id: 'wpn_goblin_bomb_glove',
    name: 'Brass Ember Gauntlet',
    slot: 'weapon',
    rarity: 'gold',
    description: 'Loot Box rare drop: brass ignition sleeve smelling faintly of sulfur.',
    badgeColor: 'text-orange-300 border-orange-500/70 bg-orange-950/60',
  },

  // Armor / Cloaks
  {
    id: 'arm_leather_jacket',
    name: 'Scuffed Leather Jacket',
    slot: 'armor',
    rarity: 'bronze',
    description: 'Classic sleeveless-ready crawler jacket with zero armor penalty.',
    badgeColor: 'text-amber-300 border-amber-600/60 bg-amber-950/50',
  },
  {
    id: 'arm_reinforced_coat',
    name: 'Pauldron Trench Coat',
    slot: 'armor',
    rarity: 'silver',
    description: 'Riveted shoulder plates layered over weathered Hunting Grounds leather.',
    badgeColor: 'text-sky-300 border-sky-500/60 bg-sky-950/50',
  },
  {
    id: 'arm_runed_obsidian',
    name: 'Runed Shadow Cloak',
    slot: 'armor',
    rarity: 'gold',
    description: 'Tattered twilight cloak woven to blend into deep forest mist.',
    badgeColor: 'text-violet-300 border-violet-500/70 bg-violet-950/60',
  },
  {
    id: 'arm_warden_plate',
    name: 'Floor Warden Plate',
    slot: 'armor',
    rarity: 'platinum',
    description: 'Enchanted obsidian chestplate etched with ember runes.',
    badgeColor: 'text-amber-200 border-amber-400/80 bg-amber-950/60',
  },
  {
    id: 'arm_heart_boxers_cape',
    name: 'Crimson Crest Cloak',
    slot: 'armor',
    rarity: 'silver',
    description: 'Loot Box drop: crimson war cloak emblazoned with a golden shield crest.',
    badgeColor: 'text-rose-300 border-rose-500/70 bg-rose-950/60',
  },

  // Accessories / Headgear
  {
    id: 'acc_tousled_grit',
    name: 'Crawler’s Grit',
    slot: 'accessory',
    rarity: 'bronze',
    description: 'No helmet needed. Pure stubbornness and bare feet.',
    badgeColor: 'text-slate-300 border-slate-600 bg-slate-800/80',
  },
  {
    id: 'acc_amber_headband',
    name: 'Torchbearer Bandana',
    slot: 'accessory',
    rarity: 'silver',
    description: 'Keeps sweat out of your eyes during high-RPE dungeon sets.',
    badgeColor: 'text-amber-300 border-amber-500/60 bg-amber-950/50',
  },
  {
    id: 'acc_emerald_visor',
    name: 'Night-Stalker Visor',
    slot: 'accessory',
    rarity: 'gold',
    description: 'Tracks glowing red mantis eyes through thick twilight fog.',
    badgeColor: 'text-emerald-300 border-emerald-500/70 bg-emerald-950/60',
  },
  {
    id: 'acc_horned_crown',
    name: 'Horned Obsidian Crown',
    slot: 'accessory',
    rarity: 'platinum',
    description: 'Regalia of the Hunting Grounds apex conqueror.',
    badgeColor: 'text-yellow-300 border-yellow-400/80 bg-yellow-950/60',
  },
  {
    id: 'acc_donut_tiara',
    name: 'Jeweled Familiar Collar',
    slot: 'accessory',
    rarity: 'platinum',
    description: 'Loot Box drop: flashy enchanted jewel collar with a crystal pendant. Bosses hate it.',
    badgeColor: 'text-fuchsia-300 border-fuchsia-500/70 bg-fuchsia-950/60',
  },

  // Visual Auras (border/glow around character stage)
  {
    id: 'aur_none',
    name: 'Twilight Mist',
    slot: 'aura',
    rarity: 'bronze',
    description: 'Standard twilight Hunting Grounds atmosphere.',
    badgeColor: 'text-slate-300 border-slate-600 bg-slate-800/80',
  },
  {
    id: 'aur_torch_ember',
    name: 'Torchlight Ember',
    slot: 'aura',
    rarity: 'bronze',
    description: 'Warm amber hearth glow framing your crawler portrait.',
    badgeColor: 'text-amber-300 border-amber-500/60 bg-amber-950/50',
  },
  {
    id: 'aur_mantis_crimson',
    name: 'Mantis Hunter Crimson',
    slot: 'aura',
    rarity: 'silver',
    description: 'Danger-red boss hunter aura earned in the deep forest.',
    badgeColor: 'text-rose-300 border-rose-500/70 bg-rose-950/60',
  },
  {
    id: 'aur_forest_emerald',
    name: 'Venom Mist Emerald',
    slot: 'aura',
    rarity: 'gold',
    description: 'Bioluminescent enchanted thicket frame.',
    badgeColor: 'text-emerald-300 border-emerald-500/70 bg-emerald-950/60',
  },
  {
    id: 'aur_celestial_gold',
    name: 'Legendary Loot Gold',
    slot: 'aura',
    rarity: 'platinum',
    description: 'Radiant Platinum Loot Box shimmer.',
    badgeColor: 'text-yellow-200 border-yellow-400/80 bg-yellow-950/60',
  },
];

export interface AchievementDef {
  id: string;
  category: 'Onboarding' | 'Consistency' | 'Mastery';
  title: string;
  description: string;
  xpBonus: number;
  rewardBox?: LootBoxTier;
}

export const CRAWLER_ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'ach_first_blood',
    category: 'Onboarding',
    title: 'First Blood in the Sanctuary',
    description: 'Log your first gym session, walk/run, or daily habit square.',
    xpBonus: 75,
    rewardBox: 'bronze',
  },
  {
    id: 'ach_well_fed',
    category: 'Onboarding',
    title: 'Well-Fed Crawler',
    description: 'Complete at least 3 meals and reach your daily hydration target on the same day.',
    xpBonus: 100,
    rewardBox: 'bronze',
  },
  {
    id: 'ach_torchbearer',
    category: 'Consistency',
    title: '7-Day Torchbearer',
    description: 'Hold an active 7-day discipline streak (Sanctuary Shields allowed).',
    xpBonus: 175,
    rewardBox: 'silver',
  },
  {
    id: 'ach_iron_stomach',
    category: 'Consistency',
    title: 'Iron Stomach',
    description: 'Log meals on 5+ days during a single program week.',
    xpBonus: 175,
    rewardBox: 'silver',
  },
  {
    id: 'ach_fortnight_will',
    category: 'Consistency',
    title: 'Fortnight of Will',
    description: 'Hold an active 14-day discipline streak without breaking momentum.',
    xpBonus: 250,
    rewardBox: 'gold',
  },
  {
    id: 'ach_mantis_slayer',
    category: 'Mastery',
    title: 'Mantis Slayer',
    description: 'Clear 4 Weekly Hunting Grounds Boss challenges.',
    xpBonus: 350,
    rewardBox: 'gold',
  },
  {
    id: 'ach_sovereign',
    category: 'Mastery',
    title: 'Hunting Grounds Sovereign',
    description: 'Reach Crawler Level 6+ and log 25+ completed workouts.',
    xpBonus: 500,
    rewardBox: 'platinum',
  },
  {
    id: 'ach_floor_conqueror',
    category: 'Mastery',
    title: 'Grand Floor Conqueror',
    description: 'Clear 8 Weekly Boss challenges across the dungeon biomes.',
    xpBonus: 600,
    rewardBox: 'platinum',
  },
];

export interface WeeklyBossDef {
  floor: number;
  name: string;
  subtitle: string;
  maxHp: number;
  image: string;
  bgImage: string;
}

export const WEEKLY_BOSSES: readonly WeeklyBossDef[] = [
  {
    floor: 1,
    name: 'Razor Mantis Alpha',
    subtitle: 'Twilight Thicket Ambush',
    maxHp: 100,
    image: BOSS_MANTIS_IMG,
    bgImage: WORLD_BACKGROUNDS.bg_1,
  },
  {
    floor: 2,
    name: 'Crimson-Eyed Stalker',
    subtitle: 'Ruined Tower Perimeter',
    maxHp: 100,
    image: worldAsset('boss_2.jpg', BOSS_MANTIS_IMG),
    bgImage: WORLD_BACKGROUNDS.bg_2,
  },
  {
    floor: 3,
    name: 'Gnarled Bog Treant',
    subtitle: 'Mist-Dithered Hollow',
    maxHp: 100,
    image: worldAsset('boss_3.jpg', BOSS_MANTIS_IMG),
    bgImage: WORLD_BACKGROUNDS.bg_3,
  },
  {
    floor: 4,
    name: 'Chitin Dreadnought',
    subtitle: 'Deep Hunting Grounds',
    maxHp: 100,
    image: worldAsset('boss_4.jpg', BOSS_MANTIS_IMG),
    bgImage: WORLD_BACKGROUNDS.bg_4,
  },
  {
    floor: 5,
    name: 'Ember Hound Matriarch',
    subtitle: 'Ember Caverns',
    maxHp: 100,
    image: worldAsset('boss_5.jpg', BOSS_MANTIS_IMG),
    bgImage: WORLD_BACKGROUNDS.bg_5,
  },
  {
    floor: 6,
    name: 'Bone-Bark Colossus',
    subtitle: 'Deep Hunting Grounds',
    maxHp: 100,
    image: worldAsset('boss_6.jpg', BOSS_MANTIS_IMG),
    bgImage: WORLD_BACKGROUNDS.bg_4,
  },
  {
    floor: 7,
    name: 'Mirror-Eyed Serpent',
    subtitle: 'Mist-Dithered Hollow',
    maxHp: 100,
    image: worldAsset('boss_7.jpg', BOSS_MANTIS_IMG),
    bgImage: WORLD_BACKGROUNDS.bg_3,
  },
  {
    floor: 8,
    name: 'Storm-Hide Boar',
    subtitle: 'Ruined Tower Perimeter',
    maxHp: 100,
    image: worldAsset('boss_8.jpg', BOSS_MANTIS_IMG),
    bgImage: WORLD_BACKGROUNDS.bg_2,
  },
];

export function getWeeklyBossForWeek(weekNumber: number): WeeklyBossDef {
  const idx = Math.max(0, (weekNumber - 1) % WEEKLY_BOSSES.length);
  return WEEKLY_BOSSES[idx];
}

export function getLevelInfo(xp: number, weeklyClears: number) {
  let current = CRAWLER_LEVELS[0];
  for (const tier of CRAWLER_LEVELS) {
    if (xp >= tier.xpRequired || weeklyClears >= tier.level - 1) {
      current = tier;
    }
  }
  const next = CRAWLER_LEVELS.find((t) => t.level === current.level + 1) ?? null;
  return { current, next };
}

export interface WeeklyChallengeSummary {
  bossFloor: number;
  bossName: string;
  bossSubtitle: string;
  bossImage: string;
  bossBgImage: string;
  completedWorkouts: number;
  targetWorkouts: number;
  nutritionDaysHit: number;
  hydrationDaysHit: number;
  habitCompletionsThisWeek: number;
  habitTargetThisWeek: number;
  overallPct: number;
  bossHpRemaining: number;
  isBossSlain: boolean;
}

export function computeWeeklyChallengeProgress(params: {
  weekNumber: number;
  profile: UserProfile;
  workouts: WorkoutDay[];
  mealLogs: MealLog[];
  hydrationLogs: HydrationLog[];
  habits: Habit[];
  habitLogs: HabitLog[];
}): WeeklyChallengeSummary {
  const { weekNumber, profile, workouts, mealLogs, hydrationLogs, habits, habitLogs } = params;
  const boss = getWeeklyBossForWeek(weekNumber);

  const weekWorkouts = workouts.filter((w) => w.weekNumber === weekNumber && !w.isRestDay);
  const completedWorkouts = weekWorkouts.filter((w) => w.completed).length;
  const targetWorkouts = Math.max(1, profile.weeklyWorkoutTarget || weekWorkouts.length || 4);
  const workoutScore = Math.min(1, completedWorkouts / targetWorkouts);

  // Days in week with >= 2 consumed meals
  const weekMeals = mealLogs.filter((m) => m.weekNumber === weekNumber && m.consumed);
  const mealDayCounts = new Map<number, number>();
  weekMeals.forEach((m) => {
    mealDayCounts.set(m.dayIndex, (mealDayCounts.get(m.dayIndex) ?? 0) + 1);
  });
  const nutritionDaysHit = Array.from(mealDayCounts.values()).filter((c) => c >= 2).length;
  const nutritionScore = Math.min(1, nutritionDaysHit / 5);

  const weekHydration = hydrationLogs.filter((h) => h.weekNumber === weekNumber);
  const hydrationDaysHit = weekHydration.filter(
    (h) => h.amountMl >= Math.max(500, h.goalMl * 0.85)
  ).length;
  const hydrationScore = Math.min(1, hydrationDaysHit / 5);

  // Habit completions across last 7 calendar days
  let habitCompletionsThisWeek = 0;
  const logMap = new Map<string, HabitLog>();
  habitLogs.forEach((l) => logMap.set(l.date || l.id, l));
  const habitIds = new Set(habits.map((h) => h.id));
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
    const log = logMap.get(iso);
    if (log) {
      habitCompletionsThisWeek += log.completedHabitIds.filter((id) => habitIds.has(id)).length;
    }
  }
  const habitTargetThisWeek = Math.max(
    1,
    habits.reduce((sum, h) => sum + (h.weeklyGoal || 5), 0)
  );
  const habitScore = habits.length > 0 ? Math.min(1, habitCompletionsThisWeek / habitTargetThisWeek) : 1;

  // Weighted Weekly Challenge %: 40% Gym + 25% Diet + 25% Habits + 10% Hydration
  const weighted =
    workoutScore * 0.4 + nutritionScore * 0.25 + habitScore * 0.25 + hydrationScore * 0.1;
  const overallPct = Math.min(100, Math.round(weighted * 100));

  // Anti-burnout threshold: clearing 85% of the week's targets slays the Weekly Boss!
  const bossHpRemaining = Math.max(0, Math.round(100 - (overallPct / 85) * 100));
  const isBossSlain = overallPct >= 85;

  return {
    bossFloor: boss.floor,
    bossName: boss.name,
    bossSubtitle: boss.subtitle,
    bossImage: boss.image,
    bossBgImage: boss.bgImage,
    completedWorkouts,
    targetWorkouts,
    nutritionDaysHit,
    hydrationDaysHit,
    habitCompletionsThisWeek,
    habitTargetThisWeek,
    overallPct,
    bossHpRemaining,
    isBossSlain,
  };
}

export function buildDefaultCrawlerState(
  uid: string,
  defaultName = 'Crawler'
): Omit<CrawlerState, 'createdAt' | 'updatedAt'> {
  return {
    id: 'main',
    ownerId: uid,
    xp: 0,
    level: 1,
    weeklyClears: 0,
    currentStreak: 0,
    bestStreak: 0,
    streakFreezes: 1,
    lastActiveDate: '',
    recoveryQuestActive: false,
    equippedSpriteTier: 1,
    equippedWeapon: 'wpn_spiked_wraps',
    equippedArmor: 'arm_leather_jacket',
    equippedAccessory: 'acc_tousled_grit',
    equippedAura: 'aur_none',
    unlockedGearIds: ['wpn_spiked_wraps', 'arm_leather_jacket', 'acc_tousled_grit', 'aur_none'],
    unlockedAchievementIds: [],
    pendingLootBoxes: [],
    rewardedActionKeys: [],
    clearedWeekKeys: [],
    sfxEnabled: true,
    crawlerName: defaultName.slice(0, 32) || 'Crawler',
    crawlerClass: 'Ironclad Vanguard',
    crawlerMotto: 'Steel yourself. One more set.',
    bannerTheme: 'amber',
    guildId: '',
    guildName: '',
    isPublicProfile: false,
  };
}

function daysBetweenIso(earlierIso: string, laterIso: string): number {
  if (!earlierIso || !laterIso) return 999;
  const [y1, m1, d1] = earlierIso.split('-').map(Number);
  const [y2, m2, d2] = laterIso.split('-').map(Number);
  const dt1 = new Date(y1, (m1 || 1) - 1, d1 || 1);
  const dt2 = new Date(y2, (m2 || 1) - 1, d2 || 1);
  return Math.round((dt2.getTime() - dt1.getTime()) / (1000 * 60 * 60 * 24));
}

export function applyCrawlerProgressionUpdate(params: {
  state: CrawlerState;
  actionKey: string;
  baseXp: number;
  reason: string;
  allowCrit?: boolean;
  weeklySummary?: WeeklyChallengeSummary;
  weekNumber?: number;
  totalCompletedWorkouts?: number;
  hasWellFedDay?: boolean;
  hasIronStomachWeek?: boolean;
}): {
  nextState: Omit<CrawlerState, 'createdAt' | 'updatedAt'>;
  rewardEvent: CrawlerRewardEvent | null;
} {
  const {
    state,
    actionKey,
    baseXp,
    reason,
    allowCrit = true,
    weeklySummary,
    weekNumber,
    totalCompletedWorkouts = 0,
    hasWellFedDay = false,
    hasIronStomachWeek = false,
  } = params;

  const today = todayIsoDate();
  const rewardedSet = new Set(state.rewardedActionKeys);
  const alreadyRewarded = rewardedSet.has(actionKey);

  // Even if actionKey was already rewarded, still check weekly boss clear & achievements
  let xpDelta = 0;
  let isCrit = false;
  if (!alreadyRewarded && baseXp > 0) {
    isCrit = allowCrit && Math.random() < 0.16;
    xpDelta = isCrit ? Math.round(baseXp * 2) : baseXp;
    rewardedSet.add(actionKey);
  }

  // Update forgiving streak + Safe-Room Shields
  let currentStreak = state.currentStreak;
  let streakFreezes = state.streakFreezes;
  let recoveryQuestActive = state.recoveryQuestActive;
  let lastActiveDate = state.lastActiveDate;

  if (lastActiveDate !== today) {
    const gap = daysBetweenIso(lastActiveDate, today);
    if (!lastActiveDate) {
      currentStreak = 1;
    } else if (gap === 1) {
      currentStreak += 1;
      recoveryQuestActive = false;
      if (currentStreak % 7 === 0 && streakFreezes < 5) {
        streakFreezes += 1;
      }
    } else if (gap === 2 && streakFreezes > 0) {
      // Safe-Room Shield automatically absorbs the 1-day gap
      streakFreezes -= 1;
      currentStreak += 1;
      recoveryQuestActive = false;
    } else if (gap === 2 && recoveryQuestActive) {
      // Recovery Quest mends the cracked streak!
      currentStreak += 1;
      recoveryQuestActive = false;
    } else if (gap > 1) {
      // Cracked streak enters Second Wind Recovery Quest instead of brutal reset if gap === 2
      if (gap === 2) {
        recoveryQuestActive = true;
        currentStreak = Math.max(1, currentStreak);
      } else {
        currentStreak = 1;
        recoveryQuestActive = false;
      }
    }
    lastActiveDate = today;
  }

  const bestStreak = Math.max(state.bestStreak, currentStreak);

  let weeklyClears = state.weeklyClears;
  const clearedWeekKeys = new Set(state.clearedWeekKeys);
  const pendingLootBoxes: LootBoxTier[] = [...state.pendingLootBoxes];
  let newLootBox: LootBoxTier | undefined;

  // Weekly Boss Clear Check
  if (weeklySummary?.isBossSlain && weekNumber) {
    const wkKey = `w${weekNumber}`;
    if (!clearedWeekKeys.has(wkKey)) {
      clearedWeekKeys.add(wkKey);
      weeklyClears += 1;
      xpDelta += 150;
      const boxTier: LootBoxTier =
        weeklyClears % 4 === 0
          ? 'platinum'
          : weeklyClears % 3 === 0
          ? 'gold'
          : weeklyClears % 2 === 0
          ? 'silver'
          : 'bronze';
      if (pendingLootBoxes.length < 20) {
        pendingLootBoxes.push(boxTier);
        newLootBox = boxTier;
      }
    }
  }

  let nextXp = Math.min(1000000, state.xp + xpDelta);
  const unlockedAchSet = new Set(state.unlockedAchievementIds);
  const newAchievements: string[] = [];

  const grantAchievement = (achId: string) => {
    if (unlockedAchSet.has(achId)) return;
    const def = CRAWLER_ACHIEVEMENTS.find((a) => a.id === achId);
    if (!def) return;
    unlockedAchSet.add(achId);
    newAchievements.push(def.title);
    nextXp = Math.min(1000000, nextXp + def.xpBonus);
    xpDelta += def.xpBonus;
    if (def.rewardBox && pendingLootBoxes.length < 20) {
      pendingLootBoxes.push(def.rewardBox);
      if (!newLootBox) newLootBox = def.rewardBox;
    }
  };

  // Evaluate all achievements
  if (rewardedSet.size >= 1) grantAchievement('ach_first_blood');
  if (hasWellFedDay) grantAchievement('ach_well_fed');
  if (currentStreak >= 7) grantAchievement('ach_torchbearer');
  if (hasIronStomachWeek) grantAchievement('ach_iron_stomach');
  if (currentStreak >= 14) grantAchievement('ach_fortnight_will');
  if (weeklyClears >= 4) grantAchievement('ach_mantis_slayer');
  if (weeklyClears >= 8) grantAchievement('ach_floor_conqueror');

  const preLevel = getLevelInfo(nextXp, weeklyClears).current;
  if (preLevel.level >= 6 && totalCompletedWorkouts >= 25) {
    grantAchievement('ach_sovereign');
  }

  const finalLevelInfo = getLevelInfo(nextXp, weeklyClears).current;
  const leveledUpTo = finalLevelInfo.level > state.level ? finalLevelInfo.level : undefined;

  const unlockedGearSet = new Set(state.unlockedGearIds);
  CRAWLER_LEVELS.forEach((tier) => {
    if (finalLevelInfo.level >= tier.level) {
      tier.autoGearIds.forEach((gid) => unlockedGearSet.add(gid));
    }
  });

  // Auto-upgrade equipped sprite tier on level-up if user leveled into a higher sprite tier
  const nextSpriteTier =
    leveledUpTo && finalLevelInfo.spriteTier > state.equippedSpriteTier
      ? finalLevelInfo.spriteTier
      : state.equippedSpriteTier;

  const rollingRewardKeys = Array.from(rewardedSet).slice(-120);

  const nextState: Omit<CrawlerState, 'createdAt' | 'updatedAt'> = {
    id: state.id || 'main',
    ownerId: state.ownerId,
    xp: nextXp,
    level: finalLevelInfo.level,
    weeklyClears,
    currentStreak,
    bestStreak,
    streakFreezes: Math.min(5, streakFreezes),
    lastActiveDate,
    recoveryQuestActive,
    equippedSpriteTier: nextSpriteTier,
    equippedWeapon: state.equippedWeapon,
    equippedArmor: state.equippedArmor,
    equippedAccessory: state.equippedAccessory,
    equippedAura: state.equippedAura,
    unlockedGearIds: Array.from(unlockedGearSet).slice(0, 60),
    unlockedAchievementIds: Array.from(unlockedAchSet).slice(0, 20),
    pendingLootBoxes: pendingLootBoxes.slice(0, 20),
    rewardedActionKeys: rollingRewardKeys,
    clearedWeekKeys: Array.from(clearedWeekKeys).slice(0, 60),
    sfxEnabled: state.sfxEnabled,
    crawlerName: state.crawlerName ?? 'Crawler',
    crawlerClass: state.crawlerClass ?? 'Ironclad Vanguard',
    crawlerMotto: state.crawlerMotto ?? '',
    bannerTheme: state.bannerTheme ?? 'amber',
    guildId: state.guildId ?? '',
    guildName: state.guildName ?? '',
    isPublicProfile: state.isPublicProfile ?? false,
  };

  if (xpDelta === 0 && !leveledUpTo && newAchievements.length === 0 && !newLootBox) {
    return { nextState, rewardEvent: null };
  }

  return {
    nextState,
    rewardEvent: {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      xpAdded: xpDelta,
      isCrit,
      reason,
      leveledUpTo,
      newAchievements: newAchievements.length > 0 ? newAchievements : undefined,
      newLootBox,
    },
  };
}

export function rollLootBoxReward(unlockedGearIds: string[]): GearItemDef {
  const locked = CRAWLER_GEAR_CATALOG.filter((g) => !unlockedGearIds.includes(g.id));
  const pool = locked.length > 0 ? locked : CRAWLER_GEAR_CATALOG;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}

// Lightweight Web Audio API 8-Bit Chiptune Synthesizer
export type RetroSfxType = 'xp' | 'habit' | 'crit' | 'loot' | 'levelup';

let sharedAudioCtx: AudioContext | null = null;

export function playRetroSfx(type: RetroSfxType, enabled: boolean): void {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === 'suspended') {
      void sharedAudioCtx.resume();
    }

    const now = sharedAudioCtx.currentTime;
    const playTone = (freq: number, start: number, dur: number, wave: OscillatorType = 'square', vol = 0.045) => {
      if (!sharedAudioCtx) return;
      const osc = sharedAudioCtx.createOscillator();
      const gain = sharedAudioCtx.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(vol, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.connect(gain);
      gain.connect(sharedAudioCtx.destination);
      osc.start(start);
      osc.stop(start + dur);
    };

    if (type === 'habit' || type === 'xp') {
      playTone(523.25, now, 0.06, 'square', 0.035);
      playTone(659.25, now + 0.055, 0.09, 'square', 0.035);
    } else if (type === 'crit') {
      playTone(587.33, now, 0.06, 'square', 0.045);
      playTone(783.99, now + 0.05, 0.06, 'square', 0.045);
      playTone(1046.5, now + 0.1, 0.14, 'square', 0.045);
    } else if (type === 'loot') {
      playTone(440, now, 0.07, 'triangle', 0.05);
      playTone(554.37, now + 0.07, 0.07, 'triangle', 0.05);
      playTone(659.25, now + 0.14, 0.07, 'triangle', 0.05);
      playTone(880, now + 0.21, 0.22, 'square', 0.045);
    } else if (type === 'levelup') {
      const notes = [392.0, 523.25, 659.25, 783.99, 1046.5];
      notes.forEach((n, idx) => playTone(n, now + idx * 0.07, 0.12, 'square', 0.045));
    }
  } catch {
    // Ignore audio errors on locked browser contexts
  }
}
