import React, { useState } from 'react';
import { useT } from '../lib/i18n';
import {
  Award,
  Check,
  Lock,
  PackageOpen,
  Shield,
  Sparkles,
  Swords,
  UserCog,
  X,
} from 'lucide-react';
import { AppearanceEditor } from './AppearanceEditor';
import { CrawlerSprite } from './CrawlerSprite';
import { encodeLook, parseLook } from '../lib/crawlerLook';
import {
  BANNER_THEME_OPTIONS,
  BannerTheme,
  CrawlerState,
  CrawlerStyle,
  GearSlot,
  LootBoxTier,
  SCHEMA_LIMITS,
} from '../types';
import {
  BANNER_THEME_STYLES,
  CRAWLER_ACHIEVEMENTS,
  CRAWLER_CLASS_PRESETS,
  CRAWLER_GEAR_CATALOG,
  CRAWLER_LEVELS,
  GearItemDef,
  getLevelInfo,
  LOOT_CHEST_IMG,
  playRetroSfx,
  rollLootBoxReward,
} from '../lib/crawlerEngine';

type ArmoryTab = 'customize' | 'armory' | 'loot' | 'achievements';

interface Props {
  open: boolean;
  initialTab?: ArmoryTab;
  onClose: () => void;
  crawler: CrawlerState;
  spriteStyle?: CrawlerStyle;
  onUpdateCrawler: (next: Omit<CrawlerState, 'createdAt' | 'updatedAt'>) => Promise<void>;
}

const SLOT_LABELS: { slot: GearSlot; label: string }[] = [
  { slot: 'weapon', label: 'Weapons' },
  { slot: 'armor', label: 'Armor & Cloaks' },
  { slot: 'accessory', label: 'Headgear & Relics' },
  { slot: 'aura', label: 'Stage Auras' },
];

const AURA_BORDER_PREVIEW: Record<string, string> = {
  aur_none: 'border-[#334155]',
  aur_torch_ember: 'border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.25)]',
  aur_mantis_crimson: 'border-rose-500/80 shadow-[0_0_20px_rgba(239,68,68,0.28)]',
  aur_forest_emerald: 'border-emerald-400/80 shadow-[0_0_20px_rgba(16,185,129,0.28)]',
  aur_celestial_gold: 'border-yellow-300/90 shadow-[0_0_24px_rgba(253,224,71,0.32)]',
};

export const CrawlerArmoryModal: React.FC<Props> = ({
  open,
  initialTab = 'armory',
  onClose,
  crawler,
  spriteStyle,
  onUpdateCrawler,
}) => {
  const t = useT();
  const [activeTab, setActiveTab] = useState<ArmoryTab>(initialTab);
  const [selectedSlot, setSelectedSlot] = useState<GearSlot>('weapon');
  const [openingBox, setOpeningBox] = useState(false);
  const [lastLootDrop, setLastLootDrop] = useState<{
    tier: LootBoxTier;
    item: GearItemDef;
    bonusXp: number;
  } | null>(null);

  const [crawlerName, setCrawlerName] = useState(crawler.crawlerName || 'Crawler');
  const [crawlerClass, setCrawlerClass] = useState(crawler.crawlerClass || 'Primal Brawler');
  const [crawlerMotto, setCrawlerMotto] = useState(crawler.crawlerMotto || '');
  const [bannerTheme, setBannerTheme] = useState<BannerTheme>(crawler.bannerTheme ?? 'amber');
  const [isPublicProfile, setIsPublicProfile] = useState(crawler.isPublicProfile ?? false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSavedMsg, setProfileSavedMsg] = useState<string | null>(null);
  const [lookDraft, setLookDraft] = useState(() => parseLook(crawler.look, spriteStyle));

  React.useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
      setLastLootDrop(null);
      setCrawlerName(crawler.crawlerName || 'Crawler');
      setCrawlerClass(crawler.crawlerClass || 'Primal Brawler');
      setCrawlerMotto(crawler.crawlerMotto || '');
      setBannerTheme(crawler.bannerTheme ?? 'amber');
      setIsPublicProfile(crawler.isPublicProfile ?? false);
      setLookDraft(parseLook(crawler.look, spriteStyle));
      setProfileSavedMsg(null);
    }
  }, [
    open,
    initialTab,
    crawler.crawlerName,
    crawler.crawlerClass,
    crawler.crawlerMotto,
    crawler.bannerTheme,
    crawler.isPublicProfile,
    crawler.look,
    spriteStyle,
  ]);

  if (!open) return null;

  const { current } = getLevelInfo(crawler.xp, crawler.weeklyClears);
  const maxUnlockedSpriteTier = current.spriteTier;
  const themeStyle = BANNER_THEME_STYLES[bannerTheme];
  const previewAuraBorder =
    AURA_BORDER_PREVIEW[crawler.equippedAura] ?? AURA_BORDER_PREVIEW.aur_none;

  const handleSaveCharacterProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingProfile) return;
    setSavingProfile(true);
    setProfileSavedMsg(null);
    try {
      const cleanName = crawlerName.trim().slice(0, SCHEMA_LIMITS.CRAWLER_NAME_MAX) || 'Crawler';
      const cleanClass =
        crawlerClass.trim().slice(0, SCHEMA_LIMITS.CRAWLER_CLASS_MAX) || 'Primal Brawler';
      const cleanMotto = crawlerMotto.trim().slice(0, SCHEMA_LIMITS.CRAWLER_MOTTO_MAX);
      playRetroSfx('xp', crawler.sfxEnabled);
      await onUpdateCrawler({
        ...crawler,
        crawlerName: cleanName,
        crawlerClass: cleanClass,
        crawlerMotto: cleanMotto,
        bannerTheme,
        isPublicProfile,
        look: encodeLook(lookDraft),
      });
      setProfileSavedMsg(t('Crawler identity updated and synced to rankings.'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleEquipSpriteTier = async (tier: 1 | 2 | 3 | 4) => {
    if (tier > maxUnlockedSpriteTier) return;
    playRetroSfx('xp', crawler.sfxEnabled);
    await onUpdateCrawler({
      ...crawler,
      equippedSpriteTier: tier,
    });
  };

  const getEquippedForSlot = (slot: GearSlot): string => {
    if (slot === 'weapon') return crawler.equippedWeapon;
    if (slot === 'armor') return crawler.equippedArmor;
    if (slot === 'accessory') return crawler.equippedAccessory;
    return crawler.equippedAura;
  };

  const handleEquipGear = async (item: GearItemDef) => {
    if (!crawler.unlockedGearIds.includes(item.id)) return;
    playRetroSfx('xp', crawler.sfxEnabled);
    const next = { ...crawler };
    if (item.slot === 'weapon') next.equippedWeapon = item.id;
    if (item.slot === 'armor') next.equippedArmor = item.id;
    if (item.slot === 'accessory') next.equippedAccessory = item.id;
    if (item.slot === 'aura') next.equippedAura = item.id;
    await onUpdateCrawler(next);
  };

  const handleOpenLootBox = async () => {
    if (crawler.pendingLootBoxes.length === 0 || openingBox) return;
    setOpeningBox(true);
    try {
      const [boxTier, ...remainingBoxes] = crawler.pendingLootBoxes;
      const droppedGear = rollLootBoxReward(crawler.unlockedGearIds);
      const bonusXp =
        boxTier === 'platinum' ? 120 : boxTier === 'gold' ? 80 : boxTier === 'silver' ? 50 : 30;
      const nextUnlocked = Array.from(new Set([...crawler.unlockedGearIds, droppedGear.id]));
      const nextXp = Math.min(1000000, crawler.xp + bonusXp);
      const nextLevel = getLevelInfo(nextXp, crawler.weeklyClears).current.level;

      playRetroSfx('loot', crawler.sfxEnabled);
      await onUpdateCrawler({
        ...crawler,
        xp: nextXp,
        level: nextLevel,
        pendingLootBoxes: remainingBoxes,
        unlockedGearIds: nextUnlocked,
      });
      setLastLootDrop({ tier: boxTier, item: droppedGear, bonusXp });
    } finally {
      setOpeningBox(false);
    }
  };

  const slotGear = CRAWLER_GEAR_CATALOG.filter((g) => g.slot === selectedSlot);
  const equippedId = getEquippedForSlot(selectedSlot);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
      role="dialog"
      aria-modal="true"
      aria-labelledby="crawler-armory-title"
    >
      <div className="bg-[#131a24] border-2 border-[#33445e] rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#253247] flex items-center justify-between gap-4 bg-[#0f151e]">
          <div>
            <h2 id="crawler-armory-title" className="font-pixel text-sm sm:text-base text-amber-400">
              {t('Crawler Armory & Safe Room')}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {t('Customize your pixel crawler, open earned Loot Boxes, and track Hunting Grounds achievements.')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('Close armory')}
            className="min-h-[42px] min-w-[42px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 pb-2 border-b border-[#253247] flex flex-wrap gap-2 bg-[#111822]">
          <button
            type="button"
            onClick={() => setActiveTab('customize')}
            className={`min-h-[40px] px-3.5 py-2 text-xs font-semibold rounded-md inline-flex items-center gap-1.5 transition-colors ${
              activeTab === 'customize'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-[#1a2332] text-slate-300 hover:text-white'
            }`}
          >
            <UserCog className="w-3.5 h-3.5" />
            {t('Character')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('armory')}
            className={`min-h-[40px] px-3.5 py-2 text-xs font-semibold rounded-md inline-flex items-center gap-1.5 transition-colors ${
              activeTab === 'armory'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-[#1a2332] text-slate-300 hover:text-white'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            {t('Sprites & Gear')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('loot')}
            className={`min-h-[40px] px-3.5 py-2 text-xs font-semibold rounded-md inline-flex items-center gap-1.5 transition-colors ${
              activeTab === 'loot'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-[#1a2332] text-slate-300 hover:text-white'
            }`}
          >
            <PackageOpen className="w-3.5 h-3.5" />
            {t('Loot Boxes ({n})', { n: crawler.pendingLootBoxes.length })}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('achievements')}
            className={`min-h-[40px] px-3.5 py-2 text-xs font-semibold rounded-md inline-flex items-center gap-1.5 transition-colors ${
              activeTab === 'achievements'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-[#1a2332] text-slate-300 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            {t('Achievements & Tiers')}
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {activeTab === 'customize' && (
            <form onSubmit={(e) => void handleSaveCharacterProfile(e)} className="space-y-5">
              {/* Live Preview Banner */}
              <div className={`rounded-xl border-2 p-4 bg-[#0f151e] flex items-center gap-4 ${themeStyle.border}`}>
                <div
                  className={`w-20 h-20 rounded-lg border-2 bg-[#0d1117] overflow-hidden shrink-0 flex items-center justify-center ${previewAuraBorder}`}
                >
                  <CrawlerSprite
                    tier={crawler.equippedSpriteTier}
                    lookOverride={lookDraft}
                    alt={crawlerName || t('Crawler Preview')}
                    className="w-full h-full object-contain pixel-art animate-crawler-idle"
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className={`font-pixel text-xs sm:text-sm truncate ${themeStyle.accentText}`}>
                    {crawlerName.trim() || t('Crawler')}
                  </p>
                  <p className="text-xs text-slate-300 font-medium truncate">
                    {t('LV {n}', { n: current.level })} · {t(crawlerClass.trim() || 'Primal Brawler')}
                    {crawler.guildName ? ` · [${crawler.guildName}]` : ''}
                  </p>
                  {crawlerMotto.trim() ? (
                    <p className="text-xs text-slate-400 italic truncate">
                      &ldquo;{crawlerMotto.trim()}&rdquo;
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500">
                      {t('Add a battle motto shown on your public Crawler card')}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="crawler-name-input"
                    className="block text-xs font-medium text-slate-300 mb-1.5"
                  >
                    {t('Crawler Name')}
                  </label>
                  <input
                    id="crawler-name-input"
                    type="text"
                    required
                    maxLength={SCHEMA_LIMITS.CRAWLER_NAME_MAX}
                    value={crawlerName}
                    onChange={(e) => setCrawlerName(e.target.value)}
                    placeholder={t('e.g. Iron Carl')}
                    className="w-full px-3 py-2 text-sm text-white bg-[#0d121a] border border-[#2d3c54] rounded-md focus:outline-none focus:border-amber-400"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    {t('Visible to friends in guilds & leaderboards (max {n} chars).', { n: SCHEMA_LIMITS.CRAWLER_NAME_MAX })}
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="crawler-class-input"
                    className="block text-xs font-medium text-slate-300 mb-1.5"
                  >
                    {t('Class / Archetype')}
                  </label>
                  <input
                    id="crawler-class-input"
                    type="text"
                    required
                    maxLength={SCHEMA_LIMITS.CRAWLER_CLASS_MAX}
                    value={crawlerClass}
                    onChange={(e) => setCrawlerClass(e.target.value)}
                    placeholder={t('Primal Brawler')}
                    className="w-full px-3 py-2 text-sm text-white bg-[#0d121a] border border-[#2d3c54] rounded-md focus:outline-none focus:border-amber-400"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {CRAWLER_CLASS_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setCrawlerClass(preset)}
                        className={`px-2 py-1 text-[11px] rounded border transition-colors ${
                          crawlerClass === preset
                            ? 'border-amber-400 bg-amber-500/15 text-amber-300'
                            : 'border-[#28364c] bg-[#161f2c] text-slate-400 hover:text-white'
                        }`}
                      >
                        {t(preset)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="crawler-motto-input"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  {t('Battle Motto / Tagline')}
                </label>
                <input
                  id="crawler-motto-input"
                  type="text"
                  maxLength={SCHEMA_LIMITS.CRAWLER_MOTTO_MAX}
                  value={crawlerMotto}
                  onChange={(e) => setCrawlerMotto(e.target.value)}
                  placeholder={t('They will not break me. Floor 3 starts at 5 AM.')}
                  className="w-full px-3 py-2 text-sm text-white bg-[#0d121a] border border-[#2d3c54] rounded-md focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <span className="block text-xs font-medium text-slate-300 mb-2">
                  {t('Banner Accent Color')}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {BANNER_THEME_OPTIONS.map((opt) => {
                    const style = BANNER_THEME_STYLES[opt];
                    const selected = bannerTheme === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setBannerTheme(opt)}
                        className={`min-h-[40px] px-3 py-2 rounded-md border flex items-center gap-2 text-xs font-medium transition-colors ${
                          selected
                            ? `${style.border} bg-[#1b2434] text-white`
                            : 'border-[#253247] bg-[#111822] text-slate-300 hover:text-white'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-sm shrink-0 ${style.swatch}`} />
                        <span className="truncate">{t(style.label.split(' ')[1])}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <AppearanceEditor look={lookDraft} onChange={setLookDraft} />

              <label className="flex items-start gap-3 p-3.5 rounded-lg border border-[#26344a] bg-[#0f151e] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublicProfile}
                  onChange={(e) => setIsPublicProfile(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[#33445e] bg-[#0d121a] text-amber-400 focus:ring-amber-400"
                />
                <div className="text-xs">
                  <p className="font-semibold text-slate-200">
                    {t('Show my Crawler on the Global Floor 3 Leaderboard')}
                  </p>
                  <p className="text-slate-400 mt-0.5 leading-relaxed">
                    {t('Only your RPG identity, level, XP, streak, boss clears, and equipped gear are shared. Your workouts, diet logs, weight, and habits always stay 100% private.')}
                  </p>
                </div>
              </label>

              {profileSavedMsg && (
                <p className="text-xs font-medium text-emerald-400">{profileSavedMsg}</p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#253247]">
                <button
                  type="button"
                  onClick={() => setActiveTab('armory')}
                  className="min-h-[42px] px-4 py-2 text-xs font-semibold text-slate-200 bg-[#1a2332] border border-[#2d3c54] hover:bg-[#233044] rounded-md"
                >
                  {t('Change Sprite & Gear')}
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="min-h-[42px] px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-md"
                >
                  {savingProfile ? t('Saving...') : t('Save Character')}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'armory' && (
            <>
              {/* Character Evolution Sprites */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
                  {t('Crawler Sprite Evolutions (Unlocks via Weekly Boss Clears & Levels)')}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {([1, 2, 3, 4] as const).map((tierNum) => {
                    const unlocked = tierNum <= maxUnlockedSpriteTier;
                    const equipped = crawler.equippedSpriteTier === tierNum;
                    const unlockLevel =
                      tierNum === 1 ? 1 : tierNum === 2 ? 3 : tierNum === 3 ? 5 : 7;
                    const tierLabel =
                      tierNum === 1
                        ? 'Barefoot Novice'
                        : tierNum === 2
                        ? 'Floor Scout'
                        : tierNum === 3
                        ? 'Mantis Hunter'
                        : 'Apex Warden';

                    return (
                      <button
                        key={tierNum}
                        type="button"
                        disabled={!unlocked}
                        onClick={() => void handleEquipSpriteTier(tierNum)}
                        className={`p-3 rounded-lg border-2 text-left flex flex-col items-center gap-2 transition-colors ${
                          equipped
                            ? 'border-amber-400 bg-[#1c2636]'
                            : unlocked
                            ? 'border-[#2c3b52] bg-[#161e2b] hover:border-slate-500'
                            : 'border-[#1f2938] bg-[#10161f] opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div className="w-20 h-20 rounded bg-[#0d1117] flex items-center justify-center overflow-hidden">
                          <CrawlerSprite
                            tier={tierNum}
                            look={crawler.look}
                            fallbackStyle={spriteStyle}
                            alt={t(tierLabel)}
                            className={`w-full h-full object-contain pixel-art ${
                              unlocked ? '' : 'grayscale contrast-75 opacity-40'
                            }`}
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-semibold text-slate-100">{t(tierLabel)}</p>
                          <p className="text-[11px] text-slate-400">
                            {equipped
                              ? t('Equipped')
                              : unlocked
                              ? t('Click to equip')
                              : t('Unlocks at Lv {n}', { n: unlockLevel })}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cosmetic Gear Slots */}
              <div>
                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  {SLOT_LABELS.map((s) => (
                    <button
                      key={s.slot}
                      type="button"
                      onClick={() => setSelectedSlot(s.slot)}
                      className={`min-h-[38px] px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                        selectedSlot === s.slot
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'bg-[#161f2c] border-[#29374d] text-slate-300 hover:text-white'
                      }`}
                    >
                      {t(s.label)}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {slotGear.map((item) => {
                    const unlocked = crawler.unlockedGearIds.includes(item.id);
                    const equipped = equippedId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={!unlocked}
                        onClick={() => void handleEquipGear(item)}
                        className={`p-3.5 rounded-lg border text-left flex items-start justify-between gap-3 transition-colors ${
                          equipped
                            ? 'border-amber-400 bg-[#1b2434]'
                            : unlocked
                            ? 'border-[#2a384f] bg-[#161e2b] hover:border-slate-500'
                            : 'border-[#1d2736] bg-[#10161f] opacity-65 cursor-not-allowed'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-slate-100 truncate">
                              {t(item.name)}
                            </p>
                            <span className="text-[10px] font-mono uppercase text-slate-400">
                              {t(item.rarity)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            {t(item.description)}
                          </p>
                        </div>
                        <span className="shrink-0 mt-0.5">
                          {equipped ? (
                            <Check className="w-4 h-4 text-amber-400" />
                          ) : unlocked ? (
                            <span className="text-xs font-medium text-emerald-400">{t('Equip')}</span>
                          ) : (
                            <Lock className="w-4 h-4 text-slate-500" />
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {activeTab === 'loot' && (
            <div className="space-y-5">
              <div className="bg-[#0e141d] border-2 border-[#2a384e] rounded-xl p-6 text-center space-y-4">
                <div className="w-28 h-28 mx-auto rounded-lg bg-[#0d1117] border-2 border-amber-500/40 flex items-center justify-center overflow-hidden">
                  <img
                    src={LOOT_CHEST_IMG}
                    alt={t('Dungeon Loot Chest')}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain pixel-art animate-crawler-idle"
                  />
                </div>

                {lastLootDrop && (
                  <div className="max-w-md mx-auto p-4 rounded-lg border-2 border-amber-400/70 bg-amber-950/30 space-y-2 text-left">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-pixel text-xs text-amber-300 uppercase">
                        {t('{tier} Loot Box Opened!', { tier: t(lastLootDrop.tier) })}
                      </span>
                      <span className="text-xs font-mono text-emerald-300">
                        +{lastLootDrop.bonusXp} XP
                      </span>
                    </div>
                    <p className="text-sm font-bold text-white">{t(lastLootDrop.item.name)}</p>
                    <p className="text-xs text-slate-300">{t(lastLootDrop.item.description)}</p>
                    <button
                      type="button"
                      onClick={() => void handleEquipGear(lastLootDrop.item)}
                      className="min-h-[38px] px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md"
                    >
                      {t('Equip {name}', { name: t(lastLootDrop.item.name) })}
                    </button>
                  </div>
                )}

                {crawler.pendingLootBoxes.length > 0 ? (
                  <div className="space-y-3">
                    <p className="font-pixel text-sm text-amber-300">
                      {t(
                        crawler.pendingLootBoxes.length === 1
                          ? '{n} Unopened Loot Box Ready!'
                          : '{n} Unopened Loot Boxes Ready!',
                        { n: crawler.pendingLootBoxes.length }
                      )}
                    </p>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      {t('Next up:')}{' '}
                      <strong className="text-slate-200 uppercase">{t(crawler.pendingLootBoxes[0])}</strong>{' '}
                      {t('Chest. Guaranteed cosmetic gear + bonus XP.')}
                    </p>
                    <button
                      type="button"
                      disabled={openingBox}
                      onClick={() => void handleOpenLootBox()}
                      className="min-h-[46px] px-6 py-2.5 text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-lg inline-flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      {openingBox ? t('Opening...') : t('Open Loot Box')}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-200">
                      {t('No Loot Boxes Waiting Right Now')}
                    </p>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      {t('Slay your Weekly Hunting Grounds Boss (hit 85% weekly discipline across workouts, diet, water, and habits) or unlock an Achievement to drop a new chest.')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
                  {t('System AI Achievements ({n}/6 Unlocked)', { n: crawler.unlockedAchievementIds.length })}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CRAWLER_ACHIEVEMENTS.map((ach) => {
                    const unlocked = crawler.unlockedAchievementIds.includes(ach.id);
                    return (
                      <div
                        key={ach.id}
                        className={`p-3.5 rounded-lg border ${
                          unlocked
                            ? 'border-emerald-500/60 bg-emerald-950/20'
                            : 'border-[#253247] bg-[#141c28] opacity-75'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                          <span className={unlocked ? 'text-emerald-400' : 'text-slate-400'}>
                            {t(ach.category)}
                          </span>
                          <span className="text-amber-300">
                            +{ach.xpBonus} XP{ach.rewardBox ? ` · ${t('{tier} box', { tier: t(ach.rewardBox) })}` : ''}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-100 mt-1">{t(ach.title)}</p>
                        <p className="text-xs text-slate-400 mt-1">{t(ach.description)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
                  {t('8-Tier Crawler Level Roadmap & Safe-Room Guardrails')}
                </h3>
                <div className="space-y-2">
                  {CRAWLER_LEVELS.map((lvl) => {
                    const reached = crawler.level >= lvl.level;
                    return (
                      <div
                        key={lvl.level}
                        className={`px-3.5 py-2.5 rounded-lg border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 ${
                          reached
                            ? 'border-amber-500/50 bg-[#1a2230]'
                            : 'border-[#222e42] bg-[#121924] opacity-70'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-pixel text-xs text-amber-400">{t('LV {n}', { n: lvl.level })}</span>
                          <span className="text-sm font-semibold text-slate-100">{t(lvl.title)}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                          <span>{lvl.xpRequired.toLocaleString()} XP</span>
                          <span className="font-sans text-slate-300">{t(lvl.unlockSummary)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 p-3.5 rounded-lg border border-sky-500/30 bg-sky-950/20 flex items-start gap-3">
                  <Shield className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong>{t('Anti-Burnout Protection:')}</strong>{' '}
                    {t('Every 7-day streak earns a Safe-Room Shield (auto-protects missed days), rest days never break streaks, and clearing 85% of your weekly targets slays the Weekly Boss. You never lose unlocked gear or XP.')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
