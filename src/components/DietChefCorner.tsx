import React, { useEffect, useMemo, useState } from 'react';
import { CrawlerState, CrawlerStyle } from '../types';
import { parseLook } from '../lib/crawlerLook';
import { poseFrames } from '../lib/crawlerPoses';
import { PoseSprite } from './PoseSprite';

interface Props {
  crawler?: CrawlerState;
  fallbackStyle?: CrawlerStyle;
  /** bump this number to make the crawler give a thumbs up */
  cheer: number;
}

/** Chef-hat crawler in the corner; gives a thumbs up each time a meal is checked. */
export const DietChefCorner: React.FC<Props> = ({ crawler, fallbackStyle, cheer }) => {
  const [cheering, setCheering] = useState(false);
  const tier = crawler?.equippedSpriteTier ?? 1;
  const look = useMemo(() => parseLook(crawler?.look, fallbackStyle), [crawler?.look, fallbackStyle]);

  useEffect(() => {
    if (cheer === 0) return;
    setCheering(true);
    const id = window.setTimeout(() => setCheering(false), 1800);
    return () => window.clearTimeout(id);
  }, [cheer]);

  const frames = useMemo(
    () => poseFrames(tier, look, cheering ? 'thumbs' : 'chef'),
    [tier, look, cheering]
  );

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed right-2 bottom-[72px] lg:bottom-4 z-20 w-[88px] h-[88px] rounded-lg border border-[#263347] bg-[#0b1017] overflow-hidden shadow-lg"
    >
      <PoseSprite
        frames={frames}
        fps={cheering ? 4 : 2}
        alt=""
        className="w-full h-full object-contain pixel-art"
      />
    </div>
  );
};
