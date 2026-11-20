/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import {
  BarChart3,
  BookOpen,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageOpen,
  Plus,
  Ruler,
  SlidersHorizontal,
  Sparkles,
  Users,
  Utensils,
  X,
} from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { Food } from './lib/foodDb';
import { LanguageProvider, LanguageToggle, useT } from './lib/i18n';
import {
  CrawlerRewardEvent,
  CrawlerState,
  Habit,
  HabitLog,
  HydrationLog,
  MealLog,
  MealSlot,
  Measurement,
  NavSection,
  Recipe,
  CrawlerStyle,
  Sex,
  UserProfile,
  WorkoutDay,
  WorkoutPlan,
} from './types';
import {
  saveCrawlerState,
  seedStarterHabits,
  syncSocialCrawlerProfile,
} from './lib/firestoreService';
import { initializeUserWorkspace } from './lib/seedData';
import {
  applyCrawlerProgressionUpdate,
  revokeRewardedActions,
  BOSS_MANTIS_IMG,
  buildDefaultCrawlerState,
  computeWeeklyChallengeProgress,
  CRAWLER_LEVELS,
  getLevelInfo,
  getLootChestImg,
  HUNTING_GROUNDS_BG,
  playRetroSfx,
  WeeklyChallengeSummary,
} from './lib/crawlerEngine';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthGate } from './components/AuthGate';
import { encodeLook, parseLook } from './lib/crawlerLook';
import { IdentityFields } from './components/IdentityFields';
import { OverviewView } from './components/OverviewView';
import { GymPlanView } from './components/GymPlanView';
import { DietPlanView } from './components/DietPlanView';
import { RecipesView } from './components/RecipesView';
import { MeasurementsView } from './components/MeasurementsView';
import { ProgressChartsView } from './components/ProgressChartsView';
import { ProgramSettingsModal } from './components/ProgramSettingsModal';
import { QuickFoodModal } from './components/QuickFoodModal';
import { CsvImportModal, CsvImportTarget } from './components/CsvImportModal';
import { CrawlerArmoryModal } from './components/CrawlerArmoryModal';
import { GuildView } from './components/GuildView';
import { PWAInstallButton } from './components/PWAInstallButton';
import { GuideCorner, GuideHostTab } from './components/GuideCorner';
import { GuideActionType } from './lib/guideFaq';

/** XP reasons are built in English; translate known shapes at display time. */
function translateReason(t: (s: string, v?: Record<string, string | number>) => string, reason: string): string {
  const prefixes: [string, string][] = [
    ['Cleared ', 'Cleared {x}'],
    ['Habit: ', 'Habit: {x}'],
    ['Defeated ', 'Defeated {x}'],
  ];
  for (const [prefix, key] of prefixes) {
    if (reason.startsWith(prefix)) return t(key, { x: t(reason.slice(prefix.length)) });
  }
  return t(reason);
}

const NAV_ITEMS: {
  id: NavSection;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'overview', label: 'Overview', shortLabel: 'Home', icon: LayoutDashboard },
  { id: 'gym', label: 'Gym Plan', shortLabel: 'Gym', icon: Dumbbell },
  { id: 'diet', label: 'Diet Plan', shortLabel: 'Diet', icon: Utensils },
  { id: 'recipes', label: 'Recipes', shortLabel: 'Recipes', icon: BookOpen },
  { id: 'measurements', label: 'Measurements', shortLabel: 'Body', icon: Ruler },
  { id: 'charts', label: 'Progress Charts', shortLabel: 'Charts', icon: BarChart3 },
  { id: 'guild', label: 'Guild & Ranks', shortLabel: 'Guild', icon: Users },
];

function WorkspaceShell() {
  const t = useT();
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileChecked, setProfileChecked] = useState(false);
  const [initializingWorkspace, setInitializingWorkspace] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [onboardSex, setOnboardSex] = useState<Sex>('unspecified');
  const [onboardStyle, setOnboardStyle] = useState<CrawlerStyle>('masculine');

  const [workouts, setWorkouts] = useState<WorkoutDay[]>([]);
  const [workoutsLoaded, setWorkoutsLoaded] = useState(false);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [mealsLoaded, setMealsLoaded] = useState(false);
  const [hydrationLogs, setHydrationLogs] = useState<HydrationLog[]>([]);
  const [hydrationLoaded, setHydrationLoaded] = useState(false);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [habitsLoaded, setHabitsLoaded] = useState(false);
  const [habitLogsLoaded, setHabitLogsLoaded] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [customFoods, setCustomFoods] = useState<Food[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);

  const [crawlerDoc, setCrawlerDoc] = useState<CrawlerState | null>(null);
  const [crawlerLoaded, setCrawlerLoaded] = useState(false);
  const [armoryState, setArmoryState] = useState<{
    open: boolean;
    tab: 'customize' | 'armory' | 'loot' | 'achievements';
  }>({ open: false, tab: 'armory' });
  const [rewardToast, setRewardToast] = useState<CrawlerRewardEvent | null>(null);

  const knownActionKeysRef = useRef<Set<string> | null>(null);
  /** action keys seen as done at some point this session (only these can be taken back) */
  const seenActionKeysRef = useRef<Set<string>>(new Set());
  const bootstrappingCrawlerRef = useRef(false);
  const lastSocialSyncSigRef = useRef<string | null>(null);

  const [activeNav, setActiveNav] = useState<NavSection>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [quickMeasOpen, setQuickMeasOpen] = useState(false);

  // Quick on-the-spot food modal state
  const [quickFoodOpen, setQuickFoodOpen] = useState(false);
  const [quickFoodDefaults, setQuickFoodDefaults] = useState<{
    week: number;
    day: number;
    slot?: MealSlot;
  }>({ week: 1, day: 0, slot: 'on_the_spot' });

  // CSV Import modal state
  const [csvImportState, setCsvImportState] = useState<{
    open: boolean;
    mode: CsvImportTarget;
    week: number;
    day: number;
  }>({ open: false, mode: 'training', week: 1, day: 0 });
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const [guideCheer, setGuideCheer] = useState(0);
  const [dietOpenMealText, setDietOpenMealText] = useState(false);
  const [gymExternalAction, setGymExternalAction] = useState<'picker' | 'templates' | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      knownActionKeysRef.current = null;
      seenActionKeysRef.current = new Set();
      bootstrappingCrawlerRef.current = false;
      lastSocialSyncSigRef.current = null;
      if (!firebaseUser) {
        setProfile(null);
        setProfileChecked(false);
        setWorkouts([]);
        setWorkoutsLoaded(false);
        setWorkoutPlans([]);
        setMealLogs([]);
        setMealsLoaded(false);
        setHydrationLogs([]);
        setHydrationLoaded(false);
        setHabits([]);
        setHabitLogs([]);
        setHabitsLoaded(false);
        setHabitLogsLoaded(false);
        setRecipes([]);
        setCustomFoods([]);
        setMeasurements([]);
        setCrawlerDoc(null);
        setCrawlerLoaded(false);
        setRewardToast(null);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authReady || !user) return;

    const uid = user.uid;
    const profilePath = `users/${uid}`;
    const unsubProfile = onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        if (snap.exists()) {
          setProfile(snap.data() as UserProfile);
        } else {
          setProfile(null);
        }
        setProfileChecked(true);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, profilePath);
      }
    );

    const workoutsPath = `users/${uid}/workouts`;
    const unsubWorkouts = onSnapshot(
      query(collection(db, 'users', uid, 'workouts'), where('ownerId', '==', uid)),
      (snap) => {
        setWorkouts(
          snap.docs.map((d) => ({ ...(d.data() as Omit<WorkoutDay, 'id'>), id: d.id }))
        );
        setWorkoutsLoaded(true);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, workoutsPath);
      }
    );

    const mealsPath = `users/${uid}/mealLogs`;
    const unsubMeals = onSnapshot(
      query(collection(db, 'users', uid, 'mealLogs'), where('ownerId', '==', uid)),
      (snap) => {
        setMealLogs(
          snap.docs.map((d) => ({ ...(d.data() as Omit<MealLog, 'id'>), id: d.id }))
        );
        setMealsLoaded(true);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, mealsPath);
      }
    );

    const recipesPath = `users/${uid}/recipes`;
    const unsubRecipes = onSnapshot(
      query(collection(db, 'users', uid, 'recipes'), where('ownerId', '==', uid)),
      (snap) => {
        setRecipes(
          snap.docs.map((d) => ({ ...(d.data() as Omit<Recipe, 'id'>), id: d.id }))
        );
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, recipesPath);
      }
    );

    const foodsPath = `users/${uid}/foods`;
    const unsubFoods = onSnapshot(
      query(collection(db, 'users', uid, 'foods'), where('ownerId', '==', uid)),
      (snap) => {
        setCustomFoods(
          snap.docs.map((d) => ({ ...(d.data() as Omit<Food, 'id'>), id: d.id, custom: true }))
        );
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, foodsPath);
      }
    );

    const measPath = `users/${uid}/measurements`;
    const unsubMeas = onSnapshot(
      query(collection(db, 'users', uid, 'measurements'), where('ownerId', '==', uid)),
      (snap) => {
        setMeasurements(
          snap.docs.map((d) => ({ ...(d.data() as Omit<Measurement, 'id'>), id: d.id }))
        );
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, measPath);
      }
    );

    const workoutPlansPath = `users/${uid}/workoutPlans`;
    const unsubWorkoutPlans = onSnapshot(
      query(collection(db, 'users', uid, 'workoutPlans'), where('ownerId', '==', uid)),
      (snap) => {
        setWorkoutPlans(
          snap.docs.map((d) => ({ ...(d.data() as Omit<WorkoutPlan, 'id'>), id: d.id }))
        );
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, workoutPlansPath);
      }
    );

    const hydrationPath = `users/${uid}/hydrationLogs`;
    const unsubHydration = onSnapshot(
      query(collection(db, 'users', uid, 'hydrationLogs'), where('ownerId', '==', uid)),
      (snap) => {
        setHydrationLogs(
          snap.docs.map((d) => ({ ...(d.data() as Omit<HydrationLog, 'id'>), id: d.id }))
        );
        setHydrationLoaded(true);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, hydrationPath);
      }
    );

    const habitsPath = `users/${uid}/habits`;
    const unsubHabits = onSnapshot(
      query(collection(db, 'users', uid, 'habits'), where('ownerId', '==', uid)),
      (snap) => {
        setHabits(
          snap.docs.map((d) => ({ ...(d.data() as Omit<Habit, 'id'>), id: d.id }))
        );
        setHabitsLoaded(true);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, habitsPath);
      }
    );

    const habitLogsPath = `users/${uid}/habitLogs`;
    const unsubHabitLogs = onSnapshot(
      query(collection(db, 'users', uid, 'habitLogs'), where('ownerId', '==', uid)),
      (snap) => {
        setHabitLogs(
          snap.docs.map((d) => ({ ...(d.data() as Omit<HabitLog, 'id'>), id: d.id }))
        );
        setHabitLogsLoaded(true);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, habitLogsPath);
      }
    );

    const crawlerPath = `users/${uid}/crawlerState`;
    const unsubCrawler = onSnapshot(
      query(collection(db, 'users', uid, 'crawlerState'), where('ownerId', '==', uid)),
      (snap) => {
        const mainSnap = snap.docs.find((d) => d.id === 'main') ?? snap.docs[0];
        if (mainSnap) {
          setCrawlerDoc({
            ...(mainSnap.data() as Omit<CrawlerState, 'id'>),
            id: mainSnap.id,
          });
        } else {
          setCrawlerDoc(null);
        }
        setCrawlerLoaded(true);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, crawlerPath);
      }
    );

    return () => {
      unsubProfile();
      unsubWorkouts();
      unsubWorkoutPlans();
      unsubMeals();
      unsubRecipes();
      unsubFoods();
      unsubMeas();
      unsubHydration();
      unsubHabits();
      unsubHabitLogs();
      unsubCrawler();
    };
  }, [authReady, user]);

  useEffect(() => {
    if (!user || !profile || !habitsLoaded) return;
    const initKey = `fitness_crawler_habits_init_${user.uid}`;
    if (habits.length === 0 && !localStorage.getItem(initKey)) {
      localStorage.setItem(initKey, '1');
      void seedStarterHabits(user.uid);
    } else if (habits.length > 0 && !localStorage.getItem(initKey)) {
      localStorage.setItem(initKey, '1');
    }
  }, [user, profile, habitsLoaded, habits.length]);

  const effectiveCrawler: CrawlerState = useMemo(() => {
    if (crawlerDoc) return crawlerDoc;
    return buildDefaultCrawlerState(
      user?.uid ?? 'local',
      profile?.displayName ?? user?.displayName ?? 'Crawler'
    );
  }, [crawlerDoc, user?.uid, user?.displayName, profile?.displayName]);

  const weeklySummary: WeeklyChallengeSummary = useMemo(() => {
    if (!profile) {
      return {
        bossFloor: 1,
        bossName: 'Razor Mantis Alpha',
        bossSubtitle: 'Twilight Thicket Ambush',
        bossImage: BOSS_MANTIS_IMG,
        bossBgImage: HUNTING_GROUNDS_BG,
        completedWorkouts: 0,
        targetWorkouts: 4,
        nutritionDaysHit: 0,
        hydrationDaysHit: 0,
        habitCompletionsThisWeek: 0,
        habitTargetThisWeek: 1,
        overallPct: 0,
        bossHpRemaining: 100,
        isBossSlain: false,
      };
    }
    return computeWeeklyChallengeProgress({
      weekNumber: profile.currentWeek,
      profile,
      workouts,
      mealLogs,
      hydrationLogs,
      habits,
      habitLogs,
    });
  }, [profile, workouts, mealLogs, hydrationLogs, habits, habitLogs]);

  // Evaluate historical bootstrap & live session progression rewards
  useEffect(() => {
    if (
      !user ||
      !profile ||
      !crawlerLoaded ||
      !workoutsLoaded ||
      !mealsLoaded ||
      !hydrationLoaded ||
      !habitsLoaded ||
      !habitLogsLoaded
    ) {
      return;
    }

    const activeHabitIds = new Set(habits.map((h) => h.id));
    const currentSignals = new Map<string, { xp: number; reason: string; sfx: 'xp' | 'habit' }>();
    // every action whose source still exists (even when not done): can be taken back on uncheck
    const candidates = new Map<string, number>();

    let totalCompletedWorkouts = 0;
    workouts.forEach((w) => {
      candidates.set(`wo_${w.id}`, 50);
      candidates.set(`cardio_${w.id}`, 35);
      if (!w.isRestDay && w.completed) {
        totalCompletedWorkouts += 1;
        currentSignals.set(`wo_${w.id}`, {
          xp: 50,
          reason: `Cleared ${w.focus || 'Gym Session'}`,
          sfx: 'xp',
        });
      }
      if (w.cardio && w.cardio.activityType !== 'none' && w.cardio.completed) {
        currentSignals.set(`cardio_${w.id}`, {
          xp: 35,
          reason: `Finished ${w.cardio.activityType === 'walk' ? 'Walk' : 'Run'}`,
          sfx: 'xp',
        });
      }
    });

    const mealCountsByDay = new Map<string, number>();
    const mealDaysByWeek = new Map<number, Set<number>>();
    mealLogs.forEach((m) => {
      const dayKey = `w${m.weekNumber}_d${m.dayIndex}`;
      candidates.set(`meal_${dayKey}`, 25);
      if (!m.consumed) return;
      mealCountsByDay.set(dayKey, (mealCountsByDay.get(dayKey) ?? 0) + 1);
      const set = mealDaysByWeek.get(m.weekNumber) ?? new Set<number>();
      set.add(m.dayIndex);
      mealDaysByWeek.set(m.weekNumber, set);
    });

    mealCountsByDay.forEach((count, dayKey) => {
      if (count >= 2) {
        currentSignals.set(`meal_${dayKey}`, {
          xp: 25,
          reason: 'Daily Rations Disciplined',
          sfx: 'xp',
        });
      }
    });

    const hydrationHitDays = new Set<string>();
    hydrationLogs.forEach((h) => {
      candidates.set(`hyd_w${h.weekNumber}_d${h.dayIndex}`, 20);
      if (h.amountMl >= Math.max(500, h.goalMl * 0.85)) {
        const dayKey = `w${h.weekNumber}_d${h.dayIndex}`;
        hydrationHitDays.add(dayKey);
        currentSignals.set(`hyd_${dayKey}`, {
          xp: 20,
          reason: 'Hydration Target Hit',
          sfx: 'xp',
        });
      }
    });

    habitLogs.forEach((log) => {
      const dateStr = log.date || log.id;
      const validCompleted = log.completedHabitIds.filter((id) => activeHabitIds.has(id));
      activeHabitIds.forEach((hid) => candidates.set(`hab_${dateStr}_${hid}`, 10));
      candidates.set(`habsweep_${dateStr}`, 25);
      validCompleted.forEach((hid) => {
        const hab = habits.find((h) => h.id === hid);
        currentSignals.set(`hab_${dateStr}_${hid}`, {
          xp: 10,
          reason: hab ? `Habit: ${hab.title}` : 'Daily Habit Cleared',
          sfx: 'habit',
        });
      });
      if (habits.length > 0 && validCompleted.length >= habits.length) {
        currentSignals.set(`habsweep_${dateStr}`, {
          xp: 25,
          reason: 'Full Daily Habit Sweep!',
          sfx: 'xp',
        });
      }
    });

    const hasWellFedDay = Array.from(mealCountsByDay.entries()).some(
      ([dayKey, count]) => count >= 3 && hydrationHitDays.has(dayKey)
    );
    const hasIronStomachWeek = Array.from(mealDaysByWeek.values()).some((s) => s.size >= 5);

    // 1. Bootstrap missing crawlerState for existing accounts silently
    if (!crawlerDoc) {
      if (bootstrappingCrawlerRef.current) return;
      bootstrappingCrawlerRef.current = true;
      const base = buildDefaultCrawlerState(user.uid, profile.displayName);
      let initialXp = 0;
      const initialKeys = Array.from(currentSignals.keys()).slice(-120);
      currentSignals.forEach((sig) => {
        initialXp += sig.xp;
      });
      initialXp = Math.min(1000000, initialXp);
      const achIds: string[] = [];
      if (initialKeys.length >= 1) achIds.push('ach_first_blood');
      if (hasWellFedDay) achIds.push('ach_well_fed');
      if (hasIronStomachWeek) achIds.push('ach_iron_stomach');

      const { current } = getLevelInfo(initialXp, 0);
      const gearSet = new Set(base.unlockedGearIds);
      CRAWLER_LEVELS.forEach((t) => {
        if (current.level >= t.level) {
          t.autoGearIds.forEach((gid) => gearSet.add(gid));
        }
      });

      const bootstrapState: Omit<CrawlerState, 'createdAt' | 'updatedAt'> = {
        ...base,
        xp: initialXp,
        level: current.level,
        equippedSpriteTier: current.spriteTier,
        look: profile.crawlerStyle ? encodeLook(parseLook(undefined, profile.crawlerStyle)) : '',
        unlockedGearIds: Array.from(gearSet).slice(0, 60),
        unlockedAchievementIds: achIds,
        rewardedActionKeys: initialKeys,
        pendingLootBoxes: initialKeys.length >= 1 ? ['bronze'] : [],
      };
      knownActionKeysRef.current = new Set(currentSignals.keys());
      void saveCrawlerState(user.uid, bootstrapState, false, profile.displayName)
        .then(() => syncSocialCrawlerProfile(user.uid, bootstrapState, profile.displayName))
        .finally(() => {
          bootstrappingCrawlerRef.current = false;
        });
      return;
    }

    // 2. First settle with existing crawlerDoc: record baseline without firing toasts
    if (knownActionKeysRef.current === null) {
      knownActionKeysRef.current = new Set([
        ...crawlerDoc.rewardedActionKeys,
        ...currentSignals.keys(),
      ]);
      return;
    }

    // 3. Detect newly completed actions during active session
    const rewardedSet = new Set(crawlerDoc.rewardedActionKeys);
    const newlyTriggered: Array<{ key: string; xp: number; reason: string; sfx: 'xp' | 'habit' }> = [];

    currentSignals.forEach((sig, key) => {
      if (!knownActionKeysRef.current!.has(key) && !rewardedSet.has(key)) {
        newlyTriggered.push({ key, ...sig });
      }
      knownActionKeysRef.current!.add(key);
    });

    // Actions seen as done earlier this session that are no longer done: take the XP back
    currentSignals.forEach((_sig, key) => seenActionKeysRef.current.add(key));
    const revoked: { key: string; baseXp: number }[] = [];
    candidates.forEach((baseXp, key) => {
      if (rewardedSet.has(key) && seenActionKeysRef.current.has(key) && !currentSignals.has(key)) {
        revoked.push({ key, baseXp });
      }
    });

    const bossNeedsClear =
      weeklySummary.isBossSlain &&
      !crawlerDoc.clearedWeekKeys.includes(`w${profile.currentWeek}`);

    if (newlyTriggered.length === 0 && !bossNeedsClear && revoked.length === 0) {
      return;
    }

    if (revoked.length > 0 && newlyTriggered.length === 0 && !bossNeedsClear) {
      revoked.forEach(({ key }) => {
        knownActionKeysRef.current!.delete(key);
        seenActionKeysRef.current.delete(key);
      });
      const revokedState = revokeRewardedActions(crawlerDoc, revoked);
      void saveCrawlerState(user.uid, { ...crawlerDoc, ...revokedState }, true, profile.displayName).then(() =>
        syncSocialCrawlerProfile(user.uid, { ...crawlerDoc, ...revokedState }, profile.displayName)
      );
      return;
    }

    // Apply primary progression update
    const primary = newlyTriggered[0] ?? {
      key: `boss_w${profile.currentWeek}`,
      xp: 0,
      reason: `Defeated ${weeklySummary.bossName}`,
      sfx: 'xp' as const,
    };

    let workingState = crawlerDoc;
    const triggeredEvents: CrawlerRewardEvent[] = [];

    const actionsToRun = newlyTriggered.length > 0 ? newlyTriggered : [primary];
    for (const act of actionsToRun) {
      const { nextState, rewardEvent } = applyCrawlerProgressionUpdate({
        state: workingState,
        actionKey: act.key,
        baseXp: act.xp,
        reason: act.reason,
        allowCrit: true,
        weeklySummary,
        weekNumber: profile.currentWeek,
        totalCompletedWorkouts,
        hasWellFedDay,
        hasIronStomachWeek,
      });
      workingState = { ...workingState, ...nextState };
      if (rewardEvent) {
        triggeredEvents.push(rewardEvent);
      }
    }

    const aggregateEvent: CrawlerRewardEvent | null = triggeredEvents.reduce<CrawlerRewardEvent | null>(
      (acc, ev) => {
        if (!acc) return ev;
        const combinedAchievements = [
          ...(acc.newAchievements ?? []),
          ...(ev.newAchievements ?? []),
        ];
        return {
          ...acc,
          xpAdded: acc.xpAdded + ev.xpAdded,
          isCrit: acc.isCrit || ev.isCrit,
          leveledUpTo: ev.leveledUpTo ?? acc.leveledUpTo,
          newLootBox: ev.newLootBox ?? acc.newLootBox,
          newAchievements:
            combinedAchievements.length > 0 ? combinedAchievements : undefined,
        };
      },
      null
    );

    if (aggregateEvent) {
      const sfxType = aggregateEvent.leveledUpTo
        ? 'levelup'
        : aggregateEvent.newLootBox
        ? 'loot'
        : aggregateEvent.isCrit
        ? 'crit'
        : primary.sfx;
      playRetroSfx(sfxType, crawlerDoc.sfxEnabled);
      setRewardToast(aggregateEvent);
    }

    void saveCrawlerState(user.uid, workingState, true, profile.displayName).then(() =>
      syncSocialCrawlerProfile(user.uid, workingState, profile.displayName)
    );
  }, [
    user,
    profile,
    crawlerDoc,
    crawlerLoaded,
    workouts,
    workoutsLoaded,
    mealLogs,
    mealsLoaded,
    hydrationLogs,
    hydrationLoaded,
    habits,
    habitsLoaded,
    habitLogs,
    habitLogsLoaded,
    weeklySummary,
  ]);

  // Keep publicCrawler & guild member snapshot synced without loops
  useEffect(() => {
    if (!user || !profile || !crawlerDoc) return;
    const sig = JSON.stringify([
      crawlerDoc.crawlerName || profile.displayName,
      crawlerDoc.crawlerClass || 'Ironclad Vanguard',
      crawlerDoc.crawlerMotto || '',
      crawlerDoc.bannerTheme || 'amber',
      crawlerDoc.xp,
      crawlerDoc.level,
      crawlerDoc.weeklyClears,
      crawlerDoc.currentStreak,
      crawlerDoc.bestStreak,
      crawlerDoc.equippedSpriteTier,
      crawlerDoc.equippedWeapon,
      crawlerDoc.equippedArmor,
      crawlerDoc.equippedAccessory,
      crawlerDoc.equippedAura,
      crawlerDoc.unlockedAchievementIds.length,
      crawlerDoc.unlockedGearIds.length,
      crawlerDoc.guildId || '',
      crawlerDoc.guildName || '',
      crawlerDoc.isPublicProfile ?? false,
      crawlerDoc.look || '',
    ]);
    if (lastSocialSyncSigRef.current === sig) return;
    lastSocialSyncSigRef.current = sig;
    void syncSocialCrawlerProfile(user.uid, crawlerDoc, profile.displayName);
  }, [user, profile, crawlerDoc]);

  // Auto-dismiss reward toast after 6s
  useEffect(() => {
    if (!rewardToast) return;
    const t = window.setTimeout(() => setRewardToast(null), 6500);
    return () => window.clearTimeout(t);
  }, [rewardToast]);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#090d12] flex items-center justify-center p-6">
        <div className="space-y-3 w-full max-w-md">
          <div className="h-5 w-32 bg-[#1a2332] rounded animate-pulse" />
          <div className="h-24 w-full bg-[#131a24] border border-[#263347] rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthGate />;
  }

  if (!profileChecked) {
    return (
      <div className="min-h-screen bg-[#090d12] flex items-center justify-center p-6">
        <div className="space-y-4 w-full max-w-2xl">
          <div className="h-6 w-48 bg-[#1a2332] rounded animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-24 bg-[#131a24] border border-[#263347] rounded-xl animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    const handleBootstrap = async (includeStarter: boolean) => {
      setInitializingWorkspace(true);
      setBootstrapError(null);
      try {
        await initializeUserWorkspace(
          user.uid,
          user.displayName || user.email?.split('@')[0] || 'Crawler',
          includeStarter,
          onboardSex,
          onboardStyle
        );
      } catch (err) {
        // Without this the screen just stays put and the user sees nothing happen.
        let detail = err instanceof Error ? err.message : String(err);
        try {
          detail = JSON.parse(detail).error ?? detail;
        } catch {
          // not our wrapped JSON error; show as is
        }
        console.error('Workspace bootstrap failed:', err);
        setBootstrapError(detail);
      } finally {
        setInitializingWorkspace(false);
      }
    };

    return (
      <div className="min-h-screen bg-[#090d12] flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-[#131a24] border-2 border-[#2a384e] rounded-xl p-8 shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <p className="font-pixel text-xs text-amber-400 mb-3">
              {t('THE HUNTING GROUNDS')}
            </p>
            <LanguageToggle />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">
            {t('Enter your training and discipline workspace')}
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed mb-6">
            {t('Start with a 4-week sample hypertrophy program, 4 high-protein recipes, and check-in history so you can explore charts right away — or open a clean Week 1 slate to import your own CSV schedule.')}
          </p>

          <div className="mb-6">
            <IdentityFields
              sex={onboardSex}
              crawlerStyle={onboardStyle}
              onSexChange={setOnboardSex}
              onStyleChange={setOnboardStyle}
            />
          </div>

          {bootstrapError && (
            <div role="alert" className="mb-4 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200">
              <p className="font-semibold">{t('Could not create your workspace. Try again.')}</p>
              <p className="mt-1 break-words font-mono text-[11px] text-rose-300/80">{bootstrapError}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              disabled={initializingWorkspace}
              onClick={() => void handleBootstrap(true)}
              className="min-h-[44px] px-4 py-3 text-sm font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg transition-colors"
            >
              {initializingWorkspace ? t('Entering Dungeon...') : t('Load 4-Week Starter Plan')}
            </button>
            <button
              type="button"
              disabled={initializingWorkspace}
              onClick={() => void handleBootstrap(false)}
              className="min-h-[44px] px-4 py-3 text-sm font-semibold text-slate-200 bg-[#1a2332] border border-[#2d3c54] hover:bg-[#233044] disabled:opacity-50 rounded-lg transition-colors"
            >
              {t('Start Blank (Week 1)')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeNavLabel = t(NAV_ITEMS.find((item) => item.id === activeNav)?.label ?? 'Overview');

  const handleOpenQuickCheckIn = () => {
    setActiveNav('measurements');
    setQuickMeasOpen(true);
  };

  const handleOpenQuickFood = (week: number, day: number, slot: MealSlot = 'on_the_spot') => {
    setQuickFoodDefaults({ week, day, slot });
    setQuickFoodOpen(true);
  };

  const handleOpenCsvImport = (mode: CsvImportTarget, week: number, day = 0) => {
    setCsvImportState({ open: true, mode, week, day });
  };

  const handleGuideAction = (actionType: GuideActionType) => {
    const jsDay = new Date().getDay();
    const todayIdx = jsDay === 0 ? 6 : jsDay - 1;
    switch (actionType) {
      case 'open_settings':
        setSettingsOpen(true);
        break;
      case 'open_armory':
        setActiveNav('overview');
        setArmoryState({ open: true, tab: 'armory' });
        break;
      case 'open_quick_food':
        handleOpenQuickFood(profile.currentWeek, todayIdx, 'on_the_spot');
        break;
      case 'open_diet_add_meal':
        setActiveNav('diet');
        setDietOpenMealText(true);
        break;
      case 'go_diet_tab':
        setActiveNav('diet');
        break;
      case 'go_gym_tab':
        setActiveNav('gym');
        break;
      case 'open_gym_picker':
        setActiveNav('gym');
        setGymExternalAction('picker');
        break;
      case 'open_gym_templates':
        setActiveNav('gym');
        setGymExternalAction('templates');
        break;
      case 'open_measurement_modal':
        handleOpenQuickCheckIn();
        break;
      case 'scroll_to_habits': {
        setActiveNav('overview');
        const reduced =
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.setTimeout(() => {
          document.getElementById('habits-card')?.scrollIntoView({
            behavior: reduced ? 'auto' : 'smooth',
            block: 'start',
          });
        }, 60);
        break;
      }
    }
  };

  const guideHostTab: GuideHostTab | null =
    activeNav === 'overview' ||
    activeNav === 'gym' ||
    activeNav === 'diet' ||
    activeNav === 'measurements'
      ? activeNav
      : null;

  const handleUpdateCrawler = async (next: Omit<CrawlerState, 'createdAt' | 'updatedAt'>) => {
    await saveCrawlerState(user.uid, next, Boolean(crawlerDoc), profile.displayName);
    lastSocialSyncSigRef.current = JSON.stringify([
      next.crawlerName || profile.displayName,
      next.crawlerClass || 'Ironclad Vanguard',
      next.crawlerMotto || '',
      next.bannerTheme || 'amber',
      next.xp,
      next.level,
      next.weeklyClears,
      next.currentStreak,
      next.bestStreak,
      next.equippedSpriteTier,
      next.equippedWeapon,
      next.equippedArmor,
      next.equippedAccessory,
      next.equippedAura,
      next.unlockedAchievementIds.length,
      next.unlockedGearIds.length,
      next.guildId || '',
      next.guildName || '',
      next.isPublicProfile ?? false,
      next.look || '',
    ]);
    await syncSocialCrawlerProfile(user.uid, next, profile.displayName);
  };

  const handleToggleSfx = () => {
    const nextEnabled = !effectiveCrawler.sfxEnabled;
    if (nextEnabled) {
      playRetroSfx('xp', true);
    }
    void saveCrawlerState(
      user.uid,
      {
        ...effectiveCrawler,
        sfxEnabled: nextEnabled,
      },
      Boolean(crawlerDoc),
      profile.displayName
    );
  };

  const mobileBottomItems = NAV_ITEMS.filter((i) => i.id !== 'charts' && i.id !== 'guild');

  return (
    <div className="min-h-screen bg-[#090d12] text-slate-100 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 bg-[#0d121a] border-r border-[#1f293a] justify-between">
        <div>
          <div className="px-6 py-5 border-b border-[#1f293a] flex items-center justify-between gap-2">
            <div>
              <span className="font-pixel text-sm tracking-tight text-amber-400 whitespace-nowrap block">
                Fitness Crawler
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {t('Floor {n}', { n: weeklySummary.bossFloor })} · {t('LV {n}', { n: effectiveCrawler.level })} {t('Crawler')}
              </span>
            </div>
          </div>

          <div className="px-4 pt-5 pb-3">
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="w-full text-left p-3 rounded-lg bg-[#131a24] border border-[#263347] hover:border-amber-500/50 transition-colors"
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{t('Current Week')}</span>
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </div>
              <p className="text-sm font-semibold text-white mt-0.5 tabular-nums">
                {t('Week {n} · {phase}', { n: profile.currentWeek, phase: profile.phaseName })}
              </p>
            </button>
          </div>

          <nav className="px-3 py-2 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveNav(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-[#151e2b] border border-transparent'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  />
                  {t(item.label)}
                </button>
              );
            })}
          </nav>

          {effectiveCrawler.pendingLootBoxes.length > 0 && (
            <div className="px-4 pt-2">
              <button
                type="button"
                onClick={() => setArmoryState({ open: true, tab: 'loot' })}
                className="w-full min-h-[40px] px-3 py-2 rounded-lg bg-amber-500/15 border border-amber-400/50 hover:bg-amber-500/25 text-amber-300 text-xs font-semibold flex items-center justify-between gap-2 transition-colors"
              >
                <span className="inline-flex items-center gap-2">
                  <img
                    src={getLootChestImg(effectiveCrawler.pendingLootBoxes[0])}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-4 h-4 rounded-[2px] pixel-art object-cover shrink-0"
                  />
                  {t('Loot Boxes Ready')}
                </span>
                <span className="font-mono">{effectiveCrawler.pendingLootBoxes.length}</span>
              </button>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[#1f293a] space-y-3">
          <PWAInstallButton />
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {profile.displayName}
              </p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={() => void signOut(auth)}
              aria-label={t('Sign out')}
              title={t('Sign out')}
              className="p-2 text-slate-400 hover:text-white hover:bg-[#1a2332] rounded-lg transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative z-10 w-64 bg-[#0d121a] h-full border-r border-[#1f293a] flex flex-col justify-between">
            <div>
              <div className="px-5 py-4 border-b border-[#1f293a] flex items-center justify-between">
                <span className="font-pixel text-sm text-amber-400">Fitness Crawler</span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label={t('Close navigation')}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <nav className="p-3 space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNav === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveNav(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full min-h-[44px] flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg ${
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'text-slate-300 hover:bg-[#151e2b]'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {t(item.label)}
                    </button>
                  );
                })}
              </nav>
            </div>
            <div className="p-4 border-t border-[#1f293a] space-y-3">
              <PWAInstallButton />
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 truncate">{profile.displayName}</span>
                <button
                  type="button"
                  onClick={() => void signOut(auth)}
                  className="min-h-[40px] px-2 text-xs font-medium text-slate-300 hover:text-white"
                >
                  {t('Sign out')}
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <header className="bg-[#0d121a] border-b border-[#1f293a] px-4 sm:px-8 py-2.5 sm:py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label={t('Open menu')}
              className="lg:hidden min-h-[40px] min-w-[40px] flex items-center justify-center -ml-2 text-slate-300 hover:text-white rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm text-slate-400 min-w-0">
              <span className="whitespace-nowrap font-mono text-amber-400">
                W{profile.currentWeek}
              </span>
              <span className="text-slate-600">/</span>
              <span className="font-semibold text-white truncate">{activeNavLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
          <LanguageToggle />
          <button
            type="button"
            onClick={handleOpenQuickCheckIn}
            className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('Log Check-in')}
          </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-28 lg:pb-24 max-w-[1280px] w-full mx-auto">
          {importFeedback && (
            <div className="mb-4 flex items-center justify-between gap-3 px-4 py-2.5 text-xs font-medium text-emerald-200 bg-emerald-950/50 border border-emerald-500/40 rounded-lg">
              <span>{importFeedback}</span>
              <button
                type="button"
                onClick={() => setImportFeedback(null)}
                aria-label={t('Dismiss import notice')}
                className="p-1 text-emerald-300 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {(activeNav === 'measurements' || activeNav === 'charts') && (
            <div className="lg:hidden flex items-center gap-1 p-1 bg-[#131a24] border border-[#263347] rounded-lg mb-4">
              <button
                type="button"
                onClick={() => setActiveNav('measurements')}
                className={`flex-1 min-h-[40px] text-xs font-medium rounded-md transition-colors ${
                  activeNav === 'measurements'
                    ? 'bg-emerald-500 text-slate-950 font-semibold'
                    : 'text-slate-300'
                }`}
              >
                {t('Measurements')}
              </button>
              <button
                type="button"
                onClick={() => setActiveNav('charts')}
                className={`flex-1 min-h-[40px] text-xs font-medium rounded-md transition-colors ${
                  activeNav === 'charts'
                    ? 'bg-emerald-500 text-slate-950 font-semibold'
                    : 'text-slate-300'
                }`}
              >
                {t('Progress Charts')}
              </button>
            </div>
          )}

          {activeNav === 'overview' && (
            <OverviewView
              uid={user.uid}
              profile={profile}
              workouts={workouts}
              mealLogs={mealLogs}
              hydrationLogs={hydrationLogs}
              habits={habits}
              habitLogs={habitLogs}
              measurements={measurements}
              crawler={effectiveCrawler}
              weeklySummary={weeklySummary}
              onOpenArmory={(tab = 'armory') => setArmoryState({ open: true, tab })}
              onToggleSfx={handleToggleSfx}
              onNavigate={setActiveNav}
              onOpenSettings={() => setSettingsOpen(true)}
              onOpenQuickMeasurement={handleOpenQuickCheckIn}
              onOpenQuickFood={handleOpenQuickFood}
            />
          )}

          {activeNav === 'gym' && (
            <GymPlanView
              uid={user.uid}
              profile={profile}
              workouts={workouts}
              workoutPlans={workoutPlans}
              mealLogs={mealLogs}
              crawler={effectiveCrawler}
              onOpenCsvImport={(wk, day) => handleOpenCsvImport('training', wk, day)}
              externalAction={gymExternalAction}
              onConsumeExternalAction={() => setGymExternalAction(null)}
            />
          )}

          {activeNav === 'diet' && (
            <DietPlanView
              uid={user.uid}
              profile={profile}
              mealLogs={mealLogs}
              hydrationLogs={hydrationLogs}
              recipes={recipes}
              customFoods={customFoods}
              onNavigateToRecipes={() => setActiveNav('recipes')}
              onOpenQuickFood={handleOpenQuickFood}
              crawler={effectiveCrawler}
              onOpenCsvImport={(wk, day) => handleOpenCsvImport('diet', wk, day)}
              onGuideCheer={() => setGuideCheer((n) => n + 1)}
              externalOpenMealText={dietOpenMealText}
              onCloseExternalMealText={() => setDietOpenMealText(false)}
            />
          )}

          {activeNav === 'recipes' && (
            <RecipesView uid={user.uid} profile={profile} recipes={recipes} />
          )}

          {activeNav === 'measurements' && (
            <MeasurementsView
              uid={user.uid}
              profile={profile}
              measurements={measurements}
              externalOpenCreate={quickMeasOpen}
              onCloseExternalCreate={() => setQuickMeasOpen(false)}
            />
          )}

          {activeNav === 'charts' && (
            <ProgressChartsView
              profile={profile}
              workouts={workouts}
              mealLogs={mealLogs}
              hydrationLogs={hydrationLogs}
              measurements={measurements}
            />
          )}

          {activeNav === 'guild' && (
            <GuildView
              uid={user.uid}
              displayName={profile.displayName}
              crawler={effectiveCrawler}
              crawlerDocExists={Boolean(crawlerDoc)}
              onOpenCustomize={() => setArmoryState({ open: true, tab: 'customize' })}
            />
          )}
        </main>
      </div>

      {/* Dungeon Reward / Loot / Achievement Toast */}
      {rewardToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-16 lg:bottom-6 right-4 z-50 max-w-sm w-[calc(100%-2rem)] bg-[#131a24] border-2 border-amber-400 rounded-xl p-4 shadow-2xl space-y-2"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-pixel text-[11px] text-amber-400">
                  {rewardToast.leveledUpTo
                    ? t('LEVEL UP! LV {n}', { n: rewardToast.leveledUpTo })
                    : rewardToast.isCrit
                    ? t('2X CRITICAL DISCIPLINE!')
                    : t('DUNGEON REWARD')}
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400 tabular-nums">
                  +{rewardToast.xpAdded} XP
                </span>
              </div>
              <p className="text-xs text-slate-200 mt-1">{translateReason(t, rewardToast.reason)}</p>
            </div>
            <button
              type="button"
              onClick={() => setRewardToast(null)}
              aria-label={t('Dismiss reward notification')}
              className="p-1 text-slate-400 hover:text-white shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {rewardToast.newAchievements && rewardToast.newAchievements.length > 0 && (
            <p className="text-[11px] text-emerald-300 font-medium">
              {t(rewardToast.newAchievements[0])}
            </p>
          )}

          {(rewardToast.newLootBox || rewardToast.leveledUpTo) && (
            <button
              type="button"
              onClick={() => {
                setArmoryState({
                  open: true,
                  tab: rewardToast.newLootBox ? 'loot' : 'armory',
                });
                setRewardToast(null);
              }}
              className="w-full min-h-[36px] px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              {rewardToast.newLootBox ? (
                <img
                  src={getLootChestImg(rewardToast.newLootBox)}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-4 h-4 rounded-[2px] pixel-art object-cover"
                />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              {rewardToast.newLootBox
                ? t('Open {tier} Loot Box', { tier: t(rewardToast.newLootBox).toUpperCase() })
                : t('Inspect New Sprite & Gear')}
            </button>
          )}
        </div>
      )}

      {guideHostTab && (
        <GuideCorner
          activeTab={guideHostTab}
          cheer={guideCheer}
          onAction={handleGuideAction}
        />
      )}

      {/* Mobile Fixed Thumb-Zone Bottom Tab Bar */}
      <nav
        aria-label={t('Mobile navigation')}
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-[#0d121a]/95 backdrop-blur-md border-t border-[#1f293a] grid grid-cols-5 items-center"
      >
        {mobileBottomItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            activeNav === item.id ||
            (item.id === 'measurements' && activeNav === 'charts');
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveNav(item.id)}
              className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors ${
                isActive ? 'text-amber-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium tracking-tight">{t(item.shortLabel)}</span>
            </button>
          );
        })}
      </nav>

      <CrawlerArmoryModal
        open={armoryState.open}
        initialTab={armoryState.tab}
        onClose={() => setArmoryState((prev) => ({ ...prev, open: false }))}
        crawler={effectiveCrawler}
        spriteStyle={profile.crawlerStyle}
        onUpdateCrawler={handleUpdateCrawler}
      />

      <ProgramSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        profile={profile}
        uid={user.uid}
      />

      <QuickFoodModal
        open={quickFoodOpen}
        onClose={() => setQuickFoodOpen(false)}
        uid={user.uid}
        profile={profile}
        customFoods={customFoods}
        defaultWeek={quickFoodDefaults.week}
        defaultDay={quickFoodDefaults.day}
        defaultSlot={quickFoodDefaults.slot}
      />

      <CsvImportModal
        open={csvImportState.open}
        onClose={() => setCsvImportState((prev) => ({ ...prev, open: false }))}
        initialMode={csvImportState.mode}
        uid={user.uid}
        unitSystem={profile.unitSystem}
        defaultWeek={csvImportState.week}
        defaultDay={csvImportState.day}
        mealsPerDay={profile.mealsPerDay ?? 6}
        existingWorkouts={workouts}
        existingPlans={workoutPlans}
        existingMeals={mealLogs}
        onImported={(summary) => setImportFeedback(summary)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <WorkspaceShell />
      </LanguageProvider>
    </ErrorBoundary>
  );
}
