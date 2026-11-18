import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  limit,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import {
  Check,
  Copy,
  Crown,
  Flame,
  Globe,
  Lock,
  LogOut,
  Plus,
  Search,
  Settings2,
  Skull,
  Trash2,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  BANNER_THEME_OPTIONS,
  BannerTheme,
  CrawlerState,
  Guild,
  GuildMember,
  PublicCrawler,
  SCHEMA_LIMITS,
} from '../types';
import {
  BANNER_THEME_STYLES,
  CRAWLER_SPRITES,
  getLevelInfo,
} from '../lib/crawlerEngine';
import {
  createGuild,
  disbandGuild,
  joinGuild,
  leaveGuild,
  lookupGuildByCode,
  updateGuildDetails,
} from '../lib/firestoreService';
import { CrawlerProfileModal, InspectableCrawler } from './CrawlerProfileModal';

interface Props {
  uid: string;
  displayName: string;
  crawler: CrawlerState;
  crawlerDocExists: boolean;
  onOpenCustomize: () => void;
}

type SortKey = 'xp' | 'clears' | 'streak';

export const GuildView: React.FC<Props> = ({
  uid,
  displayName,
  crawler,
  crawlerDocExists,
  onOpenCustomize,
}) => {
  const [activeTab, setActiveTab] = useState<'guild' | 'leaderboard'>('guild');
  const [sortBy, setSortBy] = useState<SortKey>('xp');
  const [searchTerm, setSearchTerm] = useState('');

  // Active guild subscriptions
  const [myGuild, setMyGuild] = useState<Guild | null>(null);
  const [myGuildChecked, setMyGuildChecked] = useState(false);
  const [guildMembers, setGuildMembers] = useState<GuildMember[]>([]);

  // Public directories
  const [publicGuilds, setPublicGuilds] = useState<Guild[]>([]);
  const [publicCrawlers, setPublicCrawlers] = useState<PublicCrawler[]>([]);

  // Create Guild state
  const [guildNameInput, setGuildNameInput] = useState('');
  const [guildMottoInput, setGuildMottoInput] = useState('');
  const [guildThemeInput, setGuildThemeInput] = useState<BannerTheme>('amber');
  const [guildPublicInput, setGuildPublicInput] = useState(true);
  const [creatingGuild, setCreatingGuild] = useState(false);

  // Join by code state
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [joiningCode, setJoiningCode] = useState(false);
  const [joiningPublicId, setJoiningPublicId] = useState<string | null>(null);

  // Edit Guild state (leader only)
  const [editingGuild, setEditingGuild] = useState(false);
  const [editName, setEditName] = useState('');
  const [editMotto, setEditMotto] = useState('');
  const [editTheme, setEditTheme] = useState<BannerTheme>('amber');
  const [editPublic, setEditPublic] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);

  const [leavingOrDisbanding, setLeavingOrDisbanding] = useState(false);
  const [confirmDisband, setConfirmDisband] = useState(false);
  const [copiedCode, setCopiedCode] = useState<'code' | 'invite' | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Inspect profile modal
  const [inspectedCrawler, setInspectedCrawler] = useState<InspectableCrawler | null>(null);

  const activeGuildId = crawler.guildId?.trim() || '';

  // Subscribe to user's current guild + members
  useEffect(() => {
    if (!activeGuildId) {
      setMyGuild(null);
      setMyGuildChecked(true);
      setGuildMembers([]);
      return;
    }

    setMyGuildChecked(false);
    const guildPath = `guilds/${activeGuildId}`;
    const unsubGuild = onSnapshot(
      doc(db, 'guilds', activeGuildId),
      (snap) => {
        if (snap.exists()) {
          const data = { ...(snap.data() as Omit<Guild, 'id'>), id: snap.id };
          setMyGuild(data);
        } else {
          setMyGuild(null);
        }
        setMyGuildChecked(true);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, guildPath);
      }
    );

    const membersPath = `guilds/${activeGuildId}/members`;
    const unsubMembers = onSnapshot(
      query(collection(db, 'guilds', activeGuildId, 'members'), where('guildId', '==', activeGuildId)),
      (snap) => {
        setGuildMembers(
          snap.docs.map((d) => ({ ...(d.data() as Omit<GuildMember, 'id'>), id: d.id }))
        );
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, membersPath);
      }
    );

    return () => {
      unsubGuild();
      unsubMembers();
    };
  }, [activeGuildId]);

  // Subscribe to public guilds directory (when user is not in a guild or browsing)
  useEffect(() => {
    const path = 'guilds';
    const unsub = onSnapshot(
      query(collection(db, 'guilds'), where('isPublic', '==', true), limit(30)),
      (snap) => {
        setPublicGuilds(
          snap.docs.map((d) => ({ ...(d.data() as Omit<Guild, 'id'>), id: d.id }))
        );
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
    return () => unsub();
  }, []);

  // Subscribe to global public crawlers leaderboard
  useEffect(() => {
    const path = 'publicCrawlers';
    const unsub = onSnapshot(
      query(collection(db, 'publicCrawlers'), where('isPublic', '==', true), limit(60)),
      (snap) => {
        setPublicCrawlers(
          snap.docs.map((d) => ({ ...(d.data() as Omit<PublicCrawler, 'id'>), id: d.id }))
        );
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
    return () => unsub();
  }, []);

  const sortRows = <T extends { xp: number; weeklyClears: number; currentStreak: number }>(
    rows: T[]
  ): T[] => {
    return [...rows].sort((a, b) => {
      if (sortBy === 'clears') {
        if (b.weeklyClears !== a.weeklyClears) return b.weeklyClears - a.weeklyClears;
        return b.xp - a.xp;
      }
      if (sortBy === 'streak') {
        if (b.currentStreak !== a.currentStreak) return b.currentStreak - a.currentStreak;
        return b.xp - a.xp;
      }
      return b.xp - a.xp;
    });
  };

  const sortedGuildMembers = useMemo(() => sortRows(guildMembers), [guildMembers, sortBy]);

  const sortedPublicCrawlers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const filtered = term
      ? publicCrawlers.filter(
          (c) =>
            c.crawlerName.toLowerCase().includes(term) ||
            c.crawlerClass.toLowerCase().includes(term) ||
            c.guildName.toLowerCase().includes(term)
        )
      : publicCrawlers;
    return sortRows(filtered);
  }, [publicCrawlers, searchTerm, sortBy]);

  const guildTotals = useMemo(() => {
    return guildMembers.reduce(
      (acc, m) => ({
        xp: acc.xp + (m.xp || 0),
        clears: acc.clears + (m.weeklyClears || 0),
      }),
      { xp: 0, clears: 0 }
    );
  }, [guildMembers]);

  const handleCreateGuild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creatingGuild || guildNameInput.trim().length < 2) return;
    setCreatingGuild(true);
    setFeedback(null);
    try {
      const result = await createGuild({
        uid,
        crawler,
        crawlerDocExists,
        fallbackName: displayName,
        name: guildNameInput,
        motto: guildMottoInput,
        bannerTheme: guildThemeInput,
        isPublic: guildPublicInput,
      });
      setGuildNameInput('');
      setGuildMottoInput('');
      setFeedback({
        type: 'ok',
        text: `Guild "${result.guildName}" created! Share invite code ${result.guildId} with friends.`,
      });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to create guild.',
      });
    } finally {
      setCreatingGuild(false);
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = inviteCodeInput.trim();
    if (!raw || joiningCode) return;
    setJoiningCode(true);
    setFeedback(null);
    try {
      const found = await lookupGuildByCode(raw);
      if (!found) {
        setFeedback({ type: 'err', text: 'No guild found with that invite code.' });
        return;
      }
      await joinGuild({
        uid,
        crawler,
        crawlerDocExists,
        fallbackName: displayName,
        guild: found,
      });
      setInviteCodeInput('');
      setFeedback({ type: 'ok', text: `Joined "${found.name}"!` });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to join guild.',
      });
    } finally {
      setJoiningCode(false);
    }
  };

  const handleJoinPublicGuild = async (guild: Guild) => {
    if (joiningPublicId) return;
    setJoiningPublicId(guild.id);
    setFeedback(null);
    try {
      await joinGuild({
        uid,
        crawler,
        crawlerDocExists,
        fallbackName: displayName,
        guild,
      });
      setFeedback({ type: 'ok', text: `Joined "${guild.name}"!` });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to join guild.',
      });
    } finally {
      setJoiningPublicId(null);
    }
  };

  const handleStartEditGuild = () => {
    if (!myGuild) return;
    setEditName(myGuild.name);
    setEditMotto(myGuild.motto);
    setEditTheme(myGuild.bannerTheme);
    setEditPublic(myGuild.isPublic);
    setEditingGuild(true);
  };

  const handleSaveGuildEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myGuild || savingEdit || editName.trim().length < 2) return;
    setSavingEdit(true);
    setFeedback(null);
    try {
      await updateGuildDetails(uid, myGuild.id, {
        name: editName,
        motto: editMotto,
        bannerTheme: editTheme,
        isPublic: editPublic,
      });
      setEditingGuild(false);
      setFeedback({ type: 'ok', text: 'Guild settings updated.' });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to update guild.',
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleLeaveGuild = async () => {
    if (!activeGuildId || leavingOrDisbanding) return;
    setLeavingOrDisbanding(true);
    setFeedback(null);
    try {
      await leaveGuild({
        uid,
        guildId: activeGuildId,
        crawlerDocExists,
      });
      setFeedback({ type: 'ok', text: 'You left the guild.' });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to leave guild.',
      });
    } finally {
      setLeavingOrDisbanding(false);
    }
  };

  const handleDisbandGuild = async () => {
    if (!myGuild || leavingOrDisbanding) return;
    setLeavingOrDisbanding(true);
    setFeedback(null);
    try {
      await disbandGuild({
        uid,
        guildId: myGuild.id,
        crawlerDocExists,
      });
      setConfirmDisband(false);
      setFeedback({ type: 'ok', text: `Guild "${myGuild.name}" has been disbanded.` });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to disband guild.',
      });
    } finally {
      setLeavingOrDisbanding(false);
    }
  };

  const handleCopyInvite = async (kind: 'code' | 'invite') => {
    if (!myGuild) return;
    const text =
      kind === 'code'
        ? myGuild.inviteCode
        : `Join my Fitness Crawler guild "${myGuild.name}"! Open the app, go to Guild & Ranks, and enter invite code: ${myGuild.inviteCode}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(kind);
      window.setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      setFeedback({ type: 'err', text: 'Clipboard blocked. Copy the invite code manually.' });
    }
  };

  const myName = crawler.crawlerName || displayName;
  const myClass = crawler.crawlerClass || 'Primal Brawler';
  const myLevel = getLevelInfo(crawler.xp, crawler.weeklyClears).current;
  const isLeader = myGuild?.ownerId === uid;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#131a24] border-2 border-[#263347] rounded-xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400">
            Floor 3 Social Hub · Guilds &amp; Crawler Rankings
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Guilds &amp; Leaderboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Invite friends, compare XP and boss clears, and inspect each other&apos;s 8-bit loadouts.
            Workouts, meals, and weights remain private.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 px-3.5 py-2 rounded-lg bg-[#0d121a] border border-[#253247]">
            <img
              src={CRAWLER_SPRITES[crawler.equippedSpriteTier] ?? CRAWLER_SPRITES[1]}
              alt={myName}
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded bg-[#131a24] object-contain pixel-art shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{myName}</p>
              <p className="text-[11px] font-mono text-amber-400 tabular-nums">
                LV {myLevel.level} · {myClass}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenCustomize}
            className="min-h-[42px] px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors whitespace-nowrap"
          >
            Customize Crawler
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`px-4 py-3 rounded-lg border text-xs font-medium flex items-center justify-between gap-3 ${
            feedback.type === 'ok'
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/50 border-rose-500/50 text-rose-200'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs & Sort Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="inline-flex items-center gap-1 p-1 bg-[#131a24] border border-[#263347] rounded-lg self-start">
          <button
            type="button"
            onClick={() => setActiveTab('guild')}
            className={`min-h-[38px] px-4 py-1.5 text-xs font-semibold rounded-md inline-flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'guild'
                ? 'bg-amber-400 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            {myGuild ? myGuild.name : 'My Guild'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('leaderboard')}
            className={`min-h-[38px] px-4 py-1.5 text-xs font-semibold rounded-md inline-flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'leaderboard'
                ? 'bg-amber-400 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            Global Leaderboard ({publicCrawlers.length})
          </button>
        </div>

        <div className="inline-flex items-center gap-1 p-1 bg-[#131a24] border border-[#263347] rounded-lg self-start sm:self-auto">
          <span className="text-[11px] text-slate-400 px-2">Rank by</span>
          {(
            [
              { key: 'xp', label: 'XP' },
              { key: 'clears', label: 'Bosses' },
              { key: 'streak', label: 'Streak' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setSortBy(opt.key)}
              className={`min-h-[34px] px-3 py-1 text-xs font-medium rounded transition-colors ${
                sortBy === opt.key
                  ? 'bg-emerald-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: MY GUILD */}
      {activeTab === 'guild' && (
        <div className="space-y-6">
          {activeGuildId && myGuildChecked && !myGuild ? (
            <div className="bg-[#131a24] border-2 border-amber-500/40 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Previous Guild No Longer Exists
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  The guild leader disbanded it. Clear your old guild badge to create or join a new guild.
                </p>
              </div>
              <button
                type="button"
                disabled={leavingOrDisbanding}
                onClick={() => void handleLeaveGuild()}
                className="min-h-[42px] px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md whitespace-nowrap"
              >
                {leavingOrDisbanding ? 'Clearing...' : 'Clear Guild Status'}
              </button>
            </div>
          ) : myGuild ? (
            <>
              {/* Active Guild Hall Card */}
              <div
                className={`bg-[#131a24] border-2 ${
                  (BANNER_THEME_STYLES[myGuild.bannerTheme] ?? BANNER_THEME_STYLES.amber).border
                } rounded-xl p-5 space-y-5`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-400">
                      <span
                        className={`font-semibold ${
                          (BANNER_THEME_STYLES[myGuild.bannerTheme] ?? BANNER_THEME_STYLES.amber)
                            .accentText
                        }`}
                      >
                        Guild Hall
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1">
                        {myGuild.isPublic ? (
                          <>
                            <Globe className="w-3.5 h-3.5 text-emerald-400" /> Public Guild
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5 text-amber-400" /> Invite-Only
                          </>
                        )}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {guildMembers.length || myGuild.memberCount}/50 Crawlers
                      </span>
                    </div>
                    <h2 className="font-pixel text-lg sm:text-xl text-white">{myGuild.name}</h2>
                    {myGuild.motto && (
                      <p className="text-sm text-slate-300">&ldquo;{myGuild.motto}&rdquo;</p>
                    )}
                  </div>

                  {/* Invite Code & Guild Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0d121a] border border-[#2b3a52]">
                      <span className="text-[11px] text-slate-400">Invite Code</span>
                      <span className="font-mono text-xs font-bold text-amber-400 tracking-wider">
                        {myGuild.inviteCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleCopyInvite('code')}
                        aria-label="Copy invite code"
                        className="p-1 text-slate-300 hover:text-white"
                      >
                        {copiedCode === 'code' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleCopyInvite('invite')}
                      className="min-h-[40px] px-3.5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md inline-flex items-center gap-1.5 whitespace-nowrap"
                    >
                      {copiedCode === 'invite' ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <UserPlus className="w-3.5 h-3.5" />
                      )}
                      {copiedCode === 'invite' ? 'Invite Copied' : 'Copy Friend Invite'}
                    </button>

                    {isLeader ? (
                      <>
                        <button
                          type="button"
                          onClick={handleStartEditGuild}
                          className="min-h-[40px] px-3 py-2 text-xs font-medium text-slate-200 bg-[#1a2434] hover:bg-[#233044] border border-[#344662] rounded-md inline-flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <Settings2 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDisband((v) => !v)}
                          className="min-h-[40px] px-3 py-2 text-xs font-medium text-rose-300 bg-rose-950/30 hover:bg-rose-950/60 border border-rose-500/40 rounded-md inline-flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Disband
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        disabled={leavingOrDisbanding}
                        onClick={() => void handleLeaveGuild()}
                        className="min-h-[40px] px-3 py-2 text-xs font-medium text-rose-300 bg-rose-950/30 hover:bg-rose-950/60 border border-rose-500/40 rounded-md inline-flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        {leavingOrDisbanding ? 'Leaving...' : 'Leave Guild'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Confirm Disband */}
                {confirmDisband && isLeader && (
                  <div className="p-4 rounded-lg bg-rose-950/30 border border-rose-500/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <p className="text-xs text-rose-200">
                      Disbanding deletes <strong>{myGuild.name}</strong> for all members. Your personal XP and gear are never affected.
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setConfirmDisband(false)}
                        className="min-h-[38px] px-3 py-1.5 text-xs text-slate-300 bg-[#1a2434] rounded-md"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={leavingOrDisbanding}
                        onClick={() => void handleDisbandGuild()}
                        className="min-h-[38px] px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-md"
                      >
                        {leavingOrDisbanding ? 'Disbanding...' : 'Confirm Disband'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Edit Guild Form (Leader) */}
                {editingGuild && isLeader && (
                  <form
                    onSubmit={(e) => void handleSaveGuildEdit(e)}
                    className="p-4 rounded-lg bg-[#0d121a] border border-[#2a3950] space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Guild Name
                        </label>
                        <input
                          type="text"
                          required
                          minLength={2}
                          maxLength={SCHEMA_LIMITS.GUILD_NAME_MAX}
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full min-h-[40px] px-3 py-2 text-sm bg-[#131a24] border border-[#2d3c54] rounded-md text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Guild Motto
                        </label>
                        <input
                          type="text"
                          maxLength={SCHEMA_LIMITS.GUILD_MOTTO_MAX}
                          value={editMotto}
                          onChange={(e) => setEditMotto(e.target.value)}
                          className="w-full min-h-[40px] px-3 py-2 text-sm bg-[#131a24] border border-[#2d3c54] rounded-md text-white"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Banner:</span>
                        {BANNER_THEME_OPTIONS.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setEditTheme(t)}
                            aria-label={BANNER_THEME_STYLES[t].label}
                            className={`w-7 h-7 rounded-md flex items-center justify-center border ${
                              editTheme === t ? 'border-white scale-105' : 'border-transparent opacity-70'
                            } bg-[#131a24]`}
                          >
                            <span className={`w-4 h-4 rounded-sm ${BANNER_THEME_STYLES[t].swatch}`} />
                          </button>
                        ))}
                      </div>

                      <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editPublic}
                          onChange={(e) => setEditPublic(e.target.checked)}
                          className="rounded border-slate-600 bg-[#131a24] text-emerald-500"
                        />
                        List in Open Guilds Directory
                      </label>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingGuild(false)}
                        className="min-h-[38px] px-3.5 py-1.5 text-xs text-slate-300 bg-[#1a2434] rounded-md"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingEdit}
                        className="min-h-[38px] px-4 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md"
                      >
                        {savingEdit ? 'Saving...' : 'Save Guild'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Guild Stats Summary */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-lg bg-[#0e141d] border border-[#253247]">
                    <p className="text-xs text-slate-400">Combined Guild XP</p>
                    <p className="text-lg font-bold font-mono text-amber-400 mt-1 tabular-nums">
                      {guildTotals.xp.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-lg bg-[#0e141d] border border-[#253247]">
                    <p className="text-xs text-slate-400">Total Bosses Slain</p>
                    <p className="text-lg font-bold font-mono text-rose-400 mt-1 tabular-nums">
                      {guildTotals.clears}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-lg bg-[#0e141d] border border-[#253247]">
                    <p className="text-xs text-slate-400">Active Crawlers</p>
                    <p className="text-lg font-bold font-mono text-emerald-400 mt-1 tabular-nums">
                      {guildMembers.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Guild Member Leaderboard */}
              <div className="bg-[#131a24] border-2 border-[#263347] rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#253247] flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Guild Leaderboard</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Click any crawler to inspect their 8-bit sprite, gear loadout, and achievements.
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-[#1f2a3c]">
                  {sortedGuildMembers.map((member, index) => {
                    const isSelf = member.ownerId === uid;
                    const lvl = getLevelInfo(member.xp, member.weeklyClears).current;
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => setInspectedCrawler(member)}
                        className={`w-full px-5 py-3.5 text-left flex items-center justify-between gap-4 hover:bg-[#192332] transition-colors ${
                          isSelf ? 'bg-amber-500/5' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <span
                            className={`w-7 text-center font-mono text-sm font-bold tabular-nums shrink-0 ${
                              index === 0
                                ? 'text-amber-400'
                                : index === 1
                                ? 'text-slate-200'
                                : index === 2
                                ? 'text-amber-600'
                                : 'text-slate-500'
                            }`}
                          >
                            #{index + 1}
                          </span>
                          <img
                            src={CRAWLER_SPRITES[member.equippedSpriteTier] ?? CRAWLER_SPRITES[1]}
                            alt={member.crawlerName}
                            referrerPolicy="no-referrer"
                            className="w-11 h-11 rounded-md border border-[#2d3c54] bg-[#0b1017] object-contain pixel-art shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-white truncate">
                                {member.crawlerName}
                              </span>
                              {member.role === 'leader' && (
                                <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              )}
                              {isSelf && (
                                <span className="text-[11px] font-mono text-emerald-400 shrink-0">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 truncate">
                              LV {lvl.level} · {member.crawlerClass}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 sm:gap-6 shrink-0 font-mono tabular-nums text-xs">
                          <span className="hidden sm:inline-flex items-center gap-1 text-slate-300">
                            <Flame className="w-3.5 h-3.5 text-amber-400" />
                            {member.currentStreak}d
                          </span>
                          <span className="hidden sm:inline-flex items-center gap-1 text-rose-300">
                            <Skull className="w-3.5 h-3.5 text-rose-400" />
                            {member.weeklyClears}
                          </span>
                          <span className="text-sm font-bold text-amber-400">
                            {member.xp.toLocaleString()} XP
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* Not in a guild: Create, Join by Code, or Browse Open Guilds */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Create Guild */}
              <form
                onSubmit={(e) => void handleCreateGuild(e)}
                className="lg:col-span-7 bg-[#131a24] border-2 border-[#263347] rounded-xl p-5 space-y-4"
              >
                <div>
                  <h2 className="text-base font-semibold text-white">Create a Guild</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Start a Dungeon Party and get an invite code to share with friends.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Guild Name
                    </label>
                    <input
                      type="text"
                      required
                      minLength={2}
                      maxLength={SCHEMA_LIMITS.GUILD_NAME_MAX}
                      placeholder="e.g. Princess Posse"
                      value={guildNameInput}
                      onChange={(e) => setGuildNameInput(e.target.value)}
                      className="w-full min-h-[42px] px-3 py-2 text-sm bg-[#0d121a] border border-[#2d3c54] rounded-md text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Guild Motto (optional)
                    </label>
                    <input
                      type="text"
                      maxLength={SCHEMA_LIMITS.GUILD_MOTTO_MAX}
                      placeholder="e.g. No skipped leg days on Floor 3"
                      value={guildMottoInput}
                      onChange={(e) => setGuildMottoInput(e.target.value)}
                      className="w-full min-h-[42px] px-3 py-2 text-sm bg-[#0d121a] border border-[#2d3c54] rounded-md text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Banner Theme:</span>
                    {BANNER_THEME_OPTIONS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setGuildThemeInput(t)}
                        aria-label={BANNER_THEME_STYLES[t].label}
                        className={`w-8 h-8 rounded-md flex items-center justify-center border transition-transform ${
                          guildThemeInput === t
                            ? 'border-white scale-105'
                            : 'border-[#253247] opacity-70 hover:opacity-100'
                        } bg-[#0d121a]`}
                      >
                        <span className={`w-4 h-4 rounded-sm ${BANNER_THEME_STYLES[t].swatch}`} />
                      </button>
                    ))}
                  </div>

                  <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={guildPublicInput}
                      onChange={(e) => setGuildPublicInput(e.target.checked)}
                      className="rounded border-slate-600 bg-[#0d121a] text-emerald-500"
                    />
                    Public (appear in Open Guilds list)
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={creatingGuild || guildNameInput.trim().length < 2}
                  className="min-h-[44px] px-5 py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-md inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {creatingGuild ? 'Creating Guild...' : 'Create Guild'}
                </button>
              </form>

              {/* Join by Invite Code */}
              <form
                onSubmit={(e) => void handleJoinByCode(e)}
                className="lg:col-span-5 bg-[#131a24] border-2 border-[#263347] rounded-xl p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div>
                    <h2 className="text-base font-semibold text-white">Join with Invite Code</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Got a code from a friend (like <span className="font-mono text-slate-300">PRIN-7K9M</span>)? Enter it below.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Invite Code
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={40}
                      placeholder="e.g. CRWL-7K9M"
                      value={inviteCodeInput}
                      onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                      className="w-full min-h-[42px] px-3 py-2 text-sm font-mono uppercase bg-[#0d121a] border border-[#2d3c54] rounded-md text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={joiningCode || inviteCodeInput.trim().length < 4}
                  className="w-full min-h-[44px] px-5 py-2.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-md inline-flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  {joiningCode ? 'Joining...' : 'Join Guild'}
                </button>
              </form>

              {/* Open Guilds Directory */}
              <div className="lg:col-span-12 bg-[#131a24] border-2 border-[#263347] rounded-xl p-5 space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-white">Open Guilds</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Public Hunting Grounds parties currently open to new Crawlers.
                  </p>
                </div>

                {publicGuilds.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4">
                    No public guilds yet. Create the first one above and invite your friends!
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {publicGuilds.map((g) => {
                      const theme = BANNER_THEME_STYLES[g.bannerTheme] ?? BANNER_THEME_STYLES.amber;
                      return (
                        <div
                          key={g.id}
                          className={`p-4 rounded-lg bg-[#0e141d] border ${theme.border} flex flex-col justify-between gap-3`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="text-sm font-bold text-white truncate">{g.name}</h3>
                              <span className="text-[11px] font-mono text-slate-400 tabular-nums shrink-0">
                                {g.memberCount}/50
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                              {g.motto || 'Ready to clear Floor 3.'}
                            </p>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1">
                            <span className="text-[11px] font-mono text-slate-500">
                              {g.inviteCode}
                            </span>
                            <button
                              type="button"
                              disabled={joiningPublicId === g.id || g.memberCount >= 50}
                              onClick={() => void handleJoinPublicGuild(g)}
                              className="min-h-[38px] px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-md"
                            >
                              {joiningPublicId === g.id
                                ? 'Joining...'
                                : g.memberCount >= 50
                                ? 'Full'
                                : 'Join'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GLOBAL LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <div className="bg-[#131a24] border-2 border-[#263347] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#253247] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Floor 3 Crawler Leaderboard
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Tap any Crawler to inspect their character profile, gear, and achievements.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search crawler, class, guild..."
                className="w-full min-h-[38px] pl-9 pr-3 py-1.5 text-xs bg-[#0d121a] border border-[#2d3c54] rounded-md text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          {sortedPublicCrawlers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No public crawlers match your search yet.
            </div>
          ) : (
            <div className="divide-y divide-[#1f2a3c]">
              {sortedPublicCrawlers.map((entry, index) => {
                const isSelf = entry.ownerId === uid;
                const lvl = getLevelInfo(entry.xp, entry.weeklyClears).current;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setInspectedCrawler(entry)}
                    className={`w-full px-5 py-3.5 text-left flex items-center justify-between gap-4 hover:bg-[#192332] transition-colors ${
                      isSelf ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span
                        className={`w-7 text-center font-mono text-sm font-bold tabular-nums shrink-0 ${
                          index === 0
                            ? 'text-amber-400'
                            : index === 1
                            ? 'text-slate-200'
                            : index === 2
                            ? 'text-amber-600'
                            : 'text-slate-500'
                        }`}
                      >
                        #{index + 1}
                      </span>
                      <img
                        src={CRAWLER_SPRITES[entry.equippedSpriteTier] ?? CRAWLER_SPRITES[1]}
                        alt={entry.crawlerName}
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-md border border-[#2d3c54] bg-[#0b1017] object-contain pixel-art shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white truncate">
                            {entry.crawlerName}
                          </span>
                          {isSelf && (
                            <span className="text-[11px] font-mono text-emerald-400 shrink-0">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 truncate">
                          LV {lvl.level} · {entry.crawlerClass}
                          {entry.guildName ? ` · ${entry.guildName}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6 shrink-0 font-mono tabular-nums text-xs">
                      <span className="hidden sm:inline-flex items-center gap-1 text-slate-300">
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        {entry.currentStreak}d
                      </span>
                      <span className="hidden sm:inline-flex items-center gap-1 text-rose-300">
                        <Skull className="w-3.5 h-3.5 text-rose-400" />
                        {entry.weeklyClears}
                      </span>
                      <span className="text-sm font-bold text-amber-400">
                        {entry.xp.toLocaleString()} XP
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <CrawlerProfileModal
        open={Boolean(inspectedCrawler)}
        crawler={inspectedCrawler}
        guildNameFallback={myGuild?.name ?? ''}
        isSelf={inspectedCrawler?.ownerId === uid}
        onClose={() => setInspectedCrawler(null)}
      />
    </div>
  );
};
