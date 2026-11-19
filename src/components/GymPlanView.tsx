import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Database,
  Dumbbell,
  Footprints,
  Gauge,
  Layers,
  Pencil,
  Play,
  Plus,
  Save,
  Search,
  Timer,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  CardioLog,
  CardioType,
  DAY_FULL,
  DAY_SHORT,
  ExerciseCatalogItem,
  ExerciseItem,
  MealLog,
  SCHEMA_LIMITS,
  SetLog,
  UserProfile,
  WorkoutDay,
  WorkoutPlan,
} from '../types';
import {
  computeExerciseVolume,
  defaultCardio,
  distanceUnit,
  sanitizeCardio,
  weightUnit,
} from '../lib/sanitize';
import {
  applyPlanToWorkoutDay,
  copyWeekPlans,
  deleteWorkoutPlan,
  saveWorkoutPlan,
  toggleWorkoutCompleted,
  updateUserWeekAndPhase,
  upsertWorkoutDay,
} from '../lib/firestoreService';
import { ExercisePickerModal, formatMuscleLabel } from './ExercisePickerModal';
import { RpePicker } from './RpePicker';
import { RestTimerBar, playRestCompleteChime } from './RestTimerBar';
import { WorkoutPlanModal } from './WorkoutPlanModal';
import { WorkoutTemplatesModal } from './WorkoutTemplatesModal';
import { useT } from '../lib/i18n';

interface ExerciseThumbProps {
  src?: string;
  alt: string;
  onClick: () => void;
}

const ExerciseThumb: React.FC<ExerciseThumbProps> = ({ src, alt, onClick }) => {
  const t = useT();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <button
      type="button"
      onClick={onClick}
      title={src ? t('Preview exercise form') : t('Match photo from exercise database')}
      aria-label={src ? t('Preview {name}', { name: alt }) : t('Find photo for {name}', { name: alt })}
      className="w-12 h-12 rounded-lg border border-[#2d3c54] bg-[#0e141d] overflow-hidden shrink-0 flex items-center justify-center hover:border-emerald-400 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
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
        <Dumbbell className="w-5 h-5 text-slate-400" />
      )}
    </button>
  );
};

const PreviewPhoto: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (failed) {
    return (
      <div className="w-full aspect-[4/3] bg-[#0e141d] flex items-center justify-center text-slate-400">
        <Dumbbell className="w-8 h-8" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="w-full aspect-[4/3] object-cover bg-[#0e141d]"
    />
  );
};

function getSetRows(ex: ExerciseItem): SetLog[] {
  if (ex.setLog && ex.setLog.length > 0) return ex.setLog;
  const parsed = parseInt(ex.reps, 10);
  const reps = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  const load = ex.actualLoad > 0 ? ex.actualLoad : ex.targetLoad;
  return Array.from({ length: Math.max(1, ex.sets) }, () => ({
    reps,
    load,
    rpe: 0,
    done: ex.completed,
  }));
}

function withSetRows(ex: ExerciseItem, rows: SetLog[]): ExerciseItem {
  const last = [...rows].reverse().find((r) => r.done);
  return {
    ...ex,
    setLog: rows,
    sets: rows.length,
    actualLoad: last ? last.load : ex.actualLoad,
    rpe: last && last.rpe > 0 ? last.rpe : ex.rpe,
    completed: rows.every((r) => r.done),
  };
}

interface Props {
  uid: string;
  profile: UserProfile;
  workouts: WorkoutDay[];
  workoutPlans: WorkoutPlan[];
  mealLogs: MealLog[];
  onOpenCsvImport: (week: number, day: number) => void;
}

export const GymPlanView: React.FC<Props> = ({
  uid,
  profile,
  workouts,
  workoutPlans,
  mealLogs,
  onOpenCsvImport,
}) => {
  const t = useT();
  const [subTab, setSubTab] = useState<'schedule' | 'plans'>('schedule');
  const [selectedWeek, setSelectedWeek] = useState<number>(profile.currentWeek);
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  const wUnit = weightUnit(profile.unitSystem);
  const dUnit = distanceUnit(profile.unitSystem);

  useEffect(() => {
    setSelectedWeek(profile.currentWeek);
  }, [profile.currentWeek]);

  const sortedPlans = useMemo(
    () =>
      [...workoutPlans].sort((a, b) => {
        const aDay = a.defaultDays[0] ?? 99;
        const bDay = b.defaultDays[0] ?? 99;
        if (aDay !== bDay) return aDay - bDay;
        return a.name.localeCompare(b.name);
      }),
    [workoutPlans]
  );

  const weekWorkouts = useMemo(
    () => workouts.filter((w) => w.weekNumber === selectedWeek),
    [workouts, selectedWeek]
  );

  const existingDayDoc = useMemo(
    () => weekWorkouts.find((w) => w.dayIndex === selectedDay),
    [weekWorkouts, selectedDay]
  );

  const [focus, setFocus] = useState('');
  const [planId, setPlanId] = useState('');
  const [planName, setPlanName] = useState('');
  const [isRestDay, setIsRestDay] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [cardio, setCardio] = useState<CardioLog>(defaultCardio());
  const [saving, setSaving] = useState(false);
  const [updatingTemplate, setUpdatingTemplate] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);

  // Plan editor modal & quick-apply state
  const [planModalState, setPlanModalState] = useState<{
    open: boolean;
    editingPlan: WorkoutPlan | null;
    seedFromDay: {
      name: string;
      isRestDay: boolean;
      exercises: ExerciseItem[];
      cardio: CardioLog;
      notes: string;
      dayIndex: number;
    } | null;
  }>({ open: false, editingPlan: null, seedFromDay: null });
  const [applyDayChoiceByPlan, setApplyDayChoiceByPlan] = useState<Record<string, number>>({});
  const [applyingPlanId, setApplyingPlanId] = useState<string | null>(null);

  // Exercise Database & Image Preview modal state
  const [pickerState, setPickerState] = useState<{
    open: boolean;
    mode: 'add' | 'match';
    matchIndex: number | null;
    initialQuery: string;
  }>({
    open: false,
    mode: 'add',
    matchIndex: null,
    initialQuery: '',
  });
  const [previewExerciseIdx, setPreviewExerciseIdx] = useState<number | null>(null);
  const [rpeTarget, setRpeTarget] = useState<{ idx: number; setIdx: number } | null>(null);

  // Rest Timer state
  const [timerExerciseName, setTimerExerciseName] = useState('');
  const [timerTargetSeconds, setTimerTargetSeconds] = useState(90);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const chimeFiredRef = useRef(false);

  useEffect(() => {
    if (!timerRunning || timerSecondsLeft === null) return;
    if (timerSecondsLeft <= 0) {
      setTimerRunning(false);
      if (!chimeFiredRef.current) {
        chimeFiredRef.current = true;
        if (soundEnabled) {
          playRestCompleteChime();
        }
      }
      return;
    }

    const id = window.setInterval(() => {
      setTimerSecondsLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [timerRunning, timerSecondsLeft, soundEnabled]);

  const startRestTimer = (exerciseName: string, seconds: number) => {
    const duration = Math.max(15, Math.min(600, Math.round(seconds || 90)));
    chimeFiredRef.current = false;
    setTimerExerciseName(exerciseName || 'Between Sets');
    setTimerTargetSeconds(duration);
    setTimerSecondsLeft(duration);
    setTimerRunning(true);
  };

  useEffect(() => {
    if (existingDayDoc) {
      setFocus(existingDayDoc.focus);
      setPlanId(existingDayDoc.planId ?? '');
      setPlanName(existingDayDoc.planName ?? '');
      setIsRestDay(existingDayDoc.isRestDay);
      setCompleted(existingDayDoc.completed);
      setNotes(existingDayDoc.notes);
      setExercises(existingDayDoc.exercises.map((ex) => ({ ...ex })));
      setCardio(sanitizeCardio(existingDayDoc.cardio));
    } else {
      setFocus(selectedDay === 2 || selectedDay === 6 ? 'Active Recovery' : 'Training Session');
      setPlanId('');
      setPlanName('');
      setIsRestDay(selectedDay === 2 || selectedDay === 6);
      setCompleted(false);
      setNotes('');
      setExercises([]);
      setCardio(defaultCardio());
    }
    setSaveFeedback(null);
    setPreviewExerciseIdx(null);
  }, [existingDayDoc, selectedDay, selectedWeek]);

  // Most recent earlier session's finished sets, keyed by exercise name
  const previousByName = useMemo(() => {
    const map = new Map<string, SetLog[]>();
    const key = (w: WorkoutDay) => w.weekNumber * 7 + w.dayIndex;
    const current = selectedWeek * 7 + selectedDay;
    workouts
      .filter((w) => key(w) < current)
      .sort((a, b) => key(a) - key(b))
      .forEach((w) =>
        w.exercises.forEach((ex) => {
          const done = getSetRows(ex).filter((r) => r.done);
          if (ex.name && done.length > 0) map.set(ex.name.trim().toLowerCase(), done);
        })
      );
    return map;
  }, [workouts, selectedWeek, selectedDay]);

  const sessionVolume = useMemo(() => computeExerciseVolume(exercises), [exercises]);
  const weekVolume = useMemo(
    () => weekWorkouts.reduce((acc, w) => acc + computeExerciseVolume(w.exercises), 0),
    [weekWorkouts]
  );
  const weekCardioDistance = useMemo(
    () =>
      weekWorkouts.reduce(
        (acc, w) =>
          acc + (w.cardio && w.cardio.activityType !== 'none' ? w.cardio.distance : 0),
        0
      ),
    [weekWorkouts]
  );
  const completedCount = weekWorkouts.filter((w) => !w.isRestDay && w.completed).length;

  const handleAddExercise = () => {
    if (exercises.length >= SCHEMA_LIMITS.EXERCISES_MAX) return;
    setIsRestDay(false);
    setExercises((prev) => [
      ...prev,
      {
        id: `ex_${Date.now()}_${prev.length}`,
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
        id: `ex_${Date.now()}_${prev.length}`,
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

  const handleUpdateExercise = (
    idx: number,
    field: keyof ExerciseItem,
    value: string | number | boolean
  ) => {
    setExercises((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const updateSet = (idx: number, setIdx: number, patch: Partial<SetLog>) => {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === idx
          ? withSetRows(
              ex,
              getSetRows(ex).map((r, j) => (j === setIdx ? { ...r, ...patch } : r))
            )
          : ex
      )
    );
  };

  const toggleSetDone = (idx: number, setIdx: number) => {
    const ex = exercises[idx];
    const done = !getSetRows(ex)[setIdx].done;
    updateSet(idx, setIdx, { done });
    if (done) startRestTimer(ex.name, ex.restSeconds ?? 90);
  };

  const addSet = (idx: number) => {
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== idx) return ex;
        const rows = getSetRows(ex);
        if (rows.length >= 20) return ex;
        return withSetRows(ex, [...rows, { ...rows[rows.length - 1], rpe: 0, done: false }]);
      })
    );
  };

  const removeSet = (idx: number) => {
    setExercises((prev) =>
      prev.map((ex, i) => {
        const rows = getSetRows(ex);
        return i === idx && rows.length > 1 ? withSetRows(ex, rows.slice(0, -1)) : ex;
      })
    );
  };

  const handleRemoveExercise = (idx: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== idx));
    if (previewExerciseIdx === idx) {
      setPreviewExerciseIdx(null);
    }
  };

  const linkedPlan = useMemo(
    () => (planId ? workoutPlans.find((p) => p.id === planId) ?? null : null),
    [planId, workoutPlans]
  );

  const handleApplyPlan = async (plan: WorkoutPlan, targetDayIdx: number, switchTab = false) => {
    setApplyingPlanId(plan.id);
    setSaveFeedback(null);
    try {
      const targetExists = weekWorkouts.some((w) => w.dayIndex === targetDayIdx);
      await applyPlanToWorkoutDay(uid, plan, selectedWeek, targetDayIdx, targetExists);
      setSelectedDay(targetDayIdx);
      if (switchTab) {
        setSubTab('schedule');
      }
      setSaveFeedback(
        t('Loaded "{name}" onto {day} (Week {week})', {
          name: plan.name,
          day: t(DAY_FULL[targetDayIdx]),
          week: selectedWeek,
        })
      );
    } finally {
      setApplyingPlanId(null);
    }
  };

  const handleSelectPlanFromDayDropdown = async (chosenValue: string) => {
    if (!chosenValue) return;
    if (chosenValue === '__rest__') {
      setFocus('Rest / Recovery');
      setPlanId('');
      setPlanName('');
      setIsRestDay(true);
      setExercises([]);
      await upsertWorkoutDay(
        uid,
        {
          id: existingDayDoc?.id ?? `w${selectedWeek}_d${selectedDay}`,
          weekNumber: selectedWeek,
          dayIndex: selectedDay,
          focus: 'Rest / Recovery',
          planId: '',
          planName: '',
          isRestDay: true,
          completed: false,
          exercises: [],
          cardio: sanitizeCardio(cardio),
          notes,
        },
        Boolean(existingDayDoc)
      );
      setSaveFeedback(t('Set {day} as Rest / Recovery', { day: t(DAY_FULL[selectedDay]) }));
      return;
    }

    const chosen = workoutPlans.find((p) => p.id === chosenValue);
    if (!chosen) return;
    await handleApplyPlan(chosen, selectedDay, false);
  };

  const handleUpdateLinkedPlan = async () => {
    if (!linkedPlan) return;
    setUpdatingTemplate(true);
    setSaveFeedback(null);
    try {
      await saveWorkoutPlan(
        uid,
        {
          id: linkedPlan.id,
          name: focus.trim() || linkedPlan.name,
          scheduledTime: linkedPlan.scheduledTime,
          defaultDays: linkedPlan.defaultDays,
          isRestDay,
          exercises: isRestDay ? [] : exercises,
          cardio: sanitizeCardio({ ...cardio, completed: false }),
          notes,
        },
        true
      );
      setPlanName(focus.trim() || linkedPlan.name);
      setSaveFeedback(
        t('Updated reusable plan "{name}"', { name: focus.trim() || linkedPlan.name })
      );
    } finally {
      setUpdatingTemplate(false);
    }
  };

  const handleDuplicatePlan = async (plan: WorkoutPlan) => {
    await saveWorkoutPlan(
      uid,
      {
        id: '',
        name: `${plan.name.slice(0, 70)} (${t('Copy')})`,
        scheduledTime: plan.scheduledTime,
        defaultDays: plan.defaultDays,
        isRestDay: plan.isRestDay,
        exercises: plan.exercises,
        cardio: plan.cardio,
        notes: plan.notes,
      },
      false
    );
    setSaveFeedback(t('Duplicated plan "{name}"', { name: plan.name }));
  };

  const handleSaveDay = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveFeedback(null);
    try {
      await upsertWorkoutDay(
        uid,
        {
          id: existingDayDoc?.id ?? `w${selectedWeek}_d${selectedDay}`,
          weekNumber: selectedWeek,
          dayIndex: selectedDay,
          focus: focus || 'Training Session',
          planId,
          planName,
          isRestDay,
          completed,
          exercises: isRestDay ? [] : exercises,
          cardio: sanitizeCardio(cardio),
          notes,
        },
        Boolean(existingDayDoc)
      );
      setSaveFeedback(t('Day plan saved'));
    } finally {
      setSaving(false);
    }
  };

  const handleCopyToNextWeek = async () => {
    if (selectedWeek >= 52) return;
    setCopying(true);
    setSaveFeedback(null);
    try {
      const targetWeek = selectedWeek + 1;
      const sourceMeals = mealLogs.filter((m) => m.weekNumber === selectedWeek);
      const existingTargetIds = workouts
        .filter((w) => w.weekNumber === targetWeek)
        .map((w) => w.id);
      await copyWeekPlans(uid, weekWorkouts, sourceMeals, targetWeek, existingTargetIds);
      setSelectedWeek(targetWeek);
      setSaveFeedback(t('Copied split & meals to Week {week}', { week: targetWeek }));
    } finally {
      setCopying(false);
    }
  };

  const handleMakeCurrentWeek = async () => {
    await updateUserWeekAndPhase(uid, selectedWeek, profile.phaseName);
    setSaveFeedback(t('Active program set to Week {week}', { week: selectedWeek }));
  };

  const previewExercise =
    previewExerciseIdx !== null ? exercises[previewExerciseIdx] ?? null : null;
  const previewImages = useMemo(() => {
    if (!previewExercise?.imageUrl) return [];
    const primary = previewExercise.imageUrl;
    if (primary.endsWith('/0.jpg')) {
      return [primary, `${primary.slice(0, -6)}/1.jpg`];
    }
    return [primary];
  }, [previewExercise]);

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="bg-[#131a24] border-2 border-[#263347] rounded-xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span>{t('Weekly Split & Exercise Log')}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{t('{n} training sessions done', { n: completedCount })}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              {t('{vol} {unit} weekly volume', { vol: Math.round(weekVolume).toLocaleString(), unit: wUnit })}
            </span>
            {weekCardioDistance > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums text-sky-400 font-medium">
                  {t('{dist} {unit} walk/run', { dist: Number(weekCardioDistance.toFixed(1)), unit: dUnit })}
                </span>
              </>
            )}
          </div>
          <h1 className="text-xl font-bold text-white mt-1">
            {t('Week {week} Gym Plan', { week: selectedWeek })}
            {selectedWeek === profile.currentWeek ? ` (${t('Active Week')})` : ''}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center border border-[#2d3c54] rounded-lg bg-[#0e141d] p-1">
            <button
              type="button"
              onClick={() => setSelectedWeek((w) => Math.max(1, w - 1))}
              disabled={selectedWeek <= 1}
              aria-label={t('Previous week')}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1a2434] rounded-md disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <select
              aria-label={t('Select week')}
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(Number(e.target.value))}
              className="bg-transparent px-2 text-xs font-mono font-medium text-slate-100 focus:outline-none tabular-nums"
            >
              {Array.from({ length: 52 }, (_, i) => i + 1).map((wk) => (
                <option key={wk} value={wk} className="bg-[#0e141d] text-slate-100">
                  {t('Week {n}', { n: wk })}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setSelectedWeek((w) => Math.min(52, w + 1))}
              disabled={selectedWeek >= 52}
              aria-label={t('Next week')}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1a2434] rounded-md disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {selectedWeek !== profile.currentWeek && (
            <button
              type="button"
              onClick={() => void handleMakeCurrentWeek()}
              className="px-3 py-2 text-xs font-medium text-emerald-300 bg-emerald-500/15 border border-emerald-500/40 hover:bg-emerald-500/25 rounded-lg transition-colors whitespace-nowrap"
            >
              {t('Set as Current Week')}
            </button>
          )}

          {weekWorkouts.length > 0 && selectedWeek < 52 && (
            <button
              type="button"
              onClick={() => void handleCopyToNextWeek()}
              disabled={copying}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-[#1a2332] border border-[#2d3c54] hover:bg-[#233044] rounded-lg transition-colors whitespace-nowrap"
            >
              <Copy className="w-3.5 h-3.5" />
              {copying ? t('Copying...') : t('Copy to Week {week}', { week: selectedWeek + 1 })}
            </button>
          )}

          <button
            type="button"
            onClick={() => onOpenCsvImport(selectedWeek, selectedDay)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-[#1a2332] border border-[#2d3c54] hover:bg-[#233044] rounded-lg transition-colors whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5" />
            {t('CSV Templates & Import')}
          </button>
        </div>
      </div>

      {/* Sub-navigation: Weekly Schedule vs Reusable Training Plans */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex items-center p-1 bg-[#131a24] border border-[#263347] rounded-xl self-start">
          <button
            type="button"
            onClick={() => setSubTab('schedule')}
            className={`min-h-[40px] inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              subTab === 'schedule'
                ? 'bg-amber-400 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            {t('Weekly Schedule (Mon–Sun)')}
          </button>
          <button
            type="button"
            onClick={() => setSubTab('plans')}
            className={`min-h-[40px] inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors tabular-nums ${
              subTab === 'plans'
                ? 'bg-amber-400 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            {t('Training Plans ({n})', { n: workoutPlans.length })}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setTemplatesOpen(true)}
            className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            {t('Ready-made Workouts')}
          </button>
          {subTab === 'plans' && (
            <button
              type="button"
              onClick={() =>
                setPlanModalState({ open: true, editingPlan: null, seedFromDay: null })
              }
              className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {t('Create New Plan')}
            </button>
          )}
        </div>
      </div>

      {subTab === 'plans' ? (
        <div className="space-y-4">
          {saveFeedback && (
            <div className="text-xs font-medium text-emerald-200 bg-emerald-950/50 border border-emerald-500/40 rounded-lg px-3.5 py-2">
              {saveFeedback}
            </div>
          )}

          {sortedPlans.length === 0 ? (
            <div className="bg-[#131a24] border border-dashed border-[#2d3c54] rounded-xl p-10 text-center space-y-3">
              <div className="w-11 h-11 rounded-xl bg-[#1a2332] text-slate-300 flex items-center justify-center mx-auto">
                <Layers className="w-5 h-5" />
              </div>
              <h2 className="text-base font-semibold text-white">
                {t('No reusable training plans yet')}
              </h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                {t(
                  'Extract the training CSV template to build your week with your preferred AI agent, upload it back to auto-create reusable plans, or build one manually.'
                )}
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => onOpenCsvImport(selectedWeek, selectedDay)}
                  className="min-h-[42px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {t('Get Template / Import CSV')}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPlanModalState({ open: true, editingPlan: null, seedFromDay: null })
                  }
                  className="min-h-[42px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-200 bg-[#1a2332] border border-[#2d3c54] hover:bg-[#233044] rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t('Create Plan Manually')}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedPlans.map((plan) => {
                const chosenApplyDay =
                  applyDayChoiceByPlan[plan.id] ?? plan.defaultDays[0] ?? selectedDay;
                return (
                  <div
                    key={plan.id}
                    className="bg-[#131a24] border-2 border-[#263347] rounded-xl p-5 flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-base font-bold text-white truncate">
                            {plan.name}
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
                            {plan.defaultDays.length > 0
                              ? plan.defaultDays.map((d) => t(DAY_SHORT[d])).join(', ')
                              : t('Any day')}
                            {plan.scheduledTime ? ` · ${plan.scheduledTime}` : ''}
                            {' · '}
                            {plan.isRestDay
                              ? t('Rest template')
                              : t('{n} exercises', { n: plan.exercises.length })}
                            {plan.cardio.activityType !== 'none'
                              ? ` · ${plan.cardio.activityType === 'walk' ? t('Walk') : t('Run')}${
                                  plan.cardio.durationMinutes > 0
                                    ? ` ${plan.cardio.durationMinutes} min`
                                    : ''
                                }`
                              : ''}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setPlanModalState({
                                open: true,
                                editingPlan: plan,
                                seedFromDay: null,
                              })
                            }
                            aria-label={t('Edit {name}', { name: plan.name })}
                            title={t('Edit plan')}
                            className="p-2 text-slate-400 hover:text-white hover:bg-[#1a2332] rounded-lg"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDuplicatePlan(plan)}
                            aria-label={t('Duplicate {name}', { name: plan.name })}
                            title={t('Duplicate plan')}
                            className="p-2 text-slate-400 hover:text-white hover:bg-[#1a2332] rounded-lg"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              void deleteWorkoutPlan(uid, plan.id);
                              setSaveFeedback(t('Deleted plan "{name}"', { name: plan.name }));
                            }}
                            aria-label={t('Delete {name}', { name: plan.name })}
                            title={t('Delete plan')}
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {plan.exercises.length > 0 && (
                        <ul className="space-y-1 text-xs text-slate-300 border-t border-[#1e293b] pt-2.5 tabular-nums">
                          {plan.exercises.slice(0, 4).map((ex) => (
                            <li key={ex.id} className="flex items-center justify-between gap-2">
                              <span className="truncate font-medium text-slate-200">
                                {ex.name}
                              </span>
                              <span className="text-slate-400 font-mono shrink-0">
                                {ex.sets}×{ex.reps}
                                {ex.targetLoad > 0 ? ` · ${ex.targetLoad}${wUnit}` : ''}
                              </span>
                            </li>
                          ))}
                          {plan.exercises.length > 4 && (
                            <li className="text-[11px] text-slate-500">
                              {t('+{n} more exercises', { n: plan.exercises.length - 4 })}
                            </li>
                          )}
                        </ul>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[#1e293b] flex items-center gap-2">
                      <select
                        aria-label={t('Select day to assign {name}', { name: plan.name })}
                        value={chosenApplyDay}
                        onChange={(e) =>
                          setApplyDayChoiceByPlan((prev) => ({
                            ...prev,
                            [plan.id]: Number(e.target.value),
                          }))
                        }
                        className="min-h-[38px] px-2.5 py-1.5 text-xs font-medium text-slate-100 bg-[#0e141d] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                      >
                        {DAY_FULL.map((dName, dIdx) => (
                          <option key={dName} value={dIdx}>
                            {t(dName)} (W{selectedWeek})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={applyingPlanId === plan.id}
                        onClick={() => void handleApplyPlan(plan, chosenApplyDay, true)}
                        className="flex-1 min-h-[38px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-lg transition-colors"
                      >
                        <Play className="w-3.5 h-3.5" />
                        {applyingPlanId === plan.id ? t('Assigning...') : t('Start on This Day')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* 7-Day Selector Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {DAY_SHORT.map((shortName, idx) => {
              const dayDoc = weekWorkouts.find((w) => w.dayIndex === idx);
              const isSelected = selectedDay === idx;
              return (
                <button
                  key={shortName}
                  type="button"
                  onClick={() => setSelectedDay(idx)}
                  className={`text-left p-3.5 rounded-xl border-2 transition-colors ${
                    isSelected
                      ? 'bg-[#1b2535] text-white border-amber-400'
                      : 'bg-[#131a24] text-slate-200 border-[#263347] hover:border-[#394c69]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xs font-semibold ${
                        isSelected ? 'text-amber-400' : 'text-slate-400'
                      }`}
                    >
                      {t(shortName)}
                    </span>
                    {dayDoc?.completed && (
                      <Check
                        className={`w-3.5 h-3.5 ${
                          isSelected ? 'text-emerald-400' : 'text-emerald-400'
                        }`}
                      />
                    )}
                  </div>
                  <p className="text-xs font-medium mt-1.5 truncate text-white">
                    {dayDoc ? t(dayDoc.focus) : t('Unscheduled')}
                  </p>
                  <p
                    className={`text-[11px] mt-1 tabular-nums ${
                      isSelected ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    {dayDoc ? (
                      <>
                        {dayDoc.isRestDay ? t('Rest') : `${dayDoc.exercises.length} ${t('ex')}`}
                        {dayDoc.cardio && dayDoc.cardio.activityType !== 'none'
                          ? ` · ${dayDoc.cardio.activityType === 'walk' ? t('Walk') : t('Run')} ${dayDoc.cardio.distance}${dUnit}`
                          : ''}
                      </>
                    ) : (
                      t('Pick a plan')
                    )}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Active Day Editor */}
          <form
            onSubmit={handleSaveDay}
            className="bg-[#131a24] border-2 border-[#263347] rounded-xl p-4 sm:p-6 space-y-6"
          >
            {/* Assign Plan Bar */}
            <div className="p-3.5 bg-[#0e141d] border border-[#263347] rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-200 whitespace-nowrap">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  {t('Plan for {day}:', { day: t(DAY_FULL[selectedDay]) })}
                </span>
                <select
                  aria-label={t('Select training plan for {day}', { day: t(DAY_FULL[selectedDay]) })}
                  value={planId || ''}
                  onChange={(e) => void handleSelectPlanFromDayDropdown(e.target.value)}
                  className="min-h-[38px] px-3 py-1.5 text-xs font-medium text-slate-100 bg-[#131a24] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400 max-w-full sm:max-w-xs"
                >
                  <option value="">
                    {sortedPlans.length > 0
                      ? t('Choose a saved Training Plan...')
                      : t('No saved plans yet — create or import CSV')}
                  </option>
                  {sortedPlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.isRestDay ? t('Rest') : `${p.exercises.length} ${t('ex')}`})
                    </option>
                  ))}
                  <option value="__rest__">{t('Rest / Recovery Day')}</option>
                </select>
                {planName && (
                  <span className="text-xs text-slate-400 truncate">
                    {t('Linked')} · {planName}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {linkedPlan && (
                  <button
                    type="button"
                    disabled={updatingTemplate}
                    onClick={() => void handleUpdateLinkedPlan()}
                    className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-500/15 border border-emerald-500/40 hover:bg-emerald-500/25 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {updatingTemplate ? t('Updating...') : t('Update Plan Template')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    setPlanModalState({
                      open: true,
                      editingPlan: null,
                      seedFromDay: {
                        name: focus || t('{day} Session', { day: t(DAY_FULL[selectedDay]) }),
                        isRestDay,
                        exercises,
                        cardio,
                        notes,
                        dayIndex: selectedDay,
                      },
                    })
                  }
                  className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-[#1a2332] border border-[#2d3c54] hover:bg-[#233044] rounded-lg transition-colors whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t('Save as New Plan')}
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#1e293b]">
              <div>
                <p className="text-xs font-medium text-slate-400">
                  {t('Week {n}', { n: selectedWeek })} · {t(DAY_FULL[selectedDay])}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    required
                    maxLength={SCHEMA_LIMITS.FOCUS_MAX}
                    value={focus}
                    onChange={(e) => setFocus(e.target.value)}
                    placeholder={t('Session focus (e.g., Upper Body Push)')}
                    className="px-3 py-1.5 text-base font-semibold text-white bg-[#0e141d] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400 min-w-[240px]"
                  />
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isRestDay}
                      onChange={(e) => setIsRestDay(e.target.checked)}
                      className="rounded border-[#394c69] bg-[#0e141d] text-emerald-400 focus:ring-emerald-400"
                    />
                    {t('Rest / Recovery Day')}
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {existingDayDoc && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = !completed;
                      setCompleted(next);
                      void toggleWorkoutCompleted(uid, existingDayDoc.id, next);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                      completed
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                        : 'bg-[#1a2332] text-slate-200 border-[#2d3c54] hover:bg-[#233044]'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    {completed ? t('Session Completed (+50 XP)') : t('Mark Complete (+50 XP)')}
                  </button>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? t('Saving...') : t('Save Day Log')}
                </button>
              </div>
            </div>

            {saveFeedback && (
              <div className="text-xs font-medium text-emerald-200 bg-emerald-950/50 border border-emerald-500/40 rounded-lg px-3.5 py-2">
                {saveFeedback}
              </div>
            )}

        {!isRestDay && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-white">{t('Exercise Prescription')}</h2>
                <p className="text-xs text-slate-400 tabular-nums">
                  {t('Session volume: {vol} {unit} · {n} / {max} exercises', {
                    vol: Math.round(sessionVolume).toLocaleString(),
                    unit: wUnit,
                    n: exercises.length,
                    max: SCHEMA_LIMITS.EXERCISES_MAX,
                  })}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => startRestTimer(focus || 'Quick Rest', 90)}
                  className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-[#1a2332] border border-[#2d3c54] hover:bg-[#233044] rounded-lg transition-colors whitespace-nowrap"
                >
                  <Timer className="w-3.5 h-3.5 text-emerald-400" />
                  {t('Rest Timer')}
                </button>
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
                  className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap"
                >
                  <Database className="w-3.5 h-3.5" />
                  {t('Browse Exercise DB')}
                </button>
                <button
                  type="button"
                  onClick={handleAddExercise}
                  disabled={exercises.length >= SCHEMA_LIMITS.EXERCISES_MAX}
                  className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-[#1a2332] border border-[#2d3c54] hover:bg-[#233044] disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t('Custom Row')}
                </button>
              </div>
            </div>

            {exercises.length === 0 ? (
              <div className="py-10 px-4 text-center border border-dashed border-[#2d3c54] rounded-lg">
                <p className="text-sm text-slate-300">
                  {t('No exercises added for {day}.', { day: t(DAY_FULL[selectedDay]) })}
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
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
                    className="min-h-[42px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg"
                  >
                    <Database className="w-3.5 h-3.5" />
                    {t('Browse Exercise Database')}
                  </button>
                  <button
                    type="button"
                    onClick={handleAddExercise}
                    className="min-h-[42px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-200 bg-[#1a2332] border border-[#2d3c54] hover:bg-[#233044] rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {t('Add Custom Exercise')}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {exercises.map((ex, idx) => {
                    const restSec = ex.restSeconds ?? 90;
                    const rows = getSetRows(ex);
                    const prevRows = previousByName.get(ex.name.trim().toLowerCase());
                    const cell =
                      'w-full min-h-[44px] px-1 text-center text-base font-mono tabular-nums text-white bg-[#131a24] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400';
                    return (
                      <div
                        key={ex.id}
                        className="border border-[#263347] rounded-xl p-3 sm:p-4 bg-[#0e141d] space-y-3"
                      >
                        <div className="flex items-center gap-3">
                          <ExerciseThumb
                            src={ex.imageUrl}
                            alt={ex.name || t('Exercise')}
                            onClick={() => {
                              if (ex.imageUrl) {
                                setPreviewExerciseIdx(idx);
                              } else {
                                setPickerState({
                                  open: true,
                                  mode: 'match',
                                  matchIndex: idx,
                                  initialQuery: ex.name,
                                });
                              }
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              required
                              maxLength={80}
                              value={ex.name}
                              onChange={(e) => handleUpdateExercise(idx, 'name', e.target.value)}
                              placeholder={t('Exercise name')}
                              className="w-full min-h-[38px] px-2.5 py-1.5 text-sm font-semibold text-sky-400 bg-transparent border border-transparent hover:border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                            />
                            <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-slate-400 px-2.5">
                              <span>
                                {ex.muscleGroup
                                  ? t(formatMuscleLabel(ex.muscleGroup))
                                  : t('Custom exercise')}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>{t('Target: {reps} reps', { reps: ex.reps })}</span>
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
                                className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-medium"
                              >
                                <Search className="w-3 h-3" />
                                {ex.imageUrl ? t('Swap') : t('Match photo')}
                              </button>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveExercise(idx)}
                            aria-label={t('Remove exercise')}
                            className="w-10 h-10 inline-flex items-center justify-center text-slate-400 hover:text-rose-400 rounded-lg shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <label className="inline-flex items-center gap-2 px-3 min-h-[40px] text-xs text-slate-200 bg-[#1a2332] border border-[#2d3c54] rounded-lg">
                            <Timer className="w-4 h-4 text-emerald-300" />
                            {t('Rest (sec)')}
                            <input
                              type="number"
                              step={15}
                              min={0}
                              max={600}
                              value={restSec}
                              onChange={(e) =>
                                handleUpdateExercise(idx, 'restSeconds', Number(e.target.value))
                              }
                              className="w-14 px-1 py-1 text-sm text-center font-mono tabular-nums text-white bg-[#0e141d] border border-[#2d3c54] rounded-md focus:outline-none focus:border-emerald-400"
                            />
                          </label>
                          <input
                            type="text"
                            maxLength={SCHEMA_LIMITS.EXERCISE_NOTES_MAX}
                            value={ex.notes ?? ''}
                            onChange={(e) => handleUpdateExercise(idx, 'notes', e.target.value)}
                            placeholder={t('Cue / last log note...')}
                            className="flex-1 min-w-[140px] min-h-[40px] px-2.5 py-1.5 text-xs text-slate-300 bg-[#131a24] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="grid grid-cols-[2.25rem_minmax(0,1fr)_3.75rem_3.75rem_2.75rem_2.75rem] sm:grid-cols-[2.5rem_minmax(0,1fr)_5rem_5rem_3rem_3rem] gap-1.5 sm:gap-2 text-[11px] font-medium text-slate-400 text-center uppercase">
                            <span>{t('Set')}</span>
                            <span>{t('Previous')}</span>
                            <span>{wUnit}</span>
                            <span>{t('Reps')}</span>
                            <span>{t('RPE')}</span>
                            <Check className="w-3.5 h-3.5 mx-auto" aria-hidden="true" />
                          </div>
                          {rows.map((row, setIdx) => {
                            const prev = prevRows ? prevRows[setIdx] ?? prevRows[prevRows.length - 1] : undefined;
                            return (
                              <div
                                key={setIdx}
                                className={`grid grid-cols-[2.25rem_minmax(0,1fr)_3.75rem_3.75rem_2.75rem_2.75rem] sm:grid-cols-[2.5rem_minmax(0,1fr)_5rem_5rem_3rem_3rem] gap-1.5 sm:gap-2 items-center rounded-lg ${
                                  row.done ? 'bg-emerald-500/10' : ''
                                }`}
                              >
                                <span className="min-h-[44px] inline-flex items-center justify-center text-sm font-semibold text-white bg-[#1a2332] rounded-lg">
                                  {setIdx + 1}
                                </span>
                                <span className="text-[11px] leading-tight text-center text-slate-500 font-mono tabular-nums">
                                  {prev
                                    ? `${prev.load}${wUnit} x ${prev.reps}${prev.rpe > 0 ? ` @ ${prev.rpe} rpe` : ''}`
                                    : '—'}
                                </span>
                                <input
                                  type="number"
                                  inputMode="decimal"
                                  step="0.5"
                                  min={0}
                                  max={1000}
                                  value={row.load || ''}
                                  placeholder={prev ? String(prev.load) : '0'}
                                  aria-label={t('Weight ({unit})', { unit: wUnit })}
                                  onChange={(e) => updateSet(idx, setIdx, { load: Number(e.target.value) })}
                                  className={cell}
                                />
                                <input
                                  type="number"
                                  inputMode="numeric"
                                  min={0}
                                  max={999}
                                  value={row.reps || ''}
                                  placeholder={prev ? String(prev.reps) : '0'}
                                  aria-label={t('Reps')}
                                  onChange={(e) => updateSet(idx, setIdx, { reps: Number(e.target.value) })}
                                  className={cell}
                                />
                                <button
                                  type="button"
                                  onClick={() => setRpeTarget({ idx, setIdx })}
                                  aria-label={t('Set RPE for set {n}', { n: setIdx + 1 })}
                                  className="min-h-[44px] inline-flex items-center justify-center text-sm font-mono tabular-nums text-slate-300 bg-[#1a2332] border border-[#2d3c54] hover:border-emerald-400 rounded-lg"
                                >
                                  {row.rpe > 0 ? row.rpe : <Gauge className="w-4 h-4" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleSetDone(idx, setIdx)}
                                  aria-label={t('Mark set {n} done', { n: setIdx + 1 })}
                                  aria-pressed={row.done}
                                  className={`min-h-[44px] inline-flex items-center justify-center rounded-lg border transition-colors ${
                                    row.done
                                      ? 'bg-emerald-400 text-slate-950 border-emerald-400'
                                      : 'bg-[#1a2332] text-slate-400 border-[#2d3c54] hover:text-white'
                                  }`}
                                >
                                  <Check className="w-5 h-5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => addSet(idx)}
                            disabled={rows.length >= 20}
                            className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 text-sm font-medium text-slate-200 bg-[#1a2332] hover:bg-[#233044] disabled:opacity-50 rounded-lg"
                          >
                            <Plus className="w-4 h-4" />
                            {t('Add set')}
                          </button>
                          {rows.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSet(idx)}
                              className="min-h-[44px] px-4 text-xs font-medium text-slate-400 hover:text-rose-400 bg-[#1a2332] rounded-lg"
                            >
                              {t('Remove set')}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Walk or Run Cardio Option */}
        <div className="p-4 sm:p-5 bg-[#0e141d] border border-[#263347] rounded-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#131a24] border border-[#2d3c54] flex items-center justify-center text-emerald-400 shrink-0">
                <Footprints className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">{t('Cardio · Walk or Run (+35 XP)')}</h2>
                <p className="text-xs text-slate-400">
                  {t('Log outdoor or treadmill walk/run distance, duration, and pace')}
                </p>
              </div>
            </div>

            <div className="inline-flex items-center p-1 bg-[#131a24] border border-[#2d3c54] rounded-lg self-start sm:self-auto">
              {(
                [
                  { id: 'none', label: t('None') },
                  { id: 'walk', label: t('Walk') },
                  { id: 'run', label: t('Run') },
                ] as { id: CardioType; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    setCardio((prev) => ({
                      ...prev,
                      activityType: opt.id,
                    }))
                  }
                  className={`min-h-[38px] px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
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
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('Distance ({unit})', { unit: dUnit })}
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
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums text-white bg-[#131a24] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('Duration (min)')}
                </label>
                <input
                  type="number"
                  step="1"
                  min={0}
                  max={600}
                  value={cardio.durationMinutes}
                  onChange={(e) =>
                    setCardio((prev) => ({
                      ...prev,
                      durationMinutes: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums text-white bg-[#131a24] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('Calories Burned')}
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
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums text-white bg-[#131a24] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {cardio.activityType === 'walk' ? t('Incline / Speed') : t('Pace / Split')}
                </label>
                <input
                  type="text"
                  maxLength={SCHEMA_LIMITS.PACE_OR_INCLINE_MAX}
                  value={cardio.paceOrIncline}
                  onChange={(e) =>
                    setCardio((prev) => ({ ...prev, paceOrIncline: e.target.value }))
                  }
                  placeholder={
                    cardio.activityType === 'walk'
                      ? t('e.g., 6% incline · 5.8 km/h')
                      : t('e.g., 5:20 /km')
                  }
                  className="w-full px-3 py-2 text-sm text-white bg-[#131a24] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex items-end">
                <label className="w-full min-h-[42px] px-3 py-2 bg-[#131a24] border border-[#2d3c54] rounded-lg inline-flex items-center gap-2 text-xs font-medium text-slate-200 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={cardio.completed}
                    onChange={(e) =>
                      setCardio((prev) => ({ ...prev, completed: e.target.checked }))
                    }
                    className="w-4 h-4 rounded border-[#394c69] bg-[#0e141d] text-emerald-400 focus:ring-emerald-400"
                  />
                  {t('Cardio Done')}
                </label>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            {t('Session Notes & Conditioning')}
          </label>
          <textarea
            rows={2}
            maxLength={SCHEMA_LIMITS.NOTES_MAX}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('Record tempo cues, soreness, or progression notes...')}
            className="w-full px-3 py-2 text-sm text-white bg-[#0e141d] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
          />
        </div>
      </form>
        </>
      )}

      <WorkoutTemplatesModal
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        uid={uid}
        onAdded={(name, count) => {
          setSaveFeedback(
            t(
              count === 1
                ? 'Added {n} plan from "{name}". Open a day and pick one from the list.'
                : 'Added {n} plans from "{name}". Open a day and pick one from the list.',
              { n: count, name }
            )
          );
          setSubTab('plans');
        }}
      />

      {/* Create / Edit Reusable Training Plan Modal */}
      <WorkoutPlanModal
        open={planModalState.open}
        onClose={() =>
          setPlanModalState({ open: false, editingPlan: null, seedFromDay: null })
        }
        uid={uid}
        unitSystem={profile.unitSystem}
        editingPlan={planModalState.editingPlan}
        seedFromDay={planModalState.seedFromDay}
        onSaved={(savedName) => setSaveFeedback(t('Saved training plan "{name}"', { name: savedName }))}
      />

      {/* Exercise Form Photo Preview Modal */}
      {previewExercise && previewExerciseIdx !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('Form photos for {name}', { name: previewExercise.name })}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-[1px] flex items-center justify-center p-4"
        >
          <div className="bg-[#131a24] w-full max-w-2xl rounded-2xl border-2 border-[#33445e] shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#253247] bg-[#0f151e] flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-emerald-400">
                  {previewExercise.muscleGroup
                    ? t(formatMuscleLabel(previewExercise.muscleGroup))
                    : t('Exercise Form Guide')}
                </p>
                <h3 className="text-base font-bold text-white truncate">
                  {previewExercise.name || t('Exercise Preview')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewExerciseIdx(null)}
                aria-label={t('Close exercise preview')}
                className="w-10 h-10 inline-flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#1a2332] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {previewImages.length > 0 && (
                <div
                  className={`grid gap-3 ${
                    previewImages.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'
                  }`}
                >
                  {previewImages.map((imgUrl, idx) => (
                    <div
                      key={imgUrl}
                      className="border border-[#263347] rounded-xl overflow-hidden bg-[#0e141d]"
                    >
                      <PreviewPhoto
                        src={imgUrl}
                        alt={t('{name} position {n}', { name: previewExercise.name, n: idx + 1 })}
                      />
                      <div className="px-3 py-2 text-xs font-medium text-slate-300 bg-[#131a24] border-t border-[#263347]">
                        {idx === 0 ? t('Start Position') : t('End / Peak Position')}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const idx = previewExerciseIdx;
                    const q = previewExercise.name;
                    setPreviewExerciseIdx(null);
                    setPickerState({
                      open: true,
                      mode: 'match',
                      matchIndex: idx,
                      initialQuery: q,
                    });
                  }}
                  className="min-h-[42px] px-4 py-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-200 bg-[#1a2332] border border-[#2d3c54] hover:bg-[#233044] rounded-lg transition-colors"
                >
                  <Search className="w-3.5 h-3.5" />
                  {t('Swap Photo from Database')}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    startRestTimer(
                      previewExercise.name,
                      previewExercise.restSeconds ?? 90
                    );
                    setPreviewExerciseIdx(null);
                  }}
                  className="min-h-[42px] px-4 py-2 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors tabular-nums"
                >
                  <Timer className="w-4 h-4" />
                  {t('Start {sec}s Rest', { sec: previewExercise.restSeconds ?? 90 })}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Searchable Exercise Database Modal */}
      <ExercisePickerModal
        isOpen={pickerState.open}
        mode={pickerState.mode}
        initialQuery={pickerState.initialQuery}
        onClose={() =>
          setPickerState((prev) => ({ ...prev, open: false, matchIndex: null }))
        }
        onSelectExercise={handleSelectFromCatalog}
      />

      {rpeTarget && exercises[rpeTarget.idx] && (
        <RpePicker
          value={getSetRows(exercises[rpeTarget.idx])[rpeTarget.setIdx]?.rpe ?? 0}
          onChange={(v) => updateSet(rpeTarget.idx, rpeTarget.setIdx, { rpe: v })}
          onClose={() => setRpeTarget(null)}
        />
      )}

      {/* Active Floating Rest Timer */}
      {timerSecondsLeft !== null && (
      <RestTimerBar
          exerciseName={timerExerciseName}
          targetSeconds={timerTargetSeconds}
          secondsLeft={timerSecondsLeft}
          isRunning={timerRunning}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled((s) => !s)}
          onAdjust={(delta) =>
            setTimerSecondsLeft((prev) => {
              const base = prev ?? 0;
              const next = Math.max(0, Math.min(600, base + delta));
              if (next > 0) chimeFiredRef.current = false;
              return next;
            })
          }
          onTogglePause={() => setTimerRunning((r) => !r)}
          onReset={() => {
            chimeFiredRef.current = false;
            setTimerSecondsLeft(timerTargetSeconds);
            setTimerRunning(true);
          }}
          onSelectPreset={(preset) => {
            chimeFiredRef.current = false;
            setTimerTargetSeconds(preset);
            setTimerSecondsLeft(preset);
            setTimerRunning(true);
          }}
          onDismiss={() => {
            setTimerRunning(false);
            setTimerSecondsLeft(null);
          }}
        />
      )}
    </div>
  );
};

