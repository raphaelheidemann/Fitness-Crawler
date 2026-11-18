import { Recipe, RecipeCategory } from '../types';
import { getStarterFood, macrosForGrams } from './foodDb';

type Item = [foodId: string | null, grams: number, label: string];

interface RecipeDef {
  id: string;
  title: string;
  category: RecipeCategory;
  prepMinutes: number;
  servings: number;
  items: Item[];
  steps: string[];
}

const DEFS: RecipeDef[] = [
  {
    id: 'rec_starter_panqueca',
    title: 'Panqueca simples',
    category: 'breakfast',
    prepMinutes: 15,
    servings: 2,
    items: [
      ['farinha_trigo', 100, '100g de farinha de trigo (1 xícara)'],
      ['leite_integral', 200, '200ml de leite (1 copo)'],
      ['ovo', 100, '2 ovos'],
      [null, 0, '1 pitada de sal'],
    ],
    steps: [
      'Bata tudo no liquidificador ou misture com um garfo até ficar liso.',
      'Aqueça uma frigideira antiaderente e unte com um fio de óleo.',
      'Coloque uma concha de massa e espalhe. Vire quando soltar do fundo.',
      'Rende cerca de 6 panquecas. Recheie com fruta, queijo ou iogurte.',
    ],
  },
  {
    id: 'rec_starter_mingau_aveia',
    title: 'Mingau de aveia com leite',
    category: 'breakfast',
    prepMinutes: 7,
    servings: 1,
    items: [
      ['aveia', 40, '40g de aveia em flocos (4 colheres de sopa)'],
      ['leite_integral', 250, '250ml de leite'],
      ['banana', 80, '1 banana em rodelas'],
      [null, 0, 'Canela a gosto'],
    ],
    steps: [
      'Misture a aveia e o leite numa panela pequena.',
      'Cozinhe em fogo baixo mexendo por 4 a 5 minutos, até engrossar.',
      'Sirva com a banana e canela por cima.',
    ],
  },
  {
    id: 'rec_starter_crepioca_banana',
    title: 'Crepioca com banana',
    category: 'breakfast',
    prepMinutes: 8,
    servings: 1,
    items: [
      ['ovo', 50, '1 ovo'],
      ['tapioca', 30, '30g de goma de tapioca (2 colheres de sopa)'],
      ['banana', 80, '1 banana em rodelas'],
      [null, 0, 'Canela a gosto'],
    ],
    steps: [
      'Misture o ovo e a goma de tapioca com um garfo.',
      'Despeje numa frigideira antiaderente quente e espalhe.',
      'Quando firmar, vire, coloque a banana e dobre ao meio.',
      'Finalize com canela.',
    ],
  },
  {
    id: 'rec_starter_ovos_mexidos',
    title: 'Ovos mexidos com tomate e pão',
    category: 'breakfast',
    prepMinutes: 8,
    servings: 1,
    items: [
      ['ovo', 100, '2 ovos'],
      ['tomate', 50, '1/2 tomate picado'],
      ['pao_integral', 50, '2 fatias de pão integral'],
      ['azeite', 5, '1 fio de azeite'],
    ],
    steps: [
      'Aqueça o azeite e refogue o tomate por 1 minuto.',
      'Junte os ovos batidos com sal e mexa até firmar.',
      'Sirva com o pão torrado.',
    ],
  },
  {
    id: 'rec_starter_bolo_cenoura',
    title: 'Bolo de cenoura simples',
    category: 'snack',
    prepMinutes: 50,
    servings: 10,
    items: [
      ['cenoura', 240, '3 cenouras médias picadas'],
      ['ovo', 150, '3 ovos'],
      ['azeite', 65, '1/2 xícara de óleo ou azeite'],
      ['acucar', 160, '1 xícara de açúcar'],
      ['farinha_trigo', 240, '2 xícaras de farinha de trigo'],
      [null, 0, '1 colher de sopa de fermento em pó'],
    ],
    steps: [
      'Bata no liquidificador a cenoura, os ovos e o óleo até ficar liso.',
      'Numa tigela, misture o açúcar e a farinha. Junte o líquido e mexa.',
      'Adicione o fermento e mexa de leve.',
      'Asse em forma untada a 180°C por 35 a 40 minutos.',
      'Cada porção é 1/10 do bolo (sem cobertura).',
    ],
  },
  {
    id: 'rec_starter_vitamina',
    title: 'Vitamina de banana com aveia',
    category: 'snack',
    prepMinutes: 5,
    servings: 1,
    items: [
      ['banana', 80, '1 banana'],
      ['leite_integral', 250, '250ml de leite'],
      ['aveia', 20, '20g de aveia (2 colheres de sopa)'],
      ['mel', 10, '1 colher de chá de mel (opcional)'],
    ],
    steps: ['Bata tudo no liquidificador por 1 minuto.', 'Sirva gelado.'],
  },
  {
    id: 'rec_starter_iogurte_granola',
    title: 'Iogurte com granola e fruta',
    category: 'snack',
    prepMinutes: 3,
    servings: 1,
    items: [
      ['iogurte_natural', 170, '1 pote de iogurte natural'],
      ['granola', 30, '30g de granola'],
      ['morango', 80, '80g de morangos ou outra fruta'],
    ],
    steps: ['Coloque o iogurte num copo ou tigela.', 'Cubra com a fruta e a granola.'],
  },
  {
    id: 'rec_starter_tapioca_queijo',
    title: 'Tapioca com queijo',
    category: 'snack',
    prepMinutes: 5,
    servings: 1,
    items: [
      ['tapioca', 50, '50g de goma de tapioca (3 colheres de sopa)'],
      ['queijo_minas', 40, '40g de queijo minas frescal'],
    ],
    steps: [
      'Espalhe a goma numa frigideira antiaderente quente, sem óleo.',
      'Quando virar uma massa firme, vire e coloque o queijo.',
      'Dobre ao meio e sirva.',
    ],
  },
  {
    id: 'rec_starter_arroz_feijao_frango',
    title: 'Prato básico: arroz, feijão e frango grelhado',
    category: 'lunch',
    prepMinutes: 25,
    servings: 1,
    items: [
      ['arroz_branco', 100, '100g de arroz cozido'],
      ['feijao_carioca', 80, '80g de feijão cozido (1 concha)'],
      ['frango_peito', 150, '150g de filé de frango grelhado'],
      ['alface', 40, 'Salada de folhas à vontade'],
      ['tomate', 50, '1/2 tomate'],
    ],
    steps: [
      'Tempere o frango com sal, alho e limão. Grelhe 5 a 6 minutos de cada lado.',
      'Monte o prato com arroz, feijão, frango e salada.',
      'Dica: cozinhe arroz e feijão para a semana toda e guarde em potes.',
    ],
  },
  {
    id: 'rec_starter_carne_moida_macarrao',
    title: 'Macarrão com carne moída',
    category: 'lunch',
    prepMinutes: 25,
    servings: 1,
    items: [
      ['macarrao', 200, '200g de macarrão cozido'],
      ['carne_moida', 120, '120g de carne moída refogada'],
      ['tomate', 150, 'Molho: 1,5 tomate picado'],
    ],
    steps: [
      'Cozinhe o macarrão conforme a embalagem.',
      'Refogue a carne moída com alho e cebola. Junte o tomate e deixe apurar.',
      'Misture ao macarrão e sirva.',
    ],
  },
  {
    id: 'rec_starter_pure_frango',
    title: 'Frango desfiado com purê de batata-doce',
    category: 'dinner',
    prepMinutes: 25,
    servings: 1,
    items: [
      ['frango_peito_cozido', 150, '150g de frango cozido e desfiado'],
      ['batata_doce', 200, '200g de batata-doce cozida e amassada'],
      ['brocolis', 80, '80g de brócolis cozido'],
    ],
    steps: [
      'Cozinhe a batata-doce até ficar macia e amasse com um garfo e sal.',
      'Aqueça o frango desfiado com temperos.',
      'Sirva com o brócolis cozido no vapor.',
    ],
  },
  {
    id: 'rec_starter_omelete',
    title: 'Omelete de queijo e tomate',
    category: 'dinner',
    prepMinutes: 10,
    servings: 1,
    items: [
      ['ovo', 150, '3 ovos'],
      ['queijo_mucarela', 40, '2 fatias de queijo muçarela'],
      ['tomate', 50, '1/2 tomate picado'],
      ['azeite', 5, '1 fio de azeite'],
    ],
    steps: [
      'Bata os ovos com sal.',
      'Aqueça o azeite numa frigideira e despeje os ovos.',
      'Quando firmar, coloque o queijo e o tomate, dobre e tampe 1 minuto.',
    ],
  },
  {
    id: 'rec_starter_atum_salada',
    title: 'Salada de atum com arroz',
    category: 'dinner',
    prepMinutes: 10,
    servings: 1,
    items: [
      ['atum', 120, '1 lata de atum natural (120g)'],
      ['arroz_branco', 100, '100g de arroz cozido'],
      ['alface', 40, 'Folhas de alface'],
      ['tomate', 100, '1 tomate picado'],
      ['azeite', 5, '1 fio de azeite'],
    ],
    steps: [
      'Escorra o atum e misture com o tomate e o azeite.',
      'Sirva sobre a alface, com o arroz ao lado.',
    ],
  },
  {
    id: 'rec_starter_panqueca_banana',
    title: 'Panqueca de banana (2 ingredientes)',
    category: 'breakfast',
    prepMinutes: 10,
    servings: 1,
    items: [
      ['banana', 120, '1 banana grande madura'],
      ['ovo', 100, '2 ovos'],
      [null, 0, 'Canela a gosto'],
    ],
    steps: [
      'Amasse a banana com um garfo e misture com os ovos batidos.',
      'Cozinhe em colheradas numa frigideira antiaderente em fogo baixo.',
      'Vire quando dourar embaixo. Sirva com canela.',
    ],
  },
];

export function buildStarterRecipes(): Omit<Recipe, 'ownerId' | 'createdAt' | 'updatedAt'>[] {
  return DEFS.map((def) => {
    const total = def.items.reduce(
      (acc, [foodId, grams]) => {
        if (!foodId) return acc;
        const m = macrosForGrams(getStarterFood(foodId), grams);
        return {
          calories: acc.calories + m.calories,
          proteinG: acc.proteinG + m.proteinG,
          carbsG: acc.carbsG + m.carbsG,
          fatG: acc.fatG + m.fatG,
        };
      },
      { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
    );
    return {
      id: def.id,
      title: def.title,
      category: def.category,
      prepMinutes: def.prepMinutes,
      servings: def.servings,
      calories: Math.round(total.calories / def.servings),
      proteinG: Number((total.proteinG / def.servings).toFixed(1)),
      carbsG: Number((total.carbsG / def.servings).toFixed(1)),
      fatG: Number((total.fatG / def.servings).toFixed(1)),
      imageUrl: '',
      ingredients: def.items.map(([, , label]) => label),
      instructions: def.steps,
      isFavorite: false,
    };
  });
}
