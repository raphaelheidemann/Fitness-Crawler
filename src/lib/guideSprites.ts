/** "Guia" mascot poses: src/assets/guide/guide_<pose>.png (transparent; made by scripts/key-guide.ts from magenta-background art). */
const files = import.meta.glob('/src/assets/guide/guide_*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export type GuidePose = 'idle' | 'cheer' | 'thumbs' | 'flex' | 'eat' | 'sleep' | 'wave' | 'point' | 'read' | 'think' | 'mini' | 'icon';

export function guidePose(pose: GuidePose): string {
  return files[`/src/assets/guide/guide_${pose}.png`] ?? '';
}
