import { CardioLog, CardioType, ExerciseItem, MealSlot, SCHEMA_LIMITS } from '../types';
import {
  clampInt,
  clampNumber,
  defaultCardio,
  sanitizeCardio,
  sanitizeDefaultDays,
  sanitizeExercises,
  sanitizeId,
  sanitizeString,
} from './sanitize';

export interface ParsedWorkoutDay {
  weekNumber: number;
  dayIndex: number;
  focus: string;
  scheduledTime: string;
  planId?: string;
  planName?: string;
  isRestDay: boolean;
  completed: boolean;
  exercises: ExerciseItem[];
  cardio: CardioLog;
  notes: string;
}

export interface ParsedWorkoutPlan {
  id: string;
  name: string;
  scheduledTime: string;
  defaultDays: number[];
  isRestDay: boolean;
  exercises: ExerciseItem[];
  cardio: CardioLog;
  notes: string;
}

export interface ParsedMealRow {
  weekNumber: number;
  dayIndex: number;
  slot: MealSlot;
  title: string;
  servings: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  consumed: boolean;
}

export const TRAINING_CSV_TEMPLATE = [
  'week,day,focus,is_rest_day,exercise,sets,reps,target_load,actual_load,rpe,rest_seconds,muscle_group,completed,cardio_type,cardio_distance,cardio_minutes,cardio_calories,cardio_pace,notes',
  '1,Mon,Upper Body Push,false,Barbell Bench Press,4,6-8,85,0,8,120,chest,false,,,,,,Controlled 2s eccentric',
  '1,Mon,Upper Body Push,false,Incline Dumbbell Press,3,10,32,0,8.5,90,chest,false,,,,,,',
  '1,Wed,Active Recovery Walk,true,,,,,,,,,,walk,4.0,40,230,6% incline,Outdoor or treadmill walk',
  '1,Sat,Conditioning & Tempo Run,false,Pull-Ups,4,8,10,0,8,90,lats,false,run,5.0,27,350,5:24 /km,Run after lifting',
].join('\n');

export const DIET_CSV_TEMPLATE = [
  'week,day,slot,title,servings,calories,protein_g,carbs_g,fat_g,consumed',
  '1,Mon,meal_1,Protein Overnight Oats,1,520,42,56,14,false',
  '1,Mon,meal_2,Chicken Pesto & Sweet Potato,1,640,54,58,21,false',
  '1,Mon,meal_3,Greek Yogurt & Berries,1,280,26,30,5,false',
  '1,Mon,meal_4,Seared Salmon & Rice Bowl,1,690,46,64,26,false',
  '1,Mon,meal_5,Whey Shake & Banana,1,240,28,27,2,false',
  '1,Mon,meal_6,Casein & Almonds,1,220,24,6,11,false',
].join('\n');

export function buildTrainingAiPrompt(weekNumber: number): string {
  return [
    `Build my weekly gym + walk/run training schedule for Week ${weekNumber} and return ONLY a valid CSV code block matching this exact template:`,
    '',
    'Rules:',
    '- Keep the exact header row below.',
    '- Use day values: Mon, Tue, Wed, Thu, Fri, Sat, Sun (or Seg, Ter, Qua, Qui, Sex, Sab, Dom).',
    '- Group exercises under a consistent "focus" name per session (each unique focus also becomes a reusable Training Plan).',
    '- For cardio-only or rest days set is_rest_day=true and leave exercise blank; set cardio_type to "walk", "run", or blank.',
    '- Leave numeric fields plain numbers (no units inside load/distance/minutes columns).',
    '',
    'CSV Template:',
    TRAINING_CSV_TEMPLATE,
  ].join('\n');
}

export function buildDietAiPrompt(weekNumber: number, mealsPerDay: number): string {
  return [
    `Build my 7-day diet plan (${mealsPerDay} meals per day) for Week ${weekNumber} and return ONLY a valid CSV code block matching this exact template:`,
    '',
    'Rules:',
    '- Keep the exact header row below.',
    '- Use day values: Mon, Tue, Wed, Thu, Fri, Sat, Sun (repeat rows for all 7 days).',
    `- Use slot values: meal_1 through meal_${mealsPerDay}.`,
    '- Put plain numbers for servings, calories, protein_g, carbs_g, fat_g and set consumed=false.',
    '',
    'CSV Template:',
    DIET_CSV_TEMPLATE,
  ].join('\n');
}

export function downloadCsvFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function stripAccents(input: string): string {
  return input.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function detectDelimiter(headerLine: string): ',' | ';' | '\t' {
  const commas = (headerLine.match(/,/g) ?? []).length;
  const semis = (headerLine.match(/;/g) ?? []).length;
  const tabs = (headerLine.match(/\t/g) ?? []).length;
  if (tabs > commas && tabs >= semis) return '\t';
  if (semis > commas) return ';';
  return ',';
}

export function parseCsvText(rawText: string): string[][] {
  let text = rawText.replace(/^﻿/, '').trim();
  if (text.startsWith('```')) {
    text = text
      .replace(/^```[a-zA-Z]*\r?\n?/, '')
      .replace(/\r?\n?```$/, '')
      .trim();
  }
  if (!text) return [];

  const firstNewline = text.search(/\r?\n/);
  const firstLine = firstNewline === -1 ? text : text.slice(0, firstNewline);
  const delimiter = detectDelimiter(firstLine);

  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field.trim());
      field = '';
    } else if (ch === '\r') {
      if (text[i + 1] === '\n') i++;
      row.push(field.trim());
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
      field = '';
    } else if (ch === '\n') {
      row.push(field.trim());
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }

  row.push(field.trim());
  if (row.some((c) => c.length > 0)) rows.push(row);
  return rows;
}

function normalizeHeader(h: string): string {
  return stripAccents(h)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function parseBool(val: string | undefined, fallback = false): boolean {
  if (!val) return fallback;
  const v = stripAccents(val.trim().toLowerCase());
  if (['true', 'yes', 'y', '1', 'done', 'completed', 'sim', 's', 'concluido'].includes(v)) {
    return true;
  }
  if (['false', 'no', 'n', '0', 'nao'].includes(v)) return false;
  return fallback;
}

function parseNumber(val: string | undefined, fallback = 0): number {
  if (!val) return fallback;
  const trimmed = val.trim();
  if (!trimmed) return fallback;
  // Support Brazilian/European decimal commas like "42,5" or "0,9"
  let normalized = trimmed.replace(/\s+/g, '');
  const hasComma = normalized.includes(',');
  const hasDot = normalized.includes('.');
  if (hasComma && !hasDot) {
    normalized = normalized.replace(',', '.');
  } else if (hasComma && hasDot) {
    // Whichever appears last is the decimal separator
    if (normalized.lastIndexOf(',') > normalized.lastIndexOf('.')) {
      normalized = normalized.replace(/\./g, '').replace(',', '.');
    } else {
      normalized = normalized.replace(/,/g, '');
    }
  }
  const cleaned = normalized.replace(/[^0-9.\-]/g, '');
  if (!cleaned || cleaned === '-' || cleaned === '.') return fallback;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : fallback;
}

function parseDayIndex(
  val: string | undefined,
  dayOrderVal: string | undefined,
  fallback = 0
): number | null {
  if (val && val.trim()) {
    const v = stripAccents(val.trim().toLowerCase());
    const map: Record<string, number> = {
      mon: 0,
      monday: 0,
      seg: 0,
      segunda: 0,
      'segunda-feira': 0,
      tue: 1,
      tues: 1,
      tuesday: 1,
      ter: 1,
      terca: 1,
      'terca-feira': 1,
      wed: 2,
      wednesday: 2,
      qua: 2,
      quarta: 2,
      'quarta-feira': 2,
      thu: 3,
      thur: 3,
      thurs: 3,
      thursday: 3,
      qui: 3,
      quinta: 3,
      'quinta-feira': 3,
      fri: 4,
      friday: 4,
      sex: 4,
      sexta: 4,
      'sexta-feira': 4,
      sat: 5,
      saturday: 5,
      sab: 5,
      sabado: 5,
      sun: 6,
      sunday: 6,
      dom: 6,
      domingo: 6,
    };
    if (v in map) return map[v];
    const n = parseInt(v, 10);
    if (Number.isFinite(n) && n >= 0 && n <= 6) return n;
  }

  if (dayOrderVal && dayOrderVal.trim()) {
    const ord = parseInt(dayOrderVal.trim(), 10);
    if (Number.isFinite(ord) && ord >= 1 && ord <= 7) {
      return ord - 1;
    }
  }

  if (!val || !val.trim()) return fallback;
  return null;
}

function parseMealSlot(val: string | undefined): MealSlot {
  if (!val || !val.trim()) return 'meal_1';
  const v = stripAccents(val.trim().toLowerCase()).replace(/[\s-]+/g, '_');
  if (
    v === 'breakfast' ||
    v === 'lunch' ||
    v === 'dinner' ||
    v === 'snack' ||
    v === 'on_the_spot'
  ) {
    return v;
  }
  if (v === 'extra' || v === 'onthespot' || v === 'snack_extra') return 'on_the_spot';
  const mealMatch = v.match(/^(?:meal|refeicao)_?(\d+)$/);
  if (mealMatch) {
    const n = clampInt(Number(mealMatch[1]), 1, 10, 1);
    return `meal_${n}` as MealSlot;
  }
  const numOnly = parseInt(v, 10);
  if (Number.isFinite(numOnly) && numOnly >= 1 && numOnly <= 10) {
    return `meal_${numOnly}` as MealSlot;
  }
  return 'on_the_spot';
}

function parseCardioType(val: string | undefined): CardioType {
  if (!val) return 'none';
  const v = stripAccents(val.trim().toLowerCase());
  if (v.includes('walk') || v.includes('caminhada')) return 'walk';
  if (v.includes('run') || v.includes('corrida') || v.includes('jog')) return 'run';
  return 'none';
}

function findCol(headers: string[], aliases: string[]): number {
  for (const alias of aliases) {
    const idx = headers.indexOf(alias);
    if (idx !== -1) return idx;
  }
  return -1;
}

function parseWorkingSets(raw: string | undefined): number {
  if (!raw || !raw.trim()) return 3;
  const cleaned = stripAccents(raw.trim().toLowerCase());
  if (cleaned === '—' || cleaned === '-' || cleaned === 'none') return 1;
  // Handle "aquec. + 2–3" -> take the working set range after '+'
  const afterPlus = cleaned.includes('+') ? cleaned.split('+').pop() ?? cleaned : cleaned;
  const matches = afterPlus.match(/\d+/g);
  if (!matches || matches.length === 0) return 3;
  // Use the last number in range like "2–3" -> 3
  return clampInt(Number(matches[matches.length - 1]), 1, 20, 3);
}

function parseTargetLoad(raw: string | undefined): number {
  if (!raw || !raw.trim()) return 0;
  const lower = stripAccents(raw.trim().toLowerCase());
  if (
    lower === '—' ||
    lower === '-' ||
    lower.includes('peso corporal') ||
    lower.includes('bodyweight')
  ) {
    return 0;
  }
  // If warmup + working sets are specified (e.g., "Aquec. 60 x 6; trabalho 80 kg"), prefer working load
  const workIdx = lower.indexOf('trabalho');
  const slice = workIdx !== -1 ? lower.slice(workIdx) : lower;
  const numMatch = slice.match(/(\d+(?:[.,]\d+)?)/);
  if (!numMatch) return 0;
  return Number(clampNumber(parseNumber(numMatch[1], 0), 0, 1000, 0).toFixed(1));
}

function parseRpeValue(raw: string | undefined): number {
  if (!raw || !raw.trim()) return 8;
  const lower = stripAccents(raw.trim().toLowerCase());
  if (lower === '—' || lower === '-') return 7;
  if (lower.includes('leve-moderado') || lower.includes('light-moderate')) return 6;
  if (lower.includes('leve') || lower.includes('light')) return 5.5;
  if (lower.includes('moderado') || lower.includes('moderate')) return 7;
  const matches = lower.match(/\d+(?:[.,]\d+)?/g);
  if (!matches || matches.length === 0) return 8;
  if (matches.length >= 2) {
    const a = parseNumber(matches[0], 8);
    const b = parseNumber(matches[1], a);
    return Number(clampNumber((a + b) / 2, 1, 10, 8).toFixed(1));
  }
  return Number(clampNumber(parseNumber(matches[0], 8), 1, 10, 8).toFixed(1));
}

function extractDurationMinutes(repsText: string): number {
  if (!repsText) return 0;
  const lower = stripAccents(repsText.toLowerCase());
  const minMatches = Array.from(lower.matchAll(/(\d+(?:[.,]\d+)?)\s*min/g));
  if (minMatches.length === 0) return 0;
  return minMatches.reduce((sum, m) => sum + parseNumber(m[1], 0), 0);
}

function buildExerciseNotes(
  suggestedRaw: string,
  lastLoadRaw: string,
  obsRaw: string
): string {
  const parts: string[] = [];
  const cleanSuggested = suggestedRaw.trim();
  const cleanLast = lastLoadRaw.trim();
  const cleanObs = obsRaw.trim();

  if (cleanSuggested && cleanSuggested !== '—' && cleanSuggested !== '-') {
    // Include suggested cue if it contains richer detail than just a plain number/unit
    if (!/^\d+(?:[.,]\d+)?(\s*(kg|lb|lbs))?$/i.test(cleanSuggested)) {
      parts.push(`Alvo: ${cleanSuggested}`);
    }
  }
  if (cleanLast && cleanLast !== '—' && cleanLast !== '-') {
    parts.push(`Últ: ${cleanLast}`);
  }
  if (cleanObs && cleanObs !== '—' && cleanObs !== '-') {
    parts.push(cleanObs);
  }
  return sanitizeString(parts.join(' · '), SCHEMA_LIMITS.EXERCISE_NOTES_MAX, '');
}

function slugifyPlanId(name: string, index: number): string {
  const base = stripAccents(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 48);
  return sanitizeId(`plan_${base || 'session'}_${index + 1}`);
}

export function buildPlansFromParsedDays(days: ParsedWorkoutDay[]): {
  plans: ParsedWorkoutPlan[];
  linkedDays: ParsedWorkoutDay[];
} {
  const planByName = new Map<string, ParsedWorkoutPlan>();

  days.forEach((day) => {
    const isEmptyRest =
      day.isRestDay &&
      day.exercises.length === 0 &&
      day.cardio.activityType === 'none';
    if (isEmptyRest) return;

    const cleanName = sanitizeString(day.focus, SCHEMA_LIMITS.PLAN_NAME_MAX, 'Training Plan');
    const key = stripAccents(cleanName).toLowerCase();
    const existing = planByName.get(key);
    if (existing) {
      existing.defaultDays = sanitizeDefaultDays([...existing.defaultDays, day.dayIndex]);
      if (!existing.scheduledTime && day.scheduledTime) {
        existing.scheduledTime = day.scheduledTime;
      }
      return;
    }

    const planId = slugifyPlanId(cleanName, planByName.size);
    planByName.set(key, {
      id: planId,
      name: cleanName,
      scheduledTime: sanitizeString(day.scheduledTime, SCHEMA_LIMITS.PLAN_TIME_MAX, ''),
      defaultDays: sanitizeDefaultDays([day.dayIndex]),
      isRestDay: day.isRestDay,
      exercises: sanitizeExercises(day.exercises.map((ex) => ({ ...ex, completed: false }))),
      cardio: sanitizeCardio({ ...day.cardio, completed: false }),
      notes: sanitizeString(day.notes, SCHEMA_LIMITS.NOTES_MAX, ''),
    });
  });

  const plans = Array.from(planByName.values());
  const linkedDays = days.map((day) => {
    const key = stripAccents(day.focus).toLowerCase();
    const matched = planByName.get(key);
    if (!matched) return day;
    return {
      ...day,
      planId: matched.id,
      planName: matched.name,
    };
  });

  return { plans, linkedDays };
}

export function parseTrainingCsv(
  rawText: string,
  defaultWeek: number
): {
  days: ParsedWorkoutDay[];
  plans: ParsedWorkoutPlan[];
  warnings: string[];
  totalExercises: number;
} {
  const rows = parseCsvText(rawText);
  if (rows.length < 2) {
    return {
      days: [],
      plans: [],
      warnings: ['CSV must contain a header row and at least one training row.'],
      totalExercises: 0,
    };
  }

  const headers = rows[0].map(normalizeHeader);
  const colWeek = findCol(headers, ['week', 'week_number', 'wk', 'semana']);
  const colDay = findCol(headers, ['day', 'day_of_week', 'day_index', 'weekday', 'dia']);
  const colDayOrder = findCol(headers, ['ordem_dia', 'day_order']);
  const colTime = findCol(headers, ['horario', 'scheduled_time', 'time', 'hora']);
  const colFocus = findCol(headers, ['sessao', 'session', 'focus', 'split', 'workout', 'plan', 'treino']);
  const colType = findCol(headers, ['tipo', 'type', 'category']);
  const colRest = findCol(headers, ['is_rest_day', 'rest_day', 'descanso']);
  const colExercise = findCol(headers, ['exercicio', 'exercise', 'exercise_name', 'movement', 'lift']);
  const colSets = findCol(headers, ['series', 'sets', 'set']);
  const colReps = findCol(headers, ['reps_duracao', 'reps', 'rep', 'rep_range', 'duracao']);
  const colTargetLoad = findCol(headers, [
    'target_load',
    'load',
    'weight',
    'target_weight',
    'carga_sugerida_proxima_sessao',
    'carga_sugerida',
    'carga',
  ]);
  const colActualLoad = findCol(headers, [
    'actual_load',
    'logged_load',
    'ultima_carga_registrada',
    'ultima_carga',
  ]);
  const colRpe = findCol(headers, ['rpe_alvo', 'rpe']);
  const colRestSeconds = findCol(headers, ['rest_seconds', 'rest_sec', 'rest_time', 'descanso_seg']);
  const colMuscleGroup = findCol(headers, ['muscle_group', 'muscle', 'primary_muscle', 'grupo_muscular']);
  const colCompleted = findCol(headers, ['completed', 'done', 'concluido']);
  const colCardioType = findCol(headers, ['cardio_type', 'cardio', 'walk_run']);
  const colCardioDist = findCol(headers, ['cardio_distance', 'distance', 'distancia']);
  const colCardioMin = findCol(headers, [
    'cardio_minutes',
    'cardio_duration',
    'duration_minutes',
    'duration',
  ]);
  const colCardioKcal = findCol(headers, ['cardio_calories', 'calories_burned']);
  const colCardioPace = findCol(headers, ['cardio_pace', 'pace_or_incline', 'pace', 'incline']);
  const colNotes = findCol(headers, ['observacao', 'observacoes', 'notes', 'note', 'obs']);

  if (colExercise === -1 && colFocus === -1 && colCardioType === -1) {
    return {
      days: [],
      plans: [],
      warnings: [
        'Missing expected columns. Include at least "exercise" ("Exercício"), "focus" ("Sessão"), or "cardio_type".',
      ],
      totalExercises: 0,
    };
  }

  const warnings: string[] = [];
  const grouped = new Map<string, ParsedWorkoutDay>();

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const rowNum = r + 1;
    const rawWeek = colWeek !== -1 ? row[colWeek] : '';
    const weekNumber = rawWeek
      ? clampInt(parseNumber(rawWeek, defaultWeek), 1, 52, defaultWeek)
      : defaultWeek;

    const dayIndex = parseDayIndex(
      colDay !== -1 ? row[colDay] : undefined,
      colDayOrder !== -1 ? row[colDayOrder] : undefined,
      0
    );
    if (dayIndex === null) {
      warnings.push(`Row ${rowNum}: Unrecognized day "${row[colDay]}". Use Mon–Sun or Seg–Dom.`);
      continue;
    }

    const key = `${weekNumber}_${dayIndex}`;
    let dayAcc = grouped.get(key);
    if (!dayAcc) {
      dayAcc = {
        weekNumber,
        dayIndex,
        focus: '',
        scheduledTime: '',
        isRestDay: false,
        completed: false,
        exercises: [],
        cardio: defaultCardio(),
        notes: '',
      };
      grouped.set(key, dayAcc);
    }

    const rowFocus = colFocus !== -1 ? sanitizeString(row[colFocus] ?? '', SCHEMA_LIMITS.FOCUS_MAX, '') : '';
    if (rowFocus && !dayAcc.focus) {
      dayAcc.focus = rowFocus;
    }

    const rowTime = colTime !== -1 ? sanitizeString(row[colTime] ?? '', SCHEMA_LIMITS.PLAN_TIME_MAX, '') : '';
    if (rowTime && rowTime !== '—' && !dayAcc.scheduledTime) {
      dayAcc.scheduledTime = rowTime;
    }

    const rowTypeRaw = colType !== -1 ? stripAccents((row[colType] ?? '').trim().toLowerCase()) : '';
    const rowRestFlag = colRest !== -1 ? parseBool(row[colRest], false) : false;
    const isRowRest =
      rowRestFlag ||
      rowTypeRaw === 'descanso' ||
      rowTypeRaw === 'rest' ||
      stripAccents(rowFocus.toLowerCase()) === 'descanso';

    if (isRowRest && dayAcc.exercises.length === 0) {
      dayAcc.isRestDay = true;
    }

    const rowCompleted = colCompleted !== -1 ? parseBool(row[colCompleted], false) : false;
    const exNameRaw = colExercise !== -1 ? sanitizeString(row[colExercise] ?? '', 80, '') : '';
    const exName = isRowRest && stripAccents(exNameRaw.toLowerCase()) === 'descanso' ? '' : exNameRaw;

    const rawReps = colReps !== -1 ? row[colReps] ?? '' : '';
    const rawSuggested = colTargetLoad !== -1 ? row[colTargetLoad] ?? '' : '';
    const rawActual = colActualLoad !== -1 ? row[colActualLoad] ?? '' : '';
    const rawObs = colNotes !== -1 ? row[colNotes] ?? '' : '';

    if (exName) {
      if (dayAcc.exercises.length >= SCHEMA_LIMITS.EXERCISES_MAX) {
        warnings.push(
          `Row ${rowNum}: Exceeded ${SCHEMA_LIMITS.EXERCISES_MAX} exercises for Week ${weekNumber} day ${dayIndex}; extra row skipped.`
        );
      } else {
        dayAcc.isRestDay = false;
        const exNotes = buildExerciseNotes(rawSuggested, rawActual, rawObs);
        const targetLoad = parseTargetLoad(rawSuggested);
        // Only treat actualLoad as numeric if column is strictly numeric (not descriptive log string like "40 x 10/8 (16/11)")
        const hasDescriptiveLog = /[x×@\/()]/.test(rawActual);
        const actualLoad = hasDescriptiveLog ? 0 : parseTargetLoad(rawActual);

        dayAcc.exercises.push({
          id: `csv_ex_${weekNumber}_${dayIndex}_${dayAcc.exercises.length}`,
          name: exName,
          sets: parseWorkingSets(colSets !== -1 ? row[colSets] : undefined),
          reps: sanitizeString(rawReps && rawReps !== '—' ? rawReps : '8-10', 24, '8-10'),
          targetLoad,
          actualLoad,
          rpe: parseRpeValue(colRpe !== -1 ? row[colRpe] : undefined),
          completed: rowCompleted,
          restSeconds: clampInt(
            parseNumber(colRestSeconds !== -1 ? row[colRestSeconds] : undefined, 90),
            0,
            600,
            90
          ),
          muscleGroup: colMuscleGroup !== -1 ? sanitizeString(row[colMuscleGroup] ?? '', 40, '') : undefined,
          notes: exNotes || undefined,
        });
      }
    }

    // Handle explicit cardio columns OR Portuguese "Tipo = Corrida / Caminhada"
    const explicitCardioType = colCardioType !== -1 ? parseCardioType(row[colCardioType]) : 'none';
    const inferredCardioType =
      explicitCardioType !== 'none' ? explicitCardioType : parseCardioType(rowTypeRaw);

    if (inferredCardioType !== 'none') {
      const explicitDist = parseNumber(colCardioDist !== -1 ? row[colCardioDist] : undefined, 0);
      const explicitMin = parseNumber(colCardioMin !== -1 ? row[colCardioMin] : undefined, 0);
      const inferredMin = extractDurationMinutes(rawReps) * (parseWorkingSets(colSets !== -1 ? row[colSets] : '1') || 1);
      const prevCardio = dayAcc.cardio;
      const totalMin = prevCardio.durationMinutes + (explicitMin > 0 ? explicitMin : inferredMin);
      const paceCandidate =
        colCardioPace !== -1 && row[colCardioPace]
          ? row[colCardioPace]
          : rawReps && rawReps.toLowerCase().includes('min')
          ? rawReps
          : prevCardio.paceOrIncline;

      dayAcc.cardio = sanitizeCardio({
        activityType: inferredCardioType,
        distance: explicitDist > 0 ? explicitDist : prevCardio.distance,
        durationMinutes: totalMin,
        caloriesBurned:
          colCardioKcal !== -1
            ? parseNumber(row[colCardioKcal], prevCardio.caloriesBurned)
            : prevCardio.caloriesBurned,
        paceOrIncline: paceCandidate,
        completed: rowCompleted || prevCardio.completed,
      });
    }

    const rowNotes = colNotes !== -1 ? sanitizeString(row[colNotes] ?? '', SCHEMA_LIMITS.NOTES_MAX, '') : '';
    if (rowNotes && !exName) {
      dayAcc.notes = dayAcc.notes
        ? sanitizeString(`${dayAcc.notes}; ${rowNotes}`, SCHEMA_LIMITS.NOTES_MAX, dayAcc.notes)
        : rowNotes;
    } else if (dayAcc.scheduledTime && !dayAcc.notes) {
      dayAcc.notes = sanitizeString(`Scheduled at ${dayAcc.scheduledTime}`, SCHEMA_LIMITS.NOTES_MAX, '');
    }
  }

  const rawDays = Array.from(grouped.values())
    .map((d) => ({
      ...d,
      focus: d.focus || (d.isRestDay ? 'Active Recovery' : 'Training Session'),
      exercises: d.isRestDay ? [] : sanitizeExercises(d.exercises),
      completed:
        d.exercises.length > 0
          ? d.exercises.every((ex) => ex.completed)
          : Boolean(d.cardio.activityType !== 'none' && d.cardio.completed),
    }))
    .sort((a, b) => a.weekNumber - b.weekNumber || a.dayIndex - b.dayIndex);

  const { plans, linkedDays } = buildPlansFromParsedDays(rawDays);
  const totalExercises = linkedDays.reduce((s, d) => s + d.exercises.length, 0);
  return { days: linkedDays, plans, warnings, totalExercises };
}

export function parseDietCsv(
  rawText: string,
  defaultWeek: number,
  defaultDay: number
): { meals: ParsedMealRow[]; warnings: string[]; maxSlotNumber: number } {
  const rows = parseCsvText(rawText);
  if (rows.length < 2) {
    return {
      meals: [],
      warnings: ['CSV must contain a header row and at least one meal row.'],
      maxSlotNumber: 0,
    };
  }

  const headers = rows[0].map(normalizeHeader);
  const colWeek = findCol(headers, ['week', 'week_number', 'wk', 'semana']);
  const colDay = findCol(headers, ['day', 'day_of_week', 'day_index', 'weekday', 'dia']);
  const colDayOrder = findCol(headers, ['ordem_dia', 'day_order']);
  const colSlot = findCol(headers, ['ordem_refeicao', 'slot', 'meal_slot', 'meal_order', 'meal']);
  const colMealName = findCol(headers, ['refeicao', 'meal_name', 'meal_label']);
  const colTime = findCol(headers, ['horario', 'time', 'hora']);
  const colTitle = findCol(headers, ['alimento', 'title', 'food', 'name', 'meal_name', 'item']);
  const colGrams = findCol(headers, ['quantidade_g', 'quantidade', 'grams', 'weight_g']);
  const colMeasure = findCol(headers, ['medida_caseira', 'measure', 'portion', 'serving_desc']);
  const colServings = findCol(headers, ['servings', 'serving', 'qty']);
  const colCalories = findCol(headers, ['kcal', 'calories', 'cal']);
  const colProtein = findCol(headers, ['proteina_g', 'proteina', 'protein_g', 'protein', 'p']);
  const colCarbs = findCol(headers, [
    'carboidrato_g',
    'carboidratos_g',
    'carboidrato',
    'carbs_g',
    'carbs',
    'carbohydrates',
    'c',
  ]);
  const colFat = findCol(headers, ['gordura_g', 'gorduras_g', 'gordura', 'fat_g', 'fat', 'fats', 'f']);
  const colConsumed = findCol(headers, ['consumed', 'eaten', 'done', 'completed']);

  if (colTitle === -1) {
    return {
      meals: [],
      warnings: [
        'Missing required "title" (or "Alimento" / "food" / "meal_name") column in the CSV header.',
      ],
      maxSlotNumber: 0,
    };
  }

  const warnings: string[] = [];
  const meals: ParsedMealRow[] = [];
  let maxSlotNumber = 0;

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const rowNum = r + 1;
    const rawFood = sanitizeString(row[colTitle] ?? '', SCHEMA_LIMITS.TITLE_MAX, '');
    if (!rawFood) {
      warnings.push(`Row ${rowNum}: Empty meal title skipped.`);
      continue;
    }

    const mealLabel = colMealName !== -1 ? (row[colMealName] ?? '').trim() : '';
    const mealTime = colTime !== -1 ? (row[colTime] ?? '').trim() : '';
    const gramsRaw = colGrams !== -1 ? (row[colGrams] ?? '').trim() : '';
    const measureRaw = colMeasure !== -1 ? (row[colMeasure] ?? '').trim() : '';

    // Format descriptive food title when spreadsheet splits Alimento / Quantidade / Refeição / Horário
    let formattedTitle = rawFood;
    if (gramsRaw || mealLabel) {
      const amountParts: string[] = [];
      if (gramsRaw) amountParts.push(`${gramsRaw}g`);
      if (measureRaw) amountParts.push(measureRaw);
      const amountSuffix = amountParts.length > 0 ? ` (${amountParts.join(' · ')})` : '';
      const slotContext = [mealLabel, mealTime].filter(Boolean).join(' ');
      formattedTitle = slotContext
        ? `${rawFood}${amountSuffix} — ${slotContext}`
        : `${rawFood}${amountSuffix}`;
    }

    const rawWeek = colWeek !== -1 ? row[colWeek] : '';
    const weekNumber = rawWeek
      ? clampInt(parseNumber(rawWeek, defaultWeek), 1, 52, defaultWeek)
      : defaultWeek;

    const dayIndex = parseDayIndex(
      colDay !== -1 ? row[colDay] : undefined,
      colDayOrder !== -1 ? row[colDayOrder] : undefined,
      defaultDay
    );
    if (dayIndex === null) {
      warnings.push(`Row ${rowNum}: Unrecognized day "${row[colDay]}". Use Mon–Sun or Seg–Dom.`);
      continue;
    }

    const slot = parseMealSlot(colSlot !== -1 ? row[colSlot] : undefined);
    if (slot.startsWith('meal_')) {
      const n = parseInt(slot.replace('meal_', ''), 10);
      if (Number.isFinite(n) && n > maxSlotNumber) {
        maxSlotNumber = n;
      }
    }

    meals.push({
      weekNumber,
      dayIndex,
      slot,
      title: sanitizeString(formattedTitle, SCHEMA_LIMITS.TITLE_MAX, rawFood),
      servings: Number(
        clampNumber(parseNumber(colServings !== -1 ? row[colServings] : undefined, 1), 0.25, 20, 1).toFixed(2)
      ),
      calories: Math.round(
        clampNumber(parseNumber(colCalories !== -1 ? row[colCalories] : undefined, 0), 0, 10000, 0)
      ),
      proteinG: Number(
        clampNumber(parseNumber(colProtein !== -1 ? row[colProtein] : undefined, 0), 0, 500, 0).toFixed(1)
      ),
      carbsG: Number(
        clampNumber(parseNumber(colCarbs !== -1 ? row[colCarbs] : undefined, 0), 0, 1000, 0).toFixed(1)
      ),
      fatG: Number(
        clampNumber(parseNumber(colFat !== -1 ? row[colFat] : undefined, 0), 0, 500, 0).toFixed(1)
      ),
      consumed: colConsumed !== -1 ? parseBool(row[colConsumed], false) : false,
    });
  }

  return { meals, warnings, maxSlotNumber };
}
