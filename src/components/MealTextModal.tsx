import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { MealLog, MealSlot } from '../types';
import { Food, formatFoodTitle, macrosForGrams, pluralUnit, STARTER_FOODS } from '../lib/foodDb';
import { parseMealText, resolveItem, ResolvedRow, rowGrams } from '../lib/mealText';
import { useT } from '../lib/i18n';
import { FoodIcon } from './FoodIcon';
import { createMealLog } from '../lib/firestoreService';

interface Props {
  open: boolean;
  onClose: () => void;
  uid: string;
  week: number;
  day: number;
  slots: { key: MealSlot; label: string }[];
  slotLabel: (label: string) => string;
  customFoods: Food[];
  mealLogs: MealLog[];
}

const inputCls =
  'px-2.5 py-2 text-sm text-white bg-[#0e141d] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400';

export const MealTextModal: React.FC<Props> = ({
  open,
  onClose,
  uid,
  week,
  day,
  slots,
  slotLabel,
  customFoods,
  mealLogs,
}) => {
  const t = useT();
  const [text, setText] = useState('');
  const [time, setTime] = useState('');
  const [slot, setSlot] = useState<MealSlot>('on_the_spot');
  const [eaten, setEaten] = useState(true);
  const [rows, setRows] = useState<ResolvedRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const foods = useMemo(() => [...customFoods, ...STARTER_FOODS], [customFoods]);
  const foodById = useMemo(() => new Map(foods.map((f) => [f.id, f])), [foods]);

  useEffect(() => {
    if (open) {
      setText('');
      setTime('');
      setSlot('on_the_spot');
      setEaten(true);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    setRows(parseMealText(text).map((it, i) => resolveItem(it, foods, `${i}:${it.name}`)));
  }, [text, foods]);

  // Go-to foods: most logged items (free-text ones only), same meal first.
  const goTo = useMemo(() => {
    const count = new Map<string, { text: string; n: number; inSlot: number }>();
    for (const m of mealLogs) {
      if (m.recipeId) continue;
      const text = m.title
        .replace(/^\d{2}:\d{2} · /, '')
        .replace(/ \((.+)\)$/, ' $1')
        .trim();
      if (!text) continue;
      const e = count.get(text) ?? { text, n: 0, inSlot: 0 };
      e.n += 1;
      if (m.slot === slot) e.inSlot += 1;
      count.set(text, e);
    }
    return [...count.values()].sort((a, b) => b.inSlot - a.inSlot || b.n - a.n).slice(0, 8);
  }, [mealLogs, slot]);

  if (!open) return null;

  const addLine = (line: string) => setText((cur) => (cur.trim() ? `${cur.trimEnd()}\n${line}` : line));

  const patch = (key: string, p: Partial<ResolvedRow>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...p } : r)));

  const computed = rows.map((r) => {
    const food = r.foodId ? foodById.get(r.foodId) : undefined;
    if (!food) return { r, food, grams: 0, macros: null };
    const grams = rowGrams(r, food);
    return { r, food, grams, macros: macrosForGrams(food, grams) };
  });
  const valid = computed.filter((c) => c.food && c.r.qty > 0);
  const total = valid.reduce(
    (a, c) => ({
      kcal: a.kcal + c.macros!.calories,
      p: a.p + c.macros!.proteinG,
      c: a.c + c.macros!.carbsG,
      f: a.f + c.macros!.fatG,
    }),
    { kcal: 0, p: 0, c: 0, f: 0 }
  );
  const skipped = computed.length - valid.length;

  const handleSave = async () => {
    if (valid.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const prefix = /^\d{2}:\d{2}$/.test(time) ? `${time} · ` : '';
      for (const c of valid) {
        await createMealLog(uid, {
          weekNumber: week,
          dayIndex: day,
          slot,
          title: prefix + formatFoodTitle(c.food!, c.grams, c.r.unit === 'unit' ? c.r.qty : undefined),
          recipeId: '',
          servings: 1,
          ...c.macros!,
          consumed: eaten,
        });
      }
      onClose();
    } catch {
      setError(t('Something went wrong. Check your connection and try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('Add meal')}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 sm:p-4"
    >
      <div className="w-full sm:max-w-xl bg-[#131a24] border-2 border-[#33445e] rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#253247] bg-[#0f151e]">
          <h2 className="text-sm font-semibold text-white">{t('Add meal')}</h2>
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
          <div>
            <label htmlFor="meal-text" className="block text-xs font-medium text-slate-300 mb-1">
              {t('What did you eat?')}
            </label>
            <textarea
              id="meal-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              autoFocus
              placeholder={t('Pão integral, 2 fatias\nPresunto 1 fatia\nQueijo muçarela 1 fatia\nLeite 200 ml')}
              className={`${inputCls} w-full`}
            />
            <p className="text-[11px] text-slate-400 mt-1">
              {t('One food per line or separated by commas. Use g, ml, slices, units, eggs...')}
            </p>
          </div>

          {goTo.length > 0 && (
            <div>
              <p className="text-[11px] font-medium text-slate-400 mb-1.5">{t('Go-to foods (tap to add)')}</p>
              <div className="flex flex-wrap gap-1.5">
                {goTo.map((g) => (
                  <button
                    key={g.text}
                    type="button"
                    onClick={() => addLine(g.text)}
                    className="px-2.5 py-1.5 text-[11px] text-slate-200 bg-[#1a2332] border border-[#2d3c54] hover:border-emerald-400 rounded-md"
                  >
                    {g.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {computed.length > 0 && (
            <ul className="divide-y divide-[#1e293b] border border-[#2d3c54] rounded-lg px-3">
              {computed.map(({ r, food, macros }) => (
                <li key={r.key} className="py-2.5 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {food && <FoodIcon food={food.id} className="w-8 h-8" />}
                    <select
                      aria-label={t('Food')}
                      value={r.foodId ?? ''}
                      onChange={(e) => {
                        const f = foodById.get(e.target.value);
                        patch(r.key, {
                          foodId: e.target.value || null,
                          unit: f?.unit ? 'unit' : 'base',
                          qty: f?.unit ? 1 : 100,
                        });
                      }}
                      className={`${inputCls} flex-1 min-w-[10rem]`}
                    >
                      <option value="">{t('Pick a food...')}</option>
                      {(r.candidates.length ? r.candidates : foods.slice(0, 0)).map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={0.25}
                      step={r.unit === 'unit' ? 0.5 : 1}
                      aria-label={t('Amount')}
                      value={r.qty}
                      onChange={(e) => patch(r.key, { qty: Number(e.target.value) })}
                      className={`${inputCls} w-20 font-mono tabular-nums`}
                    />
                    <select
                      aria-label={t('Unit')}
                      value={r.unit}
                      disabled={!food}
                      onChange={(e) => {
                        const unit = e.target.value as 'base' | 'unit';
                        patch(r.key, {
                          unit,
                          qty: unit === 'unit' ? 1 : food?.unit?.grams ?? 100,
                        });
                      }}
                      className={`${inputCls} w-auto`}
                    >
                      <option value="base">{food?.base ?? 'g'}</option>
                      {food?.unit && <option value="unit">{pluralUnit(food.unit.label, 2)}</option>}
                    </select>
                  </div>
                  <p className="text-[11px] font-mono tabular-nums text-slate-400">
                    {macros
                      ? `${macros.calories} kcal · ${macros.proteinG}P · ${macros.carbsG}C · ${macros.fatG}F`
                      : t('Food not found for "{name}". Pick one from the list or add it in Food DB.', {
                          name: r.typed,
                        })}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {computed.length > 0 && (
            <div className="grid grid-cols-4 gap-2 text-center bg-[#0e141d] border border-[#2d3c54] rounded-lg p-3 font-mono tabular-nums">
              {[
                [Math.round(total.kcal), 'kcal'],
                [Number(total.p.toFixed(1)), 'P'],
                [Number(total.c.toFixed(1)), 'C'],
                [Number(total.f.toFixed(1)), 'F'],
              ].map(([v, l]) => (
                <div key={l}>
                  <p className="text-sm font-semibold text-white">{v}</p>
                  <p className="text-[10px] text-slate-400">{l}</p>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="meal-slot" className="block text-xs font-medium text-slate-300 mb-1">
                {t('Meal')}
              </label>
              <select
                id="meal-slot"
                value={slot}
                onChange={(e) => setSlot(e.target.value as MealSlot)}
                className={`${inputCls} w-full`}
              >
                <option value="on_the_spot">{t('Loose meal (extra)')}</option>
                {slots
                  .filter((s) => s.key !== 'on_the_spot')
                  .map((s) => (
                    <option key={s.key} value={s.key}>
                      {slotLabel(s.label)}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label htmlFor="meal-time" className="block text-xs font-medium text-slate-300 mb-1">
                {t('Time (optional)')}
              </label>
              <input
                id="meal-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={`${inputCls} w-full`}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-200 min-h-[36px] cursor-pointer">
            <input
              type="checkbox"
              checked={eaten}
              onChange={(e) => setEaten(e.target.checked)}
              className="w-4 h-4 rounded border-[#394c69] bg-[#0e141d] text-emerald-400"
            />
            {t('Already eaten')}
          </label>

          {skipped > 0 && valid.length > 0 && (
            <p className="text-xs text-amber-300">
              {t('{n} item(s) without a food will be skipped.', { n: skipped })}
            </p>
          )}
          {error && <p className="text-xs text-rose-300">{error}</p>}

          <button
            type="button"
            disabled={busy || valid.length === 0}
            onClick={() => void handleSave()}
            className="w-full min-h-[44px] text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg"
          >
            {busy ? t('Saving...') : t('Add to day')}
          </button>
        </div>
      </div>
    </div>
  );
};
