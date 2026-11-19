import React from 'react';
import { CrawlerSprite } from './CrawlerSprite';
import { useT } from '../lib/i18n';
import { Award, Flame, Shield, Skull, Swords, Users, X } from 'lucide-react';
import { GuildMember, PublicCrawler } from '../types';
import {
  BANNER_THEME_STYLES,
  CRAWLER_ACHIEVEMENTS,
  CRAWLER_GEAR_CATALOG,
  getLevelInfo,
  HUNTING_GROUNDS_BG,
} from '../lib/crawlerEngine';

export type InspectableCrawler = PublicCrawler | GuildMember;

interface Props {
  open: boolean;
  crawler: InspectableCrawler | null;
  guildNameFallback?: string;
  isSelf?: boolean;
  onClose: () => void;
}

const AURA_FRAME_CLASSES: Record<string, string> = {
  aur_none: 'border-[#334155]',
  aur_torch_ember: 'border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.28)]',
  aur_mantis_crimson: 'border-rose-500/80 shadow-[0_0_20px_rgba(239,68,68,0.3)]',
  aur_forest_emerald: 'border-emerald-400/80 shadow-[0_0_20px_rgba(16,185,129,0.3)]',
  aur_celestial_gold: 'border-yellow-300/90 shadow-[0_0_24px_rgba(253,224,71,0.34)]',
};

export const CrawlerProfileModal: React.FC<Props> = ({
  open,
  crawler,
  guildNameFallback = '',
  isSelf = false,
  onClose,
}) => {
  const t = useT();
  if (!open || !crawler) return null;

  const { current, next } = getLevelInfo(crawler.xp, crawler.weeklyClears);
  const xpIntoLevel = Math.max(0, crawler.xp - current.xpRequired);
  const xpSpan = next ? Math.max(1, next.xpRequired - current.xpRequired) : 1;
  const xpPct = next ? Math.min(100, Math.round((xpIntoLevel / xpSpan) * 100)) : 100;

  const theme = BANNER_THEME_STYLES[crawler.bannerTheme] ?? BANNER_THEME_STYLES.amber;
  const auraFrame = AURA_FRAME_CLASSES[crawler.equippedAura] ?? AURA_FRAME_CLASSES.aur_none;

  const weaponDef = CRAWLER_GEAR_CATALOG.find((g) => g.id === crawler.equippedWeapon);
  const armorDef = CRAWLER_GEAR_CATALOG.find((g) => g.id === crawler.equippedArmor);
  const accDef = CRAWLER_GEAR_CATALOG.find((g) => g.id === crawler.equippedAccessory);
  const auraDef = CRAWLER_GEAR_CATALOG.find((g) => g.id === crawler.equippedAura);

  const guildName =
    'guildName' in crawler && crawler.guildName ? crawler.guildName : guildNameFallback;
  const roleLabel = 'role' in crawler && crawler.role === 'leader' ? t('Guild Leader') : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      role="dialog"
      aria-modal="true"
      aria-labelledby="crawler-profile-title"
    >
      <div className="bg-[#131a24] border-2 border-[#33445e] rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Hero Backdrop Header */}
        <div className="relative h-44 bg-[#0b1017] border-b border-[#253247] shrink-0">
          <img
            src={HUNTING_GROUNDS_BG}
            alt={t('Hunting Grounds forest backdrop')}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-45 pixel-art"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#131a24] via-[#0b1017]/60 to-transparent" />

          <button
            type="button"
            onClick={onClose}
            aria-label={t('Close profile')}
            className="absolute top-3 right-3 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg bg-[#0d121a]/85 border border-[#2d3c54] text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="absolute bottom-4 left-5 right-5 flex items-end gap-4">
            <div
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-lg border-2 bg-[#0d1117] overflow-hidden shrink-0 flex items-center justify-center ${auraFrame}`}
            >
              <CrawlerSprite
                tier={crawler.equippedSpriteTier}
                look={crawler.look}
                alt={t('{name} sprite', { name: crawler.crawlerName })}
                className="w-full h-full object-contain pixel-art animate-crawler-idle"
              />
            </div>

            <div className="min-w-0 flex-1 pb-0.5">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <h2
                  id="crawler-profile-title"
                  className="text-lg sm:text-xl font-bold text-white truncate"
                >
                  {crawler.crawlerName}
                </h2>
                {isSelf && (
                  <span className="text-xs font-mono text-emerald-400">{t('You')}</span>
                )}
                {roleLabel && (
                  <span className="text-xs font-mono text-amber-400">· {roleLabel}</span>
                )}
              </div>
              <p className={`text-xs font-semibold ${theme.accentText} mt-0.5`}>
                {t(crawler.crawlerClass)} · {t('LV {n}', { n: current.level })} {t(current.title)}
              </p>
              {guildName && (
                <p className="text-xs text-slate-300 mt-1 inline-flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{guildName}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {crawler.crawlerMotto && (
            <div className={`p-3.5 rounded-lg border ${theme.border} bg-[#0e141d]`}>
              <p className="text-xs text-slate-400 mb-1">{t('Battle Motto')}</p>
              <p className="text-sm text-slate-100 italic">&ldquo;{crawler.crawlerMotto}&rdquo;</p>
            </div>
          )}

          {/* XP Progress */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono mb-1.5 tabular-nums">
              <span className="text-slate-100 font-semibold">
                {crawler.xp.toLocaleString()} XP
              </span>
              <span className="text-slate-400">
                {next
                  ? t('{xp} XP to Lv {n}', {
                      xp: Math.max(0, next.xpRequired - crawler.xp).toLocaleString(),
                      n: next.level,
                    })
                  : t('Max Crawler Tier')}
              </span>
            </div>
            <div className="h-2.5 w-full bg-[#0a0f16] border border-[#29374c] rounded overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-600 to-amber-400"
                style={{ width: `${xpPct}%` }}
              />
            </div>
          </div>

          {/* Key Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-[#0e141d] border border-[#253247]">
              <p className="text-xs text-slate-400">{t('Bosses Slain')}</p>
              <p className="text-lg font-bold font-mono text-rose-400 mt-1 tabular-nums inline-flex items-center gap-1.5">
                <Skull className="w-4 h-4" />
                {crawler.weeklyClears}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[#0e141d] border border-[#253247]">
              <p className="text-xs text-slate-400">{t('Current Streak')}</p>
              <p className="text-lg font-bold font-mono text-amber-400 mt-1 tabular-nums inline-flex items-center gap-1.5">
                <Flame className="w-4 h-4" />
                {crawler.currentStreak}{t('d')}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[#0e141d] border border-[#253247]">
              <p className="text-xs text-slate-400">{t('Best Streak')}</p>
              <p className="text-lg font-bold font-mono text-emerald-400 mt-1 tabular-nums inline-flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                {crawler.bestStreak}{t('d')}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[#0e141d] border border-[#253247]">
              <p className="text-xs text-slate-400">{t('Gear Unlocked')}</p>
              <p className="text-lg font-bold font-mono text-sky-400 mt-1 tabular-nums inline-flex items-center gap-1.5">
                <Swords className="w-4 h-4" />
                {crawler.unlockedGearCount}
              </p>
            </div>
          </div>

          {/* Equipped Loadout */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2.5">
              {t('Equipped Loadout')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { label: t('Weapon'), item: weaponDef },
                { label: t('Armor'), item: armorDef },
                { label: t('Headgear & Relic'), item: accDef },
                { label: t('Stage Aura'), item: auraDef },
              ].map(({ label, item }) => (
                <div
                  key={label}
                  className="p-3 rounded-lg bg-[#0e141d] border border-[#253247]"
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                    <span>{label}</span>
                    {item && (
                      <span className="font-mono uppercase text-amber-300">{t(item.rarity)}</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-slate-100 mt-1">
                    {item ? t(item.name) : t('Default Starter')}
                  </p>
                  {item && (
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      {t(item.description)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2.5">
              {t('Achievements ({n}/6)', { n: crawler.unlockedAchievementIds.length })}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CRAWLER_ACHIEVEMENTS.map((ach) => {
                const unlocked = crawler.unlockedAchievementIds.includes(ach.id);
                return (
                  <div
                    key={ach.id}
                    className={`p-3 rounded-lg border flex items-start gap-2.5 ${
                      unlocked
                        ? 'border-emerald-500/45 bg-emerald-950/20'
                        : 'border-[#212d40] bg-[#0e141d] opacity-55'
                    }`}
                  >
                    <Award
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        unlocked ? 'text-emerald-400' : 'text-slate-600'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-100">{t(ach.title)}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{t(ach.description)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
