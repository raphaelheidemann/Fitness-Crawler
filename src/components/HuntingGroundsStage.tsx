import React from 'react';
import { useT } from '../lib/i18n';
import {
  Award,
  Flame,
  PackageOpen,
  Shield,
  Skull,
  Swords,
  UserCog,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { CrawlerState } from '../types';
import {
  BANNER_THEME_STYLES,
  BOSS_MANTIS_IMG,
  CRAWLER_GEAR_CATALOG,
  CRAWLER_SPRITES,
  getLevelInfo,
  HUNTING_GROUNDS_BG,
  LOOT_CHEST_IMG,
  WeeklyChallengeSummary,
} from '../lib/crawlerEngine';

interface Props {
  crawler: CrawlerState;
  displayName?: string;
  weekNumber: number;
  weeklySummary: WeeklyChallengeSummary;
  onOpenArmory: (initialTab?: 'customize' | 'armory' | 'loot' | 'achievements') => void;
  onOpenGuild?: () => void;
  onToggleSfx: () => void;
}

const AURA_FRAME_CLASSES: Record<string, string> = {
  aur_none: 'border-[#334155] shadow-none',
  aur_torch_ember: 'border-amber-500/80 shadow-[0_0_24px_rgba(245,158,11,0.28)]',
  aur_mantis_crimson: 'border-rose-500/80 shadow-[0_0_24px_rgba(239,68,68,0.32)]',
  aur_forest_emerald: 'border-emerald-400/80 shadow-[0_0_24px_rgba(16,185,129,0.32)]',
  aur_celestial_gold: 'border-yellow-300/90 shadow-[0_0_28px_rgba(253,224,71,0.36)]',
};

export const HuntingGroundsStage: React.FC<Props> = ({
  crawler,
  displayName,
  weekNumber,
  weeklySummary,
  onOpenArmory,
  onOpenGuild,
  onToggleSfx,
}) => {
  const t = useT();
  const { current, next } = getLevelInfo(crawler.xp, crawler.weeklyClears);
  const xpIntoLevel = Math.max(0, crawler.xp - current.xpRequired);
  const xpSpan = next ? Math.max(1, next.xpRequired - current.xpRequired) : 1;
  const xpPct = next ? Math.min(100, Math.round((xpIntoLevel / xpSpan) * 100)) : 100;

  const weaponDef = CRAWLER_GEAR_CATALOG.find((g) => g.id === crawler.equippedWeapon);
  const armorDef = CRAWLER_GEAR_CATALOG.find((g) => g.id === crawler.equippedArmor);
  const accDef = CRAWLER_GEAR_CATALOG.find((g) => g.id === crawler.equippedAccessory);

  const spriteSrc =
    CRAWLER_SPRITES[crawler.equippedSpriteTier] ?? CRAWLER_SPRITES[current.spriteTier];
  const auraFrame = AURA_FRAME_CLASSES[crawler.equippedAura] ?? AURA_FRAME_CLASSES.aur_none;
  const bannerStyle = BANNER_THEME_STYLES[crawler.bannerTheme ?? 'amber'];
  const shownName = crawler.crawlerName?.trim() || displayName || t('Crawler');
  const shownClass = crawler.crawlerClass?.trim() || t('Primal Brawler');

  return (
    <section className={`relative overflow-hidden rounded-lg border-2 ${bannerStyle.border} bg-[#0b1017]`}>
      {/* 8-Bit Hunting Grounds Forest Backdrop */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <img
          src={HUNTING_GROUNDS_BG}
          alt=""
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center opacity-90 pixel-art"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#090d12]/70 via-transparent to-[#090d12]/80" />

        {/* Subtle blinking red eyes lurking in the dark treeline */}
        <div className="hidden sm:flex items-center gap-1.5 absolute top-[44%] left-[42%] animate-eye-blink">
          <span className="w-1.5 h-1 bg-rose-500 rounded-[1px]" />
          <span className="w-1.5 h-1 bg-rose-500 rounded-[1px]" />
        </div>
        <div
          className="hidden md:flex items-center gap-1.5 absolute top-[56%] left-[56%] animate-eye-blink"
          style={{ animationDelay: '2.1s' }}
        >
          <span className="w-1.5 h-1 bg-red-500 rounded-[1px]" />
          <span className="w-1.5 h-1 bg-red-500 rounded-[1px]" />
        </div>
      </div>

      {/* Foreground HUD & Face-Off Arena */}
      <div className="relative z-10 p-4 sm:p-5 flex flex-col justify-between gap-4 sm:gap-5">
        {/* Top Battle HUD Row: Crawler Stats (Left) & Boss HP (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 items-start">
          {/* Crawler HUD */}
          <div className="bg-[#090d12]/75 backdrop-blur-[2px] border border-[#2a3950]/90 rounded-lg p-3 space-y-2 min-w-0">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 min-w-0">
                <span className={`font-pixel text-sm sm:text-base ${bannerStyle.accentText} truncate`}>
                  {shownName}
                </span>
                <span className="text-xs font-semibold text-slate-200">
                  {t('LV {n}', { n: current.level })} · {shownClass}
                </span>
                {crawler.guildName && (
                  <button
                    type="button"
                    onClick={() => onOpenGuild?.()}
                    className="text-xs font-mono text-emerald-300 hover:text-emerald-200 underline-offset-2 hover:underline"
                  >
                    [{crawler.guildName}]
                  </button>
                )}
              </div>
              <span className="text-[11px] font-mono text-slate-300 tabular-nums">
                {t('{n} Bosses Slain', { n: crawler.weeklyClears })}
              </span>
            </div>

            {crawler.crawlerMotto && (
              <p className="text-xs text-slate-300 italic truncate">
                &ldquo;{crawler.crawlerMotto}&rdquo;
              </p>
            )}

            {/* XP Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono mb-1 tabular-nums">
                <span className="text-slate-100 font-semibold">
                  {crawler.xp.toLocaleString()} XP
                </span>
                <span className="text-slate-300">
                  {next
                    ? t('{xp} XP to Lv {n}', {
                        xp: Math.max(0, next.xpRequired - crawler.xp).toLocaleString(),
                        n: next.level,
                      })
                    : t('Max Tier')}
                </span>
              </div>
              <div className="h-2.5 w-full bg-[#090d12] border border-[#2c3b52] rounded-[3px] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-300"
                  style={{ width: `${xpPct}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-200">
              <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                {t('{n}d Streak', { n: crawler.currentStreak })}
              </span>
              <span
                className="inline-flex items-center gap-1 font-mono tabular-nums text-sky-300"
                title={t('Safe-Room Shields protect your streak if you miss a day')}
              >
                <Shield className="w-3.5 h-3.5 text-sky-400" />
                {crawler.streakFreezes} {crawler.streakFreezes === 1 ? t('Shield') : t('Shields')}
              </span>
              <span className="text-slate-400 truncate">
                {t(weaponDef?.name ?? 'Knuckle Wraps')} · {t(armorDef?.name ?? 'Leather Jacket')} ·{' '}
                {t(accDef?.name ?? 'Crawler Grit')}
              </span>
            </div>
            {crawler.recoveryQuestActive && (
              <p className="text-[11px] text-amber-300 font-medium">
                {t('Second Wind active: log 1 workout or habit today to mend streak')}
              </p>
            )}
          </div>

          {/* Boss HUD */}
          <div className="bg-[#090d12]/75 backdrop-blur-[2px] border border-[#2a3950]/90 rounded-lg p-3 space-y-2 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Skull
                  className={`w-3.5 h-3.5 shrink-0 ${
                    weeklySummary.isBossSlain ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                />
                <span className="font-pixel text-xs text-slate-100 truncate">
                  {t('W{n} Boss: {name}', { n: weekNumber, name: t(weeklySummary.bossName) })}
                </span>
              </div>
              <span
                className={`text-xs font-mono font-bold tabular-nums shrink-0 ${
                  weeklySummary.isBossSlain ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {t('{n}% HP', { n: weeklySummary.bossHpRemaining })}
              </span>
            </div>

            <div className="h-2.5 w-full bg-[#090d12] border border-[#2d3b52] rounded-[3px] overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  weeklySummary.isBossSlain ? 'bg-emerald-500' : 'bg-rose-600'
                }`}
                style={{ width: `${weeklySummary.bossHpRemaining}%` }}
              />
            </div>

            <div className="grid grid-cols-4 gap-1.5 text-[11px] font-mono tabular-nums text-slate-200">
              <div className="bg-[#121a26]/85 px-2 py-1 rounded text-center">
                <span className="block text-[10px] text-slate-400">{t('Gym')}</span>
                {weeklySummary.completedWorkouts}/{weeklySummary.targetWorkouts}
              </div>
              <div className="bg-[#121a26]/85 px-2 py-1 rounded text-center">
                <span className="block text-[10px] text-slate-400">{t('Diet')}</span>
                {weeklySummary.nutritionDaysHit}/5{t('d')}
              </div>
              <div className="bg-[#121a26]/85 px-2 py-1 rounded text-center">
                <span className="block text-[10px] text-slate-400">{t('Habits')}</span>
                {weeklySummary.habitCompletionsThisWeek}/{weeklySummary.habitTargetThisWeek}
              </div>
              <div className="bg-[#121a26]/85 px-2 py-1 rounded text-center">
                <span className="block text-[10px] text-slate-400">{t('Water')}</span>
                {weeklySummary.hydrationDaysHit}/5{t('d')}
              </div>
            </div>

            <p className="text-[11px] text-slate-300 truncate">
              {weeklySummary.isBossSlain
                ? t('Slain! Weekly Level-Up & Loot Box earned')
                : t('Hit 85% week discipline to slay ({n}% / 85%)', { n: weeklySummary.overallPct })}
            </p>
          </div>
        </div>

        {/* Open Hunting Grounds Clearing: Crawler (Left, facing right) vs Boss (Right, facing left) */}
        <div className="min-h-[136px] sm:min-h-[168px] px-1 sm:px-6 flex items-end justify-between gap-3">
          {/* Left Fighter: Crawler facing right */}
          <div className="flex flex-col items-start gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onOpenArmory('customize')}
              title={t('Customize your Crawler name, class & gear')}
              className={`relative w-24 h-24 sm:w-32 sm:h-32 rounded-lg border-2 bg-[#0d1117]/85 overflow-hidden flex items-center justify-center transition-transform hover:scale-[1.03] ${auraFrame}`}
            >
              <img
                src={spriteSrc}
                alt={t('{name} Level {n} Sprite', { name: shownName, n: current.level })}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain pixel-art animate-crawler-idle"
              />
            </button>
            <span className="font-pixel text-[10px] text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
              {shownName}
            </span>
          </div>

          {/* Open Center Clearing Indicator */}
          <div className="flex-1 flex flex-col items-center justify-end pb-5 text-center pointer-events-none select-none min-w-0">
            <span className="font-pixel text-xs sm:text-sm text-amber-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
              {weeklySummary.isBossSlain ? t('BOSS SLAIN') : t('VS')}
            </span>
            <span className="text-[11px] font-mono text-slate-200 drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] hidden sm:block">
              {t('Floor 3')} · {t(current.title)}
            </span>
          </div>

          {/* Right Fighter: Weekly Boss facing left */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div
              className={`relative w-24 h-24 sm:w-32 sm:h-32 rounded-lg border-2 bg-[#0d1117]/85 overflow-hidden flex items-center justify-center ${
                weeklySummary.isBossSlain
                  ? 'border-emerald-500/50 opacity-50 grayscale'
                  : 'border-rose-500/70 shadow-[0_0_24px_rgba(239,68,68,0.22)]'
              }`}
            >
              <img
                src={BOSS_MANTIS_IMG}
                alt={t(weeklySummary.bossName)}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain pixel-art animate-crawler-idle"
                style={{ animationDelay: '0.6s' }}
              />
            </div>
            <span className="font-pixel text-[10px] text-rose-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] text-right">
              {t(weeklySummary.bossName)}
            </span>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#2a3950]/70">
          <button
            type="button"
            onClick={() => onOpenArmory('customize')}
            className="min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-100 bg-[#131b27]/90 hover:bg-[#1f2c3f] border border-[#344662] rounded-md transition-colors whitespace-nowrap"
          >
            <UserCog className="w-3.5 h-3.5 text-sky-400" />
            {t('Customize')}
          </button>

          <button
            type="button"
            onClick={() => onOpenArmory('armory')}
            className="min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-100 bg-[#131b27]/90 hover:bg-[#1f2c3f] border border-[#344662] rounded-md transition-colors whitespace-nowrap"
          >
            <Swords className="w-3.5 h-3.5 text-amber-400" />
            {t('Armory')}
          </button>

          {onOpenGuild && (
            <button
              type="button"
              onClick={onOpenGuild}
              className="min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-100 bg-[#131b27]/90 hover:bg-[#1f2c3f] border border-[#344662] rounded-md transition-colors whitespace-nowrap"
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              {t('Guild')}
            </button>
          )}

          <button
            type="button"
            onClick={() => onOpenArmory('achievements')}
            className="min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-100 bg-[#131b27]/90 hover:bg-[#1f2c3f] border border-[#344662] rounded-md transition-colors whitespace-nowrap"
          >
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            {crawler.unlockedAchievementIds.length}/6
          </button>

          {crawler.pendingLootBoxes.length > 0 && (
            <button
              type="button"
              onClick={() => onOpenArmory('loot')}
              className="min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors whitespace-nowrap"
            >
              <img
                src={LOOT_CHEST_IMG}
                alt=""
                referrerPolicy="no-referrer"
                className="w-4 h-4 rounded-[2px] pixel-art object-cover"
              />
              <PackageOpen className="w-3.5 h-3.5 hidden" />
              {t('Open Box ({n})', { n: crawler.pendingLootBoxes.length })}
            </button>
          )}

          <button
            type="button"
            onClick={onToggleSfx}
            aria-label={crawler.sfxEnabled ? t('Mute 8-bit sound effects') : t('Enable 8-bit sound effects')}
            title={crawler.sfxEnabled ? t('8-Bit SFX On') : t('8-Bit SFX Off')}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-300 hover:text-white bg-[#131b27]/90 hover:bg-[#1f2c3f] border border-[#344662] rounded-md transition-colors ml-auto"
          >
            {crawler.sfxEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>
        </div>
      </div>
    </section>
  );
};
