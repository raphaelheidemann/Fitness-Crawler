import React from 'react';
import { CardioLog } from '../types';
import { formatPace, parsePace, paceFor, speedFor } from '../lib/cardioMath';
import { useT } from '../lib/i18n';

interface Props {
  cardio: CardioLog;
  setCardio: React.Dispatch<React.SetStateAction<CardioLog>>;
  unit: string;
}

const box =
  'w-full px-3 py-2 text-sm font-mono tabular-nums text-white bg-[#131a24] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400';
const lbl = 'block text-xs font-medium text-slate-300 mb-1';

/** Run: distance + time + pace (any two fill the third). Walk: distance + time only. */
export const CardioFields: React.FC<Props> = ({ cardio, setCardio, unit }) => {
  const t = useT();
  const run = cardio.activityType === 'run';
  const mins = Math.floor(cardio.durationMinutes);
  const secs = Math.round((cardio.durationMinutes - mins) * 60);
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const paceText = run ? cardio.paceOrIncline.replace(/\s*\/.*$/, '') : '';

  const setDistance = (distance: number) =>
    setCardio((c) => {
      const next = { ...c, distance };
      const p = c.activityType === 'run' ? parsePace(c.paceOrIncline) : 0;
      if (p > 0 && distance > 0) next.durationMinutes = round2(p * distance);
      else if (c.activityType === 'run' && distance > 0 && c.durationMinutes > 0)
        next.paceOrIncline = `${formatPace(paceFor(distance, c.durationMinutes))} /${unit}`;
      return next;
    });

  const setTime = (m: number, s: number) =>
    setCardio((c) => {
      const durationMinutes = round2(Math.max(0, m) + Math.min(59, Math.max(0, s)) / 60);
      const next = { ...c, durationMinutes };
      if (c.activityType === 'run') {
        const p = paceFor(c.distance, durationMinutes);
        next.paceOrIncline = p ? `${formatPace(p)} /${unit}` : '';
      }
      return next;
    });

  const setPace = (text: string) =>
    setCardio((c) => {
      const p = parsePace(text);
      const next = { ...c, paceOrIncline: text };
      if (p > 0 && c.distance > 0) next.durationMinutes = round2(p * c.distance);
      return next;
    });

  const speed = speedFor(cardio.distance, cardio.durationMinutes);
  const pace = paceFor(cardio.distance, cardio.durationMinutes);

  return (
    <div className="space-y-3 pt-1">
      <div className={`grid gap-3 ${run ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2'}`}>
        <div>
          <label className={lbl}>{t('Distance ({unit})', { unit })}</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min={0}
            max={500}
            value={cardio.distance}
            onChange={(e) => setDistance(Number(e.target.value))}
            className={box}
          />
        </div>

        <div>
          <label className={lbl}>{t('Time (min : sec)')}</label>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={600}
              aria-label={t('Minutes')}
              value={mins}
              onChange={(e) => setTime(Number(e.target.value), secs)}
              className={box}
            />
            <span className="text-slate-400">:</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={59}
              aria-label={t('Seconds')}
              value={secs}
              onChange={(e) => setTime(mins, Number(e.target.value))}
              className={box}
            />
          </div>
        </div>

        {run && (
          <div>
            <label className={lbl}>{t('Pace (min/{unit})', { unit })}</label>
            <input
              type="text"
              inputMode="decimal"
              maxLength={20}
              value={paceText}
              onChange={(e) => setPace(e.target.value)}
              placeholder="5:20"
              className={box}
            />
          </div>
        )}

        {run && (
          <div>
            <label className={lbl}>{t('Calories Burned')}</label>
            <input
              type="number"
              min={0}
              max={5000}
              value={cardio.caloriesBurned}
              onChange={(e) => setCardio((c) => ({ ...c, caloriesBurned: Number(e.target.value) }))}
              className={box}
            />
          </div>
        )}
      </div>

      {speed > 0 && (
        <p className="text-[11px] font-mono tabular-nums text-slate-400">
          {run
            ? t('Average speed: {v} {unit}/h', { v: speed.toFixed(1), unit })
            : t('Average speed: {v} {unit}/h · pace {p} /{unit}', {
                v: speed.toFixed(1),
                p: formatPace(pace),
                unit,
              })}
        </p>
      )}

      <label className="min-h-[42px] px-3 py-2 bg-[#131a24] border border-[#2d3c54] rounded-lg inline-flex items-center gap-2 text-xs font-medium text-slate-200 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={cardio.completed}
          onChange={(e) => setCardio((c) => ({ ...c, completed: e.target.checked }))}
          className="w-4 h-4 rounded border-[#394c69] bg-[#0e141d] text-emerald-400 focus:ring-emerald-400"
        />
        {run ? t('Run done') : t('Cardio Done')}
      </label>
    </div>
  );
};
