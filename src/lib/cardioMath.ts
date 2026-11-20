/** Pace/speed helpers for run & walk logs. Distance in km or mi; pace per that unit. */

/** minutes per unit -> "5:20" */
export function formatPace(minPerUnit: number): string {
  if (!isFinite(minPerUnit) || minPerUnit <= 0) return '';
  let m = Math.floor(minPerUnit);
  let s = Math.round((minPerUnit - m) * 60);
  if (s === 60) {
    m += 1;
    s = 0;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** "5:20", "5:20 /km", "5,5" -> minutes per unit (0 if unreadable) */
export function parsePace(text: string): number {
  const m = /^\s*(\d{1,2})(?:[:.,](\d{1,2}))?/.exec(text);
  if (!m) return 0;
  const min = Number(m[1]);
  const sec = m[2] === undefined ? 0 : m[2].length === 1 && /[.,]/.test(text) ? Number(m[2]) * 6 : Number(m[2]);
  return sec < 60 ? min + sec / 60 : 0;
}

export const paceFor = (distance: number, minutes: number) =>
  distance > 0 && minutes > 0 ? minutes / distance : 0;

export const speedFor = (distance: number, minutes: number) =>
  distance > 0 && minutes > 0 ? distance / (minutes / 60) : 0;
