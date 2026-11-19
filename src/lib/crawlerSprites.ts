import { CrawlerLook } from './crawlerLook';
import { CRAWLER_SPRITES } from './crawlerEngine';

/**
 * Drop generated sprites in src/assets/crawlers named
 *   {m|f|n}_t{1-4}[_h{hair}][_c{hairColor}][_s{skin}][_e{eyes}].{png|jpg|webp}
 * e.g. f_t1.png (base), f_t1_c3.png (blonde), f_t2_h2_c3_s4.png.
 * Indexes match the option lists in crawlerLook.ts. Attributes missing from a
 * filename act as wildcards, so a base file works for every look.
 */
const FILES = import.meta.glob('/src/assets/crawlers/*.{png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

interface Entry {
  url: string;
  style: string;
  tier: number;
  attrs: Partial<Record<'h' | 'c' | 's' | 'e', number>>;
}

const NAME = /\/([mfn])_t([1-4])((?:_[hcse]\d+)*)\.\w+$/;

const ENTRIES: Entry[] = Object.entries(FILES).flatMap(([path, url]) => {
  const m = NAME.exec(path);
  if (!m) return [];
  const attrs: Entry['attrs'] = {};
  m[3].split('_').filter(Boolean).forEach((tok) => {
    attrs[tok[0] as 'h' | 'c' | 's' | 'e'] = Number(tok.slice(1));
  });
  return [{ url, style: m[1], tier: Number(m[2]), attrs }];
});

const STYLE_CODE = { masculine: 'm', feminine: 'f', neutral: 'n' } as const;

/** Best generated sprite for this look, or the original masculine art when none exists. */
export function pickCrawlerSprite(tier: number, look: CrawlerLook): string | undefined {
  const want = {
    h: look.hair,
    c: look.hairColor,
    s: look.skin,
    e: look.eyes,
  };
  let best: Entry | null = null;
  let bestScore = -Infinity;
  for (const e of ENTRIES) {
    if (e.tier !== tier || e.style !== STYLE_CODE[look.style]) continue;
    let score = 0;
    (Object.keys(e.attrs) as (keyof typeof want)[]).forEach((k) => {
      score += e.attrs[k] === want[k] ? 10 : -10;
    });
    if (score > bestScore) {
      best = e;
      bestScore = score;
    }
  }
  return best?.url ?? (CRAWLER_SPRITES as Record<number, string>)[tier];
}
