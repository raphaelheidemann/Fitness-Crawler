import React, { useEffect, useState } from 'react';

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

export { usePrefersReducedMotion };

interface Props {
  frames: string[];
  /** low on purpose: this is 8-bit, 2 to 6 is right */
  fps?: number;
  alt: string;
  className?: string;
}

/** Flips through a few still frames at a low frame rate. Static when the device asks for reduced motion. */
export const PoseSprite: React.FC<Props> = ({ frames, fps = 3, alt, className }) => {
  const [i, setI] = useState(0);
  const reduced = usePrefersReducedMotion();
  const key = frames.join('|');

  useEffect(() => {
    setI(0);
    frames.forEach((u) => {
      const img = new Image();
      img.src = u; // warm the cache so frame swaps never flash
    });
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (frames.length < 2 || reduced) return;
    const id = window.setInterval(() => {
      if (!document.hidden) setI((n) => (n + 1) % frames.length);
    }, 1000 / fps);
    return () => window.clearInterval(id);
  }, [key, fps, reduced]); // eslint-disable-line react-hooks/exhaustive-deps

  if (frames.length === 0) return null;
  return (
    <img
      src={frames[i % frames.length]}
      alt={alt}
      draggable={false}
      referrerPolicy="no-referrer"
      className={className}
    />
  );
};
