import React, { useMemo } from 'react';
import { CrawlerStyle } from '../types';
import { crawlerSprite } from '../lib/crawlerEngine';
import {
  CrawlerLook,
  EYE_COLORS,
  HAIR_COLORS,
  parseLook,
  SKIN_TONES,
} from '../lib/crawlerLook';

interface Px {
  x: number;
  y: number;
  w: number;
  h: number;
  c: string;
  o?: number;
}

const TIER_ARMOR: Record<number, string> = { 1: '#6b4423', 2: '#64748b', 3: '#166534', 4: '#b45309' };
const TIER_TRIM: Record<number, string> = { 1: '#a16207', 2: '#cbd5e1', 3: '#4ade80', 4: '#fde047' };

/** Draws a 20x34 pixel-art crawler. Feet stay on the bottom row, so height shows as extra headroom. */
function buildAvatar(look: CrawlerLook, tier: number): Px[] {
  const P: Px[] = [];
  const add = (x: number, y: number, w: number, h: number, c: string, o?: number) =>
    P.push({ x, y, w, h, c, o });

  const H = 26 + 4 * look.height;
  const y0 = 34 - H;
  const tw = 6 + 2 * look.build;
  const tl = 10 - tw / 2;
  const torso = 9 + look.height;
  const ty = y0 + 9;
  const ly = ty + torso;
  const lw = tw / 2 - 1;
  const skin = SKIN_TONES[look.skin];
  const hair = HAIR_COLORS[look.hairColor];
  const eye = EYE_COLORS[look.eyes];
  const armor = TIER_ARMOR[tier] ?? TIER_ARMOR[1];
  const trim = TIER_TRIM[tier] ?? TIER_TRIM[1];
  const fem = look.style === 'feminine';
  const masc = look.style === 'masculine';

  // legs + boots
  add(tl, ly, lw, 34 - ly - 2, '#1e293b');
  add(tl + tw - lw, ly, lw, 34 - ly - 2, '#1e293b');
  add(tl - 1, 32, lw + 1, 2, '#0f172a');
  add(tl + tw - lw, 32, lw + 1, 2, '#0f172a');

  // torso
  for (let r = 0; r < torso; r++) {
    let w = tw;
    let x = tl;
    if (fem && r >= 3 && r < torso - 3) {
      w = tw - 2;
      x = tl + 1;
    }
    if (masc && r < 2) {
      w = tw + 2;
      x = tl - 1;
    }
    add(x, ty + r, w, 1, armor);
  }
  add(tl + 1, ty + torso - 2, tw - 2, 1, trim);
  if (tier >= 2) {
    add(tl - 1, ty, 2, 2, trim);
    add(tl + tw - 1, ty, 2, 2, trim);
  }
  if (tier >= 3) add(9, ty + 2, 2, 2, trim);
  if (tier >= 4) add(tl, ty, tw, 1, trim);

  // neck + arms
  add(9, y0 + 8, 2, 1, skin);
  const armLen = torso - 2;
  [tl - 2, tl + tw].forEach((x) => {
    add(x, ty + 1, 2, 3, armor);
    add(x, ty + 4, 2, armLen - 3, skin);
  });

  // weapon in right hand
  const wx = tl + tw + 2;
  add(wx, ty - 2, 1, 6, tier >= 2 ? '#cbd5e1' : '#7c4a1e');
  add(wx - 1, ty + 4, 3, 1, '#92400e');

  // head
  add(7, y0 + 1, 6, 7, skin);
  add(7, y0 + 7, 6, 1, '#000000', 0.12);
  add(8, y0 + 3, 1, 1, hair);
  add(11, y0 + 3, 1, 1, hair);
  add(8, y0 + 4, 1, 1, eye);
  add(11, y0 + 4, 1, 1, eye);
  add(9, y0 + 6, 2, 1, fem ? '#be123c' : '#7f1d1d', 0.75);

  // hair
  switch (look.hair) {
    case 1:
      [6, 8, 10, 12].forEach((x) => add(x, y0, 1, 1, hair));
      add(6, y0 + 1, 8, 2, hair);
      add(6, y0 + 3, 1, 1, hair);
      add(13, y0 + 3, 1, 1, hair);
      break;
    case 2:
      add(7, y0, 6, 1, hair);
      add(6, y0 + 1, 8, 2, hair);
      add(6, y0 + 3, 1, 8, hair);
      add(13, y0 + 3, 1, 8, hair);
      break;
    case 3:
      add(7, y0, 6, 1, hair);
      add(6, y0 + 1, 8, 2, hair);
      add(14, y0 + 2, 2, 1, hair);
      add(15, y0 + 3, 1, 5, hair);
      break;
    case 4:
      add(7, y0 + 1, 6, 1, hair);
      break;
    case 5:
      add(9, y0, 2, 3, hair);
      break;
    default:
      add(7, y0, 6, 1, hair);
      add(6, y0 + 1, 8, 2, hair);
      add(6, y0 + 3, 1, 1, hair);
      add(13, y0 + 3, 1, 1, hair);
  }
  return P;
}

export const CrawlerAvatar: React.FC<{
  look: CrawlerLook;
  tier: number;
  className?: string;
  title?: string;
}> = ({ look, tier, className, title }) => {
  const px = useMemo(() => buildAvatar(look, tier), [look, tier]);
  return (
    <svg
      viewBox="0 0 20 34"
      role="img"
      aria-label={title}
      shapeRendering="crispEdges"
      className={className}
      style={{ filter: 'drop-shadow(0 0 0.6px #000)' }}
    >
      {px.map((p, i) => (
        <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} fill={p.c} fillOpacity={p.o} />
      ))}
    </svg>
  );
};

interface SpriteProps {
  tier: number;
  /** Encoded look string from the crawler doc */
  look?: string;
  /** Style to use when no look is saved yet (profile choice) */
  fallbackStyle?: CrawlerStyle;
  alt: string;
  className?: string;
  /** Live preview in the editor: skips parsing */
  lookOverride?: CrawlerLook;
}

/** Shows the custom pixel avatar when enabled, otherwise the tier portrait for the chosen style. */
export const CrawlerSprite: React.FC<SpriteProps> = ({
  tier,
  look,
  fallbackStyle,
  alt,
  className,
  lookOverride,
}) => {
  const l = lookOverride ?? parseLook(look, fallbackStyle);
  if (l.useAvatar) {
    return <CrawlerAvatar look={l} tier={tier} className={className} title={alt} />;
  }
  return (
    <img
      src={crawlerSprite(tier, l.style)}
      alt={alt}
      referrerPolicy="no-referrer"
      className={className}
    />
  );
};
