import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { Award, CalendarDays, Dumbbell, Flame, Shield, Swords, Utensils } from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import {
  BOSS_MANTIS_IMG,
  CRAWLER_SPRITES,
  HUNTING_GROUNDS_BG,
  LOOT_CHEST_IMG,
} from '../lib/crawlerEngine';

export const AuthGate: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Sign-in could not be completed. Please allow popups and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d12] text-slate-100 flex flex-col justify-between">
      <header className="flex items-center justify-between gap-8 px-6 lg:px-12 py-4 border-b-2 border-[#233044] bg-[#0d121a]">
        <span className="font-pixel text-base sm:text-lg text-amber-400 whitespace-nowrap shrink-0">
          Fitness Crawler
        </span>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <span className="whitespace-nowrap shrink-0">Gym &amp; Cardio</span>
          <span className="whitespace-nowrap shrink-0">Diet &amp; Macros</span>
          <span className="whitespace-nowrap shrink-0">Habit Mosaic</span>
          <span className="whitespace-nowrap shrink-0">Crawler Armory</span>
        </nav>
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="min-h-[42px] px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-md transition-colors whitespace-nowrap shrink-0"
        >
          {loading ? 'Entering...' : 'Sign in'}
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-center">
            <p className="font-pixel text-xs text-emerald-400 mb-3">
              FLOOR 3 · THE HUNTING GROUNDS
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight mb-4 [text-wrap:balance]">
              Enter the dungeon. Train, prep your meals, and level up your crawler.
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl mb-7">
              Every gym session, run, meal day, hydration goal, and daily habit square deals damage
              to the Weekly Boss—unlocking new 8-bit character sprites, gear, and Loot Boxes.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="min-h-[46px] px-6 py-3 text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-md transition-colors whitespace-nowrap"
              >
                {loading ? 'Connecting account...' : 'Continue with Google'}
              </button>
              <span className="text-xs text-slate-400">
                Private cloud save synced between gym phone &amp; desktop
              </span>
            </div>

            {error && (
              <p className="mt-4 text-sm text-rose-200 bg-rose-950/60 border border-rose-500/50 rounded-md px-4 py-2.5">
                {error}
              </p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mt-9 pt-7 border-t border-[#233044]">
              <div>
                <div className="flex items-center gap-2 text-slate-100 font-semibold text-sm mb-1">
                  <Dumbbell className="w-4 h-4 text-emerald-400" />
                  Gym Splits
                </div>
                <p className="text-xs text-slate-400">Rest timers, exercise GIFs &amp; CSV plans.</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-slate-100 font-semibold text-sm mb-1">
                  <Utensils className="w-4 h-4 text-sky-400" />
                  6+ Meal Prep
                </div>
                <p className="text-xs text-slate-400">Macros, quick food &amp; hydration tracker.</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-slate-100 font-semibold text-sm mb-1">
                  <Swords className="w-4 h-4 text-amber-400" />
                  Boss Clears
                </div>
                <p className="text-xs text-slate-400">Hit 85% weekly goals to earn Loot Boxes.</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-slate-100 font-semibold text-sm mb-1">
                  <Shield className="w-4 h-4 text-violet-400" />
                  Safe Shields
                </div>
                <p className="text-xs text-slate-400">Forgiving streaks &amp; habit mosaic.</p>
              </div>
            </div>
          </div>

          {/* Right 8-Bit Hunting Grounds Showcase Card */}
          <div className="lg:col-span-5 bg-[#131a24] border-2 border-[#2c3b52] rounded-xl overflow-hidden flex flex-col justify-between">
            <div className="relative h-52 bg-[#0d1117] overflow-hidden border-b-2 border-[#263347]">
              <img
                src={HUNTING_GROUNDS_BG}
                alt="8-bit Hunting Grounds forest at twilight"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover pixel-art opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#131a24] via-transparent to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                <img
                  src={CRAWLER_SPRITES[1]}
                  alt="Lv 1 Barefoot Crawler"
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-md border-2 border-amber-400/70 bg-[#0d1117]/90 object-contain pixel-art animate-crawler-idle"
                />
                <img
                  src={BOSS_MANTIS_IMG}
                  alt="Razor Mantis Boss"
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-md border-2 border-rose-500/70 bg-[#0d1117]/90 object-contain pixel-art"
                />
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-pixel text-xs text-amber-400">8-Tier Crawler Evolution</p>
                  <h2 className="text-sm font-semibold text-slate-100 mt-1">
                    From Barefoot Novice to Apex Floor Warden
                  </h2>
                </div>
                <img
                  src={LOOT_CHEST_IMG}
                  alt="Dungeon Loot Chest"
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded bg-[#0d1117] border border-amber-500/40 pixel-art"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs font-mono tabular-nums">
                <div className="bg-[#0e141d] border border-[#233044] rounded p-2.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400 mb-1" />
                  <span className="block text-slate-200 font-semibold">+50 XP</span>
                  <span className="text-[11px] text-slate-400">Workout</span>
                </div>
                <div className="bg-[#0e141d] border border-[#233044] rounded p-2.5">
                  <CalendarDays className="w-3.5 h-3.5 text-emerald-400 mb-1" />
                  <span className="block text-slate-200 font-semibold">70 Tiles</span>
                  <span className="text-[11px] text-slate-400">Habit Grid</span>
                </div>
                <div className="bg-[#0e141d] border border-[#233044] rounded p-2.5">
                  <Award className="w-3.5 h-3.5 text-sky-400 mb-1" />
                  <span className="block text-slate-200 font-semibold">Loot Box</span>
                  <span className="text-[11px] text-slate-400">Weekly Clear</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
