import {
  CardioLog,
  CardioType,
  ExerciseItem,
  HABIT_COLOR_OPTIONS,
  HabitColor,
  SCHEMA_LIMITS,
  UnitSystem,
} from '../types';

export function sanitizeHabitColor(value: string | undefined): HabitColor {
  if (value && (HABIT_COLOR_OPTIONS as string[]).includes(value)) {
    return value as HabitColor;
  }
  return 'emerald';
}

export function clampNumber(value: number, min: number, max: number, fallback = min): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

export function clampInt(value: number, min: number, max: number, fallback = min): number {
  return Math.round(clampNumber(value, min, max, fallback));
}

export function sanitizeString(value: string, maxLength: number, fallback = ''): string {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, maxLength);
}

export function sanitizeDateString(value: string): string {
  const trimmed = (value ?? '').trim();
  if (SCHEMA_LIMITS.DATE_PATTERN.test(trimmed)) {
    return trimmed;
  }
  return todayIsoDate();
}

export function todayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function sanitizeId(id: string): string {
  const cleaned = (id ?? '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
  return cleaned || `item_${Date.now()}`;
}

export function sanitizeExercises(items: ExerciseItem[]): ExerciseItem[] {
  return items.slice(0, SCHEMA_LIMITS.EXERCISES_MAX).map((ex, idx) => {
    const clean: ExerciseItem = {
      id: sanitizeId(ex.id || `ex_${idx}_${Date.now()}`),
      name: sanitizeString(ex.name, 80, 'Exercise'),
      sets: clampInt(Number(ex.sets), 1, 20, 3),
      reps: sanitizeString(ex.reps, 24, '10'),
      targetLoad: Number(clampNumber(Number(ex.targetLoad), 0, 1000, 0).toFixed(1)),
      actualLoad: Number(clampNumber(Number(ex.actualLoad), 0, 1000, 0).toFixed(1)),
      rpe: Number(clampNumber(Number(ex.rpe), 1, 10, 8).toFixed(1)),
      completed: Boolean(ex.completed),
      restSeconds: clampInt(Number(ex.restSeconds ?? 90), 0, 600, 90),
    };
    const muscle = sanitizeString(ex.muscleGroup ?? '', 40, '');
    if (muscle) clean.muscleGroup = muscle;
    const img = sanitizeString(ex.imageUrl ?? '', SCHEMA_LIMITS.IMAGE_URL_MAX, '');
    if (img) clean.imageUrl = img;
    const notes = sanitizeString(ex.notes ?? '', SCHEMA_LIMITS.EXERCISE_NOTES_MAX, '');
    if (notes) clean.notes = notes;
    return clean;
  });
}

export function sanitizeDefaultDays(days?: number[]): number[] {
  if (!Array.isArray(days)) return [];
  const seen = new Set<number>();
  days.forEach((d) => {
    if (Number.isInteger(d) && d >= 0 && d <= 6) {
      seen.add(d);
    }
  });
  return Array.from(seen).sort((a, b) => a - b).slice(0, 7);
}

export function defaultCardio(): CardioLog {
  return {
    activityType: 'none',
    distance: 0,
    durationMinutes: 0,
    caloriesBurned: 0,
    paceOrIncline: '',
    completed: false,
  };
}

export function sanitizeCardio(cardio?: Partial<CardioLog> | null): CardioLog {
  if (!cardio) return defaultCardio();
  const rawType = cardio.activityType;
  const activityType: CardioType =
    rawType === 'walk' || rawType === 'run' ? rawType : 'none';
  if (activityType === 'none') {
    return defaultCardio();
  }
  return {
    activityType,
    distance: Number(clampNumber(Number(cardio.distance ?? 0), 0, 500, 0).toFixed(2)),
    durationMinutes: Number(clampNumber(Number(cardio.durationMinutes ?? 0), 0, 600, 0).toFixed(1)),
    caloriesBurned: Math.round(clampNumber(Number(cardio.caloriesBurned ?? 0), 0, 5000, 0)),
    paceOrIncline: sanitizeString(cardio.paceOrIncline ?? '', SCHEMA_LIMITS.PACE_OR_INCLINE_MAX, ''),
    completed: Boolean(cardio.completed),
  };
}

export function sanitizeStringArray(items: string[], maxItems: number, maxItemLen = 180): string[] {
  return items
    .map((s) => s.trim().slice(0, maxItemLen))
    .filter((s) => s.length > 0)
    .slice(0, maxItems);
}

export function weightUnit(unitSystem: UnitSystem): string {
  return unitSystem === 'imperial' ? 'lbs' : 'kg';
}

export function lengthUnit(unitSystem: UnitSystem): string {
  return unitSystem === 'imperial' ? 'in' : 'cm';
}

export function distanceUnit(unitSystem: UnitSystem): string {
  return unitSystem === 'imperial' ? 'mi' : 'km';
}

export function formatWaterAmount(ml: number, unitSystem: UnitSystem): string {
  const safeMl = Math.max(0, Math.round(ml));
  if (unitSystem === 'imperial') {
    const oz = Math.round(safeMl / 29.5735);
    return `${oz} fl oz`;
  }
  if (safeMl >= 1000) {
    return `${(safeMl / 1000).toFixed(2).replace(/\.?0+$/, '')} L`;
  }
  return `${safeMl} ml`;
}

export function computeExerciseVolume(exercises: ExerciseItem[]): number {
  return exercises.reduce((total, ex) => {
    const load = ex.actualLoad > 0 ? ex.actualLoad : ex.targetLoad;
    const parsedReps = parseInt(ex.reps, 10);
    const reps = Number.isFinite(parsedReps) && parsedReps > 0 ? parsedReps : 0;
    return total + ex.sets * reps * load;
  }, 0);
}
