// Run: npx tsx scripts/check-meal-text.ts
import assert from 'node:assert/strict';
import { STARTER_FOODS, macrosForGrams, formatFoodTitle } from '../src/lib/foodDb';
import { parseMealText, resolveItem, rowGrams } from '../src/lib/mealText';

const run = (text: string) =>
  parseMealText(text).map((it, i) => {
    const r = resolveItem(it, STARTER_FOODS, String(i));
    const f = STARTER_FOODS.find((x) => x.id === r.foodId);
    return { r, f, grams: f ? rowGrams(r, f) : 0 };
  });

let out = run('Pão integral, 2 fatias, presunto 1 fatia, queijo muçarela 1 fatia');
assert.deepEqual(out.map((o) => [o.f?.id, o.r.qty, o.r.unit, o.grams]), [
  ['pao_integral', 2, 'unit', 50],
  ['presunto', 1, 'unit', 15],
  ['queijo_mucarela', 1, 'unit', 20],
]);

out = run('2 ovos\n200 ml leite\n150g arroz branco\n1,5 colher de sopa de azeite\n1 banana');
assert.deepEqual(out.map((o) => [o.f?.id, o.r.qty, o.r.unit, o.grams]), [
  ['ovo', 2, 'unit', 100],
  ['leite_integral', 200, 'base', 200],
  ['arroz_branco', 150, 'base', 150],
  ['azeite', 1.5, 'unit', 19.5],
  ['banana', 1, 'unit', 80],
]);

out = run('frango 120g; batata doce 200 g + 2 pães');
assert.deepEqual(out.map((o) => [o.f?.id, o.grams]), [['frango_peito', 120], ['batata_doce', 200], ['pao_frances', 100]]);

out = run('xyzzy 2');
assert.equal(out[0].f, undefined);

const pao = STARTER_FOODS.find((f) => f.id === 'pao_integral')!;
assert.equal(formatFoodTitle(pao, 50, 2), 'Pão integral (2 fatias)');
assert.equal(formatFoodTitle(STARTER_FOODS.find((f) => f.id === 'leite_integral')!, 200), 'Leite integral (200ml)');
assert.equal(macrosForGrams(pao, 50).calories, 127);
console.log('ok');

// go-to chips: stored titles must re-parse to the same food and amount
for (const [title, id, g] of [
  ['Pão integral (2 fatias)', 'pao_integral', 50],
  ['Leite integral (200ml)', 'leite_integral', 200],
  ['Azeite de oliva (1.5 colheres de sopa)', 'azeite', 19.5],
] as const) {
  const text = title.replace(/^\d{2}:\d{2} · /, '').replace(/ \((.+)\)$/, ' $1');
  const [o] = run(text);
  assert.deepEqual([o.f?.id, o.grams], [id, g], title);
}
console.log('chips ok');
