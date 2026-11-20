import React, { useMemo, useState } from 'react';
import { Calculator } from 'lucide-react';
import { Sex, UnitSystem } from '../types';
import { ACTIVITY_OPTIONS, ActivityLevel, DietGoal, computeDietTargets } from '../lib/dietGenerator';
import { useT } from '../lib/i18n';

interface Props {
  unitSystem: UnitSystem;
  sex: Sex;
  onSexChange: (s: Sex) => void;
  /** weight in the user's unit (kg or lb) used to prefill */
  weightHint: number;
  onApply: (t: { calories: number; proteinG: number; carbsG: number; fatG: number }) => void;
}

const LB_PER_KG = 2.20462;
const inputCls =
  'w-full px-3 py-2 text-sm text-white tabular-nums bg-[#0e141d] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400';
const labelCls = 'block text-xs font-medium text-slate-300 mb-1';

/** "I don't know my numbers": BMR + activity + goal -> calories and macros. */
export const TargetCalculator: React.FC<Props> = ({ unitSystem, sex, onSexChange, weightHint, onApply }) => {
  const t = useT();
  const imperial = unitSystem === 'imperial';
  const wUnit = imperial ? 'lb' : 'kg';
  const [open, setOpen] = useState(false);
  const [age, setAge] = useState(30);
  const [heightCm, setHeightCm] = useState(170);
  const [weight, setWeight] = useState(Math.round(weightHint || 70));
  const [activity, setActivity] = useState<ActivityLevel>('light');
  const [goal, setGoal] = useState<DietGoal>('maintain');

  const weightKg = imperial ? weight / LB_PER_KG : weight;
  const valid = age >= 14 && age <= 90 && heightCm >= 120 && heightCm <= 230 && weightKg >= 30 && weightKg <= 300;
  const r = useMemo(
    () => computeDietTargets({ sex, age, heightCm, weightKg, targetKg: weightKg, activity, goal }),
    [sex, age, heightCm, weightKg, activity, goal]
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full min-h-[44px] mb-3 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-amber-300 bg-amber-400/10 border border-amber-400/40 hover:bg-amber-400/20 rounded-lg"
      >
        <Calculator className="w-4 h-4" />
        {t("Don't know your numbers? Calculate calories and macros for me")}
      </button>
    );
  }

  return (
    <div className="mb-4 p-4 bg-[#0e141d] border border-amber-400/40 rounded-xl space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-white inline-flex items-center gap-2">
          <Calculator className="w-4 h-4 text-amber-300" />
          {t('Calculate my targets')}
        </h4>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-400 hover:text-white min-h-[36px] px-2">
          {t('Close')}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>{t('Sex')}</label>
          <select value={sex} onChange={(e) => onSexChange(e.target.value as Sex)} className={inputCls}>
            <option value="male">{t('Male')}</option>
            <option value="female">{t('Female')}</option>
            <option value="unspecified">{t('Prefer not to say')}</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>{t('Age')}</label>
          <input type="number" inputMode="numeric" value={age} onChange={(e) => setAge(Number(e.target.value))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>{t('Height (cm)')}</label>
          <input type="number" inputMode="numeric" value={heightCm} onChange={(e) => setHeightCm(Number(e.target.value))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>{t('Current weight ({unit})', { unit: wUnit })}</label>
          <input type="number" inputMode="decimal" value={weight} onChange={(e) => setWeight(Number(e.target.value))} className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>{t('Activity level')}</label>
        <select value={activity} onChange={(e) => setActivity(e.target.value as ActivityLevel)} className={inputCls}>
          {ACTIVITY_OPTIONS.map((a) => (
            <option key={a.key} value={a.key}>
              {t(a.label)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelCls}>{t('Goal')}</label>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ['lose', 'Lose weight'],
              ['maintain', 'Maintain'],
              ['gain', 'Gain weight'],
            ] as [DietGoal, string][]
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setGoal(k)}
              className={`min-h-[40px] text-xs font-semibold rounded-lg border ${
                goal === k ? 'bg-amber-400 text-slate-950 border-amber-400' : 'bg-[#1a2332] text-slate-200 border-[#2d3c54]'
              }`}
            >
              {t(label)}
            </button>
          ))}
        </div>
      </div>

      {valid ? (
        <div className="bg-[#131a24] border border-[#2d3c54] rounded-lg p-3 text-xs space-y-1 font-mono tabular-nums">
          <p className="text-slate-300">
            {t('BMR {bmr} kcal · maintenance {tdee} kcal', { bmr: r.bmr, tdee: r.tdee })}
          </p>
          <p className="text-white font-semibold">
            {t('Daily target {kcal} kcal · {p}P · {c}C · {f}F', { kcal: r.calories, p: r.proteinG, c: r.carbsG, f: r.fatG })}
          </p>
        </div>
      ) : (
        <p className="text-xs text-rose-300">{t('Check age, height and weight.')}</p>
      )}

      <button
        type="button"
        disabled={!valid}
        onClick={() => {
          onApply({ calories: r.calories, proteinG: r.proteinG, carbsG: r.carbsG, fatG: r.fatG });
          setOpen(false);
        }}
        className="w-full min-h-[44px] text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg"
      >
        {t('Use these numbers')}
      </button>
      <p className="text-[11px] text-slate-500">
        {t('General estimate, not medical advice. If you have a health condition, check with a doctor or dietitian.')}
      </p>
    </div>
  );
};
