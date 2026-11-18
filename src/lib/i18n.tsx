import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { PT } from './pt';

export type Lang = 'pt' | 'en';

type Vars = Record<string, string | number>;
type TFn = (text: string, vars?: Vars) => string;

const STORAGE_KEY = 'fc_lang';

function readStoredLang(): Lang {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'pt';
  } catch {
    return 'pt';
  }
}

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: TFn;
}

const I18nContext = createContext<Ctx>({ lang: 'pt', setLang: () => {}, t: (s) => s });

/**
 * Strings in the code are written in English and act as keys.
 * In Portuguese (the default) they are looked up in PT; a missing key falls back to English.
 * Use {name} placeholders for values.
 */
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(readStoredLang);

  useEffect(() => {
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // storage can be blocked; the choice then lasts for this session only
    }
  }, []);

  const t = useCallback<TFn>(
    (text, vars) => {
      const base = lang === 'pt' ? (PT[text] ?? text) : text;
      if (!vars) return base;
      return base.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);
export const useT = () => useContext(I18nContext).t;

export const LanguageToggle: React.FC = () => {
  const { lang, setLang } = useI18n();
  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex items-center p-0.5 bg-[#131a24] border border-[#263347] rounded-lg shrink-0"
    >
      {(['pt', 'en'] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`min-h-[34px] px-2.5 text-xs font-semibold rounded-md transition-colors ${
            lang === l ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:text-white'
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
};
