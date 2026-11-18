import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Plus, Search, Trash2, X } from 'lucide-react';
import { MealLog, MealSlot } from '../types';
import {
  Food,
  foldText,
  formatFoodTitle,
  macrosForGrams,
  STARTER_FOODS,
} from '../lib/foodDb';
import { useT } from '../lib/i18n';
import {
  createMealLog,
  deleteCustomFood,
  saveCustomFood,
  updateMealLog,
} from '../lib/firestoreService';

export type FoodPickerTarget =
  | { kind: 'add'; slot: MealSlot }
  | { kind: 'replace'; meal: MealLog };

interface Props {
  target: FoodPickerTarget | null;
  onClose: () => void;
  uid: string;
  week: number;
  day: number;
  customFoods: Food[];
}

const inputCls =
  'w-full px-3 py-2 text-sm text-white bg-[#0e141d] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400';

export const FoodPickerModal: React.FC<Props> = ({
  target,
  onClose,
  uid,
  week,
  day,
  customFoods,
}) => {
  const t = useT();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Food | null>(null);
  const [grams, setGrams] = useState(100);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newKcal, setNewKcal] = useState(0);
  const [newP, setNewP] = useState(0);
  const [newC, setNewC] = useState(0);
  const [newF, setNewF] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (target) {
      setSearch('');
      setSelected(null);
      setGrams(100);
      setCreating(false);
      setError(null);
    }
  }, [target]);

  const results = useMemo(() => {
    const q = foldText(search.trim());
    const all = [...customFoods, ...STARTER_FOODS];
    return all.filter((f) => !q || foldText(f.name).includes(q)).slice(0, 40);
  }, [search, customFoods]);

  if (!target) return null;

  const pick = (food: Food) => {
    setSelected(food);
    setGrams(food.unit?.grams ?? 100);
    setError(null);
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch {
      setError(t('Something went wrong. Check your connection and try again.'));
    } finally {
      setBusy(false);
    }
  };

  const handleCreateFood = () =>
    run(async () => {
      const name = newName.trim();
      if (!name) {
        setError(t('Give the food a name.'));
        return;
      }
      const id = await saveCustomFood(uid, {
        name,
        calories: newKcal,
        proteinG: newP,
        carbsG: newC,
        fatG: newF,
      });
      pick({
        id,
        name,
        calories: newKcal,
        proteinG: newP,
        carbsG: newC,
        fatG: newF,
        custom: true,
      });
      setCreating(false);
    });

  const handleConfirm = () => {
    if (!selected || grams <= 0) return;
    const macros = macrosForGrams(selected, grams);
    const title = formatFoodTitle(selected, grams);
    return run(async () => {
      if (target.kind === 'replace') {
        await updateMealLog(uid, target.meal.id, {
          slot: target.meal.slot,
          title,
          recipeId: '',
          servings: 1,
          ...macros,
          consumed: target.meal.consumed,
        });
      } else {
        await createMealLog(uid, {
          weekNumber: week,
          dayIndex: day,
          slot: target.slot,
          title,
          recipeId: '',
          servings: 1,
          ...macros,
          consumed: false,
        });
      }
      onClose();
    });
  };

  const preview = selected ? macrosForGrams(selected, grams) : null;
  const heading =
    target.kind === 'replace'
      ? t('Replace "{name}"', { name: target.meal.title })
      : t('Add food from database');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={heading}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 sm:p-4"
    >
      <div className="w-full sm:max-w-lg bg-[#131a24] border-2 border-[#33445e] rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[#253247] bg-[#0f151e]">
          <div className="flex items-center gap-1.5 min-w-0">
            {(selected || creating) && (
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setCreating(false);
                }}
                aria-label={t('Back to food list')}
                className="w-9 h-9 inline-flex items-center justify-center text-slate-300 hover:text-white rounded-lg"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="text-sm font-semibold text-white truncate">{heading}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('Close')}
            className="w-9 h-9 inline-flex items-center justify-center text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-3">
          {!selected && !creating && (
            <>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('Search: frango, arroz, banana...')}
                  autoFocus
                  className={`${inputCls} pl-9`}
                />
              </div>
              <ul className="divide-y divide-[#1e293b]">
                {results.map((f) => (
                  <li key={f.id} className="flex items-center">
                    <button
                      type="button"
                      onClick={() => pick(f)}
                      className="flex-1 min-w-0 text-left min-h-[44px] py-2 pr-2"
                    >
                      <span className="block text-sm text-slate-100 truncate">
                        {f.name}
                        {f.custom && (
                          <span className="ml-1.5 text-[10px] text-amber-300">{t('mine')}</span>
                        )}
                      </span>
                      <span className="block text-[11px] text-slate-400 font-mono tabular-nums">
                        {t('100g: {kcal} kcal · {p}P · {c}C · {f}F', { kcal: f.calories, p: f.proteinG, c: f.carbsG, f: f.fatG })}
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
                  <li className="py-4 text-xs text-slate-400">{t('No food found. Create it below.')}</li>
                )}
              </ul>
              <button
                type="button"
                onClick={() => {
                  setCreating(true);
                  setNewName(search.trim());
                }}
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/40 hover:bg-emerald-500/25 rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" />
                {t('Create new food (saved for next time)')}
              </button>
            </>
          )}

          {creating && (
            <div className="space-y-3">
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
                disabled={busy}
                onClick={() => void handleCreateFood()}
                className="w-full min-h-[44px] text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg"
              >
                {busy ? t('Saving...') : t('Save food')}
              </button>
            </div>
          )}

          {selected && preview && (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-white">{selected.name}</p>
                <p className="text-[11px] text-slate-400 font-mono tabular-nums">
                  {t('100g: {kcal} kcal · {p}P · {c}C · {f}F', {
                    kcal: selected.calories,
                    p: selected.proteinG,
                    c: selected.carbsG,
                    f: selected.fatG,
                  })}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{t('Amount (g)')}</label>
                <input
                  type="number"
                  min={1}
                  max={2000}
                  value={grams}
                  onChange={(e) => setGrams(Number(e.target.value))}
                  className={`${inputCls} font-mono tabular-nums`}
                />
                {selected.unit && (
                  <div className="flex gap-1.5 mt-2">
                    {[1, 2, 3].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setGrams(selected.unit!.grams * n)}
                        className="px-2.5 py-1 text-[11px] text-slate-200 bg-[#1a2332] border border-[#2d3c54] hover:border-emerald-400 rounded-md"
                      >
                        {n} {selected.unit!.label} ({selected.unit!.grams * n}g)
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2 text-center bg-[#0e141d] border border-[#2d3c54] rounded-lg p-3 font-mono tabular-nums">
                <div>
                  <p className="text-sm font-semibold text-white">{preview.calories}</p>
                  <p className="text-[10px] text-slate-400">kcal</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{preview.proteinG}</p>
                  <p className="text-[10px] text-slate-400">P</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{preview.carbsG}</p>
                  <p className="text-[10px] text-slate-400">C</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{preview.fatG}</p>
                  <p className="text-[10px] text-slate-400">F</p>
                </div>
              </div>
              <button
                type="button"
                disabled={busy || grams <= 0}
                onClick={() => void handleConfirm()}
                className="w-full min-h-[44px] text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg"
              >
                {busy
                  ? t('Saving...')
                  : target.kind === 'replace'
                    ? t('Replace item')
                    : t('Add to day')}
              </button>
            </div>
          )}

          {error && <p className="text-xs text-rose-300">{error}</p>}
        </div>
      </div>
    </div>
  );
};
