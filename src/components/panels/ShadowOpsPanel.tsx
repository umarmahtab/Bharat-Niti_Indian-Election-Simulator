/**
 * BHARAT NITI — Shadow Operations Panel
 * Black budget backdoor political operations.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  EyeOff, AlertTriangle, Tv, Star, Megaphone, Users,
  BarChart2, FileWarning, Banknote, Receipt, Camera,
  Bot, LogIn, UserMinus, Crosshair, Shield, Lock
} from 'lucide-react';
import { useGameStore, selectPlayerBlackBudget } from '../../store/gameStore';
import {
  SHADOW_OPERATIONS,
  ALL_SHADOW_OPERATIONS,
  type ShadowOperationType,
} from '../../engine/data/shadowOperations';

const ICON_MAP: Record<string, React.ReactNode> = {
  Tv: <Tv className="w-4 h-4" />,
  Star: <Star className="w-4 h-4" />,
  Megaphone: <Megaphone className="w-4 h-4" />,
  Users: <Users className="w-4 h-4" />,
  BarChart2: <BarChart2 className="w-4 h-4" />,
  FileWarning: <FileWarning className="w-4 h-4" />,
  Banknote: <Banknote className="w-4 h-4" />,
  Receipt: <Receipt className="w-4 h-4" />,
  Camera: <Camera className="w-4 h-4" />,
  Bot: <Bot className="w-4 h-4" />,
  LogIn: <LogIn className="w-4 h-4" />,
  UserMinus: <UserMinus className="w-4 h-4" />,
  Crosshair: <Crosshair className="w-4 h-4" />,
};

const CATEGORY_COLOURS: Record<string, { bg: string; text: string; border: string }> = {
  media: { bg: 'bg-blue-500/10', text: 'text-blue-300', border: 'border-blue-500/20' },
  intelligence: { bg: 'bg-red-500/10', text: 'text-red-300', border: 'border-red-500/20' },
  defection: { bg: 'bg-purple-500/10', text: 'text-purple-300', border: 'border-purple-500/20' },
  money: { bg: 'bg-yellow-500/10', text: 'text-yellow-300', border: 'border-yellow-500/20' },
  ground: { bg: 'bg-orange-500/10', text: 'text-orange-300', border: 'border-orange-500/20' },
};

export default function ShadowOpsPanel() {
  const { gameState, performShadowOp } = useGameStore();
  const blackBudget = useGameStore(selectPlayerBlackBudget);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStateId, setSelectedStateId] = useState<string>('');
  const [selectedTargetParty, setSelectedTargetParty] = useState<string>('');
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean; exposed?: boolean } | null>(null);
  const [confirmOp, setConfirmOp] = useState<ShadowOperationType | null>(null);

  if (!gameState) return null;

  const stateIds = Object.keys(gameState.states);
  const effectiveStateId = selectedStateId || stateIds[0] || '';
  const aiParties = Object.values(gameState.parties).filter(p => p.id !== gameState.playerPartyId);

  const categories = ['all', 'media', 'intelligence', 'defection', 'money', 'ground'];
  const filteredOps = ALL_SHADOW_OPERATIONS.filter(
    op => selectedCategory === 'all' || op.category === selectedCategory
  );

  function doShadowOp(opType: ShadowOperationType) {
    const op = SHADOW_OPERATIONS[opType];
    const targetState = op.targetType === 'state' ? effectiveStateId : undefined;
    const targetParty = op.targetType === 'party' ? (selectedTargetParty || aiParties[0]?.id) : undefined;

    const result = performShadowOp(opType, targetState, targetParty);
    setFeedback({
      msg: result.exposed
        ? `🚨 EXPOSED! ${SHADOW_OPERATIONS[opType].exposure.description}`
        : `✓ ${SHADOW_OPERATIONS[opType].name} executed successfully. Results emerging...`,
      ok: result.success && !result.exposed,
      exposed: result.exposed,
    });
    setConfirmOp(null);
    setTimeout(() => setFeedback(null), 6000);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <EyeOff className="w-5 h-5 text-red-400" />
            <h2 className="font-display font-bold text-2xl text-text-primary">Shadow Operations</h2>
          </div>
          <p className="text-text-muted text-sm mt-0.5">Backdoor politics — high reward, high risk. Never traceable (usually).</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-text-muted flex items-center gap-1.5 justify-end">
            <Lock className="w-3 h-3 text-red-400" />
            Black Budget
          </div>
          <div className="text-xl font-bold text-red-400 tabular">₹{blackBudget.toFixed(0)} Cr</div>
          <div className="text-xs text-text-dim">Hidden funds</div>
        </div>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/5 border border-red-500/15 text-xs text-red-400/80">
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>These operations are OFF the record. Exposure risks are real — check before committing. Black budget grows by ~25% of your turn income each turn.</span>
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`px-4 py-3 rounded-xl text-sm font-medium border ${
              feedback.exposed
                ? 'bg-red-500/15 border-red-500/40 text-red-300'
                : feedback.ok
                ? 'bg-india-green/15 border-india-green/30 text-india-green'
                : 'bg-red-500/15 border-red-500/30 text-red-400'
            }`}
          >
            {feedback.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Targeting Controls */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-3">
          <div className="text-xs text-text-muted mb-2">Target State</div>
          <select
            value={effectiveStateId}
            onChange={e => setSelectedStateId(e.target.value)}
            className="w-full bg-transparent text-sm text-text-primary outline-none"
          >
            {stateIds.map(sid => (
              <option key={sid} value={sid} style={{ backgroundColor: '#0d1224' }}>
                {gameState.states[sid]?.name ?? sid}
              </option>
            ))}
          </select>
        </div>
        <div className="glass-card p-3">
          <div className="text-xs text-text-muted mb-2">Target Party</div>
          <select
            value={selectedTargetParty}
            onChange={e => setSelectedTargetParty(e.target.value)}
            className="w-full bg-transparent text-sm text-text-primary outline-none"
          >
            {aiParties.map(p => (
              <option key={p.id} value={p.id} style={{ backgroundColor: '#0d1224' }}>
                {p.abbreviation} — {p.leader}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
              selectedCategory === cat
                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                : 'bg-white/[0.04] text-text-muted hover:text-text-primary'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Confirmation modal */}
      <AnimatePresence>
        {confirmOp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setConfirmOp(null)}
          >
            <div
              className="glass-card border border-red-500/30 p-6 max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span className="font-bold text-text-primary text-lg">Confirm Operation</span>
              </div>
              <div className="text-sm font-semibold text-saffron mb-1">{SHADOW_OPERATIONS[confirmOp].name}</div>
              <p className="text-sm text-text-muted mb-3 italic">{SHADOW_OPERATIONS[confirmOp].flavourText}</p>
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-4">
                <div className="text-xs text-red-400 font-semibold mb-1">⚠ Exposure Risk</div>
                <div className="text-xs text-text-muted">
                  {(SHADOW_OPERATIONS[confirmOp].exposure.probability * 100).toFixed(0)}% chance of exposure →{' '}
                  {SHADOW_OPERATIONS[confirmOp].exposure.playerPopularity}% popularity hit
                </div>
                <div className="text-xs text-text-dim mt-1">{SHADOW_OPERATIONS[confirmOp].exposure.description}</div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmOp(null)}
                  className="flex-1 px-4 py-2 rounded-xl text-sm text-text-muted border border-white/10 hover:bg-white/[0.05] transition-colors"
                >
                  Abort
                </button>
                <button
                  onClick={() => doShadowOp(confirmOp)}
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-colors"
                >
                  Execute Operation
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Operations list */}
      <div className="space-y-2">
        {filteredOps.map(op => {
          const catStyle = CATEGORY_COLOURS[op.category] ?? CATEGORY_COLOURS.media;
          const canAfford = op.cost === 0 || blackBudget >= op.cost;

          return (
            <motion.div
              key={op.id}
              whileHover={{ scale: canAfford ? 1.01 : 1 }}
              className={`glass-card p-3 transition-all ${!canAfford ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${catStyle.bg} border ${catStyle.border}`}>
                  <span className={catStyle.text}>
                    {ICON_MAP[op.icon] ?? <EyeOff className="w-4 h-4" />}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-text-primary">{op.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${catStyle.bg} ${catStyle.text} ${catStyle.border} border capitalize`}>
                      {op.category}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{op.description}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5">
                    <span className="text-xs text-red-400 font-semibold">
                      {op.cost === 0 ? '₹0 — Earns money' : `₹${op.cost} Cr black`}
                    </span>
                    <span className="text-xs text-yellow-400">
                      ⚠ {(op.exposure.probability * 100).toFixed(0)}% exposure risk
                    </span>
                    <span className="text-xs text-text-dim">Cooldown: {op.cooldown}T</span>
                  </div>
                  {/* Effect summary */}
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {op.effects.popularityDelta !== undefined && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full border ${
                        op.effects.popularityDelta > 0
                          ? 'bg-india-green/10 text-india-green border-india-green/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {op.effects.target === 'player' ? 'You' : 'Opponent'} {op.effects.popularityDelta > 0 ? '+' : ''}{op.effects.popularityDelta}% pop
                      </span>
                    )}
                    {op.effects.budgetGain !== undefined && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-300 border border-yellow-500/20">
                        +₹{op.effects.budgetGain} Cr campaign
                      </span>
                    )}
                    {op.effects.blackBudgetGain !== undefined && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-300 border border-red-500/20">
                        +₹{op.effects.blackBudgetGain} Cr black
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => canAfford && setConfirmOp(op.id)}
                  disabled={!canAfford}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-all ${
                    canAfford
                      ? 'bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-500/30'
                      : 'bg-white/[0.04] text-text-dim cursor-not-allowed'
                  }`}
                >
                  {canAfford ? 'Execute' : 'No funds'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
