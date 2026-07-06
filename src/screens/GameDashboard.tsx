/**
 * BHARAT NITI — Main Game Dashboard (v2)
 * Includes Shadow Ops nav item and per-turn income display.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map, Target, BookOpen, Users, TrendingUp, Bell,
  ChevronRight, Zap, DollarSign, Calendar, Award,
  FastForward, Settings, Home, EyeOff, Lock, ArrowUp, ShieldAlert
} from 'lucide-react';
import {
  useGameStore,
  selectPlayerParty,
  selectPlayerBudget,
  selectPlayerBlackBudget,
  selectPlayerPopularity,
  selectUnreadNotificationsCount,
  selectTurnIncome,
} from '../store/gameStore';
import IndiaMap from '../components/map/IndiaMap';
import CampaignPanel from '../components/panels/CampaignPanel';
import ManifestoPanel from '../components/panels/ManifestoPanel';
import MorningBriefing from '../components/ui/MorningBriefing';
import AlliancePanel from '../components/panels/AlliancePanel';
import PollsPanel from '../components/panels/PollsPanel';
import ShadowOpsPanel from '../components/panels/ShadowOpsPanel';
import WarRoomPanel from '../components/panels/WarRoomPanel';
import EventsFeed from '../components/ui/EventsFeed';
import PartyLeaderboard from '../components/ui/PartyLeaderboard';

export default function GameDashboard() {
  const {
    gameState, setScreen, setActivePanel,
    endTurn, isTurnAdvancing, returnToMainMenu
  } = useGameStore();
  const playerParty = useGameStore(selectPlayerParty);
  const budget = useGameStore(selectPlayerBudget);
  const blackBudget = useGameStore(selectPlayerBlackBudget);
  const popularity = useGameStore(selectPlayerPopularity);
  const unreadCount = useGameStore(selectUnreadNotificationsCount);
  const turnIncome = useGameStore(selectTurnIncome);
  const [showNotifications, setShowNotifications] = useState(false);

  if (!gameState || !playerParty) return null;

  const activePanel = gameState.activePanel ?? 'map';
  const progress = (gameState.currentTurn / gameState.totalTurns) * 100;
  const turnsLeft = gameState.totalTurns - gameState.currentTurn + 1;
  const stateLeadership =
    gameState.mode === 'state_assembly' && gameState.targetState
      ? playerParty.leadershipProfiles?.states?.[gameState.targetState]
      : undefined;
  const visibleLeader = gameState.mode === 'state_assembly'
    ? (stateLeadership?.chiefMinisterCandidate ?? playerParty.leader)
    : (playerParty.leadershipProfiles?.national?.primeMinisterCandidate ?? playerParty.leader);
  const leaderRoleLabel = gameState.mode === 'state_assembly' ? 'CM Candidate' : 'PM Candidate';
  const firstState = Object.values(gameState.states)[0];
  const majority = gameState.mode === 'lok_sabha'
    ? 272
    : Math.ceil((firstState ? firstState.assemblySeats : 200) / 2 + 1);

  const navItems = [
    { id: 'warroom', icon: <ShieldAlert className="w-4 h-4 text-saffron animate-pulse" />, label: 'War Room' },
    { id: 'map', icon: <Map className="w-4 h-4" />, label: 'Map' },
    { id: 'campaign', icon: <Target className="w-4 h-4" />, label: 'Campaign' },
    { id: 'manifesto', icon: <BookOpen className="w-4 h-4" />, label: 'Manifesto' },
    { id: 'alliance', icon: <Users className="w-4 h-4" />, label: 'Alliance' },
    { id: 'polls', icon: <TrendingUp className="w-4 h-4" />, label: 'Polls' },
    { id: 'shadow', icon: <EyeOff className="w-4 h-4" />, label: 'Shadow Ops', special: true },
  ] as const;

  return (
    <div className="flex flex-col w-full h-full bg-navy-900">
      <AnimatePresence>
        {gameState.showMorningBriefing && gameState.morningBriefing && (
          <MorningBriefing 
            briefing={gameState.morningBriefing}
            onClose={() => useGameStore.setState({ gameState: { ...gameState, showMorningBriefing: false } })}
          />
        )}
      </AnimatePresence>

      {/* ── TOP HUD BAR ─────────────────────────────────────────────── */}
      <div className="hud-bar px-4 py-2 flex items-center gap-3 flex-shrink-0 flex-wrap">
        {/* Logo */}
        <button onClick={returnToMainMenu} className="flex items-center gap-2 mr-1">
          <Home className="w-4 h-4 text-saffron" />
          <span className="font-display font-bold text-saffron text-sm">भारत नीति</span>
        </button>

        <div className="h-6 w-px bg-white/[0.08]" />

        {/* Player party info */}
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center text-sm"
            style={{ backgroundColor: playerParty.colour + '30', border: `1px solid ${playerParty.colour}50` }}
          >
            {playerParty.symbolEmoji}
          </div>
          <div>
            <div className="text-xs font-semibold text-text-primary">{playerParty.abbreviation}</div>
            <div className="text-xs text-text-muted">{leaderRoleLabel}: {visibleLeader}</div>
          </div>
        </div>

        <div className="h-6 w-px bg-white/[0.08]" />

        {/* Stats row */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Popularity */}
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-saffron" />
            <div>
              <div className="text-xs text-text-muted leading-none">Popularity</div>
              <div className="text-sm font-bold tabular" style={{ color: playerParty.colour }}>
                {popularity.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Campaign Budget */}
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-accent-gold" />
            <div>
              <div className="text-xs text-text-muted leading-none flex items-center gap-1">
                Budget
                <span className="text-india-green text-[10px] font-semibold">+₹{turnIncome}/T</span>
              </div>
              <div className="text-sm font-bold tabular text-accent-gold flex items-baseline gap-1">
                ₹{budget.toFixed(0)}Cr
                <span className="text-[10px] text-accent-gold/60 font-medium">
                  (Limit: ₹{gameState.maxBudgetPerTurn - gameState.budgetSpentThisTurn}Cr)
                </span>
              </div>
            </div>
          </div>

          {/* Black Budget */}
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-red-400" />
            <div>
              <div className="text-xs text-text-muted leading-none">Black</div>
              <div className="text-sm font-bold tabular text-red-400">
                ₹{blackBudget.toFixed(0)}Cr
              </div>
            </div>
          </div>

          {/* Turn */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-accent-blue" />
            <div>
              <div className="text-xs text-text-muted leading-none">Turn</div>
              <div className="text-sm font-bold tabular text-accent-blue">
                {gameState.currentTurn}/{gameState.totalTurns}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded border border-white/10">
            <div>
              <div className="text-[10px] text-text-muted leading-none mb-0.5 uppercase tracking-wider font-semibold">Actions</div>
              <div className="text-xs font-bold tabular text-saffron flex items-baseline gap-1">
                {gameState.maxActionsPerTurn - gameState.actionsTakenThisTurn} <span className="text-[10px] text-saffron/70">left</span>
              </div>
            </div>
          </div>

          {/* Election progress */}
          <div className="w-28">
            <div className="flex justify-between text-xs text-text-muted mb-1">
              <span>Election</span>
              <span>{turnsLeft}T left</span>
            </div>
            <div className="progress-bar h-1.5">
              <motion.div
                className="progress-fill bg-gradient-to-r from-saffron to-accent-gold"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Mode badge */}
        <div className="px-2 py-1 rounded-lg bg-white/[0.05] border border-white/[0.08] text-xs text-text-muted">
          {gameState.mode === 'lok_sabha' ? '🇮🇳 Lok Sabha' : `🏛 ${gameState.targetState ?? ''} Assembly`}
        </div>

        {/* Notifications */}
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 rounded-lg hover:bg-white/[0.05] transition-colors"
        >
          <Bell className="w-4 h-4 text-text-muted" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-saffron rounded-full text-xs flex items-center justify-center text-white font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Save */}
        <button
          onClick={() => setScreen('save_load')}
          className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors"
          title="Save/Load"
        >
          <Settings className="w-4 h-4 text-text-muted" />
        </button>

        {/* End Turn */}
        <button
          onClick={endTurn}
          disabled={isTurnAdvancing}
          className="flex items-center gap-2 px-4 py-2 bg-saffron/10 border border-saffron/30 rounded-xl text-saffron text-sm font-semibold hover:bg-saffron/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isTurnAdvancing ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Zap className="w-4 h-4" />
              </motion.div>
              Processing...
            </>
          ) : (
            <>
              <FastForward className="w-4 h-4" />
              End Turn
            </>
          )}
        </button>
      </div>

      {/* ── MAIN CONTENT AREA ──────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* Left sidebar: Nav + Leaderboard */}
        <div className="w-44 flex-shrink-0 flex flex-col border-r border-white/[0.06] bg-navy-900/50">
          <nav className="p-2 space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActivePanel(item.id as GameState['activePanel'])}
                className={`
                  w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all
                  ${'special' in item && item.special
                    ? activePanel === item.id
                      ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                      : 'text-red-400/60 hover:text-red-400 hover:bg-red-500/[0.05]'
                    : activePanel === item.id
                    ? 'bg-saffron/15 text-saffron border border-saffron/20'
                    : 'text-text-muted hover:text-text-primary hover:bg-white/[0.05]'}
                `}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
                {activePanel === item.id && <ChevronRight className="w-3 h-3 ml-auto" />}
              </button>
            ))}
          </nav>

          <div className="h-px bg-white/[0.06] mx-3 my-2" />

          {/* Party leaderboard mini */}
          <div className="flex-1 overflow-y-auto panel-scroll px-2">
            <PartyLeaderboard compact />
          </div>
        </div>

        {/* Centre: Map or Active Panel */}
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {activePanel === 'warroom' && (
              <motion.div
                key="warroom"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute inset-0 overflow-y-auto panel-scroll p-4"
              >
                <WarRoomPanel />
              </motion.div>
            )}
            {activePanel === 'map' && (
              <motion.div
                key="map"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 p-4"
              >
                <IndiaMap />
              </motion.div>
            )}
            {activePanel === 'campaign' && (
              <motion.div
                key="campaign"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute inset-0 overflow-y-auto panel-scroll p-4"
              >
                <CampaignPanel />
              </motion.div>
            )}
            {activePanel === 'manifesto' && (
              <motion.div
                key="manifesto"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute inset-0 overflow-y-auto panel-scroll p-4"
              >
                <ManifestoPanel />
              </motion.div>
            )}
            {activePanel === 'alliance' && (
              <motion.div
                key="alliance"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute inset-0 overflow-y-auto panel-scroll p-4"
              >
                <AlliancePanel />
              </motion.div>
            )}
            {activePanel === 'polls' && (
              <motion.div
                key="polls"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute inset-0 overflow-y-auto panel-scroll p-4"
              >
                <PollsPanel />
              </motion.div>
            )}
            {activePanel === 'shadow' && (
              <motion.div
                key="shadow"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute inset-0 overflow-y-auto panel-scroll p-4"
              >
                <ShadowOpsPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right sidebar: Events feed */}
        <div className="w-64 flex-shrink-0 border-l border-white/[0.06] flex flex-col bg-navy-900/50">
          <div className="p-3 border-b border-white/[0.06]">
            <h3 className="text-xs uppercase tracking-wider text-text-muted font-semibold">Live Feed</h3>
          </div>
          <div className="flex-1 overflow-y-auto panel-scroll">
            <EventsFeed />
          </div>
        </div>
      </div>

      {/* Notification panel */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-14 right-16 z-40 w-80 glass-card border border-white/10 shadow-2xl"
          >
            <div className="p-3 border-b border-white/[0.06] flex items-center justify-between">
              <span className="text-sm font-semibold text-text-primary">Notifications</span>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-text-muted hover:text-text-primary text-xs"
              >
                Close
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto panel-scroll">
              {gameState.notifications.slice(-15).reverse().map((n, i) => (
                <div
                  key={`${n.id}_${i}`}
                  className={`p-3 border-b border-white/[0.04] ${n.isRead ? 'opacity-50' : ''}`}
                >
                  <div className="text-xs font-semibold text-text-primary">{n.title}</div>
                  <div className="text-xs text-text-muted mt-0.5">{n.message}</div>
                </div>
              ))}
              {gameState.notifications.length === 0 && (
                <div className="p-4 text-center text-text-dim text-xs">No notifications yet</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Need to import GameState type for the panel type
import type { GameState } from '../engine/types';
