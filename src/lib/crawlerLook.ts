import { CrawlerStyle } from '../types';

export const HAIR_STYLES = ['Short', 'Spiky', 'Long', 'Ponytail', 'Buzz cut', 'Mohawk'] as const;
export const HAIR_COLORS = ['#1c1917', '#4a2c17', '#7a4a24', '#d9b45a', '#b3441f', '#cfd3da', '#3b82f6', '#ec4899'];
export const HAIR_COLOR_NAMES = ['Black', 'Dark brown', 'Brown', 'Blonde', 'Red', 'Silver', 'Blue', 'Pink'];
export const EYE_COLORS = ['#4a2c17', '#3b82f6', '#16a34a', '#a16207', '#94a3b8', '#f59e0b', '#a855f7'];
export const EYE_COLOR_NAMES = ['Brown', 'Blue', 'Green', 'Hazel', 'Gray', 'Amber', 'Violet'];
export const SKIN_TONES = ['#ffdfc4', '#f1c27d', '#d9a066', '#b9794a', '#8d5524', '#5c3a1e'];
export const SKIN_TONE_NAMES = ['Fair', 'Light', 'Tan', 'Brown', 'Dark', 'Deep'];
export const BUILD_NAMES = ['Slim', 'Average', 'Muscular'];
export const HEIGHT_NAMES = ['Short', 'Average', 'Tall'];

export interface CrawlerLook {
  style: CrawlerStyle;
  hair: number;
  hairColor: number;
  eyes: number;
  skin: number;
  build: number;
  height: number;
  /** true = draw the customizable pixel avatar instead of the tier portrait art */
  useAvatar: boolean;
}

export const DEFAULT_LOOK: CrawlerLook = {
  style: 'neutral',
  hair: 0,
  hairColor: 1,
  eyes: 0,
  skin: 1,
  build: 1,
  height: 1,
  useAvatar: false,
};

const STYLE_CODE: Record<CrawlerStyle, string> = { masculine: 'm', feminine: 'f', neutral: 'n' };

/** Stored as one short string ("f.2.3.1.2.1.1.0") so it fits a single Firestore field. */
export function parseLook(raw: string | undefined, fallbackStyle: CrawlerStyle = 'neutral'): CrawlerLook {
  const base: CrawlerLook = {
    ...DEFAULT_LOOK,
    style: fallbackStyle,
    hair: fallbackStyle === 'feminine' ? 2 : 0,
  };
  if (!raw) return base;
  const p = raw.split('.');
  if (p.length < 8) return base;
  const num = (i: number, max: number, def: number) => {
    const v = parseInt(p[i], 10);
    return Number.isInteger(v) && v >= 0 && v < max ? v : def;
  };
  return {
    style: p[0] === 'm' ? 'masculine' : p[0] === 'f' ? 'feminine' : 'neutral',
    hair: num(1, HAIR_STYLES.length, 0),
    hairColor: num(2, HAIR_COLORS.length, 1),
    eyes: num(3, EYE_COLORS.length, 0),
    skin: num(4, SKIN_TONES.length, 1),
    build: num(5, 3, 1),
    height: num(6, 3, 1),
    useAvatar: p[7] === '1',
  };
}

export function encodeLook(l: CrawlerLook): string {
  return [
    STYLE_CODE[l.style],
    l.hair,
    l.hairColor,
    l.eyes,
    l.skin,
    l.build,
    l.height,
    l.useAvatar ? 1 : 0,
  ].join('.');
}

export function sanitizeLook(raw: unknown): string {
  return typeof raw === 'string' && raw ? encodeLook(parseLook(raw)) : '';
}
