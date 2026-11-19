import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Dumbbell,
  Eye,
  Plus,
  Search,
  Timer,
  X,
} from 'lucide-react';
import { useI18n, useT } from '../lib/i18n';
import { exerciseNamePt } from '../lib/exerciseNamesPt';
import { ExerciseCatalogItem } from '../types';

interface ExerciseCatalogResponse {
  total: number;
  muscles: string[];
  exercises: ExerciseCatalogItem[];
}

let catalogCache: ExerciseCatalogResponse | null = null;
let catalogPromise: Promise<ExerciseCatalogResponse> | null = null;

async function loadExerciseCatalog(): Promise<ExerciseCatalogResponse> {
  if (catalogCache) return catalogCache;
  if (!catalogPromise) {
    catalogPromise = fetch('/api/exercises')
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Could not load exercise database');
        }
        const data = (await res.json()) as ExerciseCatalogResponse;
        catalogCache = data;
        return data;
      })
      .catch((err) => {
        catalogPromise = null;
        throw err;
      });
  }
  return catalogPromise;
}

export function formatMuscleLabel(raw: string): string {
  if (!raw) return 'General';
  return raw
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

interface ThumbnailProps {
  src?: string;
  alt: string;
  className?: string;
}

const CatalogImage: React.FC<ThumbnailProps> = ({ src, alt, className = '' }) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#0e141d] text-slate-500 ${className}`}
      >
        <Dumbbell className="w-6 h-6" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`object-cover bg-[#0e141d] ${className}`}
    />
  );
};

interface Props {
  isOpen: boolean;
  mode: 'add' | 'match';
  initialQuery?: string;
  onClose: () => void;
  onSelectExercise: (item: ExerciseCatalogItem, defaultRestSeconds: number) => void;
}

const DEFAULT_REST_OPTIONS = [60, 90, 120, 180] as const;
const PAGE_SIZE = 48;

export const ExercisePickerModal: React.FC<Props> = ({
  isOpen,
  mode,
  initialQuery = '',
  onClose,
  onSelectExercise,
}) => {
  const t = useT();
  const { lang } = useI18n();
  const nm = (name: string) => (lang === 'pt' ? exerciseNamePt(name) : name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [muscles, setMuscles] = useState<string[]>([]);
  const [allExercises, setAllExercises] = useState<ExerciseCatalogItem[]>([]);

  const [query, setQuery] = useState(initialQuery);
  const [selectedMuscle, setSelectedMuscle] = useState<string>('all');
  const [defaultRest, setDefaultRest] = useState<number>(90);
  const [visibleLimit, setVisibleLimit] = useState<number>(PAGE_SIZE);
  const [detailItem, setDetailItem] = useState<ExerciseCatalogItem | null>(null);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isOpen) return;
    setQuery(initialQuery);
    setDetailItem(null);
    setVisibleLimit(PAGE_SIZE);
    setAddedIds({});
  }, [isOpen, initialQuery]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setLoading(true);
    setError(null);
    loadExerciseCatalog()
      .then((data) => {
        if (!active) return;
        setMuscles(data.muscles);
        setAllExercises(data.exercises);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : t('Failed to load exercise catalog'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isOpen]);

  const filteredExercises = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allExercises.filter((ex) => {
      if (selectedMuscle !== 'all' && ex.muscleGroup.toLowerCase() !== selectedMuscle) {
        return false;
      }
      if (!q) return true;
      return (
        ex.name.toLowerCase().includes(q) ||
        nm(ex.name).toLowerCase().includes(q) ||
        ex.muscleGroup.toLowerCase().includes(q) ||
        ex.equipment.toLowerCase().includes(q) ||
        ex.category.toLowerCase().includes(q)
      );
    });
  }, [allExercises, selectedMuscle, query, lang]);

  const visibleExercises = useMemo(
    () => filteredExercises.slice(0, visibleLimit),
    [filteredExercises, visibleLimit]
  );

  if (!isOpen) return null;

  const handleChoose = (ex: ExerciseCatalogItem) => {
    onSelectExercise({ ...ex, name: nm(ex.name) }, defaultRest);
    if (mode === 'add') {
      setAddedIds((prev) => ({ ...prev, [ex.id]: true }));
    } else {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'match' ? t('Match Exercise from Database') : t('Exercise Database')}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-[1px] flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div className="bg-[#131a24] w-full sm:max-w-5xl h-[92dvh] sm:h-[86vh] rounded-t-2xl sm:rounded-2xl border-2 border-[#33445e] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-[#0f151e] border-b border-[#253247] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {detailItem ? (
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="min-h-[40px] px-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-slate-200 bg-[#1a2332] border border-[#2d3c54] hover:bg-[#233044] rounded-lg"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('Back to results')}
              </button>
            ) : (
              <div>
                <h2 className="text-base font-bold text-white">
                  {mode === 'match' ? t('Link Exercise Photo & Muscle') : t('Exercise Database')}
                </h2>
                <p className="text-xs text-slate-400 tabular-nums">
                  {allExercises.length > 0
                    ? t('{n} of {total} exercises', { n: filteredExercises.length, total: allExercises.length })
                    : t('Search verified exercises with form photos by muscle group')}
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t('Close exercise database')}
            className="w-10 h-10 inline-flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#1a2332] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {detailItem ? (
          /* Exercise Form & Instructions Detail View */
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-emerald-400">
                  {t(formatMuscleLabel(detailItem.muscleGroup))} ·{' '}
                  {t(formatMuscleLabel(detailItem.equipment))} · {t(formatMuscleLabel(detailItem.level))}
                </p>
                <h3 className="text-xl font-bold text-white mt-1">{nm(detailItem.name)}</h3>
                {detailItem.secondaryMuscles.length > 0 && (
                  <p className="text-xs text-slate-400 mt-1">
                    {t('Secondary')}: {detailItem.secondaryMuscles.map((m) => t(formatMuscleLabel(m))).join(', ')}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleChoose(detailItem)}
                className="min-h-[44px] px-4 py-2 inline-flex items-center justify-center gap-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shrink-0"
              >
                {addedIds[detailItem.id] ? (
                  <>
                    <Check className="w-4 h-4" />
                    {t('Added to Day')}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    {mode === 'match' ? t('Use This Exercise') : t('Add ({sec}s rest)', { sec: defaultRest })}
                  </>
                )}
              </button>
            </div>

            {detailItem.images.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {detailItem.images.map((imgUrl, idx) => (
                  <div
                    key={imgUrl}
                    className="border border-[#263347] rounded-xl overflow-hidden bg-[#0e141d]"
                  >
                    <CatalogImage
                      src={imgUrl}
                      alt={t('{name} position {n}', { name: nm(detailItem.name), n: idx + 1 })}
                      className="w-full aspect-[4/3]"
                    />
                    <div className="px-3 py-2 text-xs font-medium text-slate-300 border-t border-[#253247] bg-[#0f151e]">
                      {idx === 0 ? t('Start Position') : t('End / Peak Position')}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {detailItem.instructions.length > 0 && (
              <div className="bg-[#0e141d] border border-[#263347] rounded-xl p-4 space-y-2.5">
                <h4 className="text-sm font-semibold text-white">{t('Execution Steps')}</h4>
                <ol className="space-y-2 text-sm text-slate-200 list-decimal list-inside">
                  {detailItem.instructions.map((step, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        ) : (
          /* Search + Muscle Filters + Catalog Grid */
          <>
            <div className="p-4 border-b border-[#253247] bg-[#0e141d] space-y-3 shrink-0">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setVisibleLimit(PAGE_SIZE);
                    }}
                    placeholder={t('Search exercise name or equipment (e.g. bench press, dumbbell, squat)...')}
                    className="w-full min-h-[42px] pl-9 pr-9 py-2 text-sm text-white placeholder:text-slate-500 bg-[#131a24] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      aria-label={t('Clear search')}
                      className="w-8 h-8 inline-flex items-center justify-center text-slate-400 hover:text-white absolute right-1.5 top-1/2 -translate-y-1/2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {mode === 'add' && (
                  <div className="flex items-center gap-1.5 bg-[#131a24] border border-[#2d3c54] rounded-lg px-2.5 py-1.5 shrink-0">
                    <Timer className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-300">{t('Default rest:')}</span>
                    {DEFAULT_REST_OPTIONS.map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setDefaultRest(sec)}
                        className={`px-2 py-1 text-xs font-mono tabular-nums font-semibold rounded-md transition-colors ${
                          defaultRest === sec
                            ? 'bg-amber-400 text-slate-950'
                            : 'text-slate-300 hover:bg-[#1a2332]'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Muscle group filter buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMuscle('all');
                    setVisibleLimit(PAGE_SIZE);
                  }}
                  className={`min-h-[34px] px-3 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors shrink-0 ${
                    selectedMuscle === 'all'
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-[#131a24] border border-[#2d3c54] text-slate-300 hover:bg-[#1a2332]'
                  }`}
                >
                  {t('All Muscles')}
                </button>
                {muscles.map((muscle) => (
                  <button
                    key={muscle}
                    type="button"
                    onClick={() => {
                      setSelectedMuscle(muscle);
                      setVisibleLimit(PAGE_SIZE);
                    }}
                    className={`min-h-[34px] px-3 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors shrink-0 ${
                      selectedMuscle === muscle
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-[#131a24] border border-[#2d3c54] text-slate-300 hover:bg-[#1a2332]'
                    }`}
                  >
                    {t(formatMuscleLabel(muscle))}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {loading ? (
                <div className="py-16 text-center text-sm text-slate-400">
                  {t('Loading exercise catalog...')}
                </div>
              ) : error ? (
                <div className="py-12 text-center space-y-3">
                  <p className="text-sm text-rose-300">{error}</p>
                  <button
                    type="button"
                    onClick={() => {
                      catalogCache = null;
                      catalogPromise = null;
                      setError(null);
                      setLoading(true);
                      loadExerciseCatalog()
                        .then((data) => {
                          setMuscles(data.muscles);
                          setAllExercises(data.exercises);
                        })
                        .catch((err) =>
                          setError(err instanceof Error ? err.message : t('Failed to reload'))
                        )
                        .finally(() => setLoading(false));
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg"
                  >
                    {t('Retry')}
                  </button>
                </div>
              ) : visibleExercises.length === 0 ? (
                <div className="py-14 text-center space-y-2">
                  <p className="text-sm font-medium text-slate-200">
                    {t('No matching exercises found')}
                  </p>
                  <p className="text-xs text-slate-400">
                    {t('Try clearing your search or choosing “All Muscles”.')}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {visibleExercises.map((ex) => {
                      const isAdded = Boolean(addedIds[ex.id]);
                      return (
                        <div
                          key={ex.id}
                          className="border-2 border-[#263347] rounded-xl overflow-hidden bg-[#0e141d] flex flex-col hover:border-[#3b4f6e] transition-colors"
                        >
                          <button
                            type="button"
                            onClick={() => setDetailItem(ex)}
                            className="relative group text-left overflow-hidden bg-[#090d12]"
                          >
                            <CatalogImage
                              src={ex.images[0]}
                              alt={nm(ex.name)}
                              className="w-full aspect-[4/3] group-hover:scale-[1.02] transition-transform duration-200"
                            />
                            <span className="absolute bottom-2 right-2 px-2 py-1 text-[11px] font-medium bg-[#090d12]/85 text-white border border-[#33445e] rounded-md inline-flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {t('Form')}
                            </span>
                          </button>

                          <div className="p-3.5 flex-1 flex flex-col justify-between gap-3">
                            <div>
                              <h3 className="text-sm font-semibold text-white leading-snug">
                                {nm(ex.name)}
                              </h3>
                              <p className="text-xs text-slate-400 mt-1">
                                {t(formatMuscleLabel(ex.muscleGroup))}
                                {ex.equipment ? ` · ${t(formatMuscleLabel(ex.equipment))}` : ''}
                                {ex.level ? ` · ${t(formatMuscleLabel(ex.level))}` : ''}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setDetailItem(ex)}
                                className="min-h-[40px] px-3 py-1.5 text-xs font-medium text-slate-200 bg-[#1a2332] border border-[#2d3c54] hover:bg-[#233044] rounded-lg transition-colors"
                              >
                                {t('Guide')}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleChoose(ex)}
                                className={`flex-1 min-h-[40px] px-3 py-1.5 inline-flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg transition-colors ${
                                  isAdded
                                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                                    : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
                                }`}
                              >
                                {isAdded ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    {t('Added')}
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-3.5 h-3.5" />
                                    {mode === 'match' ? t('Select') : t('Add to Day')}
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {filteredExercises.length > visibleLimit && (
                    <div className="pt-5 text-center">
                      <button
                        type="button"
                        onClick={() => setVisibleLimit((n) => n + PAGE_SIZE)}
                        className="min-h-[42px] px-5 py-2 text-xs font-semibold text-slate-200 bg-[#1a2332] border border-[#2d3c54] hover:bg-[#233044] rounded-lg transition-colors tabular-nums"
                      >
                        {t('Show more ({n} remaining)', { n: filteredExercises.length - visibleLimit })}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
