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
