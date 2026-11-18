/** Food database: macros per 100 g. Starter values are approximate (cooked/ready-to-eat unless noted). */
export interface Food {
  id: string;
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  /** Handy unit, e.g. 1 egg = 50 g */
  unit?: { label: string; grams: number };
  /** true when saved by the user */
  custom?: boolean;
}

type Row = [id: string, name: string, kcal: number, p: number, c: number, f: number, unit?: [string, number]];

const ROWS: Row[] = [
  // Grains, tubers, bread
  ['arroz_branco', 'Arroz branco cozido', 128, 2.5, 28.1, 0.2],
  ['arroz_integral', 'Arroz integral cozido', 124, 2.6, 25.8, 1],
  ['feijao_carioca', 'Feijão carioca cozido', 76, 4.8, 13.6, 0.5],
  ['feijao_preto', 'Feijão preto cozido', 77, 4.5, 14, 0.5],
  ['lentilha', 'Lentilha cozida', 93, 6.3, 16.3, 0.5],
  ['batata_doce', 'Batata-doce cozida', 77, 0.6, 18.4, 0.1],
  ['batata', 'Batata inglesa cozida', 52, 1.2, 11.9, 0],
  ['mandioca', 'Mandioca cozida', 125, 0.6, 30.1, 0.3],
  ['macarrao', 'Macarrão cozido', 110, 3.7, 22, 0.9],
  ['cuscuz', 'Cuscuz de milho cozido', 113, 2.2, 25.3, 0.7],
  ['pao_frances', 'Pão francês', 300, 8, 58.6, 3.1, ['pão', 50]],
  ['pao_integral', 'Pão integral', 253, 9.4, 49.9, 3.7, ['fatia', 25]],
  ['aveia', 'Aveia em flocos', 394, 13.9, 66.6, 8.5],
  ['granola', 'Granola', 420, 9, 68, 12],
  ['tapioca', 'Goma de tapioca', 240, 0, 59, 0],
  ['farinha_trigo', 'Farinha de trigo', 360, 10, 75, 1.4],
  ['pao_queijo', 'Pão de queijo', 363, 5, 40, 20, ['unidade', 30]],
  // Meat, fish, eggs
  ['frango_peito', 'Peito de frango grelhado', 159, 32, 0, 2.5],
  ['frango_peito_cozido', 'Peito de frango cozido/desfiado', 163, 31.5, 0, 3.2],
  ['frango_coxa', 'Coxa e sobrecoxa de frango cozida (sem pele)', 175, 26, 0, 7.5],
  ['patinho', 'Patinho grelhado', 219, 35.9, 0, 7.3],
  ['carne_moida', 'Carne moída refogada', 212, 26.7, 0, 10.9],
  ['alcatra', 'Alcatra grelhada', 241, 31.9, 0, 11.5],
  ['tilapia', 'Filé de tilápia grelhado', 128, 26.2, 0, 2.7],
  ['salmao', 'Salmão grelhado', 208, 22, 0, 13],
  ['atum', 'Atum em lata (natural)', 118, 26, 0, 1],
  ['ovo', 'Ovo cozido', 146, 13.3, 0.6, 9.5, ['ovo', 50]],
  ['clara', 'Clara de ovo', 52, 10.9, 0.7, 0.2, ['clara', 33]],
  ['peito_peru', 'Peito de peru fatiado', 108, 16, 2.5, 3.5],
  // Dairy
  ['leite_integral', 'Leite integral', 61, 3.2, 4.7, 3.3, ['copo', 200]],
  ['leite_desnatado', 'Leite desnatado', 35, 3.4, 4.9, 0.1, ['copo', 200]],
  ['iogurte_natural', 'Iogurte natural', 61, 3.5, 4.7, 3.3, ['pote', 170]],
  ['iogurte_grego', 'Iogurte grego natural', 97, 9, 4, 5, ['pote', 140]],
  ['queijo_minas', 'Queijo minas frescal', 264, 17.4, 3.2, 20.2],
  ['queijo_mucarela', 'Queijo muçarela', 330, 22.6, 3, 25.2, ['fatia', 20]],
  ['requeijao', 'Requeijão cremoso', 257, 9.6, 2.4, 23.4],
  ['whey', 'Whey protein', 380, 80, 6, 5, ['scoop', 30]],
  // Fruit
  ['banana', 'Banana prata', 98, 1.3, 26, 0.1, ['banana', 80]],
  ['maca', 'Maçã', 56, 0.3, 15.2, 0, ['maçã', 150]],
  ['laranja', 'Laranja', 46, 1, 11.5, 0.1, ['laranja', 150]],
  ['mamao', 'Mamão papaia', 40, 0.5, 10.4, 0.1],
  ['morango', 'Morango', 30, 0.9, 6.8, 0.3],
  ['abacate', 'Abacate', 96, 1.2, 6, 8.4],
  // Veg
  ['brocolis', 'Brócolis cozido', 25, 2.1, 4.4, 0.5],
  ['alface', 'Alface', 11, 1.3, 1.7, 0.2],
  ['tomate', 'Tomate', 15, 1.1, 3.1, 0.2, ['tomate', 100]],
  ['cenoura', 'Cenoura crua', 34, 1.3, 7.7, 0.2, ['cenoura', 80]],
  ['cenoura_cozida', 'Cenoura cozida', 30, 0.8, 6.7, 0.2],
  ['abobrinha', 'Abobrinha cozida', 15, 1.1, 3, 0.2],
  // Fats, sweet, other
  ['azeite', 'Azeite de oliva', 884, 0, 0, 100, ['colher de sopa', 13]],
  ['manteiga', 'Manteiga', 726, 0.4, 0.1, 82, ['colher de chá', 5]],
  ['pasta_amendoim', 'Pasta de amendoim', 588, 25, 20, 50, ['colher de sopa', 15]],
  ['castanha_para', 'Castanha-do-pará', 643, 14.5, 15, 63.5, ['unidade', 4]],
  ['amendoim', 'Amendoim', 567, 26, 16, 49],
  ['mel', 'Mel', 304, 0.3, 82, 0, ['colher de sopa', 21]],
  ['acucar', 'Açúcar', 387, 0, 99.5, 0, ['colher de sopa', 12]],
  ['cacau', 'Cacau em pó', 228, 20, 58, 14, ['colher de sopa', 8]],
];

export const STARTER_FOODS: Food[] = ROWS.map(([id, name, calories, proteinG, carbsG, fatG, unit]) => ({
  id,
  name,
  calories,
  proteinG,
  carbsG,
  fatG,
  unit: unit ? { label: unit[0], grams: unit[1] } : undefined,
}));

const BY_ID = new Map(STARTER_FOODS.map((f) => [f.id, f]));

export function getStarterFood(id: string): Food {
  const food = BY_ID.get(id);
  if (!food) throw new Error(`Unknown starter food: ${id}`);
  return food;
}

export interface Macros {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export function macrosForGrams(food: Food, grams: number): Macros {
  const k = Math.max(0, grams) / 100;
  return {
    calories: Math.round(food.calories * k),
    proteinG: Number((food.proteinG * k).toFixed(1)),
    carbsG: Number((food.carbsG * k).toFixed(1)),
    fatG: Number((food.fatG * k).toFixed(1)),
  };
}

export function formatFoodTitle(food: Food, grams: number): string {
  return `${food.name} (${Math.round(grams)}g)`;
}

/** Lowercase, accent-free text for searching. */
export function foldText(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
