import React from 'react';
import { CrawlerStyle } from '../types';
import { CrawlerLook, parseLook } from '../lib/crawlerLook';
import { pickCrawlerSprite } from '../lib/crawlerSprites';

// Height and build are applied as a gentle scale so they work on any sprite.
const HEIGHT_SCALE = [0.92, 1, 1.06];
const BUILD_SCALE = [0.92, 1, 1.1];

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

/** Shows the generated sprite that best matches the crawler's look. */
export const CrawlerSprite: React.FC<SpriteProps> = ({
  tier,
  look,
  fallbackStyle,
  alt,
  className,
  lookOverride,
}) => {
  const l = lookOverride ?? parseLook(look, fallbackStyle);
  return (
    <img
      src={pickCrawlerSprite(tier, l)}
      alt={alt}
      referrerPolicy="no-referrer"
      className={className}
      style={{
        transform: `scale(${BUILD_SCALE[l.build]}, ${HEIGHT_SCALE[l.height]})`,
        transformOrigin: '50% 100%',
      }}
    />
  );
};
