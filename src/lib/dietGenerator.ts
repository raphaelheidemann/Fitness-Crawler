import { MealSlot, Sex } from '../types';
import { ParsedMealRow } from './csvImport';
import { formatFoodTitle, getStarterFood, macrosForGrams } from './foodDb';

export type { Sex };

const SEX_BMR_OFFSET: Record<Sex, number> = { male: 5, female: -161, unspecified: -78 };
const SEX_MIN_KCAL: Record<Sex, number> = { male: 1500, female: 1200, unspecified: 1350 };
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active';
export type DietGoal = 'lose' | 'maintain' | 'gain';

export const ACTIVITY_OPTIONS: { key: ActivityLevel; label: string; factor: number }[] = [
  { key: 'sedentary', label: 'Sedentary (desk job, little exercise)', factor: 1.2 },
  { key: 'light', label: 'Light (training 1–3x/week)', factor: 1.375 },
  { key: 'moderate', label: 'Moderate (training 3–5x/week)', factor: 1.55 },
  { key: 'active', label: 'Active (training 6–7x/week)', factor: 1.725 },
];

export interface DietInputs {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  targetKg: number;
  activity: ActivityLevel;
  goal: DietGoal;
}

export interface DietTargets {
  bmr: number;
  tdee: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

/** Mifflin-St Jeor BMR, activity multiplier, then a goal adjustment. */
export function computeDietTargets(i: DietInputs): DietTargets {
  const bmr = 10 * i.weightKg + 6.25 * i.heightCm - 5 * i.age + SEX_BMR_OFFSET[i.sex];
  const factor = ACTIVITY_OPTIONS.find((a) => a.key === i.activity)?.factor ?? 1.2;
  const tdee = bmr * factor;

  let calories = tdee;
  if (i.goal === 'lose') calories = Math.max(tdee * 0.8, bmr, SEX_MIN_KCAL[i.sex]);
  if (i.goal === 'gain') calories = tdee * 1.1;
  calories = Math.round(calories / 10) * 10;

  const refKg = i.goal === 'lose' ? Math.min(i.targetKg, i.weightKg) : i.weightKg;
  const proteinG = Math.round(1.8 * refKg);
  const fatG = Math.round((calories * 0.25) / 9);
  const carbsG = Math.max(0, Math.round((calories - proteinG * 4 - fatG * 9) / 4));
  return { bmr: Math.round(bmr), tdee: Math.round(tdee), calories, proteinG, carbsG, fatG };
}

type Block = 'cafe' | 'lanche_manha' | 'almoco' | 'lanche_tarde' | 'jantar' | 'ceia';
type Line = [foodId: string, grams: number];

const LUNCH_PROTEIN = ['frango_peito', 'patinho', 'frango_coxa', 'tilapia', 'frango_peito', 'alcatra', 'carne_moida'];
const DINNER_PROTEIN = ['tilapia', 'frango_peito', 'carne_moida', 'frango_peito', 'patinho', 'frango_coxa', 'frango_peito'];

function blockLines(block: Block, dayIndex: number): Line[] {
  switch (block) {
    case 'cafe':
      return [['ovo', 100], ['pao_integral', 50], ['banana', 80]];
    case 'lanche_manha':
      return [['maca', 150]];
    case 'almoco':
      return [['arroz_branco', 100], [LUNCH_PROTEIN[dayIndex], 150], ['feijao_carioca', 80], ['brocolis', 80]];
    case 'lanche_tarde':
      return [['iogurte_natural', 170], ['aveia', 20]];
    case 'jantar':
      return [['arroz_branco', 100], [DINNER_PROTEIN[dayIndex], 150], ['abobrinha', 100]];
    case 'ceia':
      return [['mamao', 150]];
  }
}

const BLOCKS_BY_MEALS: Record<number, Block[]> = {
  3: ['cafe', 'almoco', 'jantar'],
  4: ['cafe', 'almoco', 'lanche_tarde', 'jantar'],
  5: ['cafe', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar'],
  6: ['cafe', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar', 'ceia'],
};

export const MEAL_COUNT_OPTIONS = [3, 4, 5, 6] as const;

const COUNTABLE = new Set(['ovo', 'banana', 'maçã', 'laranja', 'pão']);

function roundGrams(foodId: string, grams: number): number {
  const step = foodId === 'ovo' ? 50 : 5;
  return Math.max(step, Math.round(grams / step) * step);
}

function titleFor(foodId: string, grams: number): string {
  const food = getStarterFood(foodId);
  const u = food.unit;
  if (u && COUNTABLE.has(u.label) && grams % u.grams === 0) {
    return `${food.name} (${grams / u.grams} un · ${grams}g)`;
  }
  return formatFoodTitle(food, grams);
}

export interface GeneratedWeek {
  rows: ParsedMealRow[];
  /** average kcal per day actually generated */
  avgCalories: number;
  /** true when portions had to be capped and the target was not reached */
  capped: boolean;
}

/** One meal-log row per food item, so each item can be replaced on its own. */
export function generateWeekMeals(
  weekNumber: number,
  mealsPerDay: number,
  targetCalories: number
): GeneratedWeek {
  const blocks = BLOCKS_BY_MEALS[mealsPerDay] ?? BLOCKS_BY_MEALS[5];
  const rows: ParsedMealRow[] = [];
  let capped = false;
  let totalKcal = 0;

  for (let day = 0; day < 7; day++) {
    const plan = blocks.map((block, idx) => ({
      slot: `meal_${idx + 1}` as MealSlot,
      lines: blockLines(block, day),
    }));
    const baseKcal = plan.reduce(
      (acc, m) => acc + m.lines.reduce((a, [id, g]) => a + macrosForGrams(getStarterFood(id), g).calories, 0),
      0
    );
    const raw = targetCalories / baseKcal;
    const scale = Math.min(2.2, Math.max(0.5, raw));
    if (scale !== raw) capped = true;

    plan.forEach((m) => {
      m.lines.forEach(([id, baseG]) => {
        const grams = roundGrams(id, baseG * scale);
        const macros = macrosForGrams(getStarterFood(id), grams);
        totalKcal += macros.calories;
        rows.push({
          weekNumber,
          dayIndex: day,
          slot: m.slot,
          title: titleFor(id, grams),
          servings: 1,
          ...macros,
          consumed: false,
        });
      });
    });
  }
  return { rows, avgCalories: Math.round(totalKcal / 7), capped };
}
