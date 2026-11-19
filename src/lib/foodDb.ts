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
  /** g (default) or ml for liquids. Values are per 100 of this base; 1 ml is treated as 1 g. */
  base?: 'g' | 'ml';
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
  ['peito_peru', 'Peito de peru fatiado', 108, 16, 2.5, 3.5, ['fatia', 15]],
  // Dairy
  ['leite_integral', 'Leite integral', 61, 3.2, 4.7, 3.3, ['copo', 200]],
  ['leite_desnatado', 'Leite desnatado', 35, 3.4, 4.9, 0.1, ['copo', 200]],
  ['iogurte_natural', 'Iogurte natural', 61, 3.5, 4.7, 3.3, ['pote', 170]],
  ['iogurte_grego', 'Iogurte grego natural', 97, 9, 4, 5, ['pote', 140]],
  ['queijo_minas', 'Queijo minas frescal', 264, 17.4, 3.2, 20.2, ['fatia', 30]],
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
  // More bread, breakfast, cold cuts
  ['pao_forma', 'Pão de forma', 253, 8, 49, 3, ['fatia', 25]],
  ['pao_forma_integral', 'Pão de forma integral', 247, 9.4, 44, 3.4, ['fatia', 25]],
  ['torrada', 'Torrada', 377, 10.5, 71, 5.5, ['unidade', 8]],
  ['biscoito_agua_sal', 'Biscoito água e sal', 432, 10, 68, 12, ['unidade', 6]],
  ['bolacha_recheada', 'Bolacha recheada', 472, 6.5, 70, 18, ['unidade', 13]],
  ['tapioca_pronta', 'Tapioca (massa pronta)', 240, 0, 59, 0, ['unidade', 50]],
  ['wrap', 'Wrap / pão folha', 310, 8.5, 52, 7, ['unidade', 60]],
  ['presunto', 'Presunto', 94, 14.4, 1.5, 3.5, ['fatia', 15]],
  ['peru_blanquet', 'Blanquet de peru', 97, 15.5, 2.5, 2.5, ['fatia', 15]],
  ['mortadela', 'Mortadela', 269, 12, 3, 23, ['fatia', 15]],
  ['salame', 'Salame', 410, 22, 2, 35, ['fatia', 8]],
  ['bacon', 'Bacon frito', 541, 37, 1.4, 42, ['fatia', 8]],
  ['queijo_prato', 'Queijo prato', 360, 23, 2, 29, ['fatia', 20]],
  ['queijo_coalho', 'Queijo coalho', 330, 22, 2, 25, ['fatia', 40]],
  ['queijo_parmesao', 'Queijo parmesão ralado', 431, 38, 4, 29, ['colher de sopa', 6]],
  ['queijo_cottage', 'Queijo cottage', 98, 11, 3.4, 4.3, ['colher de sopa', 25]],
  ['cream_cheese', 'Cream cheese', 342, 6, 4, 34, ['colher de sopa', 20]],
  ['ricota', 'Ricota', 140, 12.6, 3.8, 8.1, ['fatia', 30]],
  ['ovo_frito', 'Ovo frito', 240, 15.6, 1.2, 18.6, ['ovo', 50]],
  ['ovo_mexido', 'Ovo mexido', 190, 13, 1.5, 14, ['ovo', 55]],
  ['omelete', 'Omelete simples', 154, 11, 1, 12, ['ovo', 55]],
  // Meat and fish extra
  ['linguica', 'Linguiça de frango grelhada', 220, 18, 2, 15, ['unidade', 70]],
  ['salsicha', 'Salsicha cozida', 196, 10, 3, 16, ['unidade', 50]],
  ['hamburguer', 'Hambúrguer bovino grelhado', 250, 24, 2, 16, ['unidade', 90]],
  ['file_mignon', 'Filé mignon grelhado', 220, 32, 0, 9.5],
  ['acem', 'Acém cozido', 215, 27, 0, 11],
  ['porco_lombo', 'Lombo de porco assado', 210, 30, 0, 9.5],
  ['sardinha', 'Sardinha em lata', 208, 24.6, 0, 11.5, ['unidade', 30]],
  ['camarao', 'Camarão cozido', 100, 21, 1, 1.5],
  ['figado_bovino', 'Fígado bovino grelhado', 157, 29, 4, 3.5],
  // Dairy / drinks (ml)
  ['leite_zero_lactose', 'Leite zero lactose', 45, 3, 4.5, 1.5, ['copo', 200]],
  ['leite_vegetal_soja', 'Bebida de soja', 40, 3, 2.5, 2, ['copo', 200]],
  ['leite_amendoas', 'Bebida de amêndoas', 24, 0.6, 2.5, 1.1, ['copo', 200]],
  ['leite_condensado', 'Leite condensado', 313, 7.7, 54.4, 6.7, ['colher de sopa', 20]],
  ['creme_leite', 'Creme de leite', 221, 1.5, 3, 22, ['colher de sopa', 15]],
  ['iogurte_proteico', 'Iogurte proteico', 60, 10, 4, 0.5, ['pote', 170]],
  ['iogurte_desnatado', 'Iogurte desnatado', 42, 4.3, 5.8, 0.2, ['pote', 170]],
  ['cafe_sem_acucar', 'Café sem açúcar', 2, 0.1, 0.3, 0, ['xícara', 50]],
  ['cafe_com_leite', 'Café com leite', 38, 2, 3.5, 1.7, ['xícara', 150]],
  ['suco_laranja', 'Suco de laranja natural', 45, 0.7, 10.4, 0.2, ['copo', 200]],
  ['suco_uva', 'Suco de uva integral', 60, 0.4, 15, 0, ['copo', 200]],
  ['refrigerante', 'Refrigerante', 42, 0, 10.5, 0, ['lata', 350]],
  ['refrigerante_zero', 'Refrigerante zero', 1, 0, 0.2, 0, ['lata', 350]],
  ['cerveja', 'Cerveja', 43, 0.4, 3.6, 0, ['lata', 350]],
  ['agua_coco', 'Água de coco', 22, 0.2, 5.3, 0, ['copo', 200]],
  ['isotonico', 'Isotônico', 24, 0, 6, 0, ['garrafa', 500]],
  // Grains/cooked
  ['arroz_parboilizado', 'Arroz parboilizado cozido', 123, 2.7, 26.5, 0.3],
  ['macarrao_integral', 'Macarrão integral cozido', 124, 5.3, 26, 0.5],
  ['quinoa', 'Quinoa cozida', 120, 4.4, 21.3, 1.9],
  ['grao_de_bico', 'Grão-de-bico cozido', 164, 8.9, 27.4, 2.6],
  ['ervilha', 'Ervilha cozida', 84, 5.4, 15.6, 0.2],
  ['milho', 'Milho cozido', 96, 3.4, 21, 1.5],
  ['inhame', 'Inhame cozido', 97, 2, 23, 0.1],
  ['farofa', 'Farofa', 406, 2.2, 73, 12, ['colher de sopa', 20]],
  ['pure_batata', 'Purê de batata', 83, 2, 14, 2.5],
  ['pizza', 'Pizza muçarela', 266, 11, 33, 10, ['fatia', 110]],
  ['coxinha', 'Coxinha frita', 270, 9, 28, 13, ['unidade', 90]],
  ['pastel', 'Pastel de carne frito', 310, 8, 30, 18, ['unidade', 80]],
  // Fruit extra
  ['uva', 'Uva', 53, 0.7, 13.6, 0.2, ['cacho', 100]],
  ['melancia', 'Melancia', 33, 0.9, 8.1, 0, ['fatia', 200]],
  ['melao', 'Melão', 29, 0.7, 7.5, 0, ['fatia', 150]],
  ['abacaxi', 'Abacaxi', 48, 0.9, 12.3, 0.1, ['fatia', 75]],
  ['manga', 'Manga', 64, 0.4, 16.7, 0.3, ['unidade', 200]],
  ['pera', 'Pera', 53, 0.6, 14, 0.1, ['unidade', 150]],
  ['kiwi', 'Kiwi', 51, 1.3, 11.5, 0.6, ['unidade', 70]],
  ['mexerica', 'Mexerica / tangerina', 38, 0.8, 9.6, 0.1, ['unidade', 120]],
  ['banana_nanica', 'Banana nanica', 92, 1.4, 23.8, 0.1, ['banana', 100]],
  ['mirtilo', 'Mirtilo', 57, 0.7, 14.5, 0.3],
  ['tamara', 'Tâmara', 282, 2.5, 75, 0.4, ['unidade', 8]],
  ['passas', 'Uva-passa', 299, 3, 79, 0.5, ['colher de sopa', 10]],
  // Veg extra
  ['pepino', 'Pepino', 15, 0.7, 3.6, 0.1],
  ['couve', 'Couve refogada', 90, 2.9, 8.7, 5.5, ['colher de sopa', 20]],
  ['espinafre', 'Espinafre cozido', 23, 2.9, 3.6, 0.4],
  ['beterraba', 'Beterraba cozida', 44, 1.7, 10, 0.2],
  ['chuchu', 'Chuchu cozido', 19, 0.4, 4.8, 0],
  ['vagem', 'Vagem cozida', 25, 1.8, 5, 0.2],
  ['couve_flor', 'Couve-flor cozida', 23, 1.9, 4.5, 0.3],
  ['cebola', 'Cebola', 39, 1.7, 8.9, 0.1],
  ['champignon', 'Cogumelo champignon', 22, 3.1, 3.3, 0.3],
  // Snacks, sweets, supplements
  ['chocolate_70', 'Chocolate 70% cacau', 570, 8, 33, 42, ['quadrado', 10]],
  ['chocolate_leite', 'Chocolate ao leite', 540, 7.5, 58, 30, ['quadrado', 10]],
  ['brigadeiro', 'Brigadeiro', 400, 4.5, 60, 16, ['unidade', 20]],
  ['sorvete', 'Sorvete de creme', 207, 3.5, 24, 11, ['bola', 60]],
  ['barra_proteina', 'Barra de proteína', 380, 33, 35, 12, ['unidade', 60]],
  ['barra_cereal', 'Barra de cereal', 390, 5, 70, 10, ['unidade', 22]],
  ['albumina', 'Albumina', 370, 80, 5, 1, ['scoop', 30]],
  ['creatina', 'Creatina', 0, 0, 0, 0, ['colher de chá', 5]],
  ['hipercalorico', 'Hipercalórico', 380, 15, 75, 3, ['scoop', 60]],
  ['chia', 'Chia', 486, 17, 42, 31, ['colher de sopa', 12]],
  ['linhaca', 'Linhaça', 495, 14, 43, 32, ['colher de sopa', 10]],
  ['coco_ralado', 'Coco ralado', 600, 6, 14, 60, ['colher de sopa', 8]],
  ['nozes', 'Nozes', 654, 15, 14, 65, ['unidade', 5]],
  ['amendoas', 'Amêndoas', 579, 21, 22, 50, ['unidade', 1.2]],
  ['castanha_caju', 'Castanha de caju', 553, 18, 30, 44, ['unidade', 2]],
  ['geleia', 'Geleia de frutas', 250, 0.3, 62, 0, ['colher de sopa', 20]],
  ['doce_leite', 'Doce de leite', 306, 5.5, 59, 7, ['colher de sopa', 20]],
  ['maionese', 'Maionese', 302, 1, 5, 31, ['colher de sopa', 15]],
  ['ketchup', 'Ketchup', 100, 1.2, 25, 0.1, ['colher de sopa', 17]],
  ['oleo', 'Óleo de soja', 884, 0, 0, 100, ['colher de sopa', 13]],
  ['margarina', 'Margarina', 596, 0.1, 0.7, 66, ['colher de chá', 5]],
];

const LIQUID_IDS = new Set([
  'leite_integral', 'leite_desnatado', 'leite_zero_lactose', 'leite_vegetal_soja', 'leite_amendoas',
  'creme_leite', 'cafe_sem_acucar', 'cafe_com_leite', 'suco_laranja', 'suco_uva', 'refrigerante',
  'refrigerante_zero', 'cerveja', 'agua_coco', 'isotonico', 'azeite', 'oleo',
]);

export const STARTER_FOODS: Food[] = ROWS.map(([id, name, calories, proteinG, carbsG, fatG, unit]) => ({
  id,
  name,
  calories,
  proteinG,
  carbsG,
  fatG,
  unit: unit ? { label: unit[0], grams: unit[1] } : undefined,
  base: LIQUID_IDS.has(id) ? ('ml' as const) : undefined,
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

const PLURALS: Record<string, string> = {
  pão: 'pães',
  'colher de sopa': 'colheres de sopa',
  'colher de chá': 'colheres de chá',
  bola: 'bolas',
};

/** "fatia" + 2 → "fatias". */
export function pluralUnit(label: string, qty: number): string {
  if (qty <= 1) return label;
  return PLURALS[label] ?? `${label}s`;
}

/** Name plus amount, e.g. "Pão integral (2 fatias)" or "Arroz branco cozido (150g)". */
export function formatFoodTitle(food: Food, grams: number, unitQty?: number): string {
  if (unitQty && food.unit) {
    return `${food.name} (${Number(unitQty.toFixed(2))} ${pluralUnit(food.unit.label, unitQty)})`;
  }
  return `${food.name} (${Math.round(grams)}${food.base ?? 'g'})`;
}

/** Lowercase, accent-free text for searching. */
export function foldText(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
