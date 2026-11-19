import React from 'react';
import { useT } from '../lib/i18n';
import {
  BUILD_NAMES,
  CrawlerLook,
  EYE_COLOR_NAMES,
  EYE_COLORS,
  HAIR_COLOR_NAMES,
  HAIR_COLORS,
  HAIR_STYLES,
  HEIGHT_NAMES,
  SKIN_TONE_NAMES,
  SKIN_TONES,
} from '../lib/crawlerLook';
import { STYLE_OPTIONS } from './IdentityFields';

interface Props {
  look: CrawlerLook;
  onChange: (next: CrawlerLook) => void;
}

const chip = (active: boolean) =>
  `min-h-[38px] px-3 text-xs font-semibold rounded-lg border transition-colors ${
    active
      ? 'bg-amber-400 text-slate-950 border-amber-400'
      : 'bg-[#1a2332] text-slate-200 border-[#2d3c54] hover:bg-[#233044]'
  }`;

export const AppearanceEditor: React.FC<Props> = ({ look, onChange }) => {
  const t = useT();
  const set = (patch: Partial<CrawlerLook>) => onChange({ ...look, ...patch });

  const chips = (
    label: string,
    names: readonly string[],
    value: number,
    key: keyof CrawlerLook
  ) => (
    <div>
      <p className="text-xs font-medium text-slate-300 mb-1.5">{t(label)}</p>
      <div className="flex flex-wrap gap-1.5">
        {names.map((n, i) => (
          <button
            key={n}
            type="button"
            aria-pressed={value === i}
            onClick={() => set({ [key]: i } as Partial<CrawlerLook>)}
            className={chip(value === i)}
          >
            {t(n)}
          </button>
        ))}
      </div>
    </div>
  );

  const swatches = (
    label: string,
    colors: string[],
    names: string[],
    value: number,
    key: keyof CrawlerLook
  ) => (
    <div>
      <p className="text-xs font-medium text-slate-300 mb-1.5">{t(label)}</p>
      <div className="flex flex-wrap gap-2">
        {colors.map((c, i) => (
          <button
            key={c}
            type="button"
            aria-label={t(names[i])}
            aria-pressed={value === i}
            title={t(names[i])}
            onClick={() => set({ [key]: i } as Partial<CrawlerLook>)}
            style={{ backgroundColor: c }}
            className={`w-9 h-9 rounded-lg border-2 ${
              value === i ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-[#2d3c54]'
            }`}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="rounded-xl border border-[#26344a] bg-[#0f151e] p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-white">{t('Appearance')}</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          {t('Customize your crawler. The sprite that best matches your choices is shown.')}
        </p>
      </div>

      <div>
        <p className="text-xs font-medium text-slate-300 mb-1.5">{t('Crawler character')}</p>
        <div className="flex flex-wrap gap-1.5">
          {STYLE_OPTIONS.map((o) => (
            <button
              key={o.key}
              type="button"
              aria-pressed={look.style === o.key}
              onClick={() => set({ style: o.key })}
              className={chip(look.style === o.key)}
            >
              {t(o.label)}
            </button>
          ))}
        </div>
      </div>

      {chips('Hair style', HAIR_STYLES, look.hair, 'hair')}
      {swatches('Hair color', HAIR_COLORS, HAIR_COLOR_NAMES, look.hairColor, 'hairColor')}
      {swatches('Eye color', EYE_COLORS, EYE_COLOR_NAMES, look.eyes, 'eyes')}
      {swatches('Skin tone', SKIN_TONES, SKIN_TONE_NAMES, look.skin, 'skin')}
      {chips('Build', BUILD_NAMES, look.build, 'build')}
      {chips('Height', HEIGHT_NAMES, look.height, 'height')}
    </div>
  );
};
