import React from 'react';
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
            <span>Active Training Block</span>
            <span aria-hidden="true">·</span>
            <span>Started {profile.startDate}</span>
            <span aria-hidden="true">·</span>
            <span>{profile.unitSystem === 'imperial' ? 'Imperial' : 'Metric'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Week {profile.currentWeek}: {profile.phaseName}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center border border-[#2d3c54] rounded-md bg-[#0e141d] p-1">
            <button
              type="button"
              onClick={() => void handleStepWeek(-1)}
              disabled={profile.currentWeek <= 1}
              aria-label="Previous week"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1a2434] rounded disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-mono font-medium text-slate-100 tabular-nums whitespace-nowrap">
              Week {profile.currentWeek} of 52
            </span>
            <button
              type="button"
              onClick={() => void handleStepWeek(1)}
              disabled={profile.currentWeek >= 52}
              aria-label="Next week"
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
            Log Food Eaten
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="min-h-[42px] inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-200 bg-[#1a2332] border border-[#2d3c54] hover:bg-[#233044] rounded-md transition-colors whitespace-nowrap"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Edit Week &amp; Targets
          </button>
        </div>
      </div>

      {/* 4-Column KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#131a24] border-2 border-[#263347] rounded-xl p-5">
          <p className="text-xs font-medium text-slate-400">Current Weight</p>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold text-white font-mono tabular-nums">
              {latestMeas ? `${latestMeas.weight} ${wUnit}` : 'No check-in'}
            </span>
            {weightDelta !== null && (
              <span
                className={`text-xs font-mono font-medium tabular-nums ${
                  weightDelta <= 0 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {weightDelta > 0 ? `+${weightDelta}` : weightDelta} {wUnit} vs W{firstMeas.weekNumber}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-2 font-mono tabular-nums">
            Target: {profile.targetWeight} {wUnit}
          </p>
        </div>

        <div className="bg-[#131a24] border-2 border-[#263347] rounded-xl p-5">
          <p className="text-xs font-medium text-slate-400">
            Week {profile.currentWeek} Gym Sessions
          </p>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold text-white font-mono tabular-nums">
              {completedSessions} / {profile.weeklyWorkoutTarget}
            </span>
            <span className="text-xs font-mono font-medium text-emerald-400 tabular-nums">
              {Math.round(totalWeekVolume).toLocaleString()} {wUnit} vol
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {trainingDays.length} training days scheduled
          </p>
        </div>

        <div className="bg-[#131a24] border-2 border-[#263347] rounded-xl p-5">
          <p className="text-xs font-medium text-slate-400">
            Avg Logged Intake (W{profile.currentWeek})
          </p>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold text-white font-mono tabular-nums">
              {avgConsumedKcal > 0 ? `${avgConsumedKcal.toLocaleString()} kcal` : '0 kcal'}
            </span>
            <span className="text-xs font-mono font-medium text-sky-400 tabular-nums">
              {avgProteinG}g P/d
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-mono tabular-nums">
            Target: {profile.dailyCalorieTarget.toLocaleString()} kcal · {profile.proteinTargetG}g P
          </p>
        </div>

        <div className="bg-[#131a24] border-2 border-[#263347] rounded-xl p-5">
          <p className="text-xs font-medium text-slate-400">Waist &amp; Body Fat</p>
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
              ? `Est. Body Fat: ${latestMeas.bodyFatPct}%`
              : 'Log body fat on next check-in'}
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
              <h2 className="text-base font-semibold text-white">Body Weight Trajectory</h2>
              <p className="text-xs text-slate-400">
                Logged check-ins vs {profile.targetWeight} {wUnit} target
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenQuickMeasurement}
              className="text-xs font-medium text-amber-400 hover:text-amber-300 whitespace-nowrap"
            >
              + Log check-in
            </button>
          </div>

          {weightChartData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center border border-dashed border-[#2c3b52] rounded-lg text-center p-6">
              <p className="text-sm font-medium text-slate-200">No measurements logged yet</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Add your first weight and waist measurement to plot progress.
              </p>
              <button
                type="button"
                onClick={onOpenQuickMeasurement}
                className="px-3.5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md"
              >
                Log First Measurement
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
                    formatter={(value: unknown) => [`${value} ${wUnit}`, 'Weight']}
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
                      value: `Target ${profile.targetWeight}${wUnit}`,
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
                Week {profile.currentWeek} Calorie Compliance
              </h2>
              <p className="text-xs text-slate-400">
                Planned vs consumed kcal compared to {profile.dailyCalorieTarget.toLocaleString()} target
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('charts')}
              className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 whitespace-nowrap"
            >
              All charts
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
                <Bar dataKey="plannedKcal" name="Planned kcal" fill="#334155" radius={[4, 4, 0, 0]} />
                <Bar dataKey="consumedKcal" name="Consumed kcal" fill="#10b981" radius={[4, 4, 0, 0]} />
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
                Week {profile.currentWeek} Dungeon Split
              </h2>
              <p className="text-xs text-slate-400">
                Complete a session for +50 XP &amp; Boss damage
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('gym')}
              className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 whitespace-nowrap"
            >
              Open Gym Plan
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {currentWeekWorkouts.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-[#2c3b52] rounded-lg">
              <p className="text-sm text-slate-300">
                No workouts planned for Week {profile.currentWeek} yet.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('gym')}
                className="mt-3 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md"
              >
                Build Week {profile.currentWeek} Split
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
                      aria-label={`Toggle ${DAY_SHORT[day.dayIndex]} workout`}
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
                        {DAY_SHORT[day.dayIndex]} · {day.focus}
                      </p>
                      <p className="text-xs text-slate-400 font-mono tabular-nums">
                        {day.isRestDay
                          ? 'Safe Room / Recovery'
                          : `${day.exercises.length} exercises · ${Math.round(
                              computeExerciseVolume(day.exercises)
                            ).toLocaleString()} ${wUnit}`}
                        {day.cardio && day.cardio.activityType !== 'none'
                          ? ` · ${day.cardio.activityType === 'walk' ? 'Walk' : 'Run'} ${
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
                    {day.completed ? 'Cleared' : day.isRestDay ? 'Rest' : 'Active'}
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
                {DAY_SHORT[todayIdx]} Rations (Week {profile.currentWeek})
              </h2>
              <p className="text-xs text-slate-400">
                Check off meals as you eat them (+25 XP/day)
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('diet')}
              className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 whitespace-nowrap"
            >
              Diet &amp; Recipes
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {todayMeals.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-[#2c3b52] rounded-lg">
              <p className="text-sm text-slate-300">
                No meals scheduled for {DAY_SHORT[todayIdx]} in Week {profile.currentWeek}.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('diet')}
                className="mt-3 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md"
              >
                Schedule Meals
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
                      aria-label={`Mark ${meal.title} consumed`}
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
                        {getMealSlotLabel(meal.slot)} · {meal.servings}x serving
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
