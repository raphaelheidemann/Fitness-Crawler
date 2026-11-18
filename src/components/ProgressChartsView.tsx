import React, { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { HydrationLog, MealLog, Measurement, UserProfile, WorkoutDay } from '../types';
import { computeExerciseVolume, distanceUnit, lengthUnit, weightUnit } from '../lib/sanitize';

interface Props {
  profile: UserProfile;
  workouts: WorkoutDay[];
  mealLogs: MealLog[];
  hydrationLogs: HydrationLog[];
  measurements: Measurement[];
}

type RangeFilter = '4w' | '8w' | '12w' | 'all';

type CircumferenceKey = 'waist' | 'chest' | 'hips' | 'arms' | 'thighs';

const CIRCUMFERENCE_SERIES: {
  key: CircumferenceKey;
  label: string;
  color: string;
}[] = [
  { key: 'waist', label: 'Waist', color: '#10b981' },
  { key: 'chest', label: 'Chest', color: '#38bdf8' },
  { key: 'hips', label: 'Hips', color: '#a78bfa' },
  { key: 'arms', label: 'Arms', color: '#f59e0b' },
  { key: 'thighs', label: 'Thighs', color: '#fb7185' },
];

export const ProgressChartsView: React.FC<Props> = ({
  profile,
  workouts,
  mealLogs,
  hydrationLogs,
  measurements,
}) => {
  const [range, setRange] = useState<RangeFilter>('all');
  const [showBodyFat, setShowBodyFat] = useState(true);
  const [activeMetrics, setActiveMetrics] = useState<Record<CircumferenceKey, boolean>>({
    waist: true,
    chest: true,
    hips: false,
    arms: true,
    thighs: false,
  });

  const wUnit = weightUnit(profile.unitSystem);
  const lUnit = lengthUnit(profile.unitSystem);
  const dUnit = distanceUnit(profile.unitSystem);

  const minWeekFilter = useMemo(() => {
    if (range === 'all') return 1;
    const span = range === '4w' ? 4 : range === '8w' ? 8 : 12;
    return Math.max(1, profile.currentWeek - span + 1);
  }, [range, profile.currentWeek]);

  const measurementSeries = useMemo(() => {
    return [...measurements]
      .filter((m) => m.weekNumber >= minWeekFilter)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((m) => ({
        week: `W${m.weekNumber}`,
        date: m.date,
        weight: m.weight,
        bodyFatPct: m.bodyFatPct > 0 ? m.bodyFatPct : null,
        waist: m.waist > 0 ? m.waist : null,
        chest: m.chest > 0 ? m.chest : null,
        hips: m.hips > 0 ? m.hips : null,
        arms: m.arms > 0 ? m.arms : null,
        thighs: m.thighs > 0 ? m.thighs : null,
      }));
  }, [measurements, minWeekFilter]);

  const weeklyNutritionSeries = useMemo(() => {
    const weekMap = new Map<
      number,
      { days: Set<number>; kcal: number; protein: number; carbs: number; fat: number }
    >();

    mealLogs
      .filter((m) => m.consumed && m.weekNumber >= minWeekFilter)
      .forEach((m) => {
        const entry = weekMap.get(m.weekNumber) ?? {
          days: new Set<number>(),
          kcal: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        };
        entry.days.add(m.dayIndex);
        entry.kcal += m.calories;
        entry.protein += m.proteinG;
        entry.carbs += m.carbsG;
        entry.fat += m.fatG;
        weekMap.set(m.weekNumber, entry);
      });

    return Array.from(weekMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([wk, val]) => {
        const d = Math.max(1, val.days.size);
        return {
          week: `W${wk}`,
          avgCalories: Math.round(val.kcal / d),
          avgProtein: Math.round(val.protein / d),
          avgCarbs: Math.round(val.carbs / d),
          avgFat: Math.round(val.fat / d),
        };
      });
  }, [mealLogs, minWeekFilter]);

  const weeklyVolumeSeries = useMemo(() => {
    const weekMap = new Map<number, { volume: number; completed: number; planned: number }>();

    workouts
      .filter((w) => w.weekNumber >= minWeekFilter)
      .forEach((w) => {
        const entry = weekMap.get(w.weekNumber) ?? { volume: 0, completed: 0, planned: 0 };
        if (!w.isRestDay) {
          entry.planned += 1;
          if (w.completed) {
            entry.completed += 1;
          }
          entry.volume += computeExerciseVolume(w.exercises);
        }
        weekMap.set(w.weekNumber, entry);
      });

    return Array.from(weekMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([wk, val]) => ({
        week: `W${wk}`,
        volume: Math.round(val.volume),
        completed: val.completed,
        planned: val.planned,
      }));
  }, [workouts, minWeekFilter]);

  const weeklyCardioSeries = useMemo(() => {
    const weekMap = new Map<
      number,
      { walkDistance: number; runDistance: number; minutes: number }
    >();

    workouts
      .filter((w) => w.weekNumber >= minWeekFilter && w.cardio && w.cardio.activityType !== 'none')
      .forEach((w) => {
        const c = w.cardio!;
        const entry = weekMap.get(w.weekNumber) ?? {
          walkDistance: 0,
          runDistance: 0,
          minutes: 0,
        };
        if (c.activityType === 'walk') entry.walkDistance += c.distance;
        if (c.activityType === 'run') entry.runDistance += c.distance;
        entry.minutes += c.durationMinutes;
        weekMap.set(w.weekNumber, entry);
      });

    return Array.from(weekMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([wk, val]) => ({
        week: `W${wk}`,
        walkDistance: Number(val.walkDistance.toFixed(1)),
        runDistance: Number(val.runDistance.toFixed(1)),
        minutes: Math.round(val.minutes),
      }));
  }, [workouts, minWeekFilter]);

  const weeklyHydrationSeries = useMemo(() => {
    const weekMap = new Map<number, { totalMl: number; count: number; goalMl: number }>();

    hydrationLogs
      .filter((h) => h.weekNumber >= minWeekFilter && h.amountMl > 0)
      .forEach((h) => {
        const entry = weekMap.get(h.weekNumber) ?? {
          totalMl: 0,
          count: 0,
          goalMl: h.goalMl,
        };
        entry.totalMl += h.amountMl;
        entry.count += 1;
        entry.goalMl = h.goalMl;
        weekMap.set(h.weekNumber, entry);
      });

    return Array.from(weekMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([wk, val]) => ({
        week: `W${wk}`,
        avgLiters: Number((val.totalMl / Math.max(1, val.count) / 1000).toFixed(2)),
        goalLiters: Number((val.goalMl / 1000).toFixed(2)),
      }));
  }, [hydrationLogs, minWeekFilter]);

  const toggleMetric = (key: CircumferenceKey) => {
    setActiveMetrics((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#131a24] border-2 border-[#263347] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400">
            Interactive multi-week telemetry across weight, measurements, macros, and gym volume
          </p>
          <h1 className="text-xl font-bold text-white mt-1">Progress Analytics</h1>
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#0e141d] border border-[#2d3c54] rounded-lg self-start sm:self-auto">
          {(
            [
              { id: '4w', label: '4 Weeks' },
              { id: '8w', label: '8 Weeks' },
              { id: '12w', label: '12 Weeks' },
              { id: 'all', label: 'All Weeks' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setRange(item.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                range === item.id
                  ? 'bg-amber-400 text-slate-950'
                  : 'text-slate-300 hover:text-white hover:bg-[#1a2332]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Weight & Body Fat */}
        <div className="bg-[#131a24] border-2 border-[#263347] rounded-xl p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">
                Weight & Body Fat Trend
              </h2>
              <p className="text-xs text-slate-400">
                Target weight: {profile.targetWeight} {wUnit}
              </p>
            </div>
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={showBodyFat}
                onChange={(e) => setShowBodyFat(e.target.checked)}
                className="rounded border-[#394c69] bg-[#0e141d] text-emerald-400 focus:ring-emerald-400"
              />
              Show Body Fat %
            </label>
          </div>

          {measurementSeries.length === 0 ? (
            <div className="h-72 flex items-center justify-center border border-dashed border-[#2d3c54] rounded-lg text-xs text-slate-400">
              No measurement check-ins in this range.
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={measurementSeries} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="progressWeightGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#253247" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#94A3B8' }} tickLine={false} />
                  <YAxis
                    yAxisId="weight"
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 12, fill: '#94A3B8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  {showBodyFat && (
                    <YAxis
                      yAxisId="bf"
                      orientation="right"
                      domain={['auto', 'auto']}
                      tick={{ fontSize: 12, fill: '#38bdf8' }}
                      axisLine={false}
                      tickLine={false}
                    />
                  )}
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f151e',
                      border: '1px solid #33445e',
                      borderRadius: '8px',
                      color: '#f1f5f9',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }} />
                  <ReferenceLine
                    yAxisId="weight"
                    y={profile.targetWeight}
                    stroke="#94A3B8"
                    strokeDasharray="4 4"
                  />
                  <Area
                    yAxisId="weight"
                    type="monotone"
                    dataKey="weight"
                    name={`Weight (${wUnit})`}
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#progressWeightGrad)"
                  />
                  {showBodyFat && (
                    <Line
                      yAxisId="bf"
                      type="monotone"
                      dataKey="bodyFatPct"
                      name="Body Fat (%)"
                      stroke="#38bdf8"
                      strokeWidth={2}
                      connectNulls
                      dot={{ r: 3.5 }}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* 2. Body Circumferences */}
        <div className="bg-[#131a24] border-2 border-[#263347] rounded-xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">
                Circumference Progression ({lUnit})
              </h2>
              <p className="text-xs text-slate-400">Toggle body sites to compare trends</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {CIRCUMFERENCE_SERIES.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => toggleMetric(s.key)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors ${
                    activeMetrics[s.key]
                      ? 'bg-amber-400 text-slate-950 border-amber-400'
                      : 'bg-[#0e141d] text-slate-300 border-[#2d3c54] hover:bg-[#1a2332]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {measurementSeries.length === 0 ? (
            <div className="h-72 flex items-center justify-center border border-dashed border-[#2d3c54] rounded-lg text-xs text-slate-400">
              No circumference measurements in this range.
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={measurementSeries} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#253247" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#94A3B8' }} tickLine={false} />
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
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }} />
                  {CIRCUMFERENCE_SERIES.filter((s) => activeMetrics[s.key]).map((s) => (
                    <Line
                      key={s.key}
                      type="monotone"
                      dataKey={s.key}
                      name={`${s.label} (${lUnit})`}
                      stroke={s.color}
                      strokeWidth={2}
                      connectNulls
                      dot={{ r: 3.5 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* 3. Weekly Average Macro & Calorie Adherence */}
        <div className="bg-[#131a24] border-2 border-[#263347] rounded-xl p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-white">
              Weekly Avg Calorie & Macro Intake
            </h2>
            <p className="text-xs text-slate-400">
              Consumed daily averages per week vs {profile.dailyCalorieTarget.toLocaleString()} kcal target
            </p>
          </div>

          {weeklyNutritionSeries.length === 0 ? (
            <div className="h-72 flex items-center justify-center border border-dashed border-[#2d3c54] rounded-lg text-xs text-slate-400">
              Mark meals as consumed in your Diet Plan to plot weekly nutrition trends.
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={weeklyNutritionSeries} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#253247" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#94A3B8' }} tickLine={false} />
                  <YAxis yAxisId="kcal" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="grams" orientation="right" tick={{ fontSize: 12, fill: '#38bdf8' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f151e',
                      border: '1px solid #33445e',
                      borderRadius: '8px',
                      color: '#f1f5f9',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }} />
                  <ReferenceLine
                    yAxisId="kcal"
                    y={profile.dailyCalorieTarget}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                  />
                  <Bar
                    yAxisId="kcal"
                    dataKey="avgCalories"
                    name="Avg Calories"
                    fill="#475569"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="grams"
                    type="monotone"
                    dataKey="avgProtein"
                    name="Protein (g)"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 3.5 }}
                  />
                  <Line
                    yAxisId="grams"
                    type="monotone"
                    dataKey="avgCarbs"
                    name="Carbs (g)"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* 4. Weekly Gym Volume & Sessions */}
        <div className="bg-[#131a24] border-2 border-[#263347] rounded-xl p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-white">
              Weekly Training Volume & Sessions
            </h2>
            <p className="text-xs text-slate-400">
              Total weekly tonnage ({wUnit}) and completed sessions
            </p>
          </div>

          {weeklyVolumeSeries.length === 0 ? (
            <div className="h-72 flex items-center justify-center border border-dashed border-[#2d3c54] rounded-lg text-xs text-slate-400">
              Plan workouts in Gym Plan to track weekly lifting volume.
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyVolumeSeries} margin={{ top: 10, right: 12, left: -6, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#253247" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#94A3B8' }} tickLine={false} />
                  <YAxis yAxisId="vol" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="sess" orientation="right" domain={[0, 7]} tick={{ fontSize: 12, fill: '#10b981' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f151e',
                      border: '1px solid #33445e',
                      borderRadius: '8px',
                      color: '#f1f5f9',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }} />
                  <Bar
                    yAxisId="vol"
                    dataKey="volume"
                    name={`Volume (${wUnit})`}
                    fill="#38bdf8"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    yAxisId="sess"
                    dataKey="completed"
                    name="Completed Sessions"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* 5. Weekly Walk & Run Cardio */}
        <div className="bg-[#131a24] border-2 border-[#263347] rounded-xl p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-white">
              Weekly Walk & Run Cardio
            </h2>
            <p className="text-xs text-slate-400">
              Total weekly distance ({dUnit}) split by Walk vs Run and total minutes
            </p>
          </div>

          {weeklyCardioSeries.length === 0 ? (
            <div className="h-72 flex items-center justify-center border border-dashed border-[#2d3c54] rounded-lg text-xs text-slate-400">
              Log a Walk or Run in Gym Plan to track weekly cardio distance.
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={weeklyCardioSeries} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#253247" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#94A3B8' }} tickLine={false} />
                  <YAxis yAxisId="dist" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="min" orientation="right" tick={{ fontSize: 12, fill: '#f59e0b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f151e',
                      border: '1px solid #33445e',
                      borderRadius: '8px',
                      color: '#f1f5f9',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }} />
                  <Bar
                    yAxisId="dist"
                    dataKey="walkDistance"
                    stackId="cardio"
                    name={`Walk (${dUnit})`}
                    fill="#38bdf8"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    yAxisId="dist"
                    dataKey="runDistance"
                    stackId="cardio"
                    name={`Run (${dUnit})`}
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="min"
                    type="monotone"
                    dataKey="minutes"
                    name="Cardio Minutes"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 3.5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* 6. Weekly Hydration Trend */}
        <div className="bg-[#131a24] border-2 border-[#263347] rounded-xl p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-white">
              Weekly Avg Daily Hydration
            </h2>
            <p className="text-xs text-slate-400">
              Average liters consumed per logged day vs {(profile.dailyWaterGoalMl ?? 3000) / 1000} L goal
            </p>
          </div>

          {weeklyHydrationSeries.length === 0 ? (
            <div className="h-72 flex items-center justify-center border border-dashed border-[#2d3c54] rounded-lg text-xs text-slate-400">
              Log daily water intake in Overview or Diet Plan to chart hydration consistency.
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyHydrationSeries} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#253247" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#94A3B8' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f151e',
                      border: '1px solid #33445e',
                      borderRadius: '8px',
                      color: '#f1f5f9',
                      fontSize: '12px',
                    }}
                    formatter={(value: unknown) => [`${value} L`, 'Avg Hydration']}
                  />
                  <ReferenceLine
                    y={(profile.dailyWaterGoalMl ?? 3000) / 1000}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                  />
                  <Bar
                    dataKey="avgLiters"
                    name="Avg Daily Water (L)"
                    fill="#38bdf8"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
