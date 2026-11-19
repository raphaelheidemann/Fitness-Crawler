import React from 'react';
import { Utensils } from 'lucide-react';
import { foodIconUrl } from '../lib/foodIcons';

/** Pixel-art icon for a food (id or title), with a utensils fallback. */
export const FoodIcon: React.FC<{ food: string; className?: string }> = ({ food, className = 'w-9 h-9' }) => {
  const url = foodIconUrl(food);
  return url ? (
    <img
      src={url}
      alt=""
      aria-hidden="true"
      className={`${className} shrink-0`}
      style={{ imageRendering: 'pixelated' }}
    />
  ) : (
    <Utensils className={`${className} p-2 text-slate-500 shrink-0`} aria-hidden="true" />
  );
};
