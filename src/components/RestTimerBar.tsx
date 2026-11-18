import React from 'react';
import { useT } from '../lib/i18n';
import { Pause, Play, RotateCcw, Timer, Volume2, VolumeX, X } from 'lucide-react';

export function formatRestDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function playRestCompleteChime(): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate([180, 90, 180]);
    }
  } catch {
    // Ignore vibration permission errors
  }

  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const notes = [
      { freq: 659.25, start: 0, dur: 0.16 },
      { freq: 880, start: 0.18, dur: 0.28 },
    ];

    notes.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);
      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.22, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.02);
    });

    window.setTimeout(() => {
      void ctx.close().catch(() => {});
    }, 800);
  } catch {
    // Ignore Web Audio errors when audio context is blocked
  }
}

interface Props {
  exerciseName: string;
  targetSeconds: number;
  secondsLeft: number;
  isRunning: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onAdjust: (deltaSeconds: number) => void;
  onTogglePause: () => void;
  onReset: () => void;
  onSelectPreset: (seconds: number) => void;
  onDismiss: () => void;
}

const PRESETS = [60, 90, 120, 180] as const;

export const RestTimerBar: React.FC<Props> = ({
  exerciseName,
  targetSeconds,
  secondsLeft,
  isRunning,
  soundEnabled,
  onToggleSound,
  onAdjust,
  onTogglePause,
  onReset,
  onSelectPreset,
  onDismiss,
}) => {
  const t = useT();
  const isFinished = secondsLeft <= 0;
  const pct =
    targetSeconds > 0
      ? Math.min(100, Math.max(0, Math.round((secondsLeft / targetSeconds) * 100)))
      : 0;

  return (
    <div
      role="region"
      aria-label={t('Rest timer')}
      className="fixed bottom-16 lg:bottom-5 right-3 left-3 sm:left-auto sm:w-[400px] z-30 bg-slate-900 text-white border border-slate-800 rounded-xl shadow-xl overflow-hidden"
    >
      {/* Progress bar */}
      <div className="h-1 w-full bg-slate-800">
        <div
          className={`h-full transition-[width] duration-300 ${
            isFinished ? 'bg-emerald-400' : 'bg-emerald-500'
          }`}
          style={{ width: `${isFinished ? 100 : pct}%` }}
        />
      </div>

      <div className="p-3.5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
              <Timer className="w-3.5 h-3.5 shrink-0" />
              <span>{isFinished ? t('Rest Complete') : t('Rest Timer')}</span>
            </div>
            <p className="text-sm font-semibold text-white truncate mt-0.5">
              {exerciseName || t('Between Sets')}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span
              className={`text-2xl font-bold font-mono tabular-nums tracking-tight ${
                isFinished ? 'text-emerald-400' : 'text-white'
              }`}
            >
              {formatRestDuration(secondsLeft)}
            </span>

            <button
              type="button"
              onClick={onToggleSound}
              aria-label={soundEnabled ? t('Mute timer chime') : t('Unmute timer chime')}
              className="ml-1.5 w-9 h-9 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onDismiss}
              aria-label={t('Dismiss rest timer')}
              className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main controls + Presets */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onAdjust(-15)}
              className="min-h-[38px] px-2.5 text-xs font-mono font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors tabular-nums"
            >
              -15s
            </button>
            <button
              type="button"
              onClick={() => onAdjust(15)}
              className="min-h-[38px] px-2.5 text-xs font-mono font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors tabular-nums"
            >
              +15s
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onReset}
              aria-label={t('Reset rest timer')}
              className="min-h-[38px] px-2.5 inline-flex items-center gap-1 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {t('Reset')}
            </button>

            <button
              type="button"
              onClick={isFinished ? onReset : onTogglePause}
              className="min-h-[38px] px-3.5 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors"
            >
              {isFinished ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  {t('Restart')}
                </>
              ) : isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  {t('Pause')}
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  {t('Resume')}
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-800">
          <span className="text-[11px] text-slate-400">{t('Quick set')}</span>
          <div className="flex items-center gap-1.5">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onSelectPreset(preset)}
                className={`px-2.5 py-1 text-[11px] font-mono tabular-nums font-medium rounded-md transition-colors ${
                  targetSeconds === preset
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {preset}s
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
