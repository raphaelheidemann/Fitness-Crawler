import React, { useEffect, useState } from 'react';
import { useT } from '../lib/i18n';
import { X } from 'lucide-react';
import { CrawlerStyle, Sex, UnitSystem, UserProfile } from '../types';
import { IdentityFields } from './IdentityFields';
import { updateUserProfileSettings } from '../lib/firestoreService';

interface Props {
  open: boolean;
  onClose: () => void;
  profile: UserProfile;
  uid: string;
}

export const ProgramSettingsModal: React.FC<Props> = ({ open, onClose, profile, uid }) => {
  const t = useT();
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [currentWeek, setCurrentWeek] = useState(profile.currentWeek);
  const [phaseName, setPhaseName] = useState(profile.phaseName);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(profile.unitSystem);
  const [startDate, setStartDate] = useState(profile.startDate);
  const [targetWeight, setTargetWeight] = useState(profile.targetWeight);
  const [dailyCalorieTarget, setDailyCalorieTarget] = useState(profile.dailyCalorieTarget);
  const [proteinTargetG, setProteinTargetG] = useState(profile.proteinTargetG);
  const [carbsTargetG, setCarbsTargetG] = useState(profile.carbsTargetG);
  const [fatTargetG, setFatTargetG] = useState(profile.fatTargetG);
  const [weeklyWorkoutTarget, setWeeklyWorkoutTarget] = useState(profile.weeklyWorkoutTarget);
  const [mealsPerDay, setMealsPerDay] = useState(profile.mealsPerDay ?? 6);
  const [dailyWaterGoalMl, setDailyWaterGoalMl] = useState(profile.dailyWaterGoalMl ?? 3000);
  const [sex, setSex] = useState<Sex>(profile.sex ?? 'unspecified');
  const [crawlerStyle, setCrawlerStyle] = useState<CrawlerStyle>(profile.crawlerStyle ?? 'neutral');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDisplayName(profile.displayName);
      setCurrentWeek(profile.currentWeek);
      setPhaseName(profile.phaseName);
      setUnitSystem(profile.unitSystem);
      setStartDate(profile.startDate);
      setTargetWeight(profile.targetWeight);
      setDailyCalorieTarget(profile.dailyCalorieTarget);
      setProteinTargetG(profile.proteinTargetG);
      setCarbsTargetG(profile.carbsTargetG);
      setFatTargetG(profile.fatTargetG);
      setWeeklyWorkoutTarget(profile.weeklyWorkoutTarget);
      setMealsPerDay(profile.mealsPerDay ?? 6);
      setDailyWaterGoalMl(profile.dailyWaterGoalMl ?? 3000);
      setSex(profile.sex ?? 'unspecified');
      setCrawlerStyle(profile.crawlerStyle ?? 'neutral');
    }
  }, [open, profile]);

  if (!open) return null;

  const estimatedKcal = proteinTargetG * 4 + carbsTargetG * 4 + fatTargetG * 9;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUserProfileSettings(uid, {
        displayName,
        currentWeek,
        phaseName,
        unitSystem,
        startDate,
        targetWeight,
        dailyCalorieTarget,
        proteinTargetG,
        carbsTargetG,
        fatTargetG,
        weeklyWorkoutTarget,
        mealsPerDay,
        dailyWaterGoalMl,
        sex,
        crawlerStyle,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-2xl bg-[#131a24] border-2 border-[#33445e] rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 bg-[#0f151e] border-b border-[#253247]">
          <div>
            <h2 className="text-lg font-semibold text-white">{t('Program & Macro Targets')}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {t('Configure your active week, training phase, daily meals, and nutrition targets.')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('Close settings')}
            className="p-2 text-slate-400 hover:text-white hover:bg-[#1a2332] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {t('Athlete Name')}
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 text-sm text-white bg-[#0e141d] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {t('Unit System')}
              </label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-[#0e141d] border border-[#2d3c54] rounded-lg">
                <button
                  type="button"
                  onClick={() => setUnitSystem('metric')}
                  className={`py-1.5 px-3 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                    unitSystem === 'metric'
                      ? 'bg-amber-400 text-slate-950'
                      : 'text-slate-300 hover:text-white hover:bg-[#1a2332]'
                  }`}
                >
                  {t('Metric (kg / cm)')}
                </button>
                <button
                  type="button"
                  onClick={() => setUnitSystem('imperial')}
                  className={`py-1.5 px-3 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                    unitSystem === 'imperial'
                      ? 'bg-amber-400 text-slate-950'
                      : 'text-slate-300 hover:text-white hover:bg-[#1a2332]'
                  }`}
                >
                  {t('Imperial (lbs / in)')}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {t('Current Week (1–52)')}
              </label>
              <input
                type="number"
                min={1}
                max={52}
                required
                value={currentWeek}
                onChange={(e) => setCurrentWeek(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm text-white tabular-nums bg-[#0e141d] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {t('Program Phase')}
              </label>
              <input
                type="text"
                required
                maxLength={80}
                placeholder={t('e.g., Lean Hypertrophy, Cut, Strength Block')}
                value={phaseName}
                onChange={(e) => setPhaseName(e.target.value)}
                className="w-full px-3 py-2 text-sm text-white placeholder:text-slate-500 bg-[#0e141d] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {t('Block Start Date')}
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm text-white tabular-nums bg-[#0e141d] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {t('Target Weight ({unit})', { unit: unitSystem === 'imperial' ? 'lbs' : 'kg' })}
              </label>
              <input
                type="number"
                step="0.1"
                min={20}
                max={500}
                required
                value={targetWeight}
                onChange={(e) => setTargetWeight(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm text-white tabular-nums bg-[#0e141d] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#253247]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">{t('Daily Nutrition & Gym Targets')}</h3>
              <span className="text-xs text-slate-400 tabular-nums">
                {t('Macro sum: {n} kcal', { n: estimatedKcal.toLocaleString() })}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('Calories')}
                </label>
                <input
                  type="number"
                  min={800}
                  max={10000}
                  required
                  value={dailyCalorieTarget}
                  onChange={(e) => setDailyCalorieTarget(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm text-white tabular-nums bg-[#0e141d] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('Protein (g)')}
                </label>
                <input
                  type="number"
                  min={20}
                  max={600}
                  required
                  value={proteinTargetG}
                  onChange={(e) => setProteinTargetG(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm text-white tabular-nums bg-[#0e141d] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('Carbs (g)')}
                </label>
                <input
                  type="number"
                  min={0}
                  max={1200}
                  required
                  value={carbsTargetG}
                  onChange={(e) => setCarbsTargetG(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm text-white tabular-nums bg-[#0e141d] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('Fat (g)')}
                </label>
                <input
                  type="number"
                  min={10}
                  max={400}
                  required
                  value={fatTargetG}
                  onChange={(e) => setFatTargetG(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm text-white tabular-nums bg-[#0e141d] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('Sessions / Wk')}
                </label>
                <input
                  type="number"
                  min={1}
                  max={7}
                  required
                  value={weeklyWorkoutTarget}
                  onChange={(e) => setWeeklyWorkoutTarget(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm text-white tabular-nums bg-[#0e141d] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('Meals / Day')}
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  required
                  value={mealsPerDay}
                  onChange={(e) => setMealsPerDay(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm text-white tabular-nums bg-[#0e141d] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('Water Goal (ml)')}
                </label>
                <input
                  type="number"
                  min={500}
                  max={10000}
                  step={100}
                  required
                  value={dailyWaterGoalMl}
                  onChange={(e) => setDailyWaterGoalMl(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm text-white tabular-nums bg-[#0e141d] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          </div>

          <IdentityFields
            sex={sex}
            crawlerStyle={crawlerStyle}
            onSexChange={setSex}
            onStyleChange={setCrawlerStyle}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#253247]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-200 hover:bg-[#1a2332] rounded-lg transition-colors whitespace-nowrap"
            >
              {t('Cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap"
            >
              {saving ? t('Saving...') : t('Save Targets')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
