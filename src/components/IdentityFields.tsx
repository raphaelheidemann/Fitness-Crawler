import React from 'react';
import { CrawlerStyle, Sex } from '../types';
import { useT } from '../lib/i18n';

interface Props {
  sex: Sex;
  crawlerStyle?: CrawlerStyle;
  onSexChange: (sex: Sex) => void;
  onStyleChange?: (style: CrawlerStyle) => void;
}

const SEX_OPTIONS: { key: Sex; label: string }[] = [
  { key: 'male', label: 'Male' },
  { key: 'female', label: 'Female' },
  { key: 'unspecified', label: 'Prefer not to say' },
];

// 'neutral' (Non-binary) is kept in CrawlerStyle for backwards compatibility and hidden from the UI while its sprites are reworked.
export const STYLE_OPTIONS: { key: CrawlerStyle; label: string }[] = [
  { key: 'masculine', label: 'Masculine' },
  { key: 'feminine', label: 'Feminine' },
];

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { key: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  const t = useT();
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`grid gap-1.5 ${options.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}
    >
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          role="radio"
          aria-checked={value === o.key}
          onClick={() => onChange(o.key)}
          className={`min-h-[42px] px-2 text-xs font-semibold rounded-lg border transition-colors ${
            value === o.key
              ? 'bg-emerald-400 text-slate-950 border-emerald-400'
              : 'bg-[#1a2332] text-slate-200 border-[#2d3c54] hover:bg-[#233044]'
          }`}
        >
          {t(o.label)}
        </button>
      ))}
    </div>
  );
}

export const IdentityFields: React.FC<Props> = ({ sex, crawlerStyle, onSexChange, onStyleChange }) => {
  const t = useT();
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">{t('Sex (used for metabolic rate)')}</label>
        <Segmented value={sex} options={SEX_OPTIONS} onChange={onSexChange} label={t('Sex (used for metabolic rate)')} />
        {sex === 'unspecified' && (
          <p className="mt-1 text-[11px] text-slate-400">
            {t('We will use an average of the male and female formulas.')}
          </p>
        )}
      </div>
      {crawlerStyle && onStyleChange && (
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">{t('Crawler character')}</label>
          <Segmented value={crawlerStyle} options={STYLE_OPTIONS} onChange={onStyleChange} label={t('Crawler character')} />
        </div>
      )}
    </div>
  );
};
