import React from 'react';
import { Check, Minus, Plus } from 'lucide-react';
import { useT } from '../lib/i18n';

interface Props {
  value: number;
  onChange: (value: number) => void;
  onClose: () => void;
}

const clampRpe = (v: number) => Math.min(10, Math.max(0, Math.round(v * 2) / 2));

export const RpePicker: React.FC<Props> = ({ value, onChange, onClose }) => {
  const t = useT();
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('Select RPE')}
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-[#1b212b] border-t border-[#33445e] p-3 flex gap-3"
      >
        <div className="flex-1 bg-[#262d38] rounded-2xl p-4 text-center">
          <p className="text-5xl font-bold font-mono tabular-nums text-slate-300">{value}</p>
          <p className="mt-2 text-base font-semibold text-white">{t('Select RPE')}</p>
          <p className="text-xs text-slate-400">{t('Slide or tap to rate your effort')}</p>
          <input
            type="range"
            min={0}
            max={10}
            step={0.5}
            value={value}
            onChange={(e) => onChange(clampRpe(Number(e.target.value)))}
            aria-label={t('RPE')}
            className="w-full mt-4 accent-emerald-400"
          />
          <div className="flex justify-between text-[11px] text-slate-400 font-mono px-1">
            {[0, 2, 4, 6, 8, 10].map((n) => (
              <span key={n}>{n}</span>
            ))}
          </div>
        </div>
        <div className="w-20 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => onChange(clampRpe(value + 0.5))}
            aria-label="+0.5"
            className="flex-1 flex items-center justify-center bg-[#262d38] rounded-2xl text-white"
          >
            <Plus className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={() => onChange(clampRpe(value - 0.5))}
            aria-label="-0.5"
            className="flex-1 flex items-center justify-center bg-[#262d38] rounded-2xl text-white"
          >
            <Minus className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('Done')}
            className="flex-1 flex items-center justify-center bg-emerald-500 rounded-2xl text-white"
          >
            <Check className="w-7 h-7" />
          </button>
        </div>
      </div>
    </div>
  );
};
