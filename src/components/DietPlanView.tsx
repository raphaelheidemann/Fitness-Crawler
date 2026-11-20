import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  MoreHorizontal,
  Plus,
  Repeat,
  Search,
  ShoppingBag,
  Trash2,
  Upload,
  Utensils,
  Wand2,
  X,
} from 'lucide-react';
import {
  buildDailyMealSlots,
  CrawlerState,
  DAY_FULL,
  DAY_SHORT,
  HydrationLog,
  MealLog,
  MealSlot,
  normalizeSlotToBucket,
  Recipe,
  SCHEMA_LIMITS,
  UserProfile,
} from '../types';
import { Food } from '../lib/foodDb';
import { useT } from '../lib/i18n';
import {
  createMealLog,
  deleteMealLog,
  toggleMealConsumed,
  updateMealsPerDay,
} from '../lib/firestoreService';
import { HydrationCard } from './HydrationCard';
import { DietGeneratorModal } from './DietGeneratorModal';
import { FoodPickerModal, FoodPickerTarget } from './FoodPickerModal';
import { MealTextModal } from './MealTextModal';
import { FoodIcon } from './FoodIcon';

interface Props {
  uid: string;
  profile: UserProfile;
  mealLogs: MealLog[];
  hydrationLogs: HydrationLog[];
  recipes: Recipe[];
  customFoods: Food[];
  onNavigateToRecipes: () => void;
  onOpenQuickFood: (week: number, day: number, slot?: MealSlot) => void;
  crawler?: CrawlerState;
  onOpenCsvImport: (week: number, day: number) => void;
  onGuideCheer?: () => void;
  externalOpenMealText?: boolean;
  onCloseExternalMealText?: () => void;
}

export const DietPlanView: React.FC<Props> = ({
  uid,
  profile,
  mealLogs,
  hydrationLogs,
  recipes,
  customFoods,
  onNavigateToRecipes,
  onOpenQuickFood,
  crawler,
  onOpenCsvImport,
  onGuideCheer,
  externalOpenMealText,
  onCloseExternalMealText,
}) => {
  const t = useT();
  const slotLabel = (label: string) =>
    label.startsWith('Meal ') ? t('Meal {n}', { n: label.slice(5) }) : t(label);
  const [selectedWeek, setSelectedWeek] = useState(profile.currentWeek);
  const [selectedDay, setSelectedDay] = useState((new Date().getDay() + 6) % 7); // today, Mon=0
  const [showGrocery, setShowGrocery] = useState(false);
  const [foodTarget, setFoodTarget] = useState<FoodPickerTarget | null>(null);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [mealTextOpen, setMealTextOpen] = useState(false);
  const [addMenuSlot, setAddMenuSlot] = useState<MealSlot | null>(null);
  const todayIdx = (new Date().getDay() + 6) % 7;
  const [checkedGrocery, setCheckedGrocery] = useState<Record<string, boolean>>({});

  const mealsPerDay = profile.mealsPerDay ?? 6;
  const dailySlots = useMemo(() => buildDailyMealSlots(mealsPerDay), [mealsPerDay]);

  // Recipe picker modal
  const [recipePickerSlot, setRecipePickerSlot] = useState<MealSlot | null>(null);
  const [recipeSearch, setRecipeSearch] = useState('');
  const [selectedServings, setSelectedServings] = useState(1);

  // Custom meal modal
  const [customSlot, setCustomSlot] = useState<MealSlot | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [customCalories, setCustomCalories] = useState(400);
  const [customProtein, setCustomProtein] = useState(30);
  const [customCarbs, setCustomCarbs] = useState(45);
  const [customFat, setCustomFat] = useState(12);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setSelectedWeek(profile.currentWeek);
  }, [profile.currentWeek]);

  useEffect(() => {
    if (externalOpenMealText) {
      setMealTextOpen(true);
      onCloseExternalMealText?.();
    }
  }, [externalOpenMealText, onCloseExternalMealText]);

  const weekMeals = useMemo(
    () => mealLogs.filter((m) => m.weekNumber === selectedWeek),
    [mealLogs, selectedWeek]
  );

  const dayMeals = useMemo(
    () => weekMeals.filter((m) => m.dayIndex === selectedDay),
    [weekMeals, selectedDay]
  );

  const dayHydration = useMemo(
    () =>
      hydrationLogs.find(
        (h) => h.weekNumber === selectedWeek && h.dayIndex === selectedDay
      ),
    [hydrationLogs, selectedWeek, selectedDay]
  );

  const recipeMap = useMemo(() => {
    const map = new Map<string, Recipe>();
    recipes.forEach((r) => map.set(r.id, r));
    return map;
  }, [recipes]);

  const totals = useMemo(() => {
    return dayMeals.reduce(
      (acc, m) => {
        acc.plannedKcal += m.calories;
        acc.plannedP += m.proteinG;
        acc.plannedC += m.carbsG;
        acc.plannedF += m.fatG;
        if (m.consumed) {
          acc.consumedKcal += m.calories;
          acc.consumedP += m.proteinG;
          acc.consumedC += m.carbsG;
          acc.consumedF += m.fatG;
        }
        return acc;
      },
      {
        plannedKcal: 0,
        plannedP: 0,
        plannedC: 0,
        plannedF: 0,
        consumedKcal: 0,
        consumedP: 0,
        consumedC: 0,
        consumedF: 0,
      }
    );
  }, [dayMeals]);

  const weeklyIngredients = useMemo(() => {
    const counts = new Map<string, number>();
    weekMeals.forEach((m) => {
      if (!m.recipeId) return;
      const rec = recipeMap.get(m.recipeId);
      if (!rec) return;
      rec.ingredients.forEach((ing) => {
        const key = ing.trim();
        if (!key) return;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      });
    });
    return Array.from(counts.entries()).map(([ingredient, count]) => ({
      ingredient,
      count,
    }));
  }, [weekMeals, recipeMap]);

  const filteredRecipes = useMemo(() => {
    const q = recipeSearch.trim().toLowerCase();
    return recipes.filter(
      (r) =>
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.ingredients.some((i) => i.toLowerCase().includes(q))
    );
  }, [recipes, recipeSearch]);

  const handleAddFromRecipe = async (recipe: Recipe) => {
    if (!recipePickerSlot) return;
    setSubmitting(true);
    try {
      await createMealLog(uid, {
        weekNumber: selectedWeek,
        dayIndex: selectedDay,
        slot: recipePickerSlot,
        title: recipe.title,
        recipeId: recipe.id,
        servings: selectedServings,
        calories: Math.round(recipe.calories * selectedServings),
        proteinG: Number((recipe.proteinG * selectedServings).toFixed(1)),
        carbsG: Number((recipe.carbsG * selectedServings).toFixed(1)),
        fatG: Number((recipe.fatG * selectedServings).toFixed(1)),
        consumed: false,
      });
      setRecipePickerSlot(null);
      setRecipeSearch('');
      setSelectedServings(1);
    } finally {
      setSubmitting(false);
    }
  };

  const [copying, setCopying] = useState(false);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);

  /** Copies every meal from another day onto the selected day (nothing is deleted). */
  const handleCopyDay = async (source: 'yesterday' | 'lastWeek') => {
    let week = selectedWeek;
    let day = selectedDay;
    if (source === 'yesterday') {
      if (day === 0) {
        week -= 1;
        day = 6;
      } else day -= 1;
    } else week -= 1;
    const src = mealLogs.filter((m) => m.weekNumber === week && m.dayIndex === day);
    if (week < 1 || src.length === 0) {
      setCopyMsg(t('Nothing to copy from that day.'));
      return;
    }
    setCopying(true);
    setCopyMsg(null);
    try {
      for (const m of src) {
        await createMealLog(uid, {
          weekNumber: selectedWeek,
          dayIndex: selectedDay,
          slot: m.slot,
          title: m.title,
          recipeId: m.recipeId,
          servings: m.servings,
          calories: m.calories,
          proteinG: m.proteinG,
          carbsG: m.carbsG,
          fatG: m.fatG,
          consumed: false,
        });
      }
      setCopyMsg(t('Copied {n} items.', { n: src.length }));
    } catch {
      setCopyMsg(t('Something went wrong. Check your connection and try again.'));
    } finally {
      setCopying(false);
    }
  };

  const handleAddCustomMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSlot) return;
    setSubmitting(true);
    try {
      await createMealLog(uid, {
        weekNumber: selectedWeek,
        dayIndex: selectedDay,
        slot: customSlot,
        title: customTitle,
        recipeId: '',
        servings: 1,
        calories: customCalories,
        proteinG: customProtein,
        carbsG: customCarbs,
        fatG: customFat,
        consumed: false,
      });
      setCustomSlot(null);
      setCustomTitle('');
    } finally {
      setSubmitting(false);
    }
  };

  const macroBars = [
    {
      label: 'Calories',
      consumed: Math.round(totals.consumedKcal),
      planned: Math.round(totals.plannedKcal),
      target: profile.dailyCalorieTarget,
      unit: 'kcal',
      barColor: 'bg-emerald-400',
    },
    {
      label: 'Protein',
      consumed: Math.round(totals.consumedP),
      planned: Math.round(totals.plannedP),
      target: profile.proteinTargetG,
      unit: 'g',
      barColor: 'bg-sky-400',
    },
    {
      label: 'Carbs',
      consumed: Math.round(totals.consumedC),
      planned: Math.round(totals.plannedC),
      target: profile.carbsTargetG,
      unit: 'g',
      barColor: 'bg-amber-400',
    },
    {
      label: 'Fat',
      consumed: Math.round(totals.consumedF),
      planned: Math.round(totals.plannedF),
      target: profile.fatTargetG,
      unit: 'g',
      barColor: 'bg-violet-400',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-[#131a24] border-2 border-[#263347] rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span>{t('Daily Rations & Macro Log (+25 XP/day)')}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              {t('Target {kcal} kcal ({p}g P / {c}g C / {f}g F)', {
                kcal: profile.dailyCalorieTarget.toLocaleString(),
                p: profile.proteinTargetG,
                c: profile.carbsTargetG,
                f: profile.fatTargetG,
              })}
            </span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1">
            {t('Week {week} Diet Plan', { week: selectedWeek })}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Week switcher */}
          <div className="inline-flex items-center border border-[#2d3c54] rounded-lg bg-[#0e141d] p-1 min-h-[44px]">
            <button
              type="button"
              onClick={() => setSelectedWeek((w) => Math.max(1, w - 1))}
              disabled={selectedWeek <= 1}
              aria-label={t('Previous week')}
              className="p-2 text-slate-400 hover:text-white hover:bg-[#1a2434] rounded-md disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <select
              aria-label={t('Select diet week')}
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(Number(e.target.value))}
              className="bg-transparent px-2 text-xs font-mono font-medium text-slate-100 focus:outline-none tabular-nums"
            >
              {Array.from({ length: 52 }, (_, i) => i + 1).map((wk) => (
                <option key={wk} value={wk} className="bg-[#0e141d] text-slate-100">
                  {t('Week {n}', { n: wk })}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setSelectedWeek((w) => Math.min(52, w + 1))}
              disabled={selectedWeek >= 52}
              aria-label={t('Next week')}
              className="p-2 text-slate-400 hover:text-white hover:bg-[#1a2434] rounded-md disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMealTextOpen(true)}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('Add meal')}
          </button>

          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-200 bg-[#1a2332] border border-[#2d3c54] hover:bg-[#233044] rounded-lg transition-colors whitespace-nowrap"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
            {t('More')}
          </button>
        </div>

        {moreOpen && (
          <div className="w-full flex flex-wrap items-center gap-2.5 pt-3 border-t border-[#1e293b]">
            <button
              type="button"
              onClick={() => onOpenQuickFood(selectedWeek, selectedDay, 'on_the_spot')}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-200 bg-[#1a2332] border border-[#2d3c54] hover:bg-[#233044] rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              {t('Log Food Eaten')}
            </button>
            <button
              type="button"
              onClick={() => setGeneratorOpen(true)}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap"
            >
              <Wand2 className="w-3.5 h-3.5" />
              {t('Basic Diet Plan')}
            </button>
            <button
              type="button"
              onClick={() => setShowGrocery((v) => !v)}
              className={`min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                showGrocery
                  ? 'bg-amber-400 text-slate-950 border-amber-400 font-semibold'
                  : 'bg-[#1a2332] text-slate-200 border-[#2d3c54] hover:bg-[#233044]'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              {t('Grocery ({n})', { n: weeklyIngredients.length })}
            </button>
            <button
              type="button"
              onClick={() => onOpenCsvImport(selectedWeek, selectedDay)}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-200 bg-[#1a2332] border border-[#2d3c54] hover:bg-[#233044] rounded-lg transition-colors whitespace-nowrap"
            >
              <Upload className="w-3.5 h-3.5" />
              {t('CSV Templates & Import')}
            </button>
            {(['yesterday', 'lastWeek'] as const).map((src) => (
              <button
                key={src}
                type="button"
                disabled={copying}
                onClick={() => void handleCopyDay(src)}
                className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-200 bg-[#1a2332] border border-[#2d3c54] hover:bg-[#233044] disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap"
              >
                <Copy className="w-3.5 h-3.5" />
                {src === 'yesterday' ? t('Copy yesterday here') : t('Copy same day last week')}
              </button>
            ))}
            {copyMsg && <span className="text-xs text-amber-300">{copyMsg}</span>}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#2d3c54] rounded-lg bg-[#0e141d] min-h-[44px]">
              <label htmlFor="meals-per-day" className="text-xs font-medium text-slate-400 whitespace-nowrap">
                {t('Meals / day')}
              </label>
              <select
                id="meals-per-day"
                value={mealsPerDay}
                onChange={(e) => void updateMealsPerDay(uid, Number(e.target.value))}
                className="text-xs font-mono font-semibold text-white bg-transparent focus:outline-none tabular-nums"
              >
                {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option key={n} value={n} className="bg-[#0e141d] text-slate-100">
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Day Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {DAY_SHORT.map((short, idx) => {
          const count = weekMeals.filter((m) => m.dayIndex === idx).length;
          const kcal = Math.round(
            weekMeals.filter((m) => m.dayIndex === idx).reduce((s, m) => s + m.calories, 0)
          );
          const active = selectedDay === idx;
          return (
            <button
              key={short}
              type="button"
              onClick={() => setSelectedDay(idx)}
              className={`min-h-[48px] px-4 py-2 rounded-lg border-2 text-left transition-colors shrink-0 min-w-[106px] ${
                active
                  ? 'bg-[#1b2535] text-white border-amber-400'
                  : 'bg-[#131a24] text-slate-200 border-[#263347] hover:border-[#394c69]'
              }`}
            >
              <p className={`text-xs font-semibold ${active ? 'text-amber-400' : 'text-white'}`}>
                {short}
                {idx === todayIdx && (
                  <span className="ml-1.5 text-[10px] font-mono text-emerald-300">{t('today')}</span>
                )}
              </p>
              <p className="text-[11px] tabular-nums mt-0.5 text-slate-400">
                {t('{n} items · {kcal} kcal', { n: count, kcal })}
              </p>
            </button>
          );
        })}
      </div>

      {/* Macro Summary Strip: RPG stat bars, 10 blocks each, shows what is left */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {macroBars.map((bar) => {
          const ratio = bar.consumed / Math.max(1, bar.target);
          const blocks = Math.min(10, Math.floor(ratio * 10));
          const left = bar.target - bar.consumed;
          const over = left < 0;
          const rpg: Record<string, string> = {
            Calories: 'HP · Rations',
            Protein: 'STR · Protein',
            Carbs: 'AGI · Carbs',
            Fat: 'INT · Fat',
          };
          return (
            <div key={bar.label} className="bg-[#131a24] border-2 border-[#263347] rounded-xl p-4">
              <p className="font-pixel text-[10px] text-amber-400 mb-1.5">{t(rpg[bar.label] ?? bar.label)}</p>
              <p className="text-base sm:text-lg font-bold text-white font-mono tabular-nums">
                {bar.consumed.toLocaleString()}
                <span className="text-xs font-normal text-slate-400 ml-1">
                  / {bar.target.toLocaleString()} {bar.unit}
                </span>
              </p>
              <div
                className="flex gap-0.5 my-2"
                role="progressbar"
                aria-label={t(bar.label)}
                aria-valuemin={0}
                aria-valuemax={bar.target}
                aria-valuenow={bar.consumed}
              >
                {Array.from({ length: 10 }, (_, i) => (
                  <span
                    key={i}
                    className={`h-2.5 flex-1 ${
                      i < blocks ? (over ? 'bg-rose-400' : bar.barColor) : 'bg-[#0a0f16]'
                    }`}
                  />
                ))}
              </div>
              <p
                className={`text-xs font-mono tabular-nums ${over ? 'text-rose-300' : 'text-slate-300'}`}
              >
                {over
                  ? t('{n} {unit} over', { n: Math.abs(left).toLocaleString(), unit: bar.unit })
                  : t('{n} {unit} left', { n: left.toLocaleString(), unit: bar.unit })}
              </p>
              {bar.planned > bar.consumed && (
                <p className="text-[11px] text-slate-400 tabular-nums">
                  {t('Planned: {n} {unit}', { n: bar.planned.toLocaleString(), unit: bar.unit })}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Daily Hydration Tracker */}
      <HydrationCard
        uid={uid}
        weekNumber={selectedWeek}
        dayIndex={selectedDay}
        unitSystem={profile.unitSystem}
        defaultGoalMl={profile.dailyWaterGoalMl ?? 3000}
        hydrationLog={dayHydration}
      />

      {/* Main Split: Meal Slots + Optional Weekly Grocery Drawer */}
      <div className={`grid grid-cols-1 ${showGrocery ? 'lg:grid-cols-12' : ''} gap-6`}>
        <div className={`${showGrocery ? 'lg:col-span-8' : ''} space-y-4`}>
          {weekMeals.length === 0 && (
            <div className="bg-[#131a24] border-2 border-amber-400/50 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white">{t('Start here')}</h2>
              <p className="text-xs text-slate-300 mt-1">
                {t('Your week is empty. Let the app build a plan from your goal, or add foods meal by meal below.')}
              </p>
              <button
                type="button"
                onClick={() => setGeneratorOpen(true)}
                className="mt-3 min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
              >
                <Wand2 className="w-3.5 h-3.5" />
                {t('Basic Diet Plan')}
              </button>
            </div>
          )}
          {dailySlots.map(({ key, label }) => {
            const slotMeals = dayMeals.filter(
              (m) => normalizeSlotToBucket(m.slot, mealsPerDay) === key
            );
            const slotCalories = Math.round(
              slotMeals.reduce((acc, m) => acc + m.calories, 0)
            );
            const isOnTheSpot = key === 'on_the_spot';

            return (
              <div key={key} className="bg-[#131a24] border-2 border-[#263347] rounded-xl p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1e293b]">
                  <div className="flex items-baseline gap-2.5">
                    <h2 className="text-sm font-semibold text-white">{slotLabel(label)}</h2>
                    <span className="text-xs font-mono text-slate-400 tabular-nums">
                      {slotCalories} kcal
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOnTheSpot ? (
                      <button
                        type="button"
                        onClick={() => onOpenQuickFood(selectedWeek, selectedDay, 'on_the_spot')}
                        className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/40 hover:bg-emerald-500/25 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {t('Log On-the-Spot Food')}
                      </button>
                    ) : (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setAddMenuSlot(addMenuSlot === key ? null : key)}
                          aria-expanded={addMenuSlot === key}
                          className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/40 hover:bg-emerald-500/25 rounded-lg transition-colors whitespace-nowrap"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {t('Add food')}
                        </button>
                        {addMenuSlot === key && (
                          <div className="absolute right-0 z-20 mt-1 w-52 bg-[#0e141d] border border-[#33445e] rounded-lg shadow-xl overflow-hidden">
                            {[
                              { icon: BookOpen, label: 'Add Recipe', run: () => { setRecipePickerSlot(key); setSelectedServings(1); } },
                              { icon: Search, label: 'Food DB', run: () => setFoodTarget({ kind: 'add', slot: key }) },
                              { icon: Plus, label: 'Quick Food', run: () => setCustomSlot(key) },
                            ].map(({ icon: Icon, label: l, run }) => (
                              <button
                                key={l}
                                type="button"
                                onClick={() => { setAddMenuSlot(null); run(); }}
                                className="w-full min-h-[44px] flex items-center gap-2 px-3 text-left text-xs text-slate-200 hover:bg-[#1a2434]"
                              >
                                <Icon className="w-3.5 h-3.5 text-slate-400" />
                                {t(l)}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {slotMeals.length === 0 ? (
                  <p className="text-xs text-slate-400 pt-3">
                    {isOnTheSpot
                      ? t('Log spontaneous snacks, shakes, or extra meals eaten during the day.')
                      : t('No food scheduled for {slot} on {day}.', {
                          slot: slotLabel(label),
                          day: t(DAY_FULL[selectedDay]),
                        })}
                  </p>
                ) : (
                  <div className="divide-y divide-[#1e293b] mt-2">
                    {slotMeals.map((meal) => {
                      const linkedRecipe = meal.recipeId ? recipeMap.get(meal.recipeId) : undefined;
                      return (
                        <div
                          key={meal.id}
                          className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <button
                              type="button"
                              onClick={() => {
                                if (!meal.consumed) onGuideCheer?.();
                                void toggleMealConsumed(uid, meal.id, !meal.consumed);
                              }}
                              aria-label={t('Mark {name} as consumed', { name: meal.title })}
                              className="min-h-[44px] min-w-[44px] -ml-2 flex items-center justify-center shrink-0"
                            >
                              <span
                                className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${
                                  meal.consumed
                                    ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                                    : 'bg-[#0e141d] border-[#33445e] text-transparent hover:border-emerald-400'
                                }`}
                              >
                                <Check className="w-3.5 h-3.5" />
                              </span>
                            </button>

                            {linkedRecipe?.imageUrl ? (
                              <img
                                src={linkedRecipe.imageUrl}
                                alt={meal.title}
                                referrerPolicy="no-referrer"
                                className="w-11 h-11 rounded-lg object-cover border border-[#2d3c54] shrink-0"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-lg bg-[#0e141d] border border-[#2d3c54] flex items-center justify-center shrink-0">
                                <FoodIcon food={meal.title} />
                              </div>
                            )}

                            <div className="min-w-0">
                              <p
                                className={`text-sm font-medium truncate ${
                                  meal.consumed ? 'text-slate-500 line-through' : 'text-slate-100'
                                }`}
                              >
                                {meal.title}
                              </p>
                              <p className="text-xs text-slate-400 tabular-nums">
                                {t('{n}x serving', { n: meal.servings })}
                                {linkedRecipe ? ` · ${t('Recipe')}` : ` · ${t('Logged item')}`}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pl-10 sm:pl-0">
                            <div className="text-left sm:text-right font-mono text-xs tabular-nums">
                              <p className="font-semibold text-white">
                                {Math.round(meal.calories)} kcal
                              </p>
                              <p className="text-slate-400">
                                {Math.round(meal.proteinG)}g P · {Math.round(meal.carbsG)}g C ·{' '}
                                {Math.round(meal.fatG)}g F
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => setFoodTarget({ kind: 'replace', meal })}
                              aria-label={t('Replace {name}', { name: meal.title })}
                              title={t('Replace with another food')}
                              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-emerald-300 rounded-md transition-colors"
                            >
                              <Repeat className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => void deleteMealLog(uid, meal.id)}
                              aria-label={t('Delete {name}', { name: meal.title })}
                              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-rose-400 rounded-md transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {showGrocery && (
          <aside className="lg:col-span-4 bg-[#131a24] border-2 border-[#263347] rounded-xl p-5 h-fit">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  {t('Week {week} Grocery List', { week: selectedWeek })}
                </h2>
                <p className="text-xs text-slate-400">
                  {t('Aggregated from scheduled recipes')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGrocery(false)}
                aria-label={t('Close grocery list')}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {weeklyIngredients.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                {t('Schedule meals from your Recipe Library to generate your grocery list.')}
              </p>
            ) : (
              <ul className="divide-y divide-[#1e293b] mt-2 max-h-[540px] overflow-y-auto">
                {weeklyIngredients.map(({ ingredient, count }) => {
                  const checked = Boolean(checkedGrocery[ingredient]);
                  return (
                    <li key={ingredient} className="py-2.5 flex items-center justify-between gap-3">
                      <label className="flex items-center gap-3 text-xs text-slate-200 cursor-pointer min-h-[36px]">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setCheckedGrocery((prev) => ({
                              ...prev,
                              [ingredient]: !prev[ingredient],
                            }))
                          }
                          className="w-4 h-4 rounded border-[#394c69] bg-[#0e141d] text-emerald-400 focus:ring-emerald-400"
                        />
                        <span className={checked ? 'line-through text-slate-500' : ''}>
                          {ingredient}
                        </span>
                      </label>
                      {count > 1 && (
                        <span className="text-[11px] font-mono text-slate-400 tabular-nums shrink-0">
                          {t('×{n} meals', { n: count })}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>
        )}
      </div>

      {/* Recipe Picker Modal */}
      {recipePickerSlot && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 sm:p-4">
          <div className="w-full sm:max-w-2xl bg-[#131a24] border-2 border-[#33445e] rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#253247] bg-[#0f151e]">
              <div>
                <h2 className="text-base font-semibold text-white">
                  {t('Add Recipe to {day} ({slot})', {
                    day: t(DAY_FULL[selectedDay]),
                    slot: slotLabel(recipePickerSlot.replace('meal_', 'Meal ')),
                  })}
                </h2>
                <p className="text-xs text-slate-400">
                  {t('Choose serving size and select a recipe to log its macros.')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRecipePickerSlot(null)}
                aria-label={t('Close recipe picker')}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-3 border-b border-[#253247] flex flex-wrap items-center justify-between gap-3 bg-[#0e141d]">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={recipeSearch}
                  onChange={(e) => setRecipeSearch(e.target.value)}
                  placeholder={t('Search recipes or ingredients...')}
                  className="w-full pl-9 pr-3 py-2 text-sm text-white bg-[#131a24] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-slate-400">{t('Servings:')}</span>
                {[0.5, 1, 1.5, 2].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedServings(s)}
                    className={`min-h-[38px] px-3 py-1 text-xs font-mono rounded-md border tabular-nums ${
                      selectedServings === s
                        ? 'bg-emerald-400 text-slate-950 border-emerald-400 font-semibold'
                        : 'bg-[#131a24] text-slate-300 border-[#2d3c54] hover:bg-[#1a2332]'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 overflow-y-auto divide-y divide-[#1e293b]">
              {filteredRecipes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-300">{t('No matching recipes found.')}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setRecipePickerSlot(null);
                      onNavigateToRecipes();
                    }}
                    className="mt-3 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg"
                  >
                    {t('Create Recipe in Library')}
                  </button>
                </div>
              ) : (
                filteredRecipes.map((rec) => (
                  <div
                    key={rec.id}
                    className="py-3 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {rec.imageUrl ? (
                        <img
                          src={rec.imageUrl}
                          alt={rec.title}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-lg object-cover border border-[#2d3c54] shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-[#0e141d] border border-[#2d3c54] flex items-center justify-center text-slate-400 shrink-0">
                          <Utensils className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{rec.title}</p>
                        <p className="text-xs text-slate-400 font-mono tabular-nums">
                          {Math.round(rec.calories * selectedServings)} kcal ·{' '}
                          {Math.round(rec.proteinG * selectedServings)}g P ·{' '}
                          {Math.round(rec.carbsG * selectedServings)}g C ·{' '}
                          {Math.round(rec.fatG * selectedServings)}g F
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => void handleAddFromRecipe(rec)}
                      className="min-h-[40px] px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg whitespace-nowrap shrink-0"
                    >
                      {t('Add ({n}x)', { n: selectedServings })}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <MealTextModal
        open={mealTextOpen}
        onClose={() => setMealTextOpen(false)}
        uid={uid}
        week={selectedWeek}
        day={selectedDay}
        slots={dailySlots}
        slotLabel={slotLabel}
        customFoods={customFoods}
        mealLogs={mealLogs}
      />
      <FoodPickerModal
        target={foodTarget}
        onClose={() => setFoodTarget(null)}
        uid={uid}
        week={selectedWeek}
        day={selectedDay}
        customFoods={customFoods}
      />
      <DietGeneratorModal
        open={generatorOpen}
        onClose={() => setGeneratorOpen(false)}
        uid={uid}
        profile={profile}
        week={selectedWeek}
        mealLogs={mealLogs}
      />

      {/* Custom Meal Modal */}
      {customSlot && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 sm:p-4">
          <div className="w-full sm:max-w-md bg-[#131a24] border-2 border-[#33445e] rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#253247] bg-[#0f151e]">
              <h2 className="text-base font-semibold text-white">
                {t('Add Quick Food ({slot})', { slot: slotLabel(customSlot.replace('meal_', 'Meal ')) })}
              </h2>
              <button
                type="button"
                onClick={() => setCustomSlot(null)}
                aria-label={t('Close custom meal modal')}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddCustomMeal} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('Food / Meal Name')}
                </label>
                <input
                  type="text"
                  required
                  maxLength={SCHEMA_LIMITS.TITLE_MAX}
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder={t('e.g., Greek Yogurt & Honey')}
                  className="w-full px-3 py-2.5 text-sm text-white bg-[#0e141d] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t('Calories (kcal)')}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={10000}
                    required
                    value={customCalories}
                    onChange={(e) => setCustomCalories(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums text-white bg-[#0e141d] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t('Protein (g)')}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={500}
                    required
                    value={customProtein}
                    onChange={(e) => setCustomProtein(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums text-white bg-[#0e141d] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t('Carbs (g)')}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={1000}
                    required
                    value={customCarbs}
                    onChange={(e) => setCustomCarbs(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums text-white bg-[#0e141d] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t('Fat (g)')}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={500}
                    required
                    value={customFat}
                    onChange={(e) => setCustomFat(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums text-white bg-[#0e141d] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCustomSlot(null)}
                  className="min-h-[44px] px-4 py-2 text-xs font-medium text-slate-300 hover:bg-[#1a2332] rounded-lg"
                >
                  {t('Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg"
                >
                  {submitting ? t('Adding...') : t('Add to Day')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
