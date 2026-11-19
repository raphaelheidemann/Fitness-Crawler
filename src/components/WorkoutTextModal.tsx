import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Copy, Share2, X } from 'lucide-react';
import { ExerciseItem } from '../types';
import { useT } from '../lib/i18n';
import { defaultCardio } from '../lib/sanitize';
import { saveWorkoutPlan } from '../lib/firestoreService';
import { buildSessionText, buildWorkoutText, parseWorkoutText } from '../lib/workoutText';

interface Props {
  mode: 'export' | 'import' | null;
  onClose: () => void;
  uid: string;
  /** export: the day being shared */
  workoutName?: string;
  exercises?: ExerciseItem[];
  unit?: string;
  /** export of a done session: when it happened and how long it took */
  performedAt?: Date;
  durationSec?: number;
  /** true when performedAt includes a trustworthy clock time */
  withTime?: boolean;
  /** import: called after the plans were saved */
  onImported?: (count: number) => void;
}

export const WorkoutTextModal: React.FC<Props> = ({
  mode,
  onClose,
  uid,
  workoutName = '',
  exercises = [],
  unit = 'kg',
  performedAt,
  durationSec,
  withTime,
  onImported,
}) => {
  const t = useT();
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState('');
  const [name, setName] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const hasDone = exercises.some((e) => (e.setLog ? e.setLog.some((s) => s.done) : e.completed));
  const [kind, setKind] = useState<'log' | 'plan'>('log');

  useEffect(() => {
    if (!mode) return;
    setNotice(null);
    setSaving(false);
    setName('');
    setKind(hasDone ? 'log' : 'plan');
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mode !== 'export') {
      if (mode === 'import') setText('');
      return;
    }
    setText(
      kind === 'log'
        ? buildSessionText({
            name: workoutName,
            exercises,
            unit,
            date: performedAt ?? new Date(),
            durationSec,
            withTime,
          })
        : buildWorkoutText(workoutName, exercises, unit)
    );
  }, [mode, kind]); // eslint-disable-line react-hooks/exhaustive-deps

  const parsed = useMemo(() => (mode === 'import' ? parseWorkoutText(text) : []), [mode, text]);
  const found = parsed.reduce((n, w) => n + w.exercises.length, 0);
  const skipped = parsed.reduce((n, w) => n + w.skipped.length, 0);

  if (!mode) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setNotice(t('Copied. Paste it in a message.'));
    } catch {
      areaRef.current?.select();
      setNotice(t('Select the text and copy it manually.'));
    }
  };

  const handleShare = () => {
    void navigator.share({ text }).catch(() => {});
  };

  const handleImport = async () => {
    if (found === 0 || saving) return;
    setSaving(true);
    setNotice(null);
    try {
      for (const w of parsed) {
        await saveWorkoutPlan(
          uid,
          {
            id: '',
            name: (w.name || name.trim() || t('Imported workout')).slice(0, 80),
            scheduledTime: '',
            defaultDays: [],
            isRestDay: false,
            exercises: w.exercises,
            cardio: defaultCardio(),
            notes: '',
          },
          false
        );
      }
      onImported?.(parsed.length);
      onClose();
    } catch {
      setNotice(t('Could not import this workout. Check your connection and try again.'));
      setSaving(false);
    }
  };

  const isExport = mode === 'export';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isExport ? t('Export workout as text') : t('Import workout from text')}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 sm:p-4"
    >
      <div className="w-full sm:max-w-lg bg-[#131a24] border-2 border-[#33445e] rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#253247] bg-[#0f151e]">
          <h2 className="text-sm font-semibold text-white">
            {isExport ? t('Export workout as text') : t('Import workout from text')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('Close')}
            className="w-9 h-9 inline-flex items-center justify-center text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-3">
          {isExport && (
            <div className="inline-flex rounded-lg border border-[#2d3c54] bg-[#0e141d] p-1 text-xs">
              {(['log', 'plan'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  disabled={k === 'log' && !hasDone}
                  onClick={() => setKind(k)}
                  className={`px-3 py-2 rounded-md disabled:opacity-40 ${
                    kind === k ? 'bg-amber-400 text-slate-950 font-semibold' : 'text-slate-300'
                  }`}
                >
                  {k === 'log' ? t('What I did (sets, load, RPE)') : t('Plan (to import)')}
                </button>
              ))}
            </div>
          )}
          <p className="text-xs text-slate-400">
            {isExport
              ? kind === 'log'
                ? t('Every set done, with load and RPE. Send it to your coach or AI trainer.')
                : t('One exercise per line. Send it to someone: they paste it in Import from text.')
              : t('Paste a workout, one exercise per line, like "Supino com Barra - 3x10 - 40 kg".')}
          </p>

          <textarea
            ref={areaRef}
            value={text}
            readOnly={isExport}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder={isExport ? '' : 'Treino: Peito\nSupino com Barra - 3x10 - 40 kg\nCrucifixo - 3x12'}
            className="w-full px-3 py-2 text-sm font-mono text-white bg-[#0e141d] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
          />

          {!isExport && (
            <>
              <input
                type="text"
                value={name}
                maxLength={80}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('Workout name (if the text has no "Treino:" line)')}
                className="w-full px-3 py-2 text-sm text-white bg-[#0e141d] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
              />
              {text.trim() && (
                <p className={`text-xs ${found > 0 ? 'text-emerald-300' : 'text-amber-300'}`}>
                  {found > 0
                    ? t('{n} exercises found', { n: found })
                    : t('No exercises found. Use lines like "Supino - 3x10 - 40 kg".')}
                  {skipped > 0 && ` · ${t('{n} lines ignored', { n: skipped })}`}
                </p>
              )}
            </>
          )}

          {notice && <p className="text-xs text-amber-300">{notice}</p>}
        </div>

        <div className="px-4 py-3 border-t border-[#263347] flex flex-wrap justify-end gap-2">
          {isExport ? (
            <>
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  type="button"
                  onClick={handleShare}
                  className="min-h-[42px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-200 bg-[#1a2332] border border-[#2d3c54] hover:bg-[#233044] rounded-lg"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  {t('Share')}
                </button>
              )}
              <button
                type="button"
                onClick={() => void handleCopy()}
                className="min-h-[42px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg"
              >
                <Copy className="w-3.5 h-3.5" />
                {t('Copy text')}
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={found === 0 || saving}
              onClick={() => void handleImport()}
              className="min-h-[42px] px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg"
            >
              {saving ? t('Saving...') : t('Import')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
