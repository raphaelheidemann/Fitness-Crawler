import React, { useMemo, useRef, useState } from 'react';
import { useT } from '../lib/i18n';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ClipboardCopy,
  Download,
  FileSpreadsheet,
  Layers,
  Upload,
  X,
} from 'lucide-react';
import {
  DAY_SHORT,
  getMealSlotLabel,
  MealLog,
  UnitSystem,
  WorkoutDay,
  WorkoutPlan,
} from '../types';
import {
  buildDietAiPrompt,
  buildTrainingAiPrompt,
  DIET_CSV_TEMPLATE,
  downloadCsvFile,
  parseDietCsv,
  parseTrainingCsv,
  TRAINING_CSV_TEMPLATE,
} from '../lib/csvImport';
import {
  importMealLogs,
  importTrainingDays,
  importWorkoutPlans,
  updateMealsPerDay,
} from '../lib/firestoreService';
import { distanceUnit, weightUnit } from '../lib/sanitize';

export type CsvImportTarget = 'training' | 'diet';

interface Props {
  open: boolean;
  onClose: () => void;
  initialMode: CsvImportTarget;
  uid: string;
  unitSystem: UnitSystem;
  defaultWeek: number;
  defaultDay: number;
  mealsPerDay: number;
  existingWorkouts: WorkoutDay[];
  existingPlans: WorkoutPlan[];
  existingMeals: MealLog[];
  onImported: (summary: string) => void;
}

export const CsvImportModal: React.FC<Props> = ({
  open,
  onClose,
  initialMode,
  uid,
  unitSystem,
  defaultWeek,
  defaultDay,
  mealsPerDay,
  existingWorkouts,
  existingPlans,
  existingMeals,
  onImported,
}) => {
  const t = useT();
  const [mode, setMode] = useState<CsvImportTarget>(initialMode);
  const [csvText, setCsvText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [saveAsPlans, setSaveAsPlans] = useState(true);
  const [assignToWeek, setAssignToWeek] = useState(true);
  const [replaceDietDays, setReplaceDietDays] = useState(true);
  const [importing, setImporting] = useState(false);
  const [copiedKind, setCopiedKind] = useState<'csv' | 'prompt' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (open) {
      setMode(initialMode);
      setCsvText('');
      setFileName(null);
      setSaveAsPlans(true);
      setAssignToWeek(true);
      setReplaceDietDays(true);
      setCopiedKind(null);
      setError(null);
    }
  }, [open, initialMode]);

  const wUnit = weightUnit(unitSystem);
  const dUnit = distanceUnit(unitSystem);

  const trainingParsed = useMemo(() => {
    if (mode !== 'training' || !csvText.trim()) {
      return { days: [], plans: [], warnings: [], totalExercises: 0 };
    }
    return parseTrainingCsv(csvText, defaultWeek);
  }, [mode, csvText, defaultWeek]);

  const dietParsed = useMemo(() => {
    if (mode !== 'diet' || !csvText.trim()) {
      return { meals: [], warnings: [], maxSlotNumber: 0 };
    }
    return parseDietCsv(csvText, defaultWeek, defaultDay);
  }, [mode, csvText, defaultWeek, defaultDay]);

  if (!open) return null;

  const warnings = mode === 'training' ? trainingParsed.warnings : dietParsed.warnings;
  const readyCount =
    mode === 'training' ? trainingParsed.days.length : dietParsed.meals.length;
  const canImport =
    !importing &&
    readyCount > 0 &&
    (mode === 'diet' || saveAsPlans || assignToWeek);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setFileName(file.name);
    const content = await file.text();
    setCsvText(content);
    e.target.value = '';
  };

  const handleDownloadTemplate = (target: CsvImportTarget = mode) => {
    if (target === 'training') {
      downloadCsvFile(`fitness_crawler_training_template_w${defaultWeek}.csv`, TRAINING_CSV_TEMPLATE);
    } else {
      downloadCsvFile(`fitness_crawler_diet_template_w${defaultWeek}.csv`, DIET_CSV_TEMPLATE);
    }
  };

  const handleCopyText = async (kind: 'csv' | 'prompt') => {
    const text =
      kind === 'csv'
        ? mode === 'training'
          ? TRAINING_CSV_TEMPLATE
          : DIET_CSV_TEMPLATE
        : mode === 'training'
        ? buildTrainingAiPrompt(defaultWeek)
        : buildDietAiPrompt(defaultWeek, mealsPerDay);

    try {
      await navigator.clipboard.writeText(text);
      setCopiedKind(kind);
      window.setTimeout(() => setCopiedKind(null), 2200);
    } catch {
      setError(t('Clipboard access was blocked. Use "Download .csv" or "Fill Sample CSV" instead.'));
    }
  };

  const handleLoadSample = () => {
    setError(null);
    setFileName(null);
    setCsvText(mode === 'training' ? TRAINING_CSV_TEMPLATE : DIET_CSV_TEMPLATE);
  };

  const handleImport = async () => {
    if (!canImport) return;
    setImporting(true);
    setError(null);
    try {
      if (mode === 'training') {
        const parts: string[] = [];
        if (saveAsPlans && trainingParsed.plans.length > 0) {
          const planCount = await importWorkoutPlans(
            uid,
            trainingParsed.plans,
            existingPlans.map((p) => p.id)
          );
          parts.push(t(planCount === 1 ? '{n} reusable plan' : '{n} reusable plans', { n: planCount }));
        }
        if (assignToWeek && trainingParsed.days.length > 0) {
          const dayCount = await importTrainingDays(
            uid,
            trainingParsed.days,
            existingWorkouts.map((w) => w.id)
          );
          parts.push(
            t(dayCount === 1 ? '{n} scheduled day ({ex} exercises)' : '{n} scheduled days ({ex} exercises)', {
              n: dayCount,
              ex: trainingParsed.totalExercises,
            })
          );
        }
        onImported(t('Imported {what}', { what: parts.join(t(' and ')) }));
      } else {
        const count = await importMealLogs(
          uid,
          dietParsed.meals,
          existingMeals,
          replaceDietDays
        );
        let slotNote = '';
        if (dietParsed.maxSlotNumber > mealsPerDay && dietParsed.maxSlotNumber <= 10) {
          await updateMealsPerDay(uid, dietParsed.maxSlotNumber);
          slotNote = ` · ${t('expanded daily slots to {n}', { n: dietParsed.maxSlotNumber })}`;
        }
        onImported(
          `${t(count === 1 ? 'Imported {n} meal item' : 'Imported {n} meal items', { n: count })}${slotNote}`
        );
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Failed to import CSV rows.'));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 sm:p-4">
      <div className="w-full sm:max-w-3xl bg-[#131a24] border-2 border-[#33445e] rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 bg-[#0f151e] border-b border-[#253247]">
          <div>
            <h2 className="text-base font-semibold text-white">{t('CSV Templates & Import')}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {t('Extract a template for your own AI agent, then upload or paste the filled CSV back here')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('Close CSV import modal')}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {/* Mode Switch */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="inline-flex items-center p-1 bg-[#0e141d] border border-[#2d3c54] rounded-lg self-start">
              <button
                type="button"
                onClick={() => {
                  setMode('training');
                  setCsvText('');
                  setFileName(null);
                  setCopiedKind(null);
                  setError(null);
                }}
                className={`min-h-[38px] px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  mode === 'training'
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-300 hover:text-white hover:bg-[#1a2332]'
                }`}
              >
                {t('Training CSV')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('diet');
                  setCsvText('');
                  setFileName(null);
                  setCopiedKind(null);
                  setError(null);
                }}
                className={`min-h-[38px] px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  mode === 'diet'
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-300 hover:text-white hover:bg-[#1a2332]'
                }`}
              >
                {t('Diet CSV')}
              </button>
            </div>

            <button
              type="button"
              onClick={handleLoadSample}
              className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-[#1a2332] border border-[#2d3c54] hover:bg-[#233044] rounded-lg transition-colors whitespace-nowrap self-start sm:self-auto"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              {t('Preview Sample CSV')}
            </button>
          </div>

          {/* Step 1: Extract Template */}
          <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-xl space-y-3">
            <div>
              <p className="text-xs font-semibold text-emerald-200">
                {mode === 'training' ? t('1. Extract Training Template') : t('1. Extract Diet Template')}
              </p>
              <p className="text-[11px] text-emerald-100/80 mt-0.5 leading-relaxed">
                {t('Send the CSV template or ready-to-paste prompt to your preferred AI agent (ChatGPT, Claude, Gemini, etc.) to build your schedule, then import the result in Step 2.')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownloadTemplate(mode)}
                className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                {mode === 'training' ? t('Download Training .csv') : t('Download Diet .csv')}
              </button>

              <button
                type="button"
                onClick={() => void handleCopyText('prompt')}
                className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-200 bg-[#0e141d] border border-emerald-500/40 hover:bg-[#1a2332] rounded-lg transition-colors whitespace-nowrap"
              >
                {copiedKind === 'prompt' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    {t('Copied AI Prompt + Template')}
                  </>
                ) : (
                  <>
                    <ClipboardCopy className="w-3.5 h-3.5" />
                    {t('Copy AI Prompt + Template')}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => void handleCopyText('csv')}
                className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-[#1a2332] border border-[#2d3c54] hover:bg-[#233044] rounded-lg transition-colors whitespace-nowrap"
              >
                {copiedKind === 'csv' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    {t('Copied CSV')}
                  </>
                ) : (
                  <>
                    <ClipboardCopy className="w-3.5 h-3.5" />
                    {t('Copy Raw CSV')}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Step 2: File Picker + Paste Box */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 bg-[#0e141d] border border-dashed border-[#33445e] rounded-xl">
              <div className="text-xs text-slate-300 min-w-0 flex-1">
                <span className="font-semibold text-white">
                  {fileName ? t('2. Loaded: {name}', { name: fileName }) : t('2. Upload filled CSV file')}
                </span>
                <span className="block text-[11px] text-slate-400 mt-0.5">
                  {mode === 'training'
                    ? t('Supports comma (,) or semicolon (;), extracts reusable Training Plans, and assigns Mon–Sun.')
                    : t('Supports comma (,) or semicolon (;), and imports meals straight into your daily slots.')}
                </span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => void handleFileChange(e)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[42px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap"
              >
                <Upload className="w-3.5 h-3.5" />
                {t('Upload .csv')}
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t('Or paste the CSV output directly below')}
              </label>
              <textarea
                rows={5}
                value={csvText}
                onChange={(e) => {
                  setCsvText(e.target.value);
                  setError(null);
                }}
                placeholder={
                  mode === 'training'
                    ? TRAINING_CSV_TEMPLATE
                    : DIET_CSV_TEMPLATE
                }
                className="w-full px-3 py-2 text-xs text-white placeholder:text-slate-500 font-mono bg-[#0e141d] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          {/* Import Target Options */}
          {mode === 'training' ? (
            <div className="p-3.5 bg-[#0e141d] border border-[#263347] rounded-xl space-y-2.5">
              <label className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveAsPlans}
                  onChange={(e) => setSaveAsPlans(e.target.checked)}
                  className="w-4 h-4 rounded border-[#394c69] bg-[#0e141d] text-emerald-400 focus:ring-emerald-400"
                />
                <span>
                  {t('Create / update')}{' '}
                  <strong className="font-semibold text-white">
                    {trainingParsed.plans.length || t('reusable')} {t('Training Plans')}
                  </strong>{' '}
                  {t('so you can pick & edit them on any day')}
                </span>
              </label>
              <label className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={assignToWeek}
                  onChange={(e) => setAssignToWeek(e.target.checked)}
                  className="w-4 h-4 rounded border-[#394c69] bg-[#0e141d] text-emerald-400 focus:ring-emerald-400"
                />
                <span>
                  {t('Assign this schedule to')}{' '}
                  <strong className="font-semibold text-white">
                    {t('Week {n} (Mon–Sun)', { n: defaultWeek })}
                  </strong>{' '}
                  {t('so you can start training right away')}
                </span>
              </label>
            </div>
          ) : (
            <label className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={replaceDietDays}
                onChange={(e) => setReplaceDietDays(e.target.checked)}
                className="w-4 h-4 rounded border-[#394c69] bg-[#0e141d] text-emerald-400 focus:ring-emerald-400"
              />
              {t('Replace existing meals on the imported week & day slots instead of appending')}
            </label>
          )}

          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-lg text-xs text-rose-200">
              {error}
            </div>
          )}

          {warnings.length > 0 && (
            <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-lg space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-200">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {t('CSV Warnings ({n})', { n: warnings.length })}
              </div>
              <ul className="text-[11px] text-amber-100/90 space-y-0.5 max-h-24 overflow-y-auto">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Live Preview */}
          {readyCount > 0 && (
            <div className="space-y-3">
              {mode === 'training' && trainingParsed.plans.length > 0 && (
                <div className="border border-emerald-500/40 bg-emerald-950/25 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-200">
                      <Layers className="w-3.5 h-3.5 text-emerald-400" />
                      {t('Reusable Training Plans Detected ({n})', { n: trainingParsed.plans.length })}
                    </span>
                    <span className="text-emerald-300 tabular-nums">{t('Selectable on any day')}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {trainingParsed.plans.map((p) => (
                      <div
                        key={p.id}
                        className="px-3 py-2 bg-[#0e141d] border border-[#263347] rounded-lg text-xs"
                      >
                        <p className="font-semibold text-white truncate">{p.name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                          {p.defaultDays.map((d) => t(DAY_SHORT[d])).join(', ')}
                          {p.scheduledTime ? ` · ${p.scheduledTime}` : ''}
                          {` · ${t('{n} exercises', { n: p.exercises.length })}`}
                          {p.cardio.activityType !== 'none'
                            ? ` · ${p.cardio.activityType === 'walk' ? t('Walk') : t('Run')}`
                            : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border border-[#263347] rounded-xl overflow-hidden bg-[#0e141d]">
                <div className="px-4 py-2.5 bg-[#0f151e] border-b border-[#253247] flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {mode === 'training'
                      ? t('Schedule Ready: {d} days · {e} exercises', {
                          d: trainingParsed.days.length,
                          e: trainingParsed.totalExercises,
                        })
                      : `${t('Ready: {n} meal items', { n: dietParsed.meals.length })}${
                          dietParsed.maxSlotNumber > mealsPerDay
                            ? ` · ${t('expands slots to {n}/day', { n: dietParsed.maxSlotNumber })}`
                            : ''
                        }`}
                  </span>
                  <span className="text-slate-400">{t('Preview')}</span>
                </div>

                <div className="max-h-56 overflow-auto">
                  {mode === 'training' ? (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#253247] text-slate-400 bg-[#0e141d]">
                          <th className="py-2 px-3">{t('Week / Day')}</th>
                          <th className="py-2 px-3">{t('Session / Plan')}</th>
                          <th className="py-2 px-3 text-right">{t('Exercises')}</th>
                          <th className="py-2 px-3">{t('Cardio')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e293b] tabular-nums">
                        {trainingParsed.days.map((d) => (
                          <tr key={`${d.weekNumber}_${d.dayIndex}`}>
                            <td className="py-2 px-3 font-medium text-white whitespace-nowrap">
                              W{d.weekNumber} · {t(DAY_SHORT[d.dayIndex])}
                            </td>
                            <td className="py-2 px-3 text-slate-300">
                              {t(d.focus)}
                              {d.scheduledTime ? ` · ${d.scheduledTime}` : ''}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-white">
                              {d.isRestDay ? t('Rest') : `${d.exercises.length} (${wUnit})`}
                            </td>
                            <td className="py-2 px-3 text-slate-400">
                              {d.cardio.activityType === 'none'
                                ? '—'
                                : `${d.cardio.activityType === 'walk' ? t('Walk') : t('Run')}${
                                    d.cardio.durationMinutes > 0
                                      ? ` ${d.cardio.durationMinutes} min`
                                      : ''
                                  }${d.cardio.distance > 0 ? ` · ${d.cardio.distance} ${dUnit}` : ''}`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#253247] text-slate-400 bg-[#0e141d]">
                          <th className="py-2 px-3">{t('Week / Day')}</th>
                          <th className="py-2 px-3">{t('Slot')}</th>
                          <th className="py-2 px-3">{t('Food / Meal')}</th>
                          <th className="py-2 px-3 text-right">{t('Macros')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e293b] tabular-nums">
                        {dietParsed.meals.slice(0, 35).map((m, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 font-medium text-white whitespace-nowrap">
                              W{m.weekNumber} · {t(DAY_SHORT[m.dayIndex])}
                            </td>
                            <td className="py-2 px-3 text-slate-400 whitespace-nowrap">
                              {(() => {
                                const label = getMealSlotLabel(m.slot);
                                return label.startsWith('Meal ')
                                  ? t('Meal {n}', { n: label.slice(5) })
                                  : t(label);
                              })()}
                            </td>
                            <td className="py-2 px-3 text-slate-100 truncate max-w-[220px]">
                              {m.title}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-300 whitespace-nowrap">
                              {m.calories} kcal · {m.proteinG}P / {m.carbsG}C / {m.fatG}F
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3.5 border-t border-[#253247] bg-[#0f151e] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 text-xs font-medium text-slate-200 hover:bg-[#1a2332] rounded-lg"
          >
            {t('Cancel')}
          </button>
          <button
            type="button"
            disabled={!canImport}
            onClick={() => void handleImport()}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            {importing
              ? t('Importing...')
              : mode === 'training'
              ? saveAsPlans && assignToWeek
                ? t('Import {p} Plans & {d} Days', { p: trainingParsed.plans.length, d: trainingParsed.days.length })
                : saveAsPlans
                ? t('Create {n} Plans', { n: trainingParsed.plans.length })
                : t('Schedule {n} Days', { n: trainingParsed.days.length })
              : t('Import {n} Meals', { n: dietParsed.meals.length })}
          </button>
        </div>
      </div>
    </div>
  );
};
