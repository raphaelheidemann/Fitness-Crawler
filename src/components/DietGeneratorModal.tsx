import React, { useMemo, useState } from 'react';
import { Wand2, X } from 'lucide-react';
import { MealLog, UserProfile } from '../types';
import {
  ACTIVITY_OPTIONS,
  ActivityLevel,
  computeDietTargets,
  DietGoal,
  generateWeekMeals,
  MEAL_COUNT_OPTIONS,
  Sex,
} from '../lib/dietGenerator';
import { useT } from '../lib/i18n';
import { importMealLogs, updateUserProfileSettings } from '../lib/firestoreService';

interface Props {
  open: boolean;
  onClose: () => void;
  uid: string;
  profile: UserProfile;
  week: number;
  mealLogs: MealLog[];
}

const inputCls =
  'w-full px-3 py-2 text-sm text-white bg-[#0e141d] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400';
const labelCls = 'block text-xs font-medium text-slate-300 mb-1';

export const DietGeneratorModal: React.FC<Props> = ({
  open,
  onClose,
  uid,
  profile,
  week,
  mealLogs,
}) => {
  const t = useT();
  const [sex, setSex] = useState<Sex>('male');
  const [age, setAge] = useState(30);
  const [heightCm, setHeightCm] = useState(170);
  const [weightKg, setWeightKg] = useState(Math.max(profile.targetWeight, 70));
  const [targetKg, setTargetKg] = useState(profile.targetWeight);
  const [activity, setActivity] = useState<ActivityLevel>('light');
  const [goalOverride, setGoalOverride] = useState<DietGoal | null>(null);
  const [meals, setMeals] = useState(
    MEAL_COUNT_OPTIONS.includes(profile.mealsPerDay as 3) ? profile.mealsPerDay! : 5
  );
  const [updateTargets, setUpdateTargets] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goal: DietGoal =
    goalOverride ?? (targetKg < weightKg - 1 ? 'lose' : targetKg > weightKg + 1 ? 'gain' : 'maintain');

  const valid =
    age >= 14 && age <= 90 && heightCm >= 120 && heightCm <= 230 && weightKg >= 30 && weightKg <= 300;

  const targets = useMemo(
    () => computeDietTargets({ sex, age, heightCm, weightKg, targetKg, activity, goal }),
    [sex, age, heightCm, weightKg, targetKg, activity, goal]
  );

  const weekMealCount = mealLogs.filter((m) => m.weekNumber === week).length;

  if (!open) return null;

  const handleGenerate = async () => {
    if (!valid) {
      setError(t('Check age, height and weight.'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const generated = generateWeekMeals(week, meals, targets.calories);
      await importMealLogs(uid, generated.rows, mealLogs, true);
      if (updateTargets) {
        const { ownerId: _o, createdAt: _c, updatedAt: _u, ...settings } = profile as UserProfile & {
          ownerId: string;
        };
        await updateUserProfileSettings(uid, {
          ...settings,
          targetWeight: targetKg,
          dailyCalorieTarget: targets.calories,
          proteinTargetG: targets.proteinG,
          carbsTargetG: targets.carbsG,
          fatTargetG: targets.fatG,
          mealsPerDay: meals,
        });
      }
      onClose();
    } catch {
      setError(t('Could not create the plan. Check your connection and try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('Basic diet plan')}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 sm:p-4"
    >
      <div className="w-full sm:max-w-lg bg-[#131a24] border-2 border-[#33445e] rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#253247] bg-[#0f151e]">
          <div className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-white">{t('Basic diet plan')}</h2>
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

        <div className="p-4 overflow-y-auto space-y-4">
          <p className="text-xs text-slate-400">
            {t(
              'Simple everyday foods (eggs, rice, beans, chicken, fruit, yogurt) sized to your metabolism and goal. Every item can be replaced afterwards.'
            )}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{t('Sex')}</label>
              <select value={sex} onChange={(e) => setSex(e.target.value as Sex)} className={inputCls}>
                <option value="male">{t('Male')}</option>
                <option value="female">{t('Female')}</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>{t('Age')}</label>
              <input type="number" value={age} onChange={(e) => setAge(Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{t('Height (cm)')}</label>
              <input type="number" value={heightCm} onChange={(e) => setHeightCm(Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{t('Current weight (kg)')}</label>
              <input type="number" value={weightKg} onChange={(e) => setWeightKg(Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{t('Goal weight (kg)')}</label>
              <input type="number" value={targetKg} onChange={(e) => setTargetKg(Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{t('Goal')}</label>
              <select
                value={goal}
                onChange={(e) => setGoalOverride(e.target.value as DietGoal)}
                className={inputCls}
              >
                <option value="lose">{t('Lose weight')}</option>
                <option value="maintain">{t('Maintain')}</option>
                <option value="gain">{t('Gain weight')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>{t('Activity level')}</label>
            <select
              value={activity}
              onChange={(e) => setActivity(e.target.value as ActivityLevel)}
              className={inputCls}
            >
              {ACTIVITY_OPTIONS.map((a) => (
                <option key={a.key} value={a.key}>
                  {t(a.label)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>{t('Meals per day')}</label>
            <div className="flex gap-2">
              {MEAL_COUNT_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setMeals(n)}
                  className={`flex-1 min-h-[40px] text-xs font-semibold rounded-lg border ${
                    meals === n
                      ? 'bg-amber-400 text-slate-950 border-amber-400'
                      : 'bg-[#1a2332] text-slate-200 border-[#2d3c54]'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {valid && (
            <div className="bg-[#0e141d] border border-[#2d3c54] rounded-lg p-3 text-xs text-slate-300 space-y-1 font-mono tabular-nums">
              <p>
                {t('BMR {bmr} kcal · maintenance {tdee} kcal', { bmr: targets.bmr, tdee: targets.tdee })}
              </p>
              <p className="text-white font-semibold">
                {t('Daily target {kcal} kcal · {p}P · {c}C · {f}F', {
                  kcal: targets.calories,
                  p: targets.proteinG,
                  c: targets.carbsG,
                  f: targets.fatG,
                })}
              </p>
            </div>
          )}

          <label className="flex items-start gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={updateTargets}
              onChange={(e) => setUpdateTargets(e.target.checked)}
              className="mt-0.5"
            />
            {t('Also save these as my daily calorie/macro targets and goal weight')}
          </label>

          {weekMealCount > 0 && (
            <p className="text-xs text-amber-300">
              {t('Week {week} already has {n} planned items. Creating the plan replaces them.', {
                week,
                n: weekMealCount,
              })}
            </p>
          )}
          <p className="text-[11px] text-slate-500">
            {t(
              'General estimate, not medical advice. If you have a health condition, check with a doctor or dietitian.'
            )}
          </p>
          {error && <p className="text-xs text-rose-300">{error}</p>}
        </div>

        <div className="px-4 py-3 border-t border-[#263347] flex justify-end">
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleGenerate()}
            className="min-h-[42px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-60 rounded-lg"
          >
            <Wand2 className="w-3.5 h-3.5" />
            {busy ? t('Creating...') : t('Create Week {week} plan', { week })}
          </button>
        </div>
      </div>
    </div>
  );
};
