import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronRight, Search, X } from 'lucide-react';
import { useT } from '../lib/i18n';
import { foldText } from '../lib/foodDb';
import { guidePose, GuidePose } from '../lib/guideSprites';
import { GUIDE_FAQ, GuideActionType, GuideFaqItem, isContextualFaqTab } from '../lib/guideFaq';
import { PoseSprite, usePrefersReducedMotion } from './PoseSprite';

const CHEERS = ['Nice one!', 'Fuel acquired!', 'Level up your plate!', 'Stats rising!'];
const INTRO_DISMISSED_KEY = 'fc_guide_intro_dismissed';

export type GuideHostTab = 'overview' | 'gym' | 'diet' | 'measurements';

interface Props {
  activeTab: GuideHostTab;
  /** bump this number to make the Guia celebrate */
  cheer: number;
  onAction?: (type: GuideActionType) => void;
}

function readIntroDismissed(): boolean {
  try {
    return window.localStorage.getItem(INTRO_DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

function persistIntroDismissed(): void {
  try {
    window.localStorage.setItem(INTRO_DISMISSED_KEY, '1');
  } catch {
    // storage unavailable or blocked; dismissal still holds for current session
  }
}

/** Interactive Guia mascot in the corner: contextual FAQ sheet/popover, intro hint on Home, cheers on Diet. */
export const GuideCorner: React.FC<Props> = ({ activeTab, cheer, onAction }) => {
  const t = useT();
  const reducedMotion = usePrefersReducedMotion();

  const [mode, setMode] = useState<'idle' | 'cheer' | 'thumbs'>('idle');
  const [introDismissed, setIntroDismissed] = useState<boolean>(() => readIntroDismissed());
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const wasOpenRef = useRef(false);

  // Celebrate briefly whenever cheer increments (e.g. checking off a meal in Diet)
  useEffect(() => {
    if (cheer === 0) return;
    setMode('cheer');
    const id = window.setTimeout(() => setMode((m) => (m === 'cheer' ? 'idle' : m)), 1800);
    return () => window.clearTimeout(id);
  }, [cheer]);

  // Brief thumbs-up cooldown after finishing reading an answer
  useEffect(() => {
    if (mode !== 'thumbs' || open) return;
    const id = window.setTimeout(() => setMode((m) => (m === 'thumbs' ? 'idle' : m)), 1800);
    return () => window.clearTimeout(id);
  }, [mode, open]);

  // Focus management: focus search input when opening, restore focus to trigger on close
  useEffect(() => {
    if (open) {
      wasOpenRef.current = true;
      const id = window.setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        } else {
          dialogRef.current?.focus();
        }
      }, 20);
      return () => window.clearTimeout(id);
    }
    if (wasOpenRef.current) {
      wasOpenRef.current = false;
      triggerRef.current?.focus();
    }
  }, [open]);

  // Dialog Escape + Focus Trap
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (selectedId) {
          setMode('thumbs');
        }
        setOpen(false);
        return;
      }

      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusables = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first || !dialogRef.current.contains(document.activeElement)) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last || !dialogRef.current.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, selectedId]);

  const selectedItem = useMemo(
    () => (selectedId ? GUIDE_FAQ.find((item) => item.id === selectedId) ?? null : null),
    [selectedId]
  );

  const { contextualItems, otherItems } = useMemo(() => {
    const q = foldText(query.trim());
    const matches = (item: GuideFaqItem) => {
      if (!q) return true;
      const haystack = foldText(
        `${t(item.question)} ${item.steps.map((s) => t(s)).join(' ')}`
      );
      return haystack.includes(q);
    };

    const filtered = GUIDE_FAQ.filter(matches);
    return {
      contextualItems: filtered.filter((it) => isContextualFaqTab(it.tab, activeTab)),
      otherItems: filtered.filter((it) => !isContextualFaqTab(it.tab, activeTab)),
    };
  }, [query, activeTab, t]);

  const handleOpenPanel = () => {
    setQuery('');
    setSelectedId(null);
    setOpen(true);
  };

  const handleClosePanel = () => {
    if (selectedId) {
      setMode('thumbs');
    }
    setOpen(false);
  };

  const handleBackToList = () => {
    setSelectedId(null);
    setMode('thumbs');
    window.setTimeout(() => searchInputRef.current?.focus(), 20);
  };

  const handleSelectQuestion = (id: string) => {
    setSelectedId(id);
    setMode('thumbs');
  };

  const handleDismissIntro = (e: React.MouseEvent) => {
    e.stopPropagation();
    persistIntroDismissed();
    setIntroDismissed(true);
  };

  const handleRunAction = (actionType: GuideActionType) => {
    setMode('thumbs');
    setOpen(false);
    onAction?.(actionType);
  };

  // Pose selection: wave when opening FAQ, thumbs when reading/finishing an answer, cheer on cheer, idle otherwise
  const cornerFrames = useMemo<string[]>(() => {
    if (open) {
      const openPose: GuidePose = selectedItem ? 'thumbs' : 'wave';
      return [guidePose(openPose)];
    }
    if (mode === 'cheer') {
      return [guidePose('thumbs'), guidePose('cheer')];
    }
    if (mode === 'thumbs') {
      return [guidePose('thumbs')];
    }
    return [guidePose('idle')];
  }, [open, selectedItem, mode]);

  const panelPose: GuidePose = selectedItem ? 'thumbs' : 'wave';
  const showIntroBanner = activeTab === 'overview' && !introDismissed && !open && mode !== 'cheer';
  const showCheerBubble = mode === 'cheer' && !open;

  const transitionCls = reducedMotion ? 'transition-none' : 'transition-colors duration-150';

  return (
    <>
      {/* Corner Mascot Dock (pointer-events-none wrapper so surrounding viewport stays clickable) */}
      <div className="pointer-events-none fixed right-2.5 bottom-[64px] lg:bottom-5 z-30 flex items-end justify-end gap-2">
        {showCheerBubble && (
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-none mb-1.5 max-w-[calc(100vw-5.5rem)] sm:max-w-[220px] bg-[#0b1017]/95 border border-amber-400/70 rounded-xl px-2.5 py-1.5 shadow-lg"
          >
            <span className="font-pixel text-[10px] leading-tight text-amber-300 block">
              {t(CHEERS[cheer % CHEERS.length])}
            </span>
          </div>
        )}

        {showIntroBanner && (
          <div className="pointer-events-auto mb-1 flex items-center gap-1 max-w-[calc(100vw-5.5rem)] sm:max-w-[270px] bg-[#0b1017]/95 border border-[#33445e] rounded-xl pl-3 pr-1 py-1 shadow-xl">
            <button
              type="button"
              onClick={handleOpenPanel}
              className={`min-h-[44px] py-1 text-left text-xs leading-snug text-slate-100 hover:text-amber-300 ${transitionCls}`}
            >
              {t('Interactive guide that helps you use the app. Tap me!')}
            </button>
            <button
              type="button"
              onClick={handleDismissIntro}
              aria-label={t('Dismiss guide hint')}
              className={`min-h-[44px] min-w-[44px] shrink-0 inline-flex items-center justify-center text-slate-400 hover:text-white rounded-lg ${transitionCls}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <button
          ref={triggerRef}
          type="button"
          onClick={() => (open ? handleClosePanel() : handleOpenPanel())}
          aria-label={t('Open interactive guide')}
          aria-expanded={open}
          aria-haspopup="dialog"
          className={`pointer-events-auto min-w-[48px] min-h-[48px] w-12 h-14 sm:w-16 sm:h-[72px] shrink-0 rounded-xl bg-[#0d121a]/90 border border-[#2d3c54] hover:border-amber-400/80 shadow-lg flex items-center justify-center p-1 cursor-pointer ${transitionCls}`}
        >
          <PoseSprite
            frames={cornerFrames}
            fps={mode === 'cheer' ? 4 : 2}
            alt=""
            className="w-full h-full object-contain pixel-art drop-shadow-[0_2px_0_rgba(0,0,0,0.6)]"
          />
        </button>
      </div>

      {/* Interactive FAQ Panel: bottom sheet on mobile, floating popover on desktop */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div
            aria-hidden="true"
            onClick={handleClosePanel}
            className="fixed inset-0 bg-black/60 sm:bg-black/35"
          />

          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="guide-faq-title"
            tabIndex={-1}
            className="fixed inset-x-0 bottom-0 sm:inset-x-auto sm:right-5 sm:bottom-24 w-full sm:w-[400px] max-h-[82vh] sm:max-h-[75vh] bg-[#131a24] border-t-2 border-x-2 sm:border-2 border-[#33445e] rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Mobile sheet handle */}
            <div className="sm:hidden pt-2 pb-0.5 flex justify-center bg-[#0f151e]">
              <span className="w-10 h-1 rounded-full bg-[#33445e]" aria-hidden="true" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[#0f151e] border-b border-[#253247]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-11 h-11 rounded-lg bg-[#131a24] border border-[#2d3c54] flex items-center justify-center p-1 shrink-0">
                  <PoseSprite
                    frames={[guidePose(panelPose)]}
                    alt=""
                    className="w-full h-full object-contain pixel-art"
                  />
                </div>
                <div className="min-w-0">
                  <h2 id="guide-faq-title" className="text-sm sm:text-base font-bold text-white truncate">
                    {t('How can I help?')}
                  </h2>
                  <p className="text-[11px] text-slate-400 truncate">
                    {t('Tap a question for step-by-step help')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClosePanel}
                aria-label={t('Close guide')}
                className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#1a2332] rounded-lg shrink-0 ${transitionCls}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            {!selectedItem ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('Search questions...')}
                    aria-label={t('Search questions...')}
                    className="w-full min-h-[44px] pl-9 pr-11 py-2 text-sm text-white placeholder:text-slate-400 bg-[#0e141d] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery('');
                        searchInputRef.current?.focus();
                      }}
                      aria-label={t('Clear search')}
                      className="min-h-[44px] min-w-[44px] absolute right-0 top-1/2 -translate-y-1/2 inline-flex items-center justify-center text-slate-400 hover:text-white rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {contextualItems.length === 0 && otherItems.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">
                    {t('No matching questions found. Try another word.')}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {contextualItems.length > 0 && (
                      <section className="space-y-2">
                        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-amber-400 px-1">
                          {t('On this screen')}
                        </h3>
                        <ul className="space-y-1.5">
                          {contextualItems.map((item) => (
                            <li key={item.id}>
                              <button
                                type="button"
                                onClick={() => handleSelectQuestion(item.id)}
                                className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#0e141d] border border-[#263347] hover:border-emerald-400/70 hover:bg-[#161f2d] text-left flex items-center justify-between gap-2 text-xs sm:text-sm font-medium text-slate-100 ${transitionCls}`}
                              >
                                <span>{t(item.question)}</span>
                                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {otherItems.length > 0 && (
                      <section className="space-y-2">
                        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 px-1">
                          {t('Other questions')}
                        </h3>
                        <ul className="space-y-1.5">
                          {otherItems.map((item) => (
                            <li key={item.id}>
                              <button
                                type="button"
                                onClick={() => handleSelectQuestion(item.id)}
                                className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#0e141d] border border-[#263347] hover:border-amber-400/60 hover:bg-[#161f2d] text-left flex items-center justify-between gap-2 text-xs sm:text-sm font-medium text-slate-200 ${transitionCls}`}
                              >
                                <span>{t(item.question)}</span>
                                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                  {t(selectedItem.question)}
                </h3>

                <ol className="space-y-2.5">
                  {selectedItem.steps.slice(0, 5).map((step, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-lg bg-[#0e141d] border border-[#253247]"
                    >
                      <span className="w-6 h-6 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                        {idx + 1}
                      </span>
                      <span className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                        {t(step)}
                      </span>
                    </li>
                  ))}
                </ol>

                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <button
                    type="button"
                    onClick={handleBackToList}
                    className={`min-h-[44px] flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-200 bg-[#1a2332] border border-[#2d3c54] hover:bg-[#233044] rounded-lg ${transitionCls}`}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    {t('Back to questions')}
                  </button>

                  {selectedItem.action && (
                    <button
                      type="button"
                      onClick={() => handleRunAction(selectedItem.action!.type)}
                      className={`min-h-[44px] flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg ${transitionCls}`}
                    >
                      {t(selectedItem.action.label)}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
