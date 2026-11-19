import { CrawlerLook } from './crawlerLook';
import { pickCrawlerSprite } from './crawlerSprites';

/**
 * Animation frames live in src/assets/crawlers/poses as
 *   {m|f|n}_t{1-4}_{pose}_{frame}.jpg   e.g. f_t1_walk_3.jpg
 * Poses: crossed (idle), chef, thumbs, walk, fist, victory.
 */
export type PoseName = 'crossed' | 'chef' | 'thumbs' | 'walk' | 'fist' | 'victory';

const FILES = import.meta.glob('/src/assets/crawlers/poses/*.{png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const NAME = /\/([mfn]_t[1-4])_([a-z]+)_(\d+)\.\w+$/;
const STYLE_CODE = { masculine: 'm', feminine: 'f', neutral: 'n' } as const;

const FRAMES = new Map<string, string[]>();
Object.entries(FILES)
  .flatMap(([path, url]) => {
    const m = NAME.exec(path);
    return m ? [{ key: `${m[1]}_${m[2]}`, n: Number(m[3]), url }] : [];
  })
  .sort((a, b) => a.n - b.n)
  .forEach(({ key, url }) => FRAMES.set(key, [...(FRAMES.get(key) ?? []), url]));

/** Frames in order, or the still sprite when this style/tier has no poses yet (e.g. neutral). */
export function poseFrames(tier: number, look: CrawlerLook, pose: PoseName): string[] {
  const found = FRAMES.get(`${STYLE_CODE[look.style]}_t${tier}_${pose}`);
  if (found?.length) return found;
  const still = pickCrawlerSprite(tier, look);
  return still ? [still] : [];
}
