import React from 'react';
import { useT } from '../lib/i18n';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  Plus,
  SlidersHorizontal,
} from 'lucide-react';
import {
  CrawlerState,
  DAY_SHORT,
  getMealSlotLabel,
  Habit,
  HabitLog,
  HydrationLog,
  MealLog,
  MealSlot,
  Measurement,
  NavSection,
  UserProfile,
  WorkoutDay,
} from '../types';
import {
  computeExerciseVolume,
  distanceUnit,
  lengthUnit,
  weightUnit,
} from '../lib/sanitize';
import { WeeklyChallengeSummary } from '../lib/crawlerEngine';
import {
  toggleMealConsumed,
  toggleWorkoutCompleted,
  updateUserWeekAndPhase,
} from '../lib/firestoreService';
import { HydrationCard } from './HydrationCard';
import { HabitTrackerCard } from './HabitTrackerCard';
import { HuntingGroundsStage } from './HuntingGroundsStage';

interface Props {
  uid: string;
  profile: UserProfile;
  workouts: WorkoutDay[];
  mealLogs: MealLog[];
  hydrationLogs: HydrationLog[];
  habits: Habit[];
  habitLogs: HabitLog[];
  measurements: Measurement[];
  crawler: CrawlerState;
  weeklySummary: WeeklyChallengeSummary;
  onOpenArmory: (initialTab?: 'customize' | 'armory' | 'loot' | 'achievements') => void;
  onToggleSfx: () => void;
  onNavigate: (section: NavSection) => void;
  onOpenSettings: () => void;
  onOpenQuickMeasurement: () => void;
  onOpenQuickFood: (week: number, day: number, slot?: MealSlot) => void;
}

export const OverviewView: React.FC<Props> = ({
  uid,
  profile,
  workouts,
  mealLogs,
  hydrationLogs,
  habits,
  habitLogs,
  measurements,
  crawler,
  weeklySummary,
  onOpenArmory,
  onToggleSfx,
  onNavigate,
  onOpenSettings,
  onOpenQuickMeasurement,
  onOpenQuickFood,
}) => {
  const t = useT();
  const wUnit = weightUnit(profile.unitSystem);
  const lUnit = lengthUnit(profile.unitSystem);
  const dUnit = distanceUnit(profile.unitSystem);

  const sortedMeasurements = [...measurements].sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  const latestMeas = sortedMeasurements[sortedMeasurements.length - 1];
  const firstMeas = sortedMeasurements[0];

  const weightDelta =
    latestMeas && firstMeas && sortedMeasurements.length > 1
      ? Number((latestMeas.weight - firstMeas.weight).toFixed(1))
      : null;

  const waistDelta =
    latestMeas &&
    firstMeas &&
    sortedMeasurements.length > 1 &&
    latestMeas.waist > 0 &&
    firstMeas.waist > 0
      ? Number((latestMeas.waist - firstMeas.waist).toFixed(1))
      : null;

  const currentWeekWorkouts = workouts
    .filter((w) => w.weekNumber === profile.currentWeek)
    .sort((a, b) => a.dayIndex - b.dayIndex);

  const trainingDays = currentWeekWorkouts.filter((w) => !w.isRestDay);
  const completedSessions = trainingDays.filter((w) => w.completed).length;
  const totalWeekVolume = currentWeekWorkouts.reduce(
    (sum, w) => sum + computeExerciseVolume(w.exercises),
    0
  );

  const currentWeekMeals = mealLogs.filter((m) => m.weekNumber === profile.currentWeek);
  const dailyChartData = DAY_SHORT.map((day, idx) => {
    const dayMeals = currentWeekMeals.filter((m) => m.dayIndex === idx);
    const consumedKcal = dayMeals
      .filter((m) => m.consumed)
      .reduce((acc, m) => acc + m.calories, 0);
    const plannedKcal = dayMeals.reduce((acc, m) => acc + m.calories, 0);
    const proteinG = dayMeals
      .filter((m) => m.consumed)
      .reduce((acc, m) => acc + m.proteinG, 0);
    return {
      day,
      consumedKcal: Math.round(consumedKcal),
      plannedKcal: Math.round(plannedKcal),
      proteinG: Math.round(proteinG),
    };
  });

  const daysWithConsumed = dailyChartData.filter((d) => d.consumedKcal > 0);
  const avgConsumedKcal =
    daysWithConsumed.length > 0
      ? Math.round(
          daysWithConsumed.reduce((s, d) => s + d.consumedKcal, 0) / daysWithConsumed.length
        )
      : 0;
  const avgProteinG =
    daysWithConsumed.length > 0
      ? Math.round(
          daysWithConsumed.reduce((s, d) => s + d.proteinG, 0) / daysWithConsumed.length
        )
      : 0;

  const weightChartData = sortedMeasurements.map((m) => ({
    label: `W${m.weekNumber}`,
    date: m.date,
    weight: m.weight,
    waist: m.waist,
  }));

  const jsDay = new Date().getDay();
  const todayIdx = jsDay === 0 ? 6 : jsDay - 1;
  const todayMeals = currentWeekMeals.filter((m) => m.dayIndex === todayIdx);
  const todayHydration = hydrationLogs.find(
    (h) => h.weekNumber === profile.currentWeek && h.dayIndex === todayIdx
  );

  const handleStepWeek = async (delta: number) => {
    const nextWeek = Math.min(52, Math.max(1, profile.currentWeek + delta));
    if (nextWeek !== profile.currentWeek) {
      await updateUserWeekAndPhase(uid, nextWeek, profile.phaseName);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dungeon Crawler Hunting Grounds Stage & Weekly Boss */}
      <HuntingGroundsStage
        crawler={crawler}
        displayName={profile.displayName}
        weekNumber={profile.currentWeek}
        weeklySummary={weeklySummary}
        onOpenArmory={onOpenArmory}
        onOpenGuild={() => onNavigate('guild')}
        onToggleSfx={onToggleSfx}
      />

      {/* Program Week Header Strip */}
      <div className="bg-[#131a24] border-2 border-[#263347] rounded-xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>{t('Active Training Block')}</span>
            <span aria-hidden="true">·</span>
            <span>{t('Started {date}', { date: profile.startDate })}</span>
            <span aria-hidden="true">·</span>
            <span>{profile.unitSystem === 'imperial' ? t('Imperial') : t('Metric')}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            {t('Week {n}', { n: profile.currentWeek })}: {profile.phaseName}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center border border-[#2d3c54] rounded-md bg-[#0e141d] p-1">
            <button
              type="button"
              onClick={() => void handleStepWeek(-1)}
              disabled={profile.currentWeek <= 1}
              aria-label={t('Previous week')}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1a2434] rounded disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-mono font-medium text-slate-100 tabular-nums whitespace-nowrap">
              {t('Week {n} of 52', { n: profile.currentWeek })}
            </span>
            <button
              type="button"
              onClick={() => void handleStepWeek(1)}
              disabled={profile.currentWeek >= 52}
              aria-label={t('Next week')}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1a2434] rounded disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onOpenQuickFood(profile.currentWeek, todayIdx, 'on_the_spot')}
            className="min-h-[42px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('Log Food Eaten')}
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="min-h-[42px] inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-200 bg-[#1a2332] border border-[#2d3c54] hover:bg-[#233044] rounded-md transition-colors whitespace-nowrap"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {t('Edit Week & Targets')}
          </button>
        </div>
      </div>

      {/* 4-Column KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#131a24] border-2 border-[#263347] rounded-xl p-5">
          <p className="text-xs font-medium text-slate-400">{t('Current Weight')}</p>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold text-white font-mono tabular-nums">
              {latestMeas ? `${latestMeas.weight} ${wUnit}` : t('No check-in')}
            </span>
            {weightDelta !== null && (
              <span
                className={`text-xs font-mono font-medium tabular-nums ${
                  weightDelta <= 0 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {weightDelta > 0 ? `+${weightDelta}` : weightDelta} {wUnit} {t('vs W{n}', { n: firstMeas.weekNumber })}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-2 font-mono tabular-nums">
            {t('Target: {n} {unit}', { n: profile.targetWeight, unit: wUnit })}
          </p>
        </div>

        <div className="bg-[#131a24] border-2 border-[#263347] rounded-xl p-5">
          <p className="text-xs font-medium text-slate-400">
            {t('Week {n} Gym Sessions', { n: profile.currentWeek })}
          </p>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold text-white font-mono tabular-nums">
              {completedSessions} / {profile.weeklyWorkoutTarget}
            </span>
            <span className="text-xs font-mono font-medium text-emerald-400 tabular-nums">
              {t('{n} {unit} vol', { n: Math.round(totalWeekVolume).toLocaleString(), unit: wUnit })}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {t('{n} training days scheduled', { n: trainingDays.length })}
          </p>
        </div>

        <div className="bg-[#131a24] border-2 border-[#263347] rounded-xl p-5">
          <p className="text-xs font-medium text-slate-400">
            {t('Avg Logged Intake (W{n})', { n: profile.currentWeek })}
          </p>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold text-white font-mono tabular-nums">
              {avgConsumedKcal > 0 ? `${avgConsumedKcal.toLocaleString()} kcal` : '0 kcal'}
            </span>
            <span className="text-xs font-mono font-medium text-sky-400 tabular-nums">
              {t('{n}g P/d', { n: avgProteinG })}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-mono tabular-nums">
            {t('Target: {kcal} kcal · {p}g P', {
              kcal: profile.dailyCalorieTarget.toLocaleString(),
              p: profile.proteinTargetG,
            })}
          </p>
        </div>

        <div className="bg-[#131a24] border-2 border-[#263347] rounded-xl p-5">
          <p className="text-xs font-medium text-slate-400">{t('Waist & Body Fat')}</p>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold text-white font-mono tabular-nums">
              {latestMeas && latestMeas.waist > 0 ? `${latestMeas.waist} ${lUnit}` : '—'}
            </span>
            {waistDelta !== null && (
              <span className="text-xs font-mono font-medium text-emerald-400 tabular-nums">
                {waistDelta > 0 ? `+${waistDelta}` : waistDelta} {lUnit}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-2 font-mono tabular-nums">
            {latestMeas && latestMeas.bodyFatPct > 0
              ? t('Est. Body Fat: {n}%', { n: latestMeas.bodyFatPct })
              : t('Log body fat on next check-in')}
          </p>
        </div>
      </div>

      {/* Visual Colorful Habit Tracker & Goal Mosaic */}
      <HabitTrackerCard uid={uid} habits={habits} habitLogs={habitLogs} />

      {/* Interactive Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#131a24] border-2 border-[#263347] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">{t('Body Weight Trajectory')}</h2>
              <p className="text-xs text-slate-400">
                {t('Logged check-ins vs {n} {unit} target', { n: profile.targetWeight, unit: wUnit })}
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenQuickMeasurement}
              className="text-xs font-medium text-amber-400 hover:text-amber-300 whitespace-nowrap"
            >
              {t('+ Log check-in')}
            </button>
          </div>

          {weightChartData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center border border-dashed border-[#2c3b52] rounded-lg text-center p-6">
              <p className="text-sm font-medium text-slate-200">{t('No measurements logged yet')}</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                {t('Add your first weight and waist measurement to plot progress.')}
              </p>
              <button
                type="button"
                onClick={onOpenQuickMeasurement}
                className="px-3.5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md"
              >
                {t('Log First Measurement')}
              </button>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weightChartData} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="weightArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#253247" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: '#94A3B8' }}
                    axisLine={{ stroke: '#253247' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 12, fill: '#94A3B8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f151e',
                      border: '1px solid #33445e',
                      borderRadius: '8px',
                      color: '#f1f5f9',
                      fontSize: '12px',
                    }}
                    formatter={(value: unknown) => [`${value} ${wUnit}`, t('Weight')]}
                    labelFormatter={(label, payload) => {
                      const row = payload?.[0]?.payload as { date?: string } | undefined;
                      return `${label}${row?.date ? ` · ${row.date}` : ''}`;
                    }}
                  />
                  <ReferenceLine
                    y={profile.targetWeight}
                    stroke="#38bdf8"
                    strokeDasharray="4 4"
                    label={{
                      value: `${t('Target')} ${profile.targetWeight}${wUnit}`,
                      position: 'insideTopRight',
                      fill: '#38bdf8',
                      fontSize: 11,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#weightArea)"
                    activeDot={{ r: 5, fill: '#34d399' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-[#131a24] border-2 border-[#263347] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">
                {t('Week {n} Calorie Compliance', { n: profile.currentWeek })}
              </h2>
              <p className="text-xs text-slate-400">
                {t('Planned vs consumed kcal compared to {n} target', {
                  n: profile.dailyCalorieTarget.toLocaleString(),
                })}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('charts')}
              className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 whitespace-nowrap"
            >
              {t('All charts')}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyChartData} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#253247" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12, fill: '#94A3B8' }}
                  axisLine={{ stroke: '#253247' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f151e',
                    border: '1px solid #33445e',
                    borderRadius: '8px',
                    color: '#f1f5f9',
                    fontSize: '12px',
                  }}
                />
                <ReferenceLine
                  y={profile.dailyCalorieTarget}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                />
                <Bar dataKey="plannedKcal" name={t('Planned kcal')} fill="#334155" radius={[4, 4, 0, 0]} />
                <Bar dataKey="consumedKcal" name={t('Consumed kcal')} fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Hydration Tracker for Today */}
      <HydrationCard
        uid={uid}
        weekNumber={profile.currentWeek}
        dayIndex={todayIdx}
        unitSystem={profile.unitSystem}
        defaultGoalMl={profile.dailyWaterGoalMl ?? 3000}
        hydrationLog={todayHydration}
        compact
      />

      {/* Bottom Split: Week Gym Checklist & Today's Meals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#131a24] border-2 border-[#263347] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">
                {t('Week {n} Dungeon Split', { n: profile.currentWeek })}
              </h2>
              <p className="text-xs text-slate-400">
                {t('Complete a session for +50 XP & Boss damage')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('gym')}
              className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 whitespace-nowrap"
            >
              {t('Open Gym Plan')}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {currentWeekWorkouts.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-[#2c3b52] rounded-lg">
              <p className="text-sm text-slate-300">
                {t('No workouts planned for Week {n} yet.', { n: profile.currentWeek })}
              </p>
              <button
                type="button"
                onClick={() => onNavigate('gym')}
                className="mt-3 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md"
              >
                {t('Build Week {n} Split', { n: profile.currentWeek })}
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#1e293b]">
              {currentWeekWorkouts.map((day) => (
                <div key={day.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => void toggleWorkoutCompleted(uid, day.id, !day.completed)}
                      aria-label={t('Toggle {day} workout', { day: t(DAY_SHORT[day.dayIndex]) })}
                      className={`w-7 h-7 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                        day.completed
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                          : 'bg-[#0e141d] border-[#33445e] text-transparent hover:border-emerald-400'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-100 truncate">
                        {t(DAY_SHORT[day.dayIndex])} · {t(day.focus)}
                      </p>
                      <p className="text-xs text-slate-400 font-mono tabular-nums">
                        {day.isRestDay
                          ? t('Safe Room / Recovery')
                          : `${t('{n} exercises', { n: day.exercises.length })} · ${Math.round(
                              computeExerciseVolume(day.exercises)
                            ).toLocaleString()} ${wUnit}`}
                        {day.cardio && day.cardio.activityType !== 'none'
                          ? ` · ${day.cardio.activityType === 'walk' ? t('Walk') : t('Run')} ${
                              day.cardio.distance
                            } ${dUnit} (${day.cardio.durationMinutes}m)`
                          : ''}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-mono font-medium shrink-0 ${
                      day.completed
                        ? 'text-emerald-400'
                        : day.isRestDay
                        ? 'text-slate-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {day.completed ? t('Cleared') : day.isRestDay ? t('Rest') : t('Active')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#131a24] border-2 border-[#263347] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">
                {t('{day} Rations (Week {n})', { day: t(DAY_SHORT[todayIdx]), n: profile.currentWeek })}
              </h2>
              <p className="text-xs text-slate-400">
                {t('Check off meals as you eat them (+25 XP/day)')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('diet')}
              className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 whitespace-nowrap"
            >
              {t('Diet & Recipes')}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {todayMeals.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-[#2c3b52] rounded-lg">
              <p className="text-sm text-slate-300">
                {t('No meals scheduled for {day} in Week {n}.', {
                  day: t(DAY_SHORT[todayIdx]),
                  n: profile.currentWeek,
                })}
              </p>
              <button
                type="button"
                onClick={() => onNavigate('diet')}
                className="mt-3 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md"
              >
                {t('Schedule Meals')}
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#1e293b]">
              {todayMeals.map((meal) => (
                <div key={meal.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => void toggleMealConsumed(uid, meal.id, !meal.consumed)}
                      aria-label={t('Mark {name} consumed', { name: meal.title })}
                      className={`w-7 h-7 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                        meal.consumed
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                          : 'bg-[#0e141d] border-[#33445e] text-slate-500 hover:border-emerald-400'
                      }`}
                    >
                      {meal.consumed ? <Check className="w-4 h-4" /> : <Circle className="w-3 h-3" />}
                    </button>
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          meal.consumed ? 'text-slate-500 line-through' : 'text-slate-100'
                        }`}
                      >
                        {meal.title}
                      </p>
                      <p className="text-xs text-slate-400">
                        {(() => {
                          const l = getMealSlotLabel(meal.slot);
                          return l.startsWith('Meal ') ? t('Meal {n}', { n: l.slice(5) }) : t(l);
                        })()} · {t('{n}x serving', { n: meal.servings })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 tabular-nums font-mono">
                    <p className="text-xs font-semibold text-slate-100">
                      {Math.round(meal.calories)} kcal
                    </p>
                    <p className="text-xs text-sky-400">{Math.round(meal.proteinG)}g P</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
