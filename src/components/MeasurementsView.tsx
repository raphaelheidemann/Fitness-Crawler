import React, { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { Measurement, SCHEMA_LIMITS, UserProfile } from '../types';
import { lengthUnit, todayIsoDate, weightUnit } from '../lib/sanitize';
import { deleteMeasurement, saveMeasurement } from '../lib/firestoreService';

interface Props {
  uid: string;
  profile: UserProfile;
  measurements: Measurement[];
  externalOpenCreate?: boolean;
  onCloseExternalCreate?: () => void;
}

export const MeasurementsView: React.FC<Props> = ({
  uid,
  profile,
  measurements,
  externalOpenCreate,
  onCloseExternalCreate,
}) => {
  const wUnit = weightUnit(profile.unitSystem);
  const lUnit = lengthUnit(profile.unitSystem);

  const sortedDesc = useMemo(
    () => [...measurements].sort((a, b) => b.date.localeCompare(a.date)),
    [measurements]
  );
  const sortedAsc = useMemo(
    () => [...measurements].sort((a, b) => a.date.localeCompare(b.date)),
    [measurements]
  );

  const latest = sortedAsc[sortedAsc.length - 1];
  const baseline = sortedAsc[0];

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [weekNumber, setWeekNumber] = useState(profile.currentWeek);
  const [date, setDate] = useState(todayIsoDate());
  const [weight, setWeight] = useState(latest?.weight ?? 78.0);
  const [bodyFatPct, setBodyFatPct] = useState(latest?.bodyFatPct ?? 0);
  const [waist, setWaist] = useState(latest?.waist ?? 0);
  const [chest, setChest] = useState(latest?.chest ?? 0);
  const [hips, setHips] = useState(latest?.hips ?? 0);
  const [arms, setArms] = useState(latest?.arms ?? 0);
  const [thighs, setThighs] = useState(latest?.thighs ?? 0);
  const [neck, setNeck] = useState(latest?.neck ?? 0);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setWeekNumber(profile.currentWeek);
    setDate(todayIsoDate());
    setWeight(latest?.weight ?? 78.0);
    setBodyFatPct(latest?.bodyFatPct ?? 0);
    setWaist(latest?.waist ?? 0);
    setChest(latest?.chest ?? 0);
    setHips(latest?.hips ?? 0);
    setArms(latest?.arms ?? 0);
    setThighs(latest?.thighs ?? 0);
    setNeck(latest?.neck ?? 0);
    setNotes('');
    setModalOpen(true);
  };

  useEffect(() => {
    if (externalOpenCreate) {
      openCreate();
      onCloseExternalCreate?.();
    }
  }, [externalOpenCreate]);

  const openEdit = (m: Measurement) => {
    setEditingId(m.id);
    setWeekNumber(m.weekNumber);
    setDate(m.date);
    setWeight(m.weight);
    setBodyFatPct(m.bodyFatPct);
    setWaist(m.waist);
    setChest(m.chest);
    setHips(m.hips);
    setArms(m.arms);
    setThighs(m.thighs);
    setNeck(m.neck);
    setNotes(m.notes);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveMeasurement(
        uid,
        {
          id: editingId ?? '',
          weekNumber,
          date,
          weight,
          bodyFatPct,
          waist,
          chest,
          hips,
          arms,
          thighs,
          neck,
          notes,
        },
        Boolean(editingId)
      );
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const deltaLabel = (curr?: number, base?: number, unit?: string) => {
    if (!curr || !base || sortedAsc.length < 2) return null;
    const diff = Number((curr - base).toFixed(1));
    return `${diff > 0 ? `+${diff}` : diff} ${unit ?? ''}`.trim();
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#131a24] border-2 border-[#263347] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400">
            {measurements.length} recorded check-ins · Units in {wUnit} and {lUnit}
          </p>
          <h1 className="text-xl font-bold text-white mt-1">
            Body Measurements & Check-ins
          </h1>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Log Measurement
        </button>
      </div>

      {/* Latest vs Baseline Strip */}
      {latest && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Weight', val: latest.weight, base: baseline?.weight, unit: wUnit },
            { label: 'Body Fat', val: latest.bodyFatPct, base: baseline?.bodyFatPct, unit: '%' },
            { label: 'Waist', val: latest.waist, base: baseline?.waist, unit: lUnit },
            { label: 'Chest', val: latest.chest, base: baseline?.chest, unit: lUnit },
            { label: 'Arms', val: latest.arms, base: baseline?.arms, unit: lUnit },
            { label: 'Thighs', val: latest.thighs, base: baseline?.thighs, unit: lUnit },
          ].map((stat) => {
            const d = deltaLabel(stat.val, stat.base, stat.unit);
            return (
              <div key={stat.label} className="bg-[#131a24] border-2 border-[#263347] rounded-xl p-4">
                <p className="text-xs text-slate-400">{stat.label}</p>
                <p className="text-lg font-bold text-white font-mono tabular-nums mt-1">
                  {stat.val > 0 ? `${stat.val} ${stat.unit}` : '—'}
                </p>
                <p className="text-[11px] text-slate-400 font-mono tabular-nums mt-1">
                  {d ? `${d} vs W${baseline.weekNumber}` : 'Baseline'}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* History Table */}
      <div className="bg-[#131a24] border-2 border-[#263347] rounded-xl overflow-hidden">
        {sortedDesc.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-slate-200">No measurements recorded yet</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Record your current weight, body fat, and circumferences to track weekly progress.
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg"
            >
              Log First Check-in
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0e141d] border-b border-[#253247] text-xs font-medium text-slate-400">
                  <th className="py-3 px-4">Week</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3 text-right">Weight ({wUnit})</th>
                  <th className="py-3 px-3 text-right">BF %</th>
                  <th className="py-3 px-3 text-right">Waist ({lUnit})</th>
                  <th className="py-3 px-3 text-right">Chest ({lUnit})</th>
                  <th className="py-3 px-3 text-right">Hips ({lUnit})</th>
                  <th className="py-3 px-3 text-right">Arms ({lUnit})</th>
                  <th className="py-3 px-3 text-right">Thighs ({lUnit})</th>
                  <th className="py-3 px-3">Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b] text-sm">
                {sortedDesc.map((m) => (
                  <tr key={m.id} className="hover:bg-[#17202e]">
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-amber-300 tabular-nums">
                      W{m.weekNumber}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-slate-300 tabular-nums whitespace-nowrap">
                      {m.date}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-white tabular-nums">
                      {m.weight.toFixed(1)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-300 tabular-nums">
                      {m.bodyFatPct > 0 ? `${m.bodyFatPct.toFixed(1)}%` : '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-300 tabular-nums">
                      {m.waist > 0 ? m.waist.toFixed(1) : '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-300 tabular-nums">
                      {m.chest > 0 ? m.chest.toFixed(1) : '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-300 tabular-nums">
                      {m.hips > 0 ? m.hips.toFixed(1) : '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-300 tabular-nums">
                      {m.arms > 0 ? m.arms.toFixed(1) : '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-300 tabular-nums">
                      {m.thighs > 0 ? m.thighs.toFixed(1) : '—'}
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-400 max-w-[220px] truncate">
                      {m.notes || '—'}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEdit(m)}
                        aria-label={`Edit W${m.weekNumber} measurement`}
                        className="p-1.5 text-slate-400 hover:text-white rounded-md"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteMeasurement(uid, m.id)}
                        aria-label={`Delete W${m.weekNumber} measurement`}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-md ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log / Edit Measurement Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-xl bg-[#131a24] border-2 border-[#33445e] rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 bg-[#0f151e] border-b border-[#253247]">
              <h2 className="text-base font-semibold text-white">
                {editingId ? 'Edit Check-in' : 'Log Body Measurement'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close measurement modal"
                className="p-2 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Week #</label>
                  <input
                    type="number"
                    min={1}
                    max={52}
                    required
                    value={weekNumber}
                    onChange={(e) => setWeekNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm text-white bg-[#0e141d] font-mono tabular-nums border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-white bg-[#0e141d] font-mono tabular-nums border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Weight ({wUnit})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min={20}
                    max={500}
                    required
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm text-white bg-[#0e141d] font-mono tabular-nums border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Body Fat (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    max={70}
                    value={bodyFatPct}
                    onChange={(e) => setBodyFatPct(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm text-white bg-[#0e141d] font-mono tabular-nums border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-[#253247]">
                <p className="text-xs font-medium text-slate-300 mb-2">
                  Circumferences ({lUnit}) — leave 0 if unmeasured
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Waist</label>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={300}
                      value={waist}
                      onChange={(e) => setWaist(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm text-white bg-[#0e141d] font-mono tabular-nums border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Chest</label>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={300}
                      value={chest}
                      onChange={(e) => setChest(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm text-white bg-[#0e141d] font-mono tabular-nums border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Hips</label>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={300}
                      value={hips}
                      onChange={(e) => setHips(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm text-white bg-[#0e141d] font-mono tabular-nums border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Arms</label>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={150}
                      value={arms}
                      onChange={(e) => setArms(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm text-white bg-[#0e141d] font-mono tabular-nums border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Thighs</label>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={200}
                      value={thighs}
                      onChange={(e) => setThighs(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm text-white bg-[#0e141d] font-mono tabular-nums border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Neck</label>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={100}
                      value={neck}
                      onChange={(e) => setNeck(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm text-white bg-[#0e141d] font-mono tabular-nums border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Notes</label>
                <textarea
                  rows={2}
                  maxLength={SCHEMA_LIMITS.NOTES_MAX}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Sleep quality, hydration, strength PRs..."
                  className="w-full px-3 py-2 text-sm text-white placeholder:text-slate-500 bg-[#0e141d] border border-[#2d3c54] rounded-lg focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#253247]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-200 hover:bg-[#1a2332] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg"
                >
                  {saving ? 'Saving...' : 'Save Check-in'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
