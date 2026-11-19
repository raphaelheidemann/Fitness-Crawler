/** 8-bit food icons (src/assets/foods/food_<name>.png, 32x32). Matched by food id, then by title text. */
const files = import.meta.glob('/src/assets/foods/food_*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const URLS: Record<string, string> = {};
for (const [path, url] of Object.entries(files)) {
  const name = path.match(/food_(.+)\.png$/)?.[1];
  if (name) URLS[name] = url;
}

// First match wins, so specific rules come before general ones.
const RULES: [RegExp, string][] = [
  [/ovo_frito|ovo_mexido|omelete|fried/, 'fried_egg'],
  [/^ovo|clara|egg/, 'egg'],
  [/pasta_amendoim|peanut/, 'peanut_butter_jar'],
  [/bolacha|biscoito|cookie/, 'cookie'],
  [/chocolate|brigadeiro|cacau/, 'chocolate_bar'],
  [/hamburguer|burger/, 'burger'],
  [/cafe|coffee/, 'coffee_cup'],
  [/^mel$|honey|geleia|doce_leite/, 'honey_jar'],
  [/pao_frances|pao_queijo|^pao$|francês|wrap|tapioca/, 'french_roll'],
  [/pao|torrada|bread/, 'bread_slice'],
  [/presunto|peru|mortadela|salame|bacon/, 'ham_slice'],
  [/queijo|ricota|cream_cheese|cheese/, 'cheese_slice'],
  [/iogurte|yogurt/, 'yogurt_cup'],
  [/suco|orange_juice/, 'orange_juice'],
  [/leite|creme_leite|milk/, 'milk_glass'],
  [/agua|isotonico|water/, 'water_bottle'],
  [/refrigerante|soda/, 'soda_can'],
  [/cerveja|beer/, 'beer'],
  [/banana/, 'banana'],
  [/maca\b|maca$|apple/, 'apple'],
  [/laranja|mexerica|orange/, 'orange'],
  [/morango|strawberry/, 'strawberry'],
  [/uva|grape/, 'grapes'],
  [/abacate|avocado/, 'avocado'],
  [/arroz|quinoa|rice/, 'rice_bowl'],
  [/feijao|lentilha|grao_de_bico|ervilha|beans/, 'beans_bowl'],
  [/frango|coxa|chicken|linguica|salsicha/, 'chicken_breast'],
  [/patinho|carne|alcatra|file_mignon|acem|porco|figado|steak/, 'steak'],
  [/tilapia|salmao|atum|sardinha|fish/, 'fish'],
  [/camarao|shrimp/, 'shrimp'],
  [/macarrao|pasta$|pasta_|strogonoff/, 'pasta'],
  [/batata_doce|mandioca|inhame|sweet_potato/, 'sweet_potato'],
  [/batata|potato|pure/, 'potato'],
  [/brocolis|couve_flor|broccoli/, 'broccoli'],
  [/cenoura|carrot/, 'carrot'],
  [/tomate|tomato/, 'tomato'],
  [/alface|couve|espinafre|pepino|lettuce/, 'lettuce'],
  [/aveia|granola|cuscuz|farofa|oats/, 'oats_bowl'],
  [/whey|albumina|creatina|hipercalorico/, 'whey_shaker'],
  [/barra|protein_bar/, 'protein_bar'],
  [/amendoim|castanha|nozes|amendoas|nuts|tamara/, 'nuts'],
  [/azeite|oleo|olive/, 'olive_oil_bottle'],
  [/sorvete|ice_cream/, 'ice_cream'],
  [/pizza/, 'pizza_slice'],
  [/bolo|cake/, 'cake_slice'],
  [/sopa|soup/, 'soup'],
  [/salada|salad/, 'salad_bowl'],
  [/coxinha|pastel|sanduiche|sandwich/, 'sandwich'],
];

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** URL of the icon for a food id or a free title like "Pão integral (2 fatias)"; undefined if none fits. */
export function foodIconUrl(idOrTitle: string): string | undefined {
  const key = fold(idOrTitle).replace(/\s*\(.*\)\s*$/, '').replace(/^\d{2}:\d{2} · /, '').replace(/\s+/g, '_');
  const hit = RULES.find(([re]) => re.test(key));
  return hit ? URLS[hit[1]] : undefined;
}
