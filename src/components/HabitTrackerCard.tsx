import React, { useMemo, useState } from 'react';
import { Check, Pencil, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import {
  Habit,
  HabitColor,
  HabitLog,
  HABIT_COLOR_OPTIONS,
  SCHEMA_LIMITS,
} from '../types';
import { todayIsoDate } from '../lib/sanitize';
import {
  deleteHabit,
  saveHabit,
  seedStarterHabits,
  toggleHabitCompletion,
} from '../lib/firestoreService';

interface Props {
  uid: string;
  habits: Habit[];
  habitLogs: HabitLog[];
}

interface ColorPalette {
  label: string;
  solidBg: string;
  solidBorder: string;
  solidHover: string;
  swatch: string;
  softText: string;
}

const COLOR_STYLES: Record<HabitColor, ColorPalette> = {
  emerald: {
    label: 'Emerald',
    solidBg: 'bg-emerald-600',
    solidBorder: 'border-emerald-500',
    solidHover: 'hover:bg-emerald-500',
    swatch: 'bg-emerald-500',
    softText: 'text-emerald-400',
  },
  sky: {
    label: 'Sky',
    solidBg: 'bg-sky-600',
    solidBorder: 'border-sky-500',
    solidHover: 'hover:bg-sky-500',
    swatch: 'bg-sky-500',
    softText: 'text-sky-400',
  },
  amber: {
    label: 'Amber',
    solidBg: 'bg-amber-600',
    solidBorder: 'border-amber-500',
    solidHover: 'hover:bg-amber-500',
    swatch: 'bg-amber-500',
    softText: 'text-amber-400',
  },
  rose: {
    label: 'Rose',
    solidBg: 'bg-rose-600',
    solidBorder: 'border-rose-500',
    solidHover: 'hover:bg-rose-500',
    swatch: 'bg-rose-500',
    softText: 'text-rose-400',
  },
  violet: {
    label: 'Violet',
    solidBg: 'bg-violet-600',
    solidBorder: 'border-violet-500',
    solidHover: 'hover:bg-violet-500',
    swatch: 'bg-violet-500',
    softText: 'text-violet-400',
  },
  teal: {
    label: 'Teal',
    solidBg: 'bg-teal-600',
    solidBorder: 'border-teal-500',
    solidHover: 'hover:bg-teal-500',
    swatch: 'bg-teal-500',
    softText: 'text-teal-400',
  },
  orange: {
    label: 'Orange',
    solidBg: 'bg-orange-600',
    solidBorder: 'border-orange-500',
    solidHover: 'hover:bg-orange-500',
    swatch: 'bg-orange-500',
    softText: 'text-orange-400',
  },
  indigo: {
    label: 'Indigo',
    solidBg: 'bg-indigo-600',
    solidBorder: 'border-indigo-500',
    solidHover: 'hover:bg-indigo-500',
    swatch: 'bg-indigo-500',
    softText: 'text-indigo-400',
  },
};

function formatIsoOffset(daysAgo: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatReadableDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  return dt.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function getMosaicTileClasses(completedCount: number, totalCount: number): string {
  if (totalCount === 0 || completedCount <= 0) {
    return 'bg-[#0e141d] border-[#253247] hover:border-slate-500';
  }
  const ratio = completedCount / totalCount;
  if (ratio >= 1) {
    return 'bg-emerald-500 border-emerald-400 hover:bg-emerald-400';
  }
  if (ratio >= 0.7) {
    return 'bg-teal-500 border-teal-400 hover:bg-teal-400';
  }
  if (ratio >= 0.4) {
    return 'bg-sky-500 border-sky-400 hover:bg-sky-400';
  }
  return 'bg-amber-500 border-amber-400 hover:bg-amber-400';
}

export const HabitTrackerCard: React.FC<Props> = ({ uid, habits, habitLogs }) => {
  const today = todayIsoDate();

  const [editMode, setEditMode] = useState(false);
  const [selectedMosaicDate, setSelectedMosaicDate] = useState<string>(today);
  const [savingToggleKey, setSavingToggleKey] = useState<string | null>(null);
  const [restoringStarters, setRestoringStarters] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formColor, setFormColor] = useState<HabitColor>('emerald');
  const [formWeeklyGoal, setFormWeeklyGoal] = useState(7);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [submittingHabit, setSubmittingHabit] = useState(false);

  const sortedHabits = useMemo(
    () => [...habits].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title)),
    [habits]
  );

  const logsByDate = useMemo(() => {
    const map = new Map<string, HabitLog>();
    habitLogs.forEach((log) => {
      map.set(log.date || log.id, log);
    });
    return map;
  }, [habitLogs]);

  const mosaicDays = useMemo(() => {
    const list: string[] = [];
    for (let i = 69; i >= 0; i--) {
      list.push(formatIsoOffset(i));
    }
    return list;
  }, []);

  const mosaicWeeks = useMemo(() => {
    const weeks: string[][] = [];
    for (let w = 0; w < 10; w++) {
      weeks.push(mosaicDays.slice(w * 7, w * 7 + 7));
    }
    return weeks;
  }, [mosaicDays]);

  const matrixDays = useMemo(() => {
    const list: string[] = [];
    for (let i = 20; i >= 0; i--) {
      list.push(formatIsoOffset(i));
    }
    return list;
  }, []);

  const habitIdSet = useMemo(() => new Set(sortedHabits.map((h) => h.id)), [sortedHabits]);

  const countCompletedForDate = (date: string): number => {
    const log = logsByDate.get(date);
    if (!log) return 0;
    return log.completedHabitIds.filter((id) => habitIdSet.has(id)).length;
  };

  const todayCompletedCount = countCompletedForDate(today);
  const totalHabitsCount = sortedHabits.length;

  const last7Stats = useMemo(() => {
    if (totalHabitsCount === 0) return { pct: 0, totalChecks: 0 };
    let checks = 0;
    for (let i = 0; i < 7; i++) {
      const d = formatIsoOffset(i);
      const log = logsByDate.get(d);
      if (log) {
        checks += log.completedHabitIds.filter((id) => habitIdSet.has(id)).length;
      }
    }
    return {
      pct: Math.round((checks / (totalHabitsCount * 7)) * 100),
      totalChecks: checks,
    };
  }, [logsByDate, habitIdSet, totalHabitsCount]);

  const bestActiveStreak = useMemo(() => {
    if (sortedHabits.length === 0) return 0;
    let best = 0;
    sortedHabits.forEach((habit) => {
      let streak = 0;
      const todayDone = Boolean(logsByDate.get(today)?.completedHabitIds.includes(habit.id));
      const startOffset = todayDone ? 0 : 1;
      for (let i = startOffset; i < 70; i++) {
        const d = formatIsoOffset(i);
        if (logsByDate.get(d)?.completedHabitIds.includes(habit.id)) {
          streak += 1;
        } else {
          break;
        }
      }
      if (streak > best) best = streak;
    });
    return best;
  }, [sortedHabits, logsByDate, today]);

  const handleToggle = async (date: string, habitId: string) => {
    const toggleKey = `${date}:${habitId}`;
    if (savingToggleKey === toggleKey) return;
    setSavingToggleKey(toggleKey);
    try {
      await toggleHabitCompletion(uid, date, habitId, logsByDate.get(date));
    } finally {
      setSavingToggleKey(null);
    }
  };

  const openAddModal = () => {
    setEditingHabit(null);
    setFormTitle('');
    setFormColor(HABIT_COLOR_OPTIONS[sortedHabits.length % HABIT_COLOR_OPTIONS.length]);
    setFormWeeklyGoal(7);
    setConfirmDeleteId(null);
    setModalOpen(true);
  };

  const openEditModal = (habit: Habit) => {
    setEditingHabit(habit);
    setFormTitle(habit.title);
    setFormColor(habit.color);
    setFormWeeklyGoal(habit.weeklyGoal);
    setConfirmDeleteId(null);
    setModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = formTitle.trim();
    if (!trimmed) return;
    setSubmittingHabit(true);
    try {
      await saveHabit(
        uid,
        {
          id: editingHabit?.id ?? '',
          title: trimmed,
          color: formColor,
          weeklyGoal: formWeeklyGoal,
          sortOrder: editingHabit ? editingHabit.sortOrder : sortedHabits.length,
        },
        Boolean(editingHabit)
      );
      setModalOpen(false);
    } finally {
      setSubmittingHabit(false);
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (confirmDeleteId !== habitId) {
      setConfirmDeleteId(habitId);
      return;
    }
    setSubmittingHabit(true);
    try {
      await deleteHabit(uid, habitId);
      setConfirmDeleteId(null);
      if (modalOpen) setModalOpen(false);
    } finally {
      setSubmittingHabit(false);
    }
  };

  const handleRestoreStarters = async () => {
    setRestoringStarters(true);
    try {
      await seedStarterHabits(uid);
    } finally {
      setRestoringStarters(false);
    }
  };

  const selectedDateCount = countCompletedForDate(selectedMosaicDate);
  const selectedDatePct =
    totalHabitsCount > 0 ? Math.round((selectedDateCount / totalHabitsCount) * 100) : 0;

  return (
    <section className="bg-[#131a24] border-2 border-[#263347] rounded-xl p-5 space-y-6">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="font-pixel text-sm text-amber-400">
              Daily Quests &amp; Goal Squares
            </h2>
            {totalHabitsCount > 0 && (
              <span className="text-xs font-mono text-slate-400 tabular-nums">
                <strong className="text-emerald-400 font-semibold">
                  {todayCompletedCount}/{totalHabitsCount}
                </strong>{' '}
                done today ·{' '}
                <strong className="text-slate-100 font-semibold">{last7Stats.pct}%</strong> 7d
                · <strong className="text-amber-300 font-semibold">{bestActiveStreak}d</strong> best
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            +10 XP per habit square · +25 XP full daily sweep bonus · Damages the Weekly Boss.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {totalHabitsCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setEditMode((prev) => !prev);
                setConfirmDeleteId(null);
              }}
              className={`min-h-[42px] inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md border transition-colors whitespace-nowrap ${
                editMode
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-[#1a2332] text-slate-200 border-[#2e3d54] hover:bg-[#222e42]'
              }`}
            >
              <Pencil className="w-3.5 h-3.5" />
              {editMode ? 'Done Editing' : 'Edit Habits'}
            </button>
          )}
          {sortedHabits.length < SCHEMA_LIMITS.HABITS_MAX && (
            <button
              type="button"
              onClick={openAddModal}
              className="min-h-[42px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Habit
            </button>
          )}
        </div>
      </div>

      {totalHabitsCount === 0 ? (
        <div className="py-10 px-6 text-center border-2 border-dashed border-[#2a384f] rounded-lg space-y-3">
          <p className="text-sm font-medium text-slate-200">No daily quests configured yet</p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Add daily routines like Creatine, Made the bed, or Washed the dishes and watch your
            colored rune squares light up every day.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={openAddModal}
              className="min-h-[42px] px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md"
            >
              + Add Custom Habit
            </button>
            <button
              type="button"
              disabled={restoringStarters}
              onClick={() => void handleRestoreStarters()}
              className="min-h-[42px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-200 bg-[#1c2636] hover:bg-[#253247] rounded-md disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {restoringStarters ? 'Adding...' : 'Load Starter Habits'}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 1. Selected Day (Today by default) 1-Tap Colorful Check-in Tiles */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2.5">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {selectedMosaicDate === today ? "Today's Check-In" : 'Selected Day Check-In'} ·{' '}
                  {formatReadableDate(selectedMosaicDate)}
                </h3>
                {selectedMosaicDate !== today && (
                  <button
                    type="button"
                    onClick={() => setSelectedMosaicDate(today)}
                    className="text-xs font-semibold text-amber-400 hover:text-amber-300 underline"
                  >
                    Back to Today
                  </button>
                )}
              </div>
              <span className="text-xs font-mono text-slate-400 tabular-nums">
                {selectedDateCount === totalHabitsCount
                  ? 'All daily quests complete (+25 XP Sweep)'
                  : `${totalHabitsCount - selectedDateCount} remaining`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {sortedHabits.map((habit) => {
                const palette = COLOR_STYLES[habit.color] ?? COLOR_STYLES.emerald;
                const isDoneSelected = Boolean(
                  logsByDate.get(selectedMosaicDate)?.completedHabitIds.includes(habit.id)
                );
                const weekDone = Array.from({ length: 7 }, (_, i) => formatIsoOffset(i)).filter(
                  (d) => logsByDate.get(d)?.completedHabitIds.includes(habit.id)
                ).length;

                return (
                  <div key={habit.id} className="relative flex items-stretch gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        editMode
                          ? openEditModal(habit)
                          : void handleToggle(selectedMosaicDate, habit.id)
                      }
                      className={`flex-1 min-h-[54px] px-3.5 py-2.5 rounded-lg border-2 text-left flex items-center justify-between gap-3 transition-colors ${
                        isDoneSelected && !editMode
                          ? `${palette.solidBg} ${palette.solidBorder} ${palette.solidHover} text-white`
                          : 'bg-[#0e141d] border-[#253247] hover:border-[#3c4f6e] text-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-5 h-5 rounded-[4px] flex items-center justify-center shrink-0 border transition-colors ${
                            isDoneSelected && !editMode
                              ? 'bg-black/25 border-white/40 text-white'
                              : `${palette.swatch} border-transparent text-white`
                          }`}
                        >
                          {isDoneSelected ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-[1px] bg-white/80" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{habit.title}</p>
                          <p
                            className={`text-[11px] font-mono tabular-nums ${
                              isDoneSelected && !editMode ? 'text-white/90' : 'text-slate-400'
                            }`}
                          >
                            {weekDone}/{habit.weeklyGoal} weekly goal
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-semibold shrink-0 tabular-nums ${
                          isDoneSelected && !editMode ? 'text-white' : palette.softText
                        }`}
                      >
                        {editMode ? 'Edit' : isDoneSelected ? 'Done' : '+10 XP'}
                      </span>
                    </button>

                    {editMode && (
                      <button
                        type="button"
                        onClick={() => void handleDeleteHabit(habit.id)}
                        aria-label={`Delete ${habit.title}`}
                        title={
                          confirmDeleteId === habit.id
                            ? 'Click again to confirm delete'
                            : `Delete ${habit.title}`
                        }
                        className={`min-h-[54px] min-w-[44px] px-2.5 rounded-lg border-2 flex items-center justify-center transition-colors shrink-0 ${
                          confirmDeleteId === habit.id
                            ? 'bg-rose-600 border-rose-500 text-white'
                            : 'bg-[#0e141d] border-[#253247] text-slate-400 hover:text-rose-400 hover:border-rose-500/60'
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Overall 10-Week (70 Squares) Daily Goal Mosaic */}
          <div className="pt-4 border-t border-[#233044]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  10-Week Dungeon Mosaic (70 Squares)
                </h3>
                <p className="text-xs text-slate-300 mt-0.5 tabular-nums">
                  {formatReadableDate(selectedMosaicDate)}:{' '}
                  <strong className="font-semibold text-white">
                    {selectedDateCount} of {totalHabitsCount}
                  </strong>{' '}
                  habits ({selectedDatePct}%)
                  {selectedMosaicDate === today ? ' · Today' : ''}
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                <span>0%</span>
                <span className="w-3.5 h-3.5 rounded-[3px] bg-[#0e141d] border border-[#253247]" />
                <span className="w-3.5 h-3.5 rounded-[3px] bg-amber-500 border border-amber-400" />
                <span className="w-3.5 h-3.5 rounded-[3px] bg-sky-500 border border-sky-400" />
                <span className="w-3.5 h-3.5 rounded-[3px] bg-teal-500 border border-teal-400" />
                <span className="w-3.5 h-3.5 rounded-[3px] bg-emerald-500 border border-emerald-400" />
                <span>100%</span>
              </div>
            </div>

            <div className="overflow-x-auto pb-1">
              <div className="inline-grid grid-cols-10 gap-1.5 sm:gap-2">
                {mosaicWeeks.map((weekDates, weekIdx) => (
                  <div key={weekIdx} className="grid grid-rows-7 gap-1.5 sm:gap-2">
                    {weekDates.map((dateStr) => {
                      const count = countCompletedForDate(dateStr);
                      const isToday = dateStr === today;
                      const isSelected = dateStr === selectedMosaicDate;
                      return (
                        <button
                          key={dateStr}
                          type="button"
                          onClick={() => setSelectedMosaicDate(dateStr)}
                          title={`${formatReadableDate(dateStr)} · ${count}/${totalHabitsCount} habits`}
                          aria-label={`${formatReadableDate(dateStr)}, ${count} of ${totalHabitsCount} habits completed`}
                          className={`w-5 h-5 sm:w-6 sm:h-6 rounded-[4px] border transition-transform hover:scale-105 ${getMosaicTileClasses(
                            count,
                            totalHabitsCount
                          )} ${
                            isSelected
                              ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-[#131a24]'
                              : isToday
                              ? 'ring-1 ring-slate-300 ring-offset-1 ring-offset-[#131a24]'
                              : ''
                          }`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Per-Habit Interactive 21-Day Colorful Squares */}
          <div className="pt-4 border-t border-[#233044]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Habit Streaks · Last 21 Days (Click Any Square)
              </h3>
              <span className="text-[11px] font-mono text-slate-500">Oldest → Today</span>
            </div>

            <div className="divide-y divide-[#1e293b]">
              {sortedHabits.map((habit) => {
                const palette = COLOR_STYLES[habit.color] ?? COLOR_STYLES.emerald;
                const weekDone = Array.from({ length: 7 }, (_, i) => formatIsoOffset(i)).filter(
                  (d) => logsByDate.get(d)?.completedHabitIds.includes(habit.id)
                ).length;
                const goalMet = weekDone >= habit.weeklyGoal;

                return (
                  <div
                    key={habit.id}
                    className="py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                  >
                    <div className="flex items-center justify-between gap-3 min-w-0 md:w-64 shrink-0">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-3 h-3 rounded-[3px] shrink-0 ${palette.swatch}`}
                          aria-hidden="true"
                        />
                        <button
                          type="button"
                          onClick={() => openEditModal(habit)}
                          className="text-sm font-medium text-slate-100 hover:text-amber-300 truncate text-left"
                        >
                          {habit.title}
                        </button>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-xs font-mono font-semibold tabular-nums ${
                            goalMet ? palette.softText : 'text-slate-400'
                          }`}
                        >
                          {weekDone}/{habit.weeklyGoal}
                        </span>
                        <button
                          type="button"
                          onClick={() => openEditModal(habit)}
                          aria-label={`Edit ${habit.title}`}
                          className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-0.5">
                      {matrixDays.map((dateStr, idx) => {
                        const completed = Boolean(
                          logsByDate.get(dateStr)?.completedHabitIds.includes(habit.id)
                        );
                        const isToday = dateStr === today;
                        const hideOnNarrow = idx < 7;
                        return (
                          <button
                            key={dateStr}
                            type="button"
                            onClick={() => void handleToggle(dateStr, habit.id)}
                            title={`${habit.title} · ${formatReadableDate(dateStr)} · ${
                              completed ? 'Done' : 'Not logged'
                            }`}
                            aria-label={`${habit.title} on ${formatReadableDate(dateStr)}: ${
                              completed ? 'completed' : 'not completed'
                            }`}
                            className={`${
                              hideOnNarrow ? 'hidden sm:flex' : 'flex'
                            } w-5 h-5 sm:w-[22px] sm:h-[22px] rounded-[4px] border items-center justify-center transition-all shrink-0 ${
                              completed
                                ? `${palette.solidBg} ${palette.solidBorder} text-white`
                                : 'bg-[#0e141d] border-[#253247] text-transparent hover:border-slate-400'
                            } ${
                              isToday
                                ? 'ring-1 ring-amber-400 ring-offset-1 ring-offset-[#131a24]'
                                : ''
                            }`}
                          >
                            {completed && <Check className="w-3 h-3 stroke-[2.5]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Add / Edit Habit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
          role="dialog"
          aria-modal="true"
          aria-labelledby="habit-modal-title"
        >
          <div className="bg-[#131a24] border-2 border-[#33445e] rounded-xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 id="habit-modal-title" className="font-pixel text-sm text-amber-400">
                {editingHabit ? 'Edit Daily Quest' : 'Add Daily Quest'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close modal"
                className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => void handleSaveModal(e)} className="space-y-4">
              <div>
                <label
                  htmlFor="habit-title-input"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  Habit Name
                </label>
                <input
                  id="habit-title-input"
                  type="text"
                  required
                  maxLength={SCHEMA_LIMITS.HABIT_TITLE_MAX}
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g., Creatine (5g), Made the bed, Cold shower"
                  className="w-full min-h-[44px] px-3 py-2 text-sm text-white bg-[#0e141d] border border-[#32435c] rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-300 mb-2">
                  Rune Square Color
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {HABIT_COLOR_OPTIONS.map((colorKey) => {
                    const palette = COLOR_STYLES[colorKey];
                    const selected = formColor === colorKey;
                    return (
                      <button
                        key={colorKey}
                        type="button"
                        onClick={() => setFormColor(colorKey)}
                        className={`min-h-[44px] px-2.5 py-2 rounded-lg border flex items-center justify-center gap-1.5 text-xs font-medium transition-colors ${
                          selected
                            ? `${palette.solidBg} ${palette.solidBorder} text-white`
                            : 'bg-[#0e141d] border-[#253247] text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <span
                          className={`w-3 h-3 rounded-[3px] shrink-0 ${
                            selected ? 'bg-white/90' : palette.swatch
                          }`}
                        />
                        <span>{palette.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-300 mb-2">
                  Weekly Goal (Days / Week)
                </span>
                <div className="grid grid-cols-7 gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setFormWeeklyGoal(n)}
                      className={`min-h-[44px] rounded-lg border text-sm font-mono font-semibold tabular-nums transition-colors ${
                        formWeeklyGoal === n
                          ? 'bg-amber-400 border-amber-300 text-slate-950'
                          : 'bg-[#0e141d] border-[#253247] text-slate-300 hover:bg-[#1a2332]'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                {editingHabit ? (
                  <button
                    type="button"
                    disabled={submittingHabit}
                    onClick={() => void handleDeleteHabit(editingHabit.id)}
                    className={`min-h-[44px] px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                      confirmDeleteId === editingHabit.id
                        ? 'bg-rose-600 border-rose-500 text-white'
                        : 'bg-[#0e141d] border-rose-500/40 text-rose-400 hover:bg-rose-950/50'
                    }`}
                  >
                    {confirmDeleteId === editingHabit.id ? 'Confirm Delete' : 'Delete Habit'}
                  </button>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="min-h-[44px] px-4 py-2 text-xs font-medium text-slate-300 bg-[#1c2636] hover:bg-[#253247] rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingHabit || !formTitle.trim()}
                    className="min-h-[44px] px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg"
                  >
                    {submittingHabit ? 'Saving...' : editingHabit ? 'Save Changes' : 'Add Habit'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
