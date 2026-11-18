import React, { useEffect, useState } from 'react';
import {
  Database,
  Dumbbell,
  Footprints,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  CardioLog,
  CardioType,
  DAY_SHORT,
  ExerciseCatalogItem,
  ExerciseItem,
  SCHEMA_LIMITS,
  UnitSystem,
  WorkoutPlan,
} from '../types';
import {
  defaultCardio,
  distanceUnit,
  sanitizeCardio,
  sanitizeDefaultDays,
  weightUnit,
} from '../lib/sanitize';
import { saveWorkoutPlan } from '../lib/firestoreService';
import { ExercisePickerModal, formatMuscleLabel } from './ExercisePickerModal';

interface Props {
  open: boolean;
  onClose: () => void;
  uid: string;
  unitSystem: UnitSystem;
  editingPlan: WorkoutPlan | null;
  seedFromDay?: {
    name: string;
    isRestDay: boolean;
    exercises: ExerciseItem[];
    cardio: CardioLog;
    notes: string;
    dayIndex: number;
  } | null;
  onSaved: (planName: string) => void;
}

const PlanThumb: React.FC<{ src?: string; alt: string; onClick: () => void }> = ({
  src,
  alt,
  onClick,
}) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <button
      type="button"
      onClick={onClick}
      title="Match photo from exercise database"
      aria-label={`Find photo for ${alt}`}
      className="w-10 h-10 rounded-lg border border-[#2d3c54] bg-[#0e141d] overflow-hidden shrink-0 flex items-center justify-center hover:border-emerald-400 transition-colors"
    >
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <Dumbbell className="w-4 h-4 text-slate-500" />
      )}
    </button>
  );
};

export const WorkoutPlanModal: React.FC<Props> = ({
  open,
  onClose,
  uid,
  unitSystem,
  editingPlan,
  seedFromDay,
  onSaved,
}) => {
  const [name, setName] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [defaultDays, setDefaultDays] = useState<number[]>([]);
  const [isRestDay, setIsRestDay] = useState(false);
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [cardio, setCardio] = useState<CardioLog>(defaultCardio());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pickerState, setPickerState] = useState<{
    open: boolean;
    mode: 'add' | 'match';
    matchIndex: number | null;
    initialQuery: string;
  }>({ open: false, mode: 'add', matchIndex: null, initialQuery: '' });

  const wUnit = weightUnit(unitSystem);
  const dUnit = distanceUnit(unitSystem);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (editingPlan) {
      setName(editingPlan.name);
      setScheduledTime(editingPlan.scheduledTime || '');
      setDefaultDays(sanitizeDefaultDays(editingPlan.defaultDays));
      setIsRestDay(Boolean(editingPlan.isRestDay));
      setExercises(editingPlan.exercises.map((ex) => ({ ...ex, completed: false })));
      setCardio(sanitizeCardio({ ...editingPlan.cardio, completed: false }));
      setNotes(editingPlan.notes || '');
    } else if (seedFromDay) {
      setName(seedFromDay.name);
      setScheduledTime('');
      setDefaultDays(sanitizeDefaultDays([seedFromDay.dayIndex]));
      setIsRestDay(Boolean(seedFromDay.isRestDay));
      setExercises(
        seedFromDay.exercises.map((ex, i) => ({
          ...ex,
          id: `ex_${Date.now()}_${i}`,
          completed: false,
        }))
      );
      setCardio(sanitizeCardio({ ...seedFromDay.cardio, completed: false }));
      setNotes(seedFromDay.notes || '');
    } else {
      setName('');
      setScheduledTime('');
      setDefaultDays([]);
      setIsRestDay(false);
      setExercises([]);
      setCardio(defaultCardio());
      setNotes('');
    }
  }, [open, editingPlan, seedFromDay]);

  if (!open) return null;

  const toggleDefaultDay = (dayIdx: number) => {
    setDefaultDays((prev) =>
      prev.includes(dayIdx)
        ? prev.filter((d) => d !== dayIdx)
        : sanitizeDefaultDays([...prev, dayIdx])
    );
  };

  const handleAddCustomExercise = () => {
    if (exercises.length >= SCHEMA_LIMITS.EXERCISES_MAX) return;
    setIsRestDay(false);
    setExercises((prev) => [
      ...prev,
      {
        id: `plan_ex_${Date.now()}_${prev.length}`,
        name: '',
        sets: 3,
        reps: '8-10',
        targetLoad: 0,
        actualLoad: 0,
        rpe: 8,
        restSeconds: 90,
        completed: false,
      },
    ]);
  };

  const handleSelectFromCatalog = (
    item: ExerciseCatalogItem,
    defaultRestSeconds: number
  ) => {
    const primaryImage = item.images[0] || '';
    if (pickerState.mode === 'match' && pickerState.matchIndex !== null) {
      const targetIdx = pickerState.matchIndex;
      setExercises((prev) =>
        prev.map((ex, i) =>
          i === targetIdx
            ? {
                ...ex,
                name: ex.name.trim() ? ex.name : item.name,
                muscleGroup: item.muscleGroup,
                imageUrl: primaryImage,
                restSeconds: ex.restSeconds ?? defaultRestSeconds,
              }
            : ex
        )
      );
      return;
    }

    if (exercises.length >= SCHEMA_LIMITS.EXERCISES_MAX) return;
    setIsRestDay(false);
    setExercises((prev) => [
      ...prev,
      {
        id: `plan_ex_${Date.now()}_${prev.length}`,
        name: item.name.slice(0, 80),
        sets: 3,
        reps: '8-12',
        targetLoad: 0,
        actualLoad: 0,
        rpe: 8,
        restSeconds: defaultRestSeconds,
        muscleGroup: item.muscleGroup,
        imageUrl: primaryImage,
        completed: false,
      },
    ]);
  };

  const updateExercise = (
    idx: number,
    field: keyof ExerciseItem,
    value: string | number | boolean
  ) => {
    setExercises((prev) =>
      prev.map((ex, i) => (i === idx ? { ...ex, [field]: value } : ex))
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Enter a plan name (for example, Upper 1 or Tempo Run).');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveWorkoutPlan(
        uid,
        {
          id: editingPlan?.id ?? '',
          name: name.trim(),
          scheduledTime: scheduledTime.trim(),
          defaultDays,
          isRestDay,
          exercises: isRestDay ? [] : exercises,
          cardio: sanitizeCardio({ ...cardio, completed: false }),
          notes,
        },
        Boolean(editingPlan)
      );
      onSaved(name.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save training plan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 sm:p-4">
      <div className="w-full sm:max-w-3xl bg-[#131a24] border-2 border-[#33445e] rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 bg-[#0f151e] border-b border-[#253247]">
          <div>
            <h2 className="text-base font-semibold text-white">
              {editingPlan ? 'Edit Training Plan' : 'Create Reusable Training Plan'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Save a workout template you can pick and adapt for any day of the week
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close plan editor"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Plan Name
              </label>
              <input
                type="text"
                required
                maxLength={SCHEMA_LIMITS.PLAN_NAME_MAX}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Upper 1 (Push Machines)"
                className="w-full min-h-[40px] px-3 py-2 text-sm font-medium text-white placeholder:text-slate-500 bg-[#0e141d] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Usual Time (optional)
              </label>
              <input
                type="text"
                maxLength={SCHEMA_LIMITS.PLAN_TIME_MAX}
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                placeholder="e.g., 05:00"
                className="w-full min-h-[40px] px-3 py-2 text-sm text-white placeholder:text-slate-500 bg-[#0e141d] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400 tabular-nums"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="block text-xs font-medium text-slate-300 mb-1.5">
                Typical Weekdays
              </span>
              <div className="flex flex-wrap gap-1.5">
                {DAY_SHORT.map((day, idx) => {
                  const active = defaultDays.includes(idx);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDefaultDay(idx)}
                      className={`min-h-[34px] px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors ${
                        active
                          ? 'bg-amber-400 text-slate-950 border-amber-400'
                          : 'bg-[#0e141d] text-slate-300 border-[#2d3c54] hover:border-[#4b6285]'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-200 cursor-pointer select-none pt-2 sm:pt-5">
              <input
                type="checkbox"
                checked={isRestDay}
                onChange={(e) => setIsRestDay(e.target.checked)}
                className="w-4 h-4 rounded border-[#394c69] bg-[#0e141d] text-emerald-400 focus:ring-emerald-400"
              />
              Rest / Recovery Template
            </label>
          </div>

          {!isRestDay && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-white">
                  Exercises ({exercises.length} / {SCHEMA_LIMITS.EXERCISES_MAX})
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setPickerState({
                        open: true,
                        mode: 'add',
                        matchIndex: null,
                        initialQuery: '',
                      })
                    }
                    disabled={exercises.length >= SCHEMA_LIMITS.EXERCISES_MAX}
                    className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg"
                  >
                    <Database className="w-3.5 h-3.5" />
                    Browse Exercise DB
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCustomExercise}
                    disabled={exercises.length >= SCHEMA_LIMITS.EXERCISES_MAX}
                    className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-[#1a2332] border border-[#2d3c54] hover:bg-[#233044] disabled:opacity-50 rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Exercise
                  </button>
                </div>
              </div>

              {exercises.length === 0 ? (
                <div className="py-6 px-4 text-center border border-dashed border-[#2d3c54] rounded-xl text-xs text-slate-400">
                  No exercises yet. Browse the Exercise Database or add custom exercises.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {exercises.map((ex, idx) => (
                    <div
                      key={ex.id}
                      className="p-3 bg-[#0e141d] border border-[#263347] rounded-xl space-y-2.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <PlanThumb
                          src={ex.imageUrl}
                          alt={ex.name || 'Exercise'}
                          onClick={() =>
                            setPickerState({
                              open: true,
                              mode: 'match',
                              matchIndex: idx,
                              initialQuery: ex.name,
                            })
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            required
                            maxLength={80}
                            value={ex.name}
                            onChange={(e) => updateExercise(idx, 'name', e.target.value)}
                            placeholder="Exercise name"
                            className="w-full px-2.5 py-1.5 text-xs font-semibold text-white placeholder:text-slate-500 bg-[#131a24] border border-[#2d3c54] rounded-md focus:outline-none focus:border-emerald-400"
                          />
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                            <span>
                              {ex.muscleGroup ? formatMuscleLabel(ex.muscleGroup) : 'Custom'}
                            </span>
                            <span aria-hidden="true">·</span>
                            <button
                              type="button"
                              onClick={() =>
                                setPickerState({
                                  open: true,
                                  mode: 'match',
                                  matchIndex: idx,
                                  initialQuery: ex.name,
                                })
                              }
                              className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium"
                            >
                              <Search className="w-3 h-3" />
                              {ex.imageUrl ? 'Swap' : 'Match photo'}
                            </button>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setExercises((prev) => prev.filter((_, i) => i !== idx))
                          }
                          aria-label="Remove exercise"
                          className="p-2 text-slate-400 hover:text-rose-400 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        <div>
                          <label className="block text-[10px] font-medium text-slate-400 mb-0.5">
                            Sets
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={20}
                            value={ex.sets}
                            onChange={(e) =>
                              updateExercise(idx, 'sets', Number(e.target.value))
                            }
                            className="w-full px-2 py-1 text-xs text-white font-mono tabular-nums bg-[#131a24] border border-[#2d3c54] rounded-md focus:outline-none focus:border-emerald-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-slate-400 mb-0.5">
                            Reps
                          </label>
                          <input
                            type="text"
                            maxLength={24}
                            value={ex.reps}
                            onChange={(e) => updateExercise(idx, 'reps', e.target.value)}
                            className="w-full px-2 py-1 text-xs text-white font-mono tabular-nums bg-[#131a24] border border-[#2d3c54] rounded-md focus:outline-none focus:border-emerald-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-slate-400 mb-0.5">
                            Target ({wUnit})
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            min={0}
                            max={1000}
                            value={ex.targetLoad}
                            onChange={(e) =>
                              updateExercise(idx, 'targetLoad', Number(e.target.value))
                            }
                            className="w-full px-2 py-1 text-xs text-white font-mono tabular-nums bg-[#131a24] border border-[#2d3c54] rounded-md focus:outline-none focus:border-emerald-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-slate-400 mb-0.5">
                            RPE
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            min={1}
                            max={10}
                            value={ex.rpe}
                            onChange={(e) =>
                              updateExercise(idx, 'rpe', Number(e.target.value))
                            }
                            className="w-full px-2 py-1 text-xs text-white font-mono tabular-nums bg-[#131a24] border border-[#2d3c54] rounded-md focus:outline-none focus:border-emerald-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-slate-400 mb-0.5">
                            Rest (s)
                          </label>
                          <input
                            type="number"
                            step={15}
                            min={0}
                            max={600}
                            value={ex.restSeconds ?? 90}
                            onChange={(e) =>
                              updateExercise(idx, 'restSeconds', Number(e.target.value))
                            }
                            className="w-full px-2 py-1 text-xs text-white font-mono tabular-nums bg-[#131a24] border border-[#2d3c54] rounded-md focus:outline-none focus:border-emerald-400"
                          />
                        </div>
                      </div>

                      <input
                        type="text"
                        maxLength={SCHEMA_LIMITS.EXERCISE_NOTES_MAX}
                        value={ex.notes ?? ''}
                        onChange={(e) => updateExercise(idx, 'notes', e.target.value)}
                        placeholder="Optional progression cue or observation"
                        className="w-full px-2.5 py-1 text-[11px] text-slate-200 placeholder:text-slate-500 bg-[#131a24] border border-[#2d3c54] rounded-md focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Cardio Template */}
          <div className="p-3.5 bg-[#0e141d] border border-[#263347] rounded-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Footprints className="w-4 h-4 text-emerald-400" />
                Default Walk / Run Cardio
              </div>
              <div className="inline-flex items-center p-0.5 bg-[#131a24] border border-[#2d3c54] rounded-lg">
                {(
                  [
                    { id: 'none', label: 'None' },
                    { id: 'walk', label: 'Walk' },
                    { id: 'run', label: 'Run' },
                  ] as { id: CardioType; label: string }[]
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      setCardio((prev) => ({ ...prev, activityType: opt.id }))
                    }
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                      cardio.activityType === opt.id
                        ? 'bg-amber-400 text-slate-950'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {cardio.activityType !== 'none' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block text-[10px] font-medium text-slate-400 mb-0.5">
                    Distance ({dUnit})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    max={500}
                    value={cardio.distance}
                    onChange={(e) =>
                      setCardio((prev) => ({ ...prev, distance: Number(e.target.value) }))
                    }
                    className="w-full px-2 py-1.5 text-xs text-white font-mono tabular-nums bg-[#131a24] border border-[#2d3c54] rounded-md focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-slate-400 mb-0.5">
                    Minutes
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={600}
                    value={cardio.durationMinutes}
                    onChange={(e) =>
                      setCardio((prev) => ({
                        ...prev,
                        durationMinutes: Number(e.target.value),
                      }))
                    }
                    className="w-full px-2 py-1.5 text-xs text-white font-mono tabular-nums bg-[#131a24] border border-[#2d3c54] rounded-md focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-slate-400 mb-0.5">
                    Est. kcal
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={5000}
                    value={cardio.caloriesBurned}
                    onChange={(e) =>
                      setCardio((prev) => ({
                        ...prev,
                        caloriesBurned: Number(e.target.value),
                      }))
                    }
                    className="w-full px-2 py-1.5 text-xs text-white font-mono tabular-nums bg-[#131a24] border border-[#2d3c54] rounded-md focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-slate-400 mb-0.5">
                    Pace / Incline
                  </label>
                  <input
                    type="text"
                    maxLength={SCHEMA_LIMITS.PACE_OR_INCLINE_MAX}
                    value={cardio.paceOrIncline}
                    onChange={(e) =>
                      setCardio((prev) => ({ ...prev, paceOrIncline: e.target.value }))
                    }
                    placeholder="e.g., 5:20 /km"
                    className="w-full px-2 py-1.5 text-xs text-white placeholder:text-slate-500 bg-[#131a24] border border-[#2d3c54] rounded-md focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Plan Notes
            </label>
            <textarea
              rows={2}
              maxLength={SCHEMA_LIMITS.NOTES_MAX}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Warmup protocol, pacing reminders, progression rules..."
              className="w-full px-3 py-2 text-xs text-white placeholder:text-slate-500 bg-[#0e141d] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-lg text-xs text-rose-200">
              {error}
            </div>
          )}

          <div className="pt-2 border-t border-[#253247] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[42px] px-4 py-2 text-xs font-medium text-slate-200 hover:bg-[#1a2332] rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-[42px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving...' : editingPlan ? 'Update Plan' : 'Save Plan'}
            </button>
          </div>
        </form>
      </div>

      <ExercisePickerModal
        isOpen={pickerState.open}
        mode={pickerState.mode}
        initialQuery={pickerState.initialQuery}
        onClose={() =>
          setPickerState((prev) => ({ ...prev, open: false, matchIndex: null }))
        }
        onSelectExercise={handleSelectFromCatalog}
      />
    </div>
  );
};
