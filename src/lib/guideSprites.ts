/** "Guia" mascot poses: src/assets/guide/guide_<pose>.png (see scripts/slice-guide.ts). */
const files = import.meta.glob('/src/assets/guide/guide_*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export type GuidePose = 'idle' | 'cheer' | 'thumbs' | 'flex' | 'eat' | 'sleep' | 'wave' | 'point' | 'mini' | 'icon';

export function guidePose(pose: GuidePose): string {
  return files[`/src/assets/guide/guide_${pose}.png`] ?? '';
}
