/**
 * BHARAT NITI — Campaign Panel (v2)
 * 3-category campaign system: Rally | Booth | Digital
 * With 10-level benchmark milestones per state.
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic2, Users, Smartphone, Target, Lock, CheckCircle,
  ChevronRight, Zap, TrendingUp, BookOpen, Bus, Wheat,
  Briefcase, Shield, MapPin, Info, Star
} from 'lucide-react';
import { useGameStore, selectPlayerBudget } from '../../store/gameStore';
import { CAMPAIGN_ACTIONS } from '../../engine/data/campaignActions';
import { RALLY_TOPICS } from '../../engine/data/rallyTopics';
import { BENCHMARK_LEVELS, ACTION_CATEGORY_MAP } from '../../engine/data/shadowOperations';
import type { CampaignCategory, RallyTopic } from '../../engine/types';

type TabType = 'rally' | 'booth' | 'digital' | 'topics';

const CATEGORY_META: Record<CampaignCategory, {
  label: string;
  hindi: string;
  icon: React.ReactNode;
  colour: string;
  description: string;
}> = {
  rally: {
    label: 'Rally',
    hindi: 'भाषण',
    icon: <Mic2 className="w-4 h-4" />,
    colour: '#FF6B00',
    description: 'Public events, roadshows, star campaigners & media',
  },
  booth: {
    label: 'Booth',
    hindi: 'बूथ',
    icon: <Users className="w-4 h-4" />,
    colour: '#10B981',
    description: 'Ground-level voter contact, booth workers & canvassing',
  },
  digital: {
    label: 'Digital',
    hindi: 'डिजिटल',
    icon: <Smartphone className="w-4 h-4" />,
    colour: '#3B82F6',
    description: 'Social media, IT cell, TV ads & digital campaigns',
  },
};

const TOPIC_ICONS: Record<string, React.ReactNode> = {
  Bus: <Bus className="w-4 h-4" />,
  Tractor: <span className="text-sm">🚜</span>,
  Briefcase: <Briefcase className="w-4 h-4" />,
  Shield: <Shield className="w-4 h-4" />,
  Star: <Star className="w-4 h-4" />,
  Wheat: <Wheat className="w-4 h-4" />,
  Zap: <Zap className="w-4 h-4" />,
  BookOpen: <BookOpen className="w-4 h-4" />,
};

function getTopicIcon(icon: string): React.ReactNode {
  return TOPIC_ICONS[icon] ?? <Target className="w-4 h-4" />;
}

/** Get filtered actions by category */
function getActionsForCategory(category: CampaignCategory) {
  return Object.values(CAMPAIGN_ACTIONS).filter(
    a => ACTION_CATEGORY_MAP[a.type] === category
  );
}

export default function CampaignPanel() {
  const { gameState, performCampaignAction, commitToTopic, removeActiveTopic, selectConstituency } = useGameStore();
  const budget = useGameStore(selectPlayerBudget);
  const [activeTab, setActiveTab] = useState<TabType>('rally');
  const [selectedStateId, setSelectedStateId] = useState<string>('');
  const [selectedConstId, setSelectedConstId] = useState<string>('');

  if (!gameState) return null;

  const stateIds = Object.keys(gameState.states);

  // Use first state as default if not selected
  const effectiveStateId = selectedStateId || stateIds[0] || '';
  const stateData = gameState.states[effectiveStateId];
  const stateBenchmarks = gameState.benchmarks?.[effectiveStateId];
  const playerPartyId = gameState.playerPartyId;
  const activeTopicIds = gameState.activeTopics?.[effectiveStateId] ?? [];
  const effectiveConstId = selectedConstId || gameState.selectedConstituencyId || '';

  const stateConsts = Object.values(gameState.constituencies).filter(
    c => c.stateId === effectiveStateId && c.type === (gameState.mode === 'lok_sabha' ? 'lok_sabha' : 'state_assembly')
  );

  // Category actions filtered
  const categoryActions = useMemo(() => {
    if (activeTab === 'topics') return [];
    return getActionsForCategory(activeTab as CampaignCategory);
  }, [activeTab]);

  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);
  const [topicError, setTopicError] = useState<string | null>(null);

  function doAction(actionType: string, isConstAction: boolean) {
    if (!effectiveStateId) return;
    if (isConstAction && !effectiveConstId) {
      setFeedback({ msg: 'Please select a target constituency first!', ok: false });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    const result = performCampaignAction(actionType as any, effectiveStateId, isConstAction ? effectiveConstId : undefined);
    setFeedback({ msg: result.message, ok: result.success });
    setTimeout(() => setFeedback(null), 3000);
  }

  function doCommitTopic(topic: RallyTopic) {
    const result = commitToTopic(topic.id, effectiveStateId, topic.cost);
    setTopicError(result.success ? null : result.message);
    if (result.success) setTimeout(() => setTopicError(null), 3000);
  }

  /** Get locked benchmark labels that belong to the player */
  function getPlayerLockedBenchmarks(category: CampaignCategory): string[] {
    if (!stateBenchmarks) return [];
    const cat = stateBenchmarks[category];
    return Object.values(cat.locks)
      .filter(l => l.partyId === playerPartyId)
      .map(l => l.label);
  }

  /** Get current benchmark level for player in a category */
  function getPlayerBenchmarkProgress(category: CampaignCategory): { points: number; nextLevel: number; nextPoints: number } {
    const cat = stateBenchmarks?.[category];
    const points = cat?.progress?.[playerPartyId] ?? 0;
    const nextBm = BENCHMARK_LEVELS.find(b => points < b.points);
    return {
      points,
      nextLevel: nextBm?.level ?? 10,
      nextPoints: nextBm?.points ?? BENCHMARK_LEVELS[9].points,
    };
  }

  const tabs: { id: TabType; label: string; icon: React.ReactNode; colour?: string }[] = [
    { id: 'rally', label: 'Rally', icon: <Mic2 className="w-3.5 h-3.5" />, colour: '#FF6B00' },
    { id: 'booth', label: 'Booth', icon: <Users className="w-3.5 h-3.5" />, colour: '#10B981' },
    { id: 'digital', label: 'Digital', icon: <Smartphone className="w-3.5 h-3.5" />, colour: '#3B82F6' },
    { id: 'topics', label: 'Topics', icon: <BookOpen className="w-3.5 h-3.5" />, colour: '#A855F7' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl text-text-primary">Campaign Command</h2>
          <p className="text-text-muted text-sm">Spend budget across categories to unlock benchmarks</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-text-muted">Campaign Budget</div>
          <div className="text-xl font-bold text-accent-gold tabular">₹{budget.toFixed(0)} Cr</div>
        </div>
      </div>

      {/* State Selector */}
      <div className="glass-card p-3">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-3.5 h-3.5 text-saffron" />
          <span className="text-xs text-text-muted font-medium uppercase tracking-wider">Target State</span>
        </div>
        <div className="w-full">
          <select
            value={effectiveStateId}
            onChange={(e) => setSelectedStateId(e.target.value)}
            className="w-full bg-white/[0.05] border border-white/10 rounded-lg p-2 text-sm text-text-primary focus:outline-none focus:border-saffron/50 transition-colors"
          >
            {stateIds.map(sid => (
              <option key={sid} value={sid} className="bg-slate-900 text-white">
                {gameState.states[sid]?.name ?? sid}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Feedback banner */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${
              feedback.ok
                ? 'bg-india-green/15 border border-india-green/30 text-india-green'
                : 'bg-red-500/15 border border-red-500/30 text-red-400'
            }`}
          >
            {feedback.ok ? '✓' : '✗'} {feedback.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Tabs */}
      <div className="flex gap-1 p-1 bg-white/[0.04] rounded-xl">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-white/[0.1] text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
            }`}
            style={activeTab === tab.id && tab.colour ? { color: tab.colour } : {}}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Rally / Booth / Digital Tabs ─────────────────────────────── */}
        {activeTab !== 'topics' && (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-4"
          >
            {/* Benchmark progress bar */}
            {effectiveStateId && stateBenchmarks && (
              <BenchmarkBar
                category={activeTab as CampaignCategory}
                progress={getPlayerBenchmarkProgress(activeTab as CampaignCategory)}
                lockedLabels={getPlayerLockedBenchmarks(activeTab as CampaignCategory)}
                colour={CATEGORY_META[activeTab as CampaignCategory].colour}
                stateId={effectiveStateId}
                stateBenchmarks={stateBenchmarks}
                playerPartyId={playerPartyId}
                allParties={gameState.parties}
              />
            )}

            {/* Action cards */}
            <div className="space-y-2">
              <div className="text-xs text-text-muted uppercase tracking-wider px-1">
                {CATEGORY_META[activeTab as CampaignCategory].description}
              </div>
              {categoryActions.map(action => {
                const canAfford = budget >= action.cost;
                const isConstituencyAction = 
                  action.type === 'public_meeting' ||
                  action.type === 'door_to_door' ||
                  action.type === 'booth_workers' ||
                  action.type === 'candidate_promotion';

                return (
                  <motion.div
                    key={action.type}
                    whileHover={{ scale: 1.01 }}
                    className={`glass-card p-3 flex flex-col gap-2.5 transition-all ${
                      canAfford ? 'hover:border-saffron/20' : 'opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm"
                        style={{
                          backgroundColor: CATEGORY_META[activeTab as CampaignCategory].colour + '20',
                          border: `1px solid ${CATEGORY_META[activeTab as CampaignCategory].colour}40`,
                        }}
                      >
                        <Target className="w-4 h-4" style={{ color: CATEGORY_META[activeTab as CampaignCategory].colour }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-text-primary">{action.name}</div>
                        <div className="text-xs text-text-muted truncate mt-0.5">{action.description}</div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs text-accent-gold font-semibold">₹{action.cost} Cr</span>
                          <span className="text-xs text-india-green">+{action.popularityGain.toFixed(1)}% pop</span>
                          <span className="text-xs text-text-dim">Cooldown: {action.cooldown}T</span>
                        </div>
                      </div>
                      <button
                        onClick={() => canAfford && doAction(action.type, isConstituencyAction)}
                        disabled={!canAfford}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ${
                          canAfford
                            ? 'bg-saffron/15 text-saffron hover:bg-saffron/25 border border-saffron/30'
                            : 'bg-white/[0.04] text-text-dim cursor-not-allowed'
                        }`}
                      >
                        {canAfford ? 'Launch →' : 'No funds'}
                      </button>
                    </div>

                    {isConstituencyAction && (
                      <div className="p-2 rounded-xl bg-black/20 border border-white/5 flex items-center justify-between gap-3">
                        <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold">Target Constituency:</span>
                        <select
                          value={effectiveConstId}
                          onChange={(e) => {
                            setSelectedConstId(e.target.value);
                            selectConstituency(e.target.value);
                          }}
                          className="bg-[#0b1021] border border-white/10 rounded px-2.5 py-1 text-xs text-white focus:outline-none flex-1 max-w-[220px]"
                        >
                          <option value="">-- Choose Constituency --</option>
                          {stateConsts.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name} {c.isReserved ? `(${c.reservedFor})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Topics Tab ───────────────────────────────────────────────── */}
        {activeTab === 'topics' && (
          <motion.div
            key="topics"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="text-xs text-text-muted uppercase tracking-wider">
                Campaign Agenda — {effectiveStateId ? gameState.states[effectiveStateId]?.name : 'Select State'}
              </div>
              <div className="text-xs text-text-dim">{activeTopicIds.length}/3 active</div>
            </div>

            {topicError && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
                {topicError}
              </div>
            )}

            {/* Active topics */}
            {activeTopicIds.length > 0 && (
              <div className="glass-card p-3 border border-india-green/20 bg-india-green/5">
                <div className="text-xs text-india-green font-semibold mb-2 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Active Agenda in {stateData?.name ?? effectiveStateId}
                </div>
                <div className="space-y-1.5">
                  {activeTopicIds.map(tid => {
                    const t = RALLY_TOPICS[tid];
                    if (!t) return null;
                    return (
                      <div key={tid} className="flex items-center gap-2 bg-white/[0.04] rounded-lg px-2.5 py-1.5">
                        <span className="text-india-green">{getTopicIcon(t.icon)}</span>
                        <span className="text-xs text-text-primary flex-1">{t.name}</span>
                        <span className="text-xs text-india-green font-semibold">+{t.voteShareBonus}% vote</span>
                        <button
                          onClick={() => removeActiveTopic(tid, effectiveStateId)}
                          className="text-red-400 text-xs hover:text-red-300 ml-1"
                          title="Remove topic"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Available topics */}
            <div className="space-y-2">
              {Object.values(RALLY_TOPICS).map(topic => {
                const isActive = activeTopicIds.includes(topic.id);
                const canAfford = budget >= topic.cost;
                const resonates = !topic.requiredIssue || (stateData?.primaryIssues ?? []).includes(topic.requiredIssue);
                const urbanOk = !topic.urbanCondition ||
                  (topic.urbanCondition === 'urban' && (stateData?.urbanization ?? 50) >= 30) ||
                  (topic.urbanCondition === 'rural' && (stateData?.urbanization ?? 50) <= 70) ||
                  topic.urbanCondition === 'both';

                return (
                  <motion.div
                    key={topic.id}
                    whileHover={{ scale: isActive ? 1 : 1.01 }}
                    className={`glass-card p-3 transition-all ${
                      isActive ? 'border-india-green/30 bg-india-green/5' :
                      !resonates || !urbanOk ? 'opacity-40' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: '#A855F720', border: '1px solid #A855F740' }}
                      >
                        <span className="text-purple-400">{getTopicIcon(topic.icon)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-text-primary">{topic.name}</span>
                          {isActive && <CheckCircle className="w-3.5 h-3.5 text-india-green" />}
                          {!resonates && <span className="text-xs text-text-dim">(not relevant here)</span>}
                        </div>
                        <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{topic.description}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span className="text-xs text-purple-400 font-semibold">+{topic.voteShareBonus}% vote share</span>
                          <span className="text-xs text-accent-gold">₹{topic.cost} Cr commitment</span>
                          <span className="text-xs text-text-dim">{topic.turns} turns active</span>
                          {topic.targetDemographics.map(d => (
                            <span key={d} className="text-xs bg-purple-500/10 text-purple-300 px-1.5 py-0.5 rounded-full border border-purple-500/20">
                              {d.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                      {!isActive && (
                        <button
                          onClick={() => canAfford && resonates && urbanOk && doCommitTopic(topic)}
                          disabled={!canAfford || !resonates || !urbanOk}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-all ${
                            canAfford && resonates && urbanOk
                              ? 'bg-purple-500/15 text-purple-300 hover:bg-purple-500/25 border border-purple-500/30'
                              : 'bg-white/[0.04] text-text-dim cursor-not-allowed'
                          }`}
                        >
                          {!canAfford ? 'No funds' : !resonates || !urbanOk ? 'N/A' : 'Commit'}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Benchmark Bar Component ──────────────────────────────────────────────────

interface BenchmarkBarProps {
  category: CampaignCategory;
  progress: { points: number; nextLevel: number; nextPoints: number };
  lockedLabels: string[];
  colour: string;
  stateId: string;
  stateBenchmarks: NonNullable<GameState['benchmarks'][string]>;
  playerPartyId: string;
  allParties: GameState['parties'];
}

// Import GameState type for the component
import type { GameState } from '../../engine/types';

function BenchmarkBar({
  category, progress, lockedLabels, colour, stateBenchmarks, playerPartyId, allParties
}: BenchmarkBarProps) {
  const cat = stateBenchmarks[category];
  const { points, nextPoints } = progress;
  const pct = Math.min(100, (points / nextPoints) * 100);

  // Who leads in this category?
  const leaderEntry = Object.entries(cat.progress).sort((a, b) => b[1] - a[1])[0];
  const leaderId = leaderEntry?.[0];
  const leaderName = allParties[leaderId ?? '']?.abbreviation ?? leaderId ?? '?';
  const isLeading = leaderId === playerPartyId;

  const lockedCount = Object.values(cat.locks).filter(l => l.partyId === playerPartyId).length;
  const opponentLocked = Object.values(cat.locks).filter(l => l.partyId !== playerPartyId).length;

  return (
    <div className="glass-card p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: colour }}
          >
            {category} Benchmark
          </div>
          {lockedCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-india-green">
              <Lock className="w-3 h-3" />
              {lockedCount} levels locked by you
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs">
          {isLeading ? (
            <span className="text-india-green font-semibold">▲ You lead</span>
          ) : (
            <span className="text-red-400">{leaderName} leads</span>
          )}
          {opponentLocked > 0 && (
            <span className="text-red-400/70 flex items-center gap-0.5">
              <Lock className="w-3 h-3" />{opponentLocked} opponent-locked
            </span>
          )}
        </div>
      </div>

      {/* Progress bar with 10 milestone ticks */}
      <div className="relative">
        <div className="h-3 bg-white/[0.06] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: colour, width: `${pct}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        {/* Milestone tick marks */}
        <div className="flex justify-between mt-1">
          {BENCHMARK_LEVELS.slice(0, 5).map(bm => {
            const locked = cat.locks[bm.level];
            return (
              <div
                key={bm.level}
                className="text-xs text-center"
                title={`Level ${bm.level}: ${bm.points} pts → +${bm.voteShareBonus}% vote share\n${bm.label}`}
              >
                {locked ? (
                  <Lock
                    className="w-3 h-3 mx-auto"
                    style={{ color: locked.partyId === playerPartyId ? '#10B981' : '#EF4444' }}
                  />
                ) : (
                  <div className="w-1 h-1 rounded-full bg-white/20 mx-auto mt-1" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between mt-1.5 text-xs text-text-muted">
        <span>{points.toFixed(0)} pts</span>
        <span>Next milestone at {progress.nextPoints} pts → +{BENCHMARK_LEVELS.find(b => b.level === progress.nextLevel)?.voteShareBonus ?? 0}% vote share</span>
      </div>

      {lockedLabels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {lockedLabels.map((label, i) => (
            <span
              key={i}
              className="text-xs px-2 py-0.5 rounded-full bg-india-green/10 text-india-green border border-india-green/20 flex items-center gap-1"
            >
              <Lock className="w-2.5 h-2.5" />
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
