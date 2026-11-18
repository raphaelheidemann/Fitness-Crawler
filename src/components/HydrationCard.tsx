import React, { useState } from 'react';
import { Check, Droplets, Minus, Pencil, Plus, X } from 'lucide-react';
import { DAY_SHORT, HydrationLog, UnitSystem } from '../types';
import { formatWaterAmount } from '../lib/sanitize';
import { updateDailyWaterGoal, upsertHydrationLog } from '../lib/firestoreService';

interface Props {
  uid: string;
  weekNumber: number;
  dayIndex: number;
  unitSystem: UnitSystem;
  defaultGoalMl: number;
  hydrationLog?: HydrationLog;
  compact?: boolean;
}

export const HydrationCard: React.FC<Props> = ({
  uid,
  weekNumber,
  dayIndex,
  unitSystem,
  defaultGoalMl,
  hydrationLog,
  compact = false,
}) => {
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(defaultGoalMl);
  const [saving, setSaving] = useState(false);

  const amountMl = hydrationLog?.amountMl ?? 0;
  const goalMl = hydrationLog?.goalMl ?? defaultGoalMl;
  const pct = Math.min(100, Math.round((amountMl / Math.max(500, goalMl)) * 100));
  const goalReached = amountMl >= goalMl;

  const isImperial = unitSystem === 'imperial';
  const stepSmall = isImperial ? 237 : 250;
  const stepMedium = isImperial ? 473 : 500;
  const stepLarge = isImperial ? 946 : 1000;

  const handleDelta = async (deltaMl: number) => {
    const nextAmount = Math.max(0, Math.min(20000, amountMl + deltaMl));
    setSaving(true);
    try {
      await upsertHydrationLog(
        uid,
        weekNumber,
        dayIndex,
        nextAmount,
        goalMl,
        Boolean(hydrationLog)
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const safeGoal = Math.min(10000, Math.max(500, Math.round(goalInput || 3000)));
    setSaving(true);
    try {
      await updateDailyWaterGoal(uid, safeGoal);
      if (hydrationLog) {
        await upsertHydrationLog(uid, weekNumber, dayIndex, amountMl, safeGoal, true);
      }
      setEditingGoal(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#131a24] border-2 border-[#263347] rounded-xl p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-sky-950/60 border border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0">
            <Droplets className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-100">
                Hydration Potion · {DAY_SHORT[dayIndex]} (W{weekNumber})
              </h2>
              {goalReached && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                  <Check className="w-3 h-3" />
                  Goal hit (+20 XP)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono tabular-nums">
              {formatWaterAmount(amountMl, unitSystem)} / {formatWaterAmount(goalMl, unitSystem)} ({pct}%)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setGoalInput(goalMl);
            setEditingGoal((v) => !v);
          }}
          className="min-h-[38px] inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-[#1c2636] rounded-lg transition-colors"
        >
          {editingGoal ? <X className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
          {editingGoal ? 'Cancel' : 'Daily Goal'}
        </button>
      </div>

      {editingGoal && (
        <form
          onSubmit={handleSaveGoal}
          className="mb-3 p-3 bg-[#0e141d] border border-[#253247] rounded-lg flex flex-wrap items-center justify-between gap-2"
        >
          <label className="text-xs font-medium text-slate-300">
            Daily Water Target (ml):
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={500}
              max={10000}
              step={100}
              value={goalInput}
              onChange={(e) => setGoalInput(Number(e.target.value))}
              className="w-28 px-2.5 py-1.5 text-sm font-mono tabular-nums text-white bg-[#131a24] border border-[#32435c] rounded-md focus:outline-none focus:border-sky-400"
            />
            <button
              type="submit"
              disabled={saving}
              className="min-h-[38px] px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-50 rounded-md"
            >
              Save
            </button>
          </div>
        </form>
      )}

      <div className="h-2.5 w-full bg-[#0b1017] border border-[#233044] rounded-[4px] overflow-hidden mb-3.5">
        <div
          className={`h-full transition-all duration-200 ${
            goalReached ? 'bg-emerald-500' : 'bg-sky-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className={`grid ${compact ? 'grid-cols-4' : 'grid-cols-2 sm:grid-cols-4'} gap-2`}>
        <button
          type="button"
          disabled={saving || amountMl <= 0}
          onClick={() => void handleDelta(-stepSmall)}
          className="min-h-[44px] inline-flex items-center justify-center gap-1 px-2.5 py-2 text-xs font-medium text-slate-300 bg-[#1a2332] hover:bg-[#222e42] border border-[#2a384f] disabled:opacity-40 rounded-lg transition-colors tabular-nums"
        >
          <Minus className="w-3.5 h-3.5 shrink-0" />
          {isImperial ? '8 oz' : '250 ml'}
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={() => void handleDelta(stepSmall)}
          className="min-h-[44px] inline-flex items-center justify-center gap-1 px-2.5 py-2 text-xs font-semibold text-sky-300 bg-sky-950/50 hover:bg-sky-900/60 border border-sky-500/40 disabled:opacity-40 rounded-lg transition-colors tabular-nums"
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          {isImperial ? '8 oz' : '250 ml'}
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={() => void handleDelta(stepMedium)}
          className="min-h-[44px] inline-flex items-center justify-center gap-1 px-2.5 py-2 text-xs font-semibold text-sky-300 bg-sky-950/50 hover:bg-sky-900/60 border border-sky-500/40 disabled:opacity-40 rounded-lg transition-colors tabular-nums"
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          {isImperial ? '16 oz' : '500 ml'}
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={() => void handleDelta(stepLarge)}
          className="min-h-[44px] inline-flex items-center justify-center gap-1 px-2.5 py-2 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 disabled:opacity-40 rounded-lg transition-colors tabular-nums"
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          {isImperial ? '32 oz' : '1 L'}
        </button>
      </div>
    </div>
  );
};
