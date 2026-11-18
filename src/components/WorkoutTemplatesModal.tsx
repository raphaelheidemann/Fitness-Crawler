import React, { useEffect, useState } from 'react';
import { Check, ChevronLeft, Layers, X } from 'lucide-react';
import { DAY_SHORT } from '../types';
import { defaultCardio } from '../lib/sanitize';
import { saveWorkoutPlan } from '../lib/firestoreService';
import {
  TEMPLATE_LEVELS,
  TemplateLevel,
  TemplateSplit,
  WORKOUT_TEMPLATES,
} from '../lib/workoutTemplates';

interface Props {
  open: boolean;
  onClose: () => void;
  uid: string;
  onAdded: (splitName: string, count: number) => void;
}

export const WorkoutTemplatesModal: React.FC<Props> = ({ open, onClose, uid, onAdded }) => {
  const [level, setLevel] = useState<TemplateLevel | null>(null);
  const [split, setSplit] = useState<TemplateSplit | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLevel(null);
      setSplit(null);
      setSaving(false);
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const levelLabel = TEMPLATE_LEVELS.find((l) => l.key === level)?.label ?? '';
  const splits = WORKOUT_TEMPLATES.filter((s) => s.level === level);

  const handleBack = () => {
    setError(null);
    if (split) setSplit(null);
    else setLevel(null);
  };

  const handleAdd = async () => {
    if (!split) return;
    setSaving(true);
    setError(null);
    try {
      for (const d of split.days) {
        await saveWorkoutPlan(
          uid,
          {
            id: '',
            name: `${split.name} · ${d.name}`,
            scheduledTime: '',
            defaultDays: d.weekdays,
            isRestDay: false,
            exercises: d.exercises,
            cardio: defaultCardio(),
            notes: '',
          },
          false
        );
      }
      onAdded(`${levelLabel} ${split.name}`, split.days.length);
      onClose();
    } catch {
      setError('Could not add these workouts. Check your connection and try again.');
      setSaving(false);
    }
  };

  const title = split ? split.name : level ? `${levelLabel}: choose a split` : 'Ready-made workouts';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Ready-made workouts"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-[1px] flex items-center justify-center p-4"
    >
      <div className="bg-[#131a24] w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border-2 border-[#33445e] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#263347]">
          <div className="flex items-center gap-2 min-w-0">
            {level && (
              <button
                type="button"
                onClick={handleBack}
                aria-label="Back"
                className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-[#1a2332]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <Layers className="w-4 h-4 text-amber-400 shrink-0" />
            <h2 className="text-sm font-semibold text-white truncate">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-[#1a2332]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-3">
          {!level && (
            <>
              <p className="text-xs text-slate-400">What is your training level?</p>
              {TEMPLATE_LEVELS.map((l) => (
                <button
                  key={l.key}
                  type="button"
                  onClick={() => setLevel(l.key)}
                  className="w-full text-left min-h-[56px] px-4 py-3 bg-[#1a2332] border border-[#2d3c54] hover:border-amber-400 rounded-xl transition-colors"
                >
                  <span className="block text-sm font-semibold text-white">{l.label}</span>
                  <span className="block text-xs text-slate-400">{l.hint}</span>
                </button>
              ))}
            </>
          )}

          {level && !split &&
            splits.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSplit(s)}
                className="w-full text-left px-4 py-3 bg-[#1a2332] border border-[#2d3c54] hover:border-amber-400 rounded-xl transition-colors"
              >
                <span className="block text-sm font-semibold text-white">{s.name}</span>
                <span className="block text-xs text-slate-400 mt-0.5">{s.description}</span>
              </button>
            ))}

          {split && (
            <>
              <p className="text-xs text-slate-400">{split.description}</p>
              {split.days.map((d) => (
                <div key={d.name} className="bg-[#1a2332] border border-[#2d3c54] rounded-xl p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-white">{d.name}</h3>
                    <span className="text-[11px] text-slate-400">
                      {d.weekdays.map((w) => DAY_SHORT[w]).join(' · ')}
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {d.exercises.map((ex) => (
                      <li key={ex.id} className="flex justify-between gap-2 text-xs text-slate-300">
                        <span className="truncate">{ex.name}</span>
                        <span className="font-mono tabular-nums text-slate-400 shrink-0">
                          {ex.sets}×{ex.reps}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <p className="text-[11px] text-slate-500">
                Adds {split.days.length} {split.days.length === 1 ? 'plan' : 'plans'} to Training
                Plans. Open a day, pick the workout from the list and train. You can edit the loads
                and exercises afterwards.
              </p>
              {error && <p className="text-xs text-rose-300">{error}</p>}
            </>
          )}
        </div>

        {split && (
          <div className="px-4 py-3 border-t border-[#263347] flex justify-end">
            <button
              type="button"
              onClick={() => void handleAdd()}
              disabled={saving}
              className="min-h-[42px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-60 rounded-lg transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              {saving ? 'Adding...' : 'Add to my plans'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
