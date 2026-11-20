import { Food, foldText } from './foodDb';

/** Free-text meal parsing: "Pão integral, 2 fatias, presunto 1 fatia, 200 ml leite". */

export interface ParsedItem {
  name: string;
  qty: number | null;
  /** g/ml = explicit weight or volume; count = fatia/unidade/colher...; null = no unit word */
  kind: 'g' | 'ml' | 'count' | null;
}

const NUM = String.raw`(\d+(?:[.,]\d+)?)`;
const MEASURE = String.raw`(kg|gramas?|gr|g|litros?|ml|l)`;
const COUNT = String.raw`(fatias?|unidades?|und|un|colher(?:es)?(?: de (?:sopa|ch[aá]|sobremesa))?|scoops?|copos?|potes?|latas?|x[ií]caras?|bolas?|quadrados?|garrafas?|cachos?)`;

const LEAD = new RegExp(`^${NUM}\\s*(?:${MEASURE}|${COUNT})?(?![\\p{L}])\\s*(?:de\\s+)?(.*)$`, 'iu');
const TRAIL = new RegExp(`^(.*?)[\\s:=-]+${NUM}\\s*(?:${MEASURE}|${COUNT})?\\s*$`, 'iu');

const toNum = (s: string) => Number(s.replace(',', '.'));

function measure(qty: number, m: string): { qty: number; kind: 'g' | 'ml' } {
  const u = m.toLowerCase();
  if (u === 'kg') return { qty: qty * 1000, kind: 'g' };
  if (u.startsWith('l')) return { qty: qty * 1000, kind: 'ml' }; // l / litro(s)
  if (u === 'ml') return { qty, kind: 'ml' };
  return { qty, kind: 'g' };
}

function parseToken(raw: string): { name: string; qty: number | null; kind: ParsedItem['kind'] } | null {
  const tok = raw.trim().replace(/^(?:[-•*]\s+|\d+[.)]\s+)/, '').trim();
  if (!tok) return null;
  let m = LEAD.exec(tok);
  if (m) {
    const [, n, meas, count, rest] = m;
    const q = toNum(n);
    if (meas) return { ...measure(q, meas), name: rest.trim() };
    return { name: rest.trim(), qty: q, kind: count ? 'count' : null };
  }
  m = TRAIL.exec(tok);
  if (m) {
    const [, name, n, meas, count] = m;
    const q = toNum(n);
    if (meas) return { ...measure(q, meas), name: name.trim() };
    return { name: name.trim(), qty: q, kind: count ? 'count' : null };
  }
  return { name: tok, qty: null, kind: null };
}

/**
 * Splits on newline, ";", "+" and commas (not decimal commas). A piece holding only a
 * quantity ("2 fatias") attaches to the previous name; so "Pão integral, 2 fatias" is one item.
 */
export function parseMealText(text: string): ParsedItem[] {
  const out: ParsedItem[] = [];
  for (const piece of text.split(/[\n;+]|,(?!\d)/)) {
    const p = parseToken(piece);
    if (!p) continue;
    const last = out[out.length - 1];
    if (!p.name) {
      if (last && last.qty === null && p.qty !== null) {
        last.qty = p.qty;
        last.kind = p.kind;
      }
      continue;
    }
    out.push({ name: p.name, qty: p.qty, kind: p.kind });
  }
  return out;
}

function stem(w: string): string {
  if (w === 'paes') return 'pao';
  if (w === 'ovos') return 'ovo';
  return w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w;
}

const STOP = new Set(['de', 'da', 'do', 'com', 'e', 'em']);

function tokens(s: string): string[] {
  return foldText(s)
    .split(/[^a-z0-9]+/)
    .filter((w) => w && !STOP.has(w))
    .map(stem);
}

/** Best foods for a typed name, best first. `exact` = every typed word was found in the name. */
export function matchFoods(
  name: string,
  foods: Food[],
  limit = 6
): { foods: Food[]; exact: boolean } {
  const q = tokens(name);
  if (q.length === 0) return { foods: [], exact: false };
  const scored: { food: Food; score: number; all: boolean }[] = [];
  foods.forEach((food, i) => {
    const ft = tokens(food.name);
    const hits = q.filter((w) => ft.some((x) => x === w || x.startsWith(w) || w.startsWith(x))).length;
    if (hits === 0) return;
    const all = hits === q.length;
    let score = hits * 100 - (ft.length - hits) * 1 - i * 0.01;
    if (all) score += 1000;
    if (ft[0] === q[0]) score += 40;
    if (food.custom) score += 20;
    scored.push({ food, score, all });
  });
  scored.sort((a, b) => b.score - a.score);
  return { foods: scored.slice(0, limit).map((s) => s.food), exact: scored[0]?.all ?? false };
}

export interface ResolvedRow {
  key: string;
  typed: string;
  candidates: Food[];
  foodId: string | null;
  qty: number;
  /** "base" = g/ml, "unit" = the food's own unit (fatia, ovo...) */
  unit: 'base' | 'unit';
}

export function resolveItem(item: ParsedItem, foods: Food[], key: string): ResolvedRow {
  const { foods: candidates, exact } = matchFoods(item.name, foods);
  const food = exact ? candidates[0] : undefined;
  let unit: ResolvedRow['unit'] = 'base';
  let qty = item.qty ?? 100;
  if (food && (item.kind === 'count' || item.kind === null) && food.unit) {
    unit = 'unit';
    qty = item.qty ?? 1;
  }
  return { key, typed: item.name, candidates, foodId: food?.id ?? null, qty, unit };
}

export function rowGrams(row: ResolvedRow, food: Food): number {
  return row.unit === 'unit' && food.unit ? row.qty * food.unit.grams : row.qty;
}
