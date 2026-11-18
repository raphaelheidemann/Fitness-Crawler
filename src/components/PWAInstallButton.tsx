import React, { useState } from 'react';
import { useT } from '../lib/i18n';
import { Download, PlusSquare, Share, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const t = useT();
  const { canPrompt, isIos, isInstalled, promptInstall } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = () => {
    if (canPrompt) {
      void promptInstall();
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="w-full min-h-[42px] flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-500/40 rounded-lg transition-colors whitespace-nowrap"
      >
        {canPrompt ? <Download className="w-3.5 h-3.5 shrink-0" /> : <Smartphone className="w-3.5 h-3.5 shrink-0" />}
        {canPrompt ? t('Install Phone App') : isIos ? t('Add to iPhone Home') : t('Install on Phone')}
      </button>

      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 sm:p-4">
          <div className="w-full sm:max-w-md bg-[#131a24] border-2 border-[#33445e] rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 bg-[#0f151e] border-b border-[#253247]">
              <div>
                <h2 className="text-base font-semibold text-white">{t('Install Fitness Crawler on Phone')}</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t('Runs full-screen like a native app with private Google sign-in')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                aria-label={t('Close install instructions')}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-200 leading-relaxed">
              <div className="p-3.5 bg-[#0e141d] border border-[#263347] rounded-lg space-y-2">
                <p className="font-semibold text-white">{t('iPhone / iPad (Safari)')}</p>
                <ol className="space-y-1.5 list-decimal list-inside">
                  <li>{t('Open the app URL directly in Safari (outside an embedded preview).')}</li>
                  <li className="inline-flex items-center gap-1 flex-wrap">
                    {t('Tap the')} <Share className="w-3.5 h-3.5 text-emerald-400 inline" /> {t('Share button at the bottom of Safari.')}
                  </li>
                  <li className="inline-flex items-center gap-1 flex-wrap">
                    {t('Select')} <PlusSquare className="w-3.5 h-3.5 text-emerald-400 inline" />{' '}
                    <strong>{t('Add to Home Screen')}</strong>, {t('then tap')} <strong>{t('Add')}</strong>.
                  </li>
                </ol>
              </div>

              <div className="p-3.5 bg-[#0e141d] border border-[#263347] rounded-lg space-y-2">
                <p className="font-semibold text-white">{t('Android (Chrome)')}</p>
                <ol className="space-y-1.5 list-decimal list-inside">
                  <li>{t('Open the shared/direct app URL in Chrome (outside an embedded preview).')}</li>
                  <li>
                    {t('Tap the')} <strong>{t('Install Phone App')}</strong> {t('button when available, or open Chrome’s menu (⋮) →')}{' '}
                    <strong>{t('Add to home screen')}</strong> → <strong>{t('Install')}</strong>{' '}
                    {t('(not “Create shortcut”).')}
                  </li>
                  <li>
                    {t('If an older')} <strong>Cadence</strong> {t('app is still on your home screen, uninstall it first so the new')}{' '}
                    <strong>Fitness Crawler</strong> {t('icon installs cleanly.')}
                  </li>
                </ol>
              </div>

              <p className="text-[11px] text-slate-400">
                {t('Your workouts, meals, hydration, and measurements stay tied exclusively to your signed-in Google account in Firestore.')}
              </p>

              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-full min-h-[44px] px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg"
              >
                {t('Got it')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
