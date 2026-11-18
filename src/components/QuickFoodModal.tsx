import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  buildDailyMealSlots,
  DAY_FULL,
  MealSlot,
  SCHEMA_LIMITS,
  UserProfile,
} from '../types';
import { createMealLog } from '../lib/firestoreService';
import { useT } from '../lib/i18n';

interface Props {
  open: boolean;
  onClose: () => void;
  uid: string;
  profile: UserProfile;
  defaultWeek?: number;
  defaultDay?: number;
  defaultSlot?: MealSlot;
}

export const QuickFoodModal: React.FC<Props> = ({
  open,
  onClose,
  uid,
  profile,
  defaultWeek,
  defaultDay,
  defaultSlot,
}) => {
  const t = useT();
  const mealsPerDay = profile.mealsPerDay ?? 6;
  const slots = buildDailyMealSlots(mealsPerDay);

  const jsDay = new Date().getDay();
  const todayIndex = jsDay === 0 ? 6 : jsDay - 1;

  const [weekNumber, setWeekNumber] = useState(defaultWeek ?? profile.currentWeek);
  const [dayIndex, setDayIndex] = useState(defaultDay ?? todayIndex);
  const [slot, setSlot] = useState<MealSlot>(defaultSlot ?? 'on_the_spot');
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
      setTitle('');
      setCalories(300);
      setProteinG(25);
      setCarbsG(30);
      setFatG(8);
      setConsumed(true);
      setError(null);
    }
  }, [open, defaultWeek, defaultDay, defaultSlot, profile.currentWeek, todayIndex]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim();
    if (!finalTitle) {
      setError(t('Please enter a food or meal name.'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createMealLog(uid, {
        weekNumber,
        dayIndex,
        slot,
        title: finalTitle,
        recipeId: '',
        servings: 1,
        calories,
        proteinG,
        carbsG,
        fatG,
        consumed,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 sm:p-4">
      <div className="w-full sm:max-w-lg bg-[#131a24] border-2 border-[#33445e] rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 bg-[#0f151e] border-b border-[#253247]">
          <div>
            <h2 className="text-base font-semibold text-white">{t('Log Food Eaten On the Spot')}</h2>
            <p className="text-xs text-slate-400">
              {t('Record extra food, snacks, or shakes eaten during the day.')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('Close quick food modal')}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg"
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

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">{t('Food / Meal Name')}</label>
            <input
              type="text"
              required
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
                required
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
                required
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
                required
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
                required
                value={fatG}
                onChange={(e) => setFatG(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm text-white bg-[#0e141d] font-mono tabular-nums border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <label className="inline-flex items-center gap-2.5 text-xs font-medium text-slate-200 cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              checked={consumed}
              onChange={(e) => setConsumed(e.target.checked)}
              className="w-4 h-4 rounded border-[#394c69] bg-[#0e141d] text-emerald-400 focus:ring-emerald-400"
            />
            {t("Already eaten (count immediately toward today's consumed macros)")}
          </label>

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
            <button
              type="submit"
              disabled={saving}
              className="min-h-[44px] px-5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg"
            >
              {saving ? t('Logging...') : t('Save Food Entry')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
