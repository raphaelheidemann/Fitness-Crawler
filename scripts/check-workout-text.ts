// Run: npx tsx scripts/check-workout-text.ts
import assert from 'node:assert/strict';
import { buildWorkoutText, parseWorkoutText } from '../src/lib/workoutText';

const ex = (name: string, sets: number, reps: string, load: number) => ({
  id: 'x', name, sets, reps, targetLoad: load, actualLoad: 0, rpe: 8, completed: false,
});

// round trip
const text = buildWorkoutText('Peito e Tríceps', [ex('Supino com Barra', 3, '10', 40), ex('Tríceps na Polia', 3, '8-12', 0)], 'kg');
assert.equal(text, 'Treino: Peito e Tríceps\nSupino com Barra - 3x10 - 40 kg\nTríceps na Polia - 3x8-12');
const [w] = parseWorkoutText(text);
assert.equal(w.name, 'Peito e Tríceps');
assert.deepEqual(w.exercises.map((e) => [e.name, e.sets, e.reps, e.targetLoad]), [
  ['Supino com Barra', 3, '10', 40],
  ['Tríceps na Polia', 3, '8-12', 0],
]);

// forgiving formats
const [f] = parseWorkoutText('1. Supino 3x10 40kg\n- Remada: 4 x 8–10 @ 32,5 kg\nAgachamento - 5x5 - 100\nlinha solta');
assert.deepEqual(f.exercises.map((e) => [e.name, e.sets, e.reps, e.targetLoad]), [
  ['Supino', 3, '10', 40],
  ['Remada', 4, '8-10', 32.5],
  ['Agachamento', 5, '5', 100],
]);
assert.deepEqual(f.skipped, ['linha solta']);

// two workouts, ignored empties, no header
assert.equal(parseWorkoutText('Treino: A\nRosca 3x12\nTreino: B\nElevação 3x15').length, 2);
assert.equal(parseWorkoutText('nada aqui').length, 0);
console.log('workoutText OK');

// reorder helper
import { moveItem } from '../src/lib/arrayMove';
assert.deepEqual(moveItem(['a', 'b', 'c'], 0, 1), ['b', 'a', 'c']);
assert.deepEqual(moveItem(['a', 'b', 'c'], 2, 1), ['a', 'c', 'b']);
assert.deepEqual(moveItem(['a', 'b', 'c'], 0, -1), ['a', 'b', 'c']);
assert.deepEqual(moveItem(['a', 'b', 'c'], 2, 3), ['a', 'b', 'c']);
console.log('arrayMove OK');

// session log (Hevy-like)
import { buildSessionText } from '../src/lib/workoutText';
const sess = buildSessionText({
  name: 'Domingo inferiores',
  unit: 'kg',
  date: new Date(2026, 10, 15, 8, 33),
  withTime: true,
  exercises: [
    { ...ex('Agachamento (Barra)', 3, '6', 80), setLog: [
      { reps: 6, load: 60, rpe: 7, done: true }, { reps: 6, load: 80, rpe: 8.5, done: true }, { reps: 6, load: 80, rpe: 0, done: false }] },
    { ...ex('Elevação de Joelhos nas Barras Paralelas', 3, '15', 0), setLog: [{ reps: 15, load: 0, rpe: 7, done: true }] },
    { ...ex('Não feito', 3, '10', 10), setLog: [{ reps: 10, load: 10, rpe: 0, done: false }] },
  ],
});
assert.equal(
  sess,
  'Domingo inferiores\ndomingo, 15 de nov. de 2026 às 08:33\n\nAgachamento (Barra)\nSérie 1: 60 kg x 6 @ 7 rpe\nSérie 2: 80 kg x 6 @ 8.5 rpe\n\nElevação de Joelhos nas Barras Paralelas\nSérie 1: 15 repetições @ 7 rpe'
);
console.log('session text OK');
