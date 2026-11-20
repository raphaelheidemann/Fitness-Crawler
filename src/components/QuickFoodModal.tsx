import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Plus, Search, Trash2, X } from 'lucide-react';
import {
  buildDailyMealSlots,
  DAY_FULL,
  MealSlot,
  SCHEMA_LIMITS,
  UserProfile,
} from '../types';
import {
  Food,
  foldText,
  formatFoodTitle,
  macrosForGrams,
  pluralUnit,
  STARTER_FOODS,
} from '../lib/foodDb';
import { matchFoods } from '../lib/mealText';
import { createMealLog, deleteCustomFood, saveCustomFood } from '../lib/firestoreService';
import { useT } from '../lib/i18n';
import { FoodIcon } from './FoodIcon';

interface Props {
  open: boolean;
  onClose: () => void;
  uid: string;
  profile: UserProfile;
  customFoods?: Food[];
  defaultWeek?: number;
  defaultDay?: number;
  defaultSlot?: MealSlot;
}

type DraftItem =
  | { key: string; kind: 'db'; food: Food; amount: number; useUnit: boolean }
  | {
      key: string;
      kind: 'manual';
      title: string;
      calories: number;
      proteinG: number;
      carbsG: number;
      fatG: number;
    };

const inputCls =
  'w-full px-3 py-2 text-sm text-white bg-[#0e141d] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400';

let nextKey = 1;
const makeKey = () => `qf_${Date.now()}_${nextKey++}`;

export const QuickFoodModal: React.FC<Props> = ({
  open,
  onClose,
  uid,
  profile,
  customFoods = [],
  defaultWeek,
  defaultDay,
  defaultSlot,
}) => {
  const t = useT();
  const mealsPerDay = profile.mealsPerDay ?? 6;
  const slots = buildDailyMealSlots(mealsPerDay);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const jsDay = new Date().getDay();
  const todayIndex = jsDay === 0 ? 6 : jsDay - 1;

  const [weekNumber, setWeekNumber] = useState(defaultWeek ?? profile.currentWeek);
  const [dayIndex, setDayIndex] = useState(defaultDay ?? todayIndex);
  const [slot, setSlot] = useState<MealSlot>(defaultSlot ?? 'on_the_spot');

  // List of foods being summed together
  const [items, setItems] = useState<DraftItem[]>([]);
  const [picking, setPicking] = useState(true);
  const [search, setSearch] = useState('');

  // Create new custom food (per 100g) or manual one-off entry
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newKcal, setNewKcal] = useState(0);
  const [newP, setNewP] = useState(0);
  const [newC, setNewC] = useState(0);
  const [newF, setNewF] = useState(0);

  const [manual, setManual] = useState(false);
  const [title, setTitle] = useState('');
  const [calories, setCalories] = useState(300);
  const [proteinG, setProteinG] = useState(25);
  const [carbsG, setCarbsG] = useState(30);
  const [fatG, setFatG] = useState(8);

  const [consumed, setConsumed] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setWeekNumber(defaultWeek ?? profile.currentWeek);
      setDayIndex(defaultDay ?? todayIndex);
      setSlot(defaultSlot ?? 'on_the_spot');
      setItems([]);
      setPicking(true);
      setSearch('');
      setCreating(false);
      setNewName('');
      setNewKcal(0);
      setNewP(0);
      setNewC(0);
      setNewF(0);
      setManual(false);
      setTitle('');
      setCalories(300);
      setProteinG(25);
      setCarbsG(30);
      setFatG(8);
      setConsumed(true);
      setError(null);
    }
  }, [open, defaultWeek, defaultDay, defaultSlot, profile.currentWeek, todayIndex]);

  useEffect(() => {
    if (open && picking && !creating && !manual) {
      const id = setTimeout(() => searchInputRef.current?.focus(), 20);
      return () => clearTimeout(id);
    }
  }, [open, picking, creating, manual]);

  const allFoods = useMemo(() => [...customFoods, ...STARTER_FOODS], [customFoods]);

  const results = useMemo(() => {
    const raw = search.trim();
    if (!raw) return allFoods.slice(0, 40);
    const ranked = matchFoods(raw, allFoods, 40).foods;
    const seen = new Set(ranked.map((f) => f.id));
    const q = foldText(raw);
    for (const f of allFoods) {
      if (ranked.length >= 40) break;
      if (!seen.has(f.id) && foldText(f.name).includes(q)) {
        ranked.push(f);
        seen.add(f.id);
      }
    }
    return ranked;
  }, [search, allFoods]);

  const computedItems = useMemo(
    () =>
      items.map((item) => {
        if (item.kind === 'manual') {
          return {
            item,
            grams: 0,
            entryTitle: item.title,
            macros: {
              calories: Math.round(item.calories),
              proteinG: Number(item.proteinG.toFixed(1)),
              carbsG: Number(item.carbsG.toFixed(1)),
              fatG: Number(item.fatG.toFixed(1)),
            },
            valid: item.title.trim().length > 0,
          };
        }
        const safeAmount = Number.isFinite(item.amount) ? Math.max(0, item.amount) : 0;
        const grams =
          item.useUnit && item.food.unit ? safeAmount * item.food.unit.grams : safeAmount;
        return {
          item,
          grams,
          entryTitle: formatFoodTitle(item.food, grams, item.useUnit ? safeAmount : undefined),
          macros: macrosForGrams(item.food, grams),
          valid: grams > 0,
        };
      }),
    [items]
  );

  const validItems = useMemo(() => computedItems.filter((c) => c.valid), [computedItems]);

  const totals = useMemo(
    () =>
      validItems.reduce(
        (acc, c) => ({
          calories: acc.calories + c.macros.calories,
          proteinG: Number((acc.proteinG + c.macros.proteinG).toFixed(1)),
          carbsG: Number((acc.carbsG + c.macros.carbsG).toFixed(1)),
          fatG: Number((acc.fatG + c.macros.fatG).toFixed(1)),
        }),
        { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
      ),
    [validItems]
  );

  if (!open) return null;

  const addDbFood = (food: Food) => {
    setItems((prev) => [
      ...prev,
      {
        key: makeKey(),
        kind: 'db',
        food,
        amount: food.unit ? 1 : 100,
        useUnit: Boolean(food.unit),
      },
    ]);
    setSearch('');
    setPicking(false);
    setCreating(false);
    setManual(false);
    setError(null);
  };

  const patchItem = (key: string, patch: Partial<Extract<DraftItem, { kind: 'db' }>>) => {
    setItems((prev) =>
      prev.map((it) => (it.key === key && it.kind === 'db' ? { ...it, ...patch } : it))
    );
  };

  const removeItem = (key: string) => {
    setItems((prev) => {
      const next = prev.filter((it) => it.key !== key);
      if (next.length === 0) setPicking(true);
      return next;
    });
  };

  const handleCreateFood = async () => {
    const name = newName.trim();
    if (!name) {
      setError(t('Give the food a name.'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const id = await saveCustomFood(uid, {
        name,
        calories: newKcal,
        proteinG: newP,
        carbsG: newC,
        fatG: newF,
      });
      addDbFood({
        id,
        name,
        calories: newKcal,
        proteinG: newP,
        carbsG: newC,
        fatG: newF,
        custom: true,
      });
      setNewName('');
      setNewKcal(0);
      setNewP(0);
      setNewC(0);
      setNewF(0);
    } catch {
      setError(t('Something went wrong. Check your connection and try again.'));
    } finally {
      setSaving(false);
    }
  };

  const handleAddManual = () => {
    const finalTitle = title.trim();
    if (!finalTitle) {
      setError(t('Please enter a food or meal name.'));
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        key: makeKey(),
        kind: 'manual',
        title: finalTitle,
        calories: Math.max(0, calories),
        proteinG: Math.max(0, proteinG),
        carbsG: Math.max(0, carbsG),
        fatG: Math.max(0, fatG),
      },
    ]);
    setTitle('');
    setCalories(300);
    setProteinG(25);
    setCarbsG(30);
    setFatG(8);
    setManual(false);
    setPicking(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validItems.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      for (const c of validItems) {
        await createMealLog(uid, {
          weekNumber,
          dayIndex,
          slot,
          title: c.entryTitle,
          recipeId: '',
          servings: 1,
          ...c.macros,
          consumed,
        });
      }
      onClose();
    } catch {
      setError(t('Something went wrong. Check your connection and try again.'));
    } finally {
      setSaving(false);
    }
  };

  const canGoBack = creating || manual || (picking && items.length > 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('Log Food Eaten On the Spot')}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 sm:p-4"
    >
      <div className="w-full sm:max-w-lg bg-[#131a24] border-2 border-[#33445e] rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 bg-[#0f151e] border-b border-[#253247]">
          <div className="flex items-center gap-2 min-w-0">
            {canGoBack && (
              <button
                type="button"
                onClick={() => {
                  if (creating || manual) {
                    setCreating(false);
                    setManual(false);
                    setPicking(true);
                  } else {
                    setPicking(false);
                  }
                  setError(null);
                }}
                aria-label={t('Back to food list')}
                className="w-9 h-9 inline-flex items-center justify-center text-slate-300 hover:text-white rounded-lg shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-white truncate">
                {t('Log Food Eaten On the Spot')}
              </h2>
              <p className="text-xs text-slate-400 truncate">
                {t('Record extra food, snacks, or shakes eaten during the day.')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('Close quick food modal')}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">{t('Week')}</label>
              <input
                type="number"
                min={1}
                max={52}
                value={weekNumber}
                onChange={(e) => setWeekNumber(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm text-white bg-[#0e141d] tabular-nums border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">{t('Day')}</label>
              <select
                value={dayIndex}
                onChange={(e) => setDayIndex(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm text-white border border-[#2d3c54] rounded-lg bg-[#0e141d] focus:outline-none focus:border-emerald-400"
              >
                {DAY_FULL.map((d, i) => (
                  <option key={d} value={i} className="bg-[#0e141d] text-slate-100">
                    {t(d)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">{t('Meal Slot')}</label>
              <select
                value={slot}
                onChange={(e) => setSlot(e.target.value as MealSlot)}
                className="w-full px-3 py-2 text-sm text-white border border-[#2d3c54] rounded-lg bg-[#0e141d] focus:outline-none focus:border-emerald-400"
              >
                {slots.map((s) => (
                  <option key={s.key} value={s.key} className="bg-[#0e141d] text-slate-100">
                    {s.label.startsWith('Meal ') ? t('Meal {n}', { n: s.label.slice(5) }) : t(s.label)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Running total strip while picking another food */}
          {picking && items.length > 0 && !creating && !manual && (
            <button
              type="button"
              onClick={() => setPicking(false)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/15 rounded-lg text-left"
            >
              <span className="font-medium text-emerald-300">
                {t('Added foods')} ({validItems.length})
              </span>
              <span className="font-mono tabular-nums text-slate-200">
                {totals.calories} kcal · {totals.proteinG}P · {totals.carbsG}C · {totals.fatG}F
              </span>
            </button>
          )}

          {/* Added foods list + inline qty/unit editing + running sum */}
          {!picking && !creating && !manual && items.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-300">
                  {t('Added foods')} ({items.length})
                </p>
              </div>

              <ul className="divide-y divide-[#1e293b] border border-[#253247] rounded-lg bg-[#0e141d]/60 px-3">
                {computedItems.map(({ item, macros, entryTitle }) => (
                  <li key={item.key} className="py-2.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.kind === 'db' && <FoodIcon food={item.food.id} className="w-8 h-8" />}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-100 truncate">
                            {item.kind === 'db' ? item.food.name : entryTitle}
                          </p>
                          <p className="text-[11px] font-mono tabular-nums text-slate-400">
                            {macros.calories} kcal · {macros.proteinG}P · {macros.carbsG}C · {macros.fatG}F
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        aria-label={t('Remove {name}', {
                          name: item.kind === 'db' ? item.food.name : entryTitle,
                        })}
                        className="w-9 h-9 inline-flex items-center justify-center text-slate-500 hover:text-rose-400 rounded-lg shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {item.kind === 'db' && (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0.25}
                          step={item.useUnit ? 0.5 : 1}
                          max={2000}
                          aria-label={t('Amount')}
                          value={item.amount}
                          onChange={(e) =>
                            patchItem(item.key, { amount: Number(e.target.value) })
                          }
                          className={`${inputCls} w-24 font-mono tabular-nums py-1.5`}
                        />
                        <select
                          aria-label={t('Unit')}
                          value={item.useUnit ? 'unit' : 'base'}
                          onChange={(e) => {
                            const toUnit = e.target.value === 'unit';
                            patchItem(item.key, {
                              useUnit: toUnit,
                              amount: toUnit ? 1 : item.food.unit?.grams ?? 100,
                            });
                          }}
                          className={`${inputCls} w-auto py-1.5`}
                        >
                          <option value="base">{item.food.base ?? 'g'}</option>
                          {item.food.unit && (
                            <option value="unit">{pluralUnit(item.food.unit.label, 2)}</option>
                          )}
                        </select>
                        {item.food.unit && (
                          <span className="text-[11px] text-slate-500 truncate">
                            1 {item.food.unit.label} ≈ {item.food.unit.grams}
                            {item.food.base ?? 'g'}
                          </span>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => {
                  setPicking(true);
                  setSearch('');
                  setError(null);
                }}
                className="w-full min-h-[42px] inline-flex items-center justify-center gap-1.5 px-3 text-xs font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/40 hover:bg-emerald-500/25 rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" />
                {t('Add food')}
              </button>

              <div className="bg-[#0e141d] border border-[#2d3c54] rounded-lg p-3">
                <p className="text-[11px] font-medium text-slate-400 mb-2">
                  {validItems.length > 1
                    ? `${t('Total')} (${t('{n} items', { n: validItems.length })})`
                    : t('Total')}
                </p>
                <div className="grid grid-cols-4 gap-2 text-center font-mono tabular-nums">
                  <div>
                    <p className="text-sm font-semibold text-white">{totals.calories}</p>
                    <p className="text-[10px] text-slate-400">kcal</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{totals.proteinG}</p>
                    <p className="text-[10px] text-slate-400">P</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{totals.carbsG}</p>
                    <p className="text-[10px] text-slate-400">C</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{totals.fatG}</p>
                    <p className="text-[10px] text-slate-400">F</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Database search picker */}
          {picking && !creating && !manual && (
            <div className="space-y-3">
              <div>
                <label htmlFor="quick-food-search" className="block text-xs font-medium text-slate-300 mb-1">
                  {t('Search food database')}
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    ref={searchInputRef}
                    id="quick-food-search"
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('Search: frango, arroz, banana...')}
                    className={`${inputCls} pl-9 pr-9 py-2.5`}
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      aria-label={t('Clear search')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <ul className="divide-y divide-[#1e293b] border border-[#253247] rounded-lg bg-[#0e141d]/60 max-h-60 overflow-y-auto px-3">
                {results.map((f) => (
                  <li key={f.id} className="flex items-center">
                    <button
                      type="button"
                      onClick={() => addDbFood(f)}
                      className="flex-1 min-w-0 text-left min-h-[44px] py-2 pr-2 flex items-center gap-2.5 hover:bg-[#1a2332]/60 rounded transition-colors"
                    >
                      <FoodIcon food={f.id} className="w-8 h-8" />
                      <span className="min-w-0">
                        <span className="block text-sm text-slate-100 truncate">
                          {f.name}
                          {f.custom && (
                            <span className="ml-1.5 text-[10px] text-amber-300">{t('mine')}</span>
                          )}
                        </span>
                        <span className="block text-[11px] text-slate-400 font-mono tabular-nums">
                          {t('100{base}: {kcal} kcal · {p}P · {c}C · {f}F', {
                            base: f.base ?? 'g',
                            kcal: f.calories,
                            p: f.proteinG,
                            c: f.carbsG,
                            f: f.fatG,
                          })}
                        </span>
                      </span>
                    </button>
                    {f.custom && (
                      <button
                        type="button"
                        onClick={() => void deleteCustomFood(uid, f.id)}
                        aria-label={t('Delete {name} from my foods', { name: f.name })}
                        className="w-10 h-10 inline-flex items-center justify-center text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </li>
                ))}
                {results.length === 0 && (
                  <li className="py-4 text-xs text-slate-400 text-center">
                    {t('No food found. Create it below.')}
                  </li>
                )}
              </ul>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCreating(true);
                    setNewName(search.trim());
                    setError(null);
                  }}
                  className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-3 text-xs font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/40 hover:bg-emerald-500/25 rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t('Create new food (saved for next time)')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setManual(true);
                    setTitle(search.trim());
                    setError(null);
                  }}
                  className="min-h-[42px] inline-flex items-center justify-center px-3 text-xs font-medium text-slate-200 bg-[#1a2332] border border-[#2d3c54] hover:bg-[#233044] rounded-lg"
                >
                  {t('Enter manually')}
                </button>
              </div>
            </div>
          )}

          {creating && (
            <div className="space-y-3 bg-[#0e141d]/50 border border-[#253247] rounded-lg p-3.5">
              <p className="text-xs text-slate-400">
                {t('Fill in the macros per 100g once. It stays in your food list.')}
              </p>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{t('Name')}</label>
                <input
                  type="text"
                  value={newName}
                  maxLength={80}
                  onChange={(e) => setNewName(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    ['Calories (kcal)', newKcal, setNewKcal],
                    ['Protein (g)', newP, setNewP],
                    ['Carbs (g)', newC, setNewC],
                    ['Fat (g)', newF, setNewF],
                  ] as const
                ).map(([label, value, set]) => (
                  <div key={label}>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {t('{label} per 100g', { label: t(label) })}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={value}
                      onChange={(e) => set(Number(e.target.value))}
                      className={`${inputCls} font-mono tabular-nums`}
                    />
                  </div>
                ))}
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleCreateFood()}
                className="w-full min-h-[42px] text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg"
              >
                {saving ? t('Saving...') : t('Save food')}
              </button>
            </div>
          )}

          {manual && (
            <div className="space-y-4 bg-[#0e141d]/50 border border-[#253247] rounded-lg p-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{t('Food / Meal Name')}</label>
                <input
                  type="text"
                  maxLength={SCHEMA_LIMITS.TITLE_MAX}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('e.g., Post-Workout Shake & Banana')}
                  className="w-full px-3 py-2.5 text-sm text-white placeholder:text-slate-500 bg-[#0e141d] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{t('Calories')}</label>
                  <input
                    type="number"
                    min={0}
                    max={10000}
                    value={calories}
                    onChange={(e) => setCalories(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm text-white bg-[#0e141d] font-mono tabular-nums border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{t('Protein (g)')}</label>
                  <input
                    type="number"
                    step="0.5"
                    min={0}
                    max={500}
                    value={proteinG}
                    onChange={(e) => setProteinG(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm text-white bg-[#0e141d] font-mono tabular-nums border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{t('Carbs (g)')}</label>
                  <input
                    type="number"
                    step="0.5"
                    min={0}
                    max={1000}
                    value={carbsG}
                    onChange={(e) => setCarbsG(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm text-white bg-[#0e141d] font-mono tabular-nums border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{t('Fat (g)')}</label>
                  <input
                    type="number"
                    step="0.5"
                    min={0}
                    max={500}
                    value={fatG}
                    onChange={(e) => setFatG(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm text-white bg-[#0e141d] font-mono tabular-nums border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddManual}
                className="w-full min-h-[42px] text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg"
              >
                {t('Add to list')}
              </button>
            </div>
          )}

          {validItems.length > 0 && !creating && !manual && (
            <label className="inline-flex items-center gap-2.5 text-xs font-medium text-slate-200 cursor-pointer min-h-[44px]">
              <input
                type="checkbox"
                checked={consumed}
                onChange={(e) => setConsumed(e.target.checked)}
                className="w-4 h-4 rounded border-[#394c69] bg-[#0e141d] text-emerald-400 focus:ring-emerald-400"
              />
              {t("Already eaten (count immediately toward today's consumed macros)")}
            </label>
          )}

          {error && (
            <p className="text-xs text-rose-200 bg-rose-950/60 border border-rose-500/40 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#253247]">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 text-xs font-medium text-slate-200 hover:bg-[#1a2332] rounded-lg"
            >
              {t('Cancel')}
            </button>
            {validItems.length > 0 && !creating && !manual && (
              <button
                type="submit"
                disabled={saving}
                className="min-h-[44px] px-5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg"
              >
                {saving
                  ? t('Logging...')
                  : validItems.length > 1
                    ? t('Save {n} foods', { n: validItems.length })
                    : t('Save Food Entry')}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
