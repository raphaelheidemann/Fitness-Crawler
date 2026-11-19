import { ExerciseItem } from '../types';

/**
 * Plain-text workout, one exercise per line, for sharing outside the app:
 *
 *   Treino: Peito e Tríceps
 *   Supino com Barra - 3x10 - 40 kg
 *   Tríceps na Polia - 3x8-12
 *
 * The parser is forgiving: "Supino 3x10 40kg", "- Supino: 3 x 10 @ 40 kg" and a
 * list numbered "1." all work. Several "Treino:" headers make several workouts.
 */
export interface TextWorkout {
  name: string; // '' when the text has no header
  exercises: ExerciseItem[];
  skipped: string[]; // non-empty lines that did not look like an exercise
}

const HEADER = /^(?:treino|workout|dia|day)\s*[:\-–]\s*(.+)$/i;
const SETS = /(\d{1,2})\s*[x×]\s*(\d{1,3}(?:[-–]\d{1,3})?)/i; // no spaces in the range, so "3x10 - 40 kg" is not 10-40
const LOAD_UNIT = /(\d+(?:[.,]\d+)?)\s*(?:kg|lbs?|quilos?)\b/i;
const LOAD_TRAILING = /[-–:|@]\s*(\d+(?:[.,]\d+)?)\s*$/;

const fmtNum = (n: number) => String(Number(n.toFixed(1)));

export function buildWorkoutText(name: string, exercises: ExerciseItem[], unit: string): string {
  const lines = [`Treino: ${name.trim() || 'Treino'}`];
  for (const ex of exercises) {
    const exName = ex.name.trim();
    if (!exName) continue;
    const sets = ex.setLog?.length ? ex.setLog.length : ex.sets;
    const load = ex.actualLoad > 0 ? ex.actualLoad : ex.targetLoad;
    lines.push(`${exName} - ${sets}x${ex.reps || '10'}${load > 0 ? ` - ${fmtNum(load)} ${unit}` : ''}`);
  }
  return lines.join('\n');
}

/**
 * What was actually done, one line per set, for a coach or an AI trainer:
 *
 *   Domingo inferiores
 *   domingo, 15 de nov. de 2026 às 08:33
 *
 *   Agachamento (Barra)
 *   Série 1: 60 kg x 6 @ 7 rpe
 *   Série 2: 15 repetições @ 8 rpe        (no load)
 *
 * Only sets marked done are listed; exercises with none are left out.
 */
export function buildSessionText(opts: {
  name: string;
  exercises: ExerciseItem[];
  unit: string;
  date: Date;
  durationSec?: number;
  /** show the clock time (only when it is known, e.g. just finished) */
  withTime?: boolean;
}): string {
  const { name, exercises, unit, date, durationSec, withTime } = opts;
  const day = date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  const time = withTime
    ? ` às ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    : '';
  const head = [name.trim() || 'Treino', `${day}${time}`];
  if (durationSec && durationSec > 0) head.push(`Duração: ${Math.max(1, Math.round(durationSec / 60))} min`);

  const blocks: string[] = [];
  for (const ex of exercises) {
    const exName = ex.name.trim();
    if (!exName) continue;
    const sets = ex.setLog
      ? ex.setLog.filter((s) => s.done)
      : ex.completed
        ? Array.from({ length: ex.sets }, () => ({
            reps: parseInt(ex.reps, 10) || 0,
            load: ex.actualLoad > 0 ? ex.actualLoad : ex.targetLoad,
            rpe: ex.rpe,
            done: true,
          }))
        : [];
    if (sets.length === 0) continue;
    const lines = sets.map((s, i) => {
      const work = s.load > 0 ? `${fmtNum(s.load)} ${unit} x ${s.reps}` : `${s.reps} repetições`;
      return `Série ${i + 1}: ${work}${s.rpe > 0 ? ` @ ${fmtNum(s.rpe)} rpe` : ''}`;
    });
    blocks.push([exName, ...lines].join('\n'));
  }
  return [head.join('\n'), ...blocks].join('\n\n');
}

export function parseWorkoutText(raw: string): TextWorkout[] {
  const workouts: TextWorkout[] = [];
  let cur: TextWorkout = { name: '', exercises: [], skipped: [] };
  workouts.push(cur);
  let seq = 0;

  for (const original of raw.split(/\r?\n/)) {
    let line = original.trim();
    if (!line) continue;

    const header = HEADER.exec(line);
    if (header) {
      cur = { name: header[1].trim().slice(0, 80), exercises: [], skipped: [] };
      workouts.push(cur);
      continue;
    }

    line = line.replace(/^(?:[-•*·]\s+|\d+[.)]\s+)/, '');
    const sets = SETS.exec(line);
    if (!sets) {
      cur.skipped.push(original.trim());
      continue;
    }
    const reps = sets[2].replace(/\s+/g, '').replace('–', '-');
    let rest = line.replace(sets[0], ' ');

    let load = 0;
    const unit = LOAD_UNIT.exec(rest);
    if (unit) {
      load = parseFloat(unit[1].replace(',', '.'));
      rest = rest.replace(unit[0], ' ');
    } else {
      const trailing = LOAD_TRAILING.exec(rest.trimEnd());
      if (trailing) {
        load = parseFloat(trailing[1].replace(',', '.'));
        rest = rest.trimEnd().replace(trailing[0], ' ');
      }
    }

    const name = rest
      .replace(/\s+/g, ' ')
      .replace(/^[\s\-–:|,@]+|[\s\-–:|,@]+$/g, '')
      .slice(0, 80);
    if (!name) {
      cur.skipped.push(original.trim());
      continue;
    }

    cur.exercises.push({
      id: `ex_${Date.now()}_${seq++}`,
      name,
      sets: Math.min(20, Math.max(1, parseInt(sets[1], 10))),
      reps: reps.slice(0, 24),
      targetLoad: Math.min(1000, Math.max(0, load)),
      actualLoad: 0,
      rpe: 8,
      restSeconds: 90,
      completed: false,
    });
  }

  return workouts.filter((w) => w.exercises.length > 0);
}
