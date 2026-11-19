import React, { useEffect, useState } from 'react';
import { useT } from '../lib/i18n';
import { guidePose } from '../lib/guideSprites';
import { PoseSprite } from './PoseSprite';

const CHEERS = ['Nice one!', 'Fuel acquired!', 'Level up your plate!', 'Stats rising!'];

interface Props {
  /** bump this number to make the Guia celebrate */
  cheer: number;
}

/** The Guia mascot in the corner: waves hello, then celebrates each time a meal is checked. */
export const GuideCorner: React.FC<Props> = ({ cheer }) => {
  const t = useT();
  const [mode, setMode] = useState<'wave' | 'idle' | 'cheer'>('wave');

  useEffect(() => {
    const id = window.setTimeout(() => setMode((m) => (m === 'wave' ? 'idle' : m)), 2400);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (cheer === 0) return;
    setMode('cheer');
    const id = window.setTimeout(() => setMode('idle'), 1800);
    return () => window.clearTimeout(id);
  }, [cheer]);

  const frames =
    mode === 'cheer'
      ? [guidePose('thumbs'), guidePose('cheer')]
      : mode === 'wave'
        ? [guidePose('idle'), guidePose('wave')]
        : [guidePose('idle')];

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed right-2 bottom-[72px] lg:bottom-4 z-20 flex flex-col items-end gap-1"
    >
      {mode === 'cheer' && (
        <span className="font-pixel text-[10px] text-amber-300 bg-[#0b1017] border border-[#263347] rounded px-2 py-1">
          {t(CHEERS[cheer % CHEERS.length])}
        </span>
      )}
      <div className="w-[96px] h-[110px]">
        <PoseSprite
          frames={frames}
          fps={mode === 'cheer' ? 4 : 2}
          alt=""
          className="w-full h-full object-contain drop-shadow-[0_2px_0_rgba(0,0,0,0.6)]"
        />
      </div>
    </div>
  );
};
