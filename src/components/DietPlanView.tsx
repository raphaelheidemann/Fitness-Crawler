import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
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

interface Props {
  uid: string;
  profile: UserProfile;
  mealLogs: MealLog[];
  hydrationLogs: HydrationLog[];
  recipes: Recipe[];
  customFoods: Food[];
  onNavigateToRecipes: () => void;
  onOpenQuickFood: (week: number, day: number, slot?: MealSlot) => void;
  onOpenCsvImport: (week: number, day: number) => void;
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
  onOpenCsvImport,
}) => {
  const t = useT();
  const [selectedWeek, setSelectedWeek] = useState(profile.currentWeek);
  const [selectedDay, setSelectedDay] = useState(0);
  const [showGrocery, setShowGrocery] = useState(false);
  const [foodTarget, setFoodTarget] = useState<FoodPickerTarget | null>(null);
  const [generatorOpen, setGeneratorOpen] = useState(false);
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
      <div className="bg-[#131a24] border-2 border-[#263347] rounded-xl p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span>Daily Rations &amp; Macro Log (+25 XP/day)</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              Target {profile.dailyCalorieTarget.toLocaleString()} kcal ({profile.proteinTargetG}g P /{' '}
              {profile.carbsTargetG}g C / {profile.fatTargetG}g F)
            </span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1">
            Week {selectedWeek} Diet Plan
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Week switcher */}
          <div className="inline-flex items-center border border-[#2d3c54] rounded-lg bg-[#0e141d] p-1 min-h-[44px]">
            <button
              type="button"
              onClick={() => setSelectedWeek((w) => Math.max(1, w - 1))}
              disabled={selectedWeek <= 1}
              aria-label="Previous week"
              className="p-2 text-slate-400 hover:text-white hover:bg-[#1a2434] rounded-md disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <select
              aria-label="Select diet week"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(Number(e.target.value))}
              className="bg-transparent px-2 text-xs font-mono font-medium text-slate-100 focus:outline-none tabular-nums"
            >
              {Array.from({ length: 52 }, (_, i) => i + 1).map((wk) => (
                <option key={wk} value={wk} className="bg-[#0e141d] text-slate-100">
                  Week {wk}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setSelectedWeek((w) => Math.min(52, w + 1))}
              disabled={selectedWeek >= 52}
              aria-label="Next week"
              className="p-2 text-slate-400 hover:text-white hover:bg-[#1a2434] rounded-md disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Meals per day selector */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#2d3c54] rounded-lg bg-[#0e141d] min-h-[44px]">
            <label htmlFor="meals-per-day" className="text-xs font-medium text-slate-400 whitespace-nowrap">
              Meals / day
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

          <button
            type="button"
            onClick={() => onOpenQuickFood(selectedWeek, selectedDay, 'on_the_spot')}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            Log Food Eaten
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
            Grocery ({weeklyIngredients.length})
          </button>

          <button
            type="button"
            onClick={() => onOpenCsvImport(selectedWeek, selectedDay)}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-200 bg-[#1a2332] border border-[#2d3c54] hover:bg-[#233044] rounded-lg transition-colors whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5" />
            CSV Templates &amp; Import
          </button>
        </div>
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
              </p>
              <p className="text-[11px] tabular-nums mt-0.5 text-slate-400">
                {count} items · {kcal} kcal
              </p>
            </button>
          );
        })}
      </div>

      {/* Macro Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {macroBars.map((bar) => {
          const pct = Math.min(100, Math.round((bar.consumed / Math.max(1, bar.target)) * 100));
          return (
            <div key={bar.label} className="bg-[#131a24] border-2 border-[#263347] rounded-xl p-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-slate-300">{bar.label}</span>
                <span className="text-slate-400 tabular-nums hidden sm:inline">
                  Planned: {bar.planned.toLocaleString()} {bar.unit}
                </span>
              </div>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-base sm:text-lg font-bold text-white font-mono tabular-nums">
                  {bar.consumed.toLocaleString()}
                  <span className="text-xs font-normal text-slate-400 ml-1">
                    / {bar.target.toLocaleString()} {bar.unit}
                  </span>
                </span>
                <span className="text-xs font-mono font-medium text-slate-300 tabular-nums">{pct}%</span>
              </div>
              <div className="h-1.5 w-full bg-[#0a0f16] rounded-full overflow-hidden">
                <div
                  className={`h-full ${bar.barColor} transition-all duration-200`}
                  style={{ width: `${pct}%` }}
                />
              </div>
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
                    <h2 className="text-sm font-semibold text-white">{label}</h2>
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
                        Log On-the-Spot Food
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setRecipePickerSlot(key);
                            setSelectedServings(1);
                          }}
                          className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-500/15 border border-emerald-500/40 hover:bg-emerald-500/25 rounded-lg transition-colors whitespace-nowrap"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          Add Recipe
                        </button>
                        <button
                          type="button"
                          onClick={() => setFoodTarget({ kind: 'add', slot: key })}
                          className="min-h-[40px] inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-200 bg-[#1a2332] border border-[#2d3c54] hover:bg-[#233044] rounded-lg transition-colors whitespace-nowrap"
                        >
                          <Search className="w-3.5 h-3.5" />
                          {t('Food DB')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomSlot(key)}
                          className="min-h-[40px] inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-200 bg-[#1a2332] border border-[#2d3c54] hover:bg-[#233044] rounded-lg transition-colors whitespace-nowrap"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Quick Food
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {slotMeals.length === 0 ? (
                  <p className="text-xs text-slate-400 pt-3">
                    {isOnTheSpot
                      ? 'Log spontaneous snacks, shakes, or extra meals eaten during the day.'
                      : `No food scheduled for ${label} on ${DAY_FULL[selectedDay]}.`}
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
                              onClick={() =>
                                void toggleMealConsumed(uid, meal.id, !meal.consumed)
                              }
                              aria-label={`Mark ${meal.title} as consumed`}
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
                              <div className="w-11 h-11 rounded-lg bg-[#0e141d] border border-[#2d3c54] flex items-center justify-center text-slate-400 shrink-0">
                                <Utensils className="w-4 h-4" />
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
                                {meal.servings}x serving
                                {linkedRecipe ? ' · Recipe' : ' · Logged item'}
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
                              aria-label={`Delete ${meal.title}`}
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
                  Week {selectedWeek} Grocery List
                </h2>
                <p className="text-xs text-slate-400">
                  Aggregated from scheduled recipes
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGrocery(false)}
                aria-label="Close grocery list"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {weeklyIngredients.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Schedule meals from your Recipe Library to generate your grocery list.
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
                          ×{count} meals
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
                  Add Recipe to {DAY_FULL[selectedDay]} ({recipePickerSlot.replace('meal_', 'Meal ')})
                </h2>
                <p className="text-xs text-slate-400">
                  Choose serving size and select a recipe to log its macros.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRecipePickerSlot(null)}
                aria-label="Close recipe picker"
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
                  placeholder="Search recipes or ingredients..."
                  className="w-full pl-9 pr-3 py-2 text-sm text-white bg-[#131a24] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-slate-400">Servings:</span>
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
                  <p className="text-sm text-slate-300">No matching recipes found.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setRecipePickerSlot(null);
                      onNavigateToRecipes();
                    }}
                    className="mt-3 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg"
                  >
                    Create Recipe in Library
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
                      Add ({selectedServings}x)
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

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
                Add Quick Food ({customSlot.replace('meal_', 'Meal ')})
              </h2>
              <button
                type="button"
                onClick={() => setCustomSlot(null)}
                aria-label="Close custom meal modal"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddCustomMeal} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Food / Meal Name
                </label>
                <input
                  type="text"
                  required
                  maxLength={SCHEMA_LIMITS.TITLE_MAX}
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g., Greek Yogurt & Honey"
                  className="w-full px-3 py-2.5 text-sm text-white bg-[#0e141d] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Calories (kcal)
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
                    Protein (g)
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
                    Carbs (g)
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
                    Fat (g)
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
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg"
                >
                  {submitting ? 'Adding...' : 'Add to Day'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
