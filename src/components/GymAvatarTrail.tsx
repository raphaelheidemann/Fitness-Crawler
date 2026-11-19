import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Flag } from 'lucide-react';
import { CrawlerState, CrawlerStyle } from '../types';
import { parseLook } from '../lib/crawlerLook';
import { PoseName, poseFrames } from '../lib/crawlerPoses';
import { PoseSprite, usePrefersReducedMotion } from './PoseSprite';
import { useT } from '../lib/i18n';

interface Props {
  crawler?: CrawlerState;
  fallbackStyle?: CrawlerStyle;
  doneSets: number;
  totalSets: number;
}

type Mode = 'idle' | 'fist' | 'walk';

const POSE: Record<Mode | 'victory', { pose: PoseName; fps: number }> = {
  idle: { pose: 'crossed', fps: 2 },
  fist: { pose: 'fist', fps: 4 },
  walk: { pose: 'walk', fps: 6 },
  victory: { pose: 'victory', fps: 3 },
};

const AVATAR = 72;

/** The crawler waits with crossed arms and walks along a trail as sets get checked off. */
export const GymAvatarTrail: React.FC<Props> = ({ crawler, fallbackStyle, doneSets, totalSets }) => {
  const t = useT();
  const reduced = usePrefersReducedMotion();
  const [mode, setMode] = useState<Mode>('idle');
  const prevDone = useRef(doneSets);
  const progress = totalSets > 0 ? Math.min(1, doneSets / totalSets) : 0;

  useEffect(() => {
    if (doneSets === prevDone.current) return;
    const up = doneSets > prevDone.current;
    prevDone.current = doneSets;
    const timers: number[] = [];
    setMode(up ? 'fist' : 'walk');
    if (up) timers.push(window.setTimeout(() => setMode('walk'), 700));
    timers.push(window.setTimeout(() => setMode('idle'), up ? 2000 : 1300));
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [doneSets]);

  const finished = totalSets > 0 && doneSets >= totalSets && mode === 'idle';
  const shown = finished ? 'victory' : mode;
  const tier = crawler?.equippedSpriteTier ?? 1;
  const look = useMemo(() => parseLook(crawler?.look, fallbackStyle), [crawler?.look, fallbackStyle]);
  const frames = useMemo(() => poseFrames(tier, look, POSE[shown].pose), [tier, look, shown]);

  return (
    <div
      role="img"
      aria-label={t('Workout progress: {done} of {total} sets', { done: doneSets, total: totalSets })}
      className="relative h-[84px] rounded-xl border border-[#263347] bg-[#0b1017] overflow-hidden"
    >
      <div className="absolute left-3 right-12 bottom-[14px] h-[3px] border-t-2 border-dashed border-[#2d3c54]" />
      <div
        className="absolute left-3 bottom-[14px] h-[3px] bg-emerald-500/80"
        style={{
          width: `calc((100% - 3.75rem) * ${progress})`,
          transition: reduced ? 'none' : 'width 1.2s steps(8)',
        }}
      />
      <Flag className="absolute right-3 bottom-[10px] w-5 h-5 text-amber-400" aria-hidden="true" />
      <div
        className="absolute bottom-[6px]"
        style={{
          width: AVATAR,
          height: AVATAR,
          left: `calc(0.5rem + (100% - ${AVATAR}px - 3.5rem) * ${progress})`,
          transition: reduced ? 'none' : 'left 1.2s steps(8)',
        }}
      >
        <PoseSprite
          frames={frames}
          fps={POSE[shown].fps}
          alt=""
          className="w-full h-full object-contain pixel-art"
        />
      </div>
      <span className="absolute right-3 top-2 font-mono text-[11px] tabular-nums text-slate-400">
        {doneSets}/{totalSets}
      </span>
    </div>
  );
};
