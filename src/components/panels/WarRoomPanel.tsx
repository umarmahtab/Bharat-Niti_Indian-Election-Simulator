/**
 * BHARAT NITI — Campaign War Room Panel (v2)
 * Analytical command center with "Quick Deploy" fast-action buttons to launch campaigns directly.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ShieldAlert, ArrowRight, Award, ListFilter, Zap, CheckCircle2, AlertTriangle, Target } from 'lucide-react';
import { useGameStore, selectPlayerBudget } from '../../store/gameStore';
import { getCampaignPriorities } from '../../engine/campaignWarRoom';
import { CAMPAIGN_ACTIONS } from '../../engine/data/campaignActions';

export default function WarRoomPanel() {
  const { gameState, selectState, setActivePanel, performCampaignAction } = useGameStore();
  const playerBudget = useGameStore(selectPlayerBudget);
  const [actionFeedback, setActionFeedback] = useState<Record<string, { msg: string; ok: boolean }>>({});

  if (!gameState) return null;

  const priorities = getCampaignPriorities(gameState, gameState.playerPartyId);
  const criticalCount = priorities.filter(p => p.stars === 5).length;
  const highCount = priorities.filter(p => p.stars === 4).length;

  const handleQuickDeploy = (rec: any) => {
    const res = performCampaignAction(rec.recommendedActionType, rec.stateId);
    setActionFeedback(prev => ({
      ...prev,
      [rec.stateId]: { msg: res.message, ok: res.success }
    }));
    setTimeout(() => {
      setActionFeedback(prev => {
        const copy = { ...prev };
        delete copy[rec.stateId];
        return copy;
      });
    }, 4500);
  };

  return (
    <div className="space-y-6 text-text-primary">
      {/* Header banner */}
      <div className="bg-gradient-to-r from-saffron/15 to-accent-gold/5 border border-saffron/20 p-5 rounded-2xl flex gap-4 items-center">
        <div className="w-12 h-12 rounded-full bg-saffron/20 flex items-center justify-center text-saffron shrink-0 shadow-lg">
          <ShieldAlert className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h2 className="font-display font-bold text-xl text-white tracking-tight">Campaign War Room</h2>
          <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
            Our intelligence cells have analyzed polling trends and seat numbers. There are currently <strong className="text-saffron">{criticalCount} Critical (5★)</strong> and <strong className="text-accent-gold">{highCount} High Priority (4★)</strong> campaigns demanding immediate deployment.
          </p>
        </div>
      </div>

      {/* Priority card list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-text-muted font-bold uppercase tracking-wider px-1">
          <span className="flex items-center gap-1.5"><ListFilter className="w-3.5 h-3.5" /> Targeting Priorities</span>
          <span>{priorities.length} States Analysed</span>
        </div>

        {priorities.map((rec, idx) => {
          const isCritical = rec.stars === 5;
          const isHigh = rec.stars === 4;
          const feedback = actionFeedback[rec.stateId];
          const actionDef = CAMPAIGN_ACTIONS[rec.recommendedActionType];
          const cost = actionDef?.cost ?? 10;
          const hasEnoughBudget = playerBudget >= cost;

          return (
            <motion.div
              key={rec.stateId}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className={`glass-card p-5 border transition-all flex flex-col md:flex-row gap-5 items-start md:items-center relative overflow-hidden ${
                isCritical 
                  ? 'border-red-500/30 bg-red-500/[0.02] shadow-[0_4px_20px_rgba(239,68,68,0.05)]' 
                  : isHigh 
                  ? 'border-saffron/20 bg-saffron/[0.01]' 
                  : 'border-white/5'
              }`}
            >
              {/* Star Rating & State name */}
              <div className="w-full md:w-56 shrink-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-base text-white tracking-tight">{rec.stateName}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-text-muted">
                    {rec.seats} Seats
                  </span>
                </div>
                
                {/* Star rating icons */}
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < rec.stars 
                          ? isCritical 
                            ? 'text-red-400 fill-red-400' 
                            : 'text-saffron fill-saffron' 
                          : 'text-white/10'
                      }`}
                    />
                  ))}
                  <span className={`text-[10px] ml-1.5 font-bold uppercase tracking-wider ${
                    isCritical ? 'text-red-400' : isHigh ? 'text-saffron' : 'text-text-dim'
                  }`}>
                    {rec.status}
                  </span>
                </div>
              </div>

              {/* Dynamic explanation */}
              <div className="flex-1 space-y-2.5">
                <p className="text-xs text-text-secondary leading-relaxed">{rec.explanation}</p>
                
                {/* Recommendation block */}
                <div className="p-2.5 rounded-xl bg-black/20 border border-white/5 flex gap-2.5 items-start">
                  <div className="w-5 h-5 rounded-full bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center text-accent-gold shrink-0 mt-0.5">
                    <Award className="w-3 h-3" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] uppercase font-bold text-accent-gold tracking-wider">Recommended Strategy</div>
                    <div className="text-xs text-white/90 mt-0.5 leading-relaxed">{rec.recommendedAction}</div>
                  </div>
                </div>

                {/* Interactive Toast Feedback */}
                <AnimatePresence>
                  {feedback && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className={`text-xs font-bold flex items-center gap-1.5 mt-2 ${feedback.ok ? 'text-india-green' : 'text-red-400'}`}
                    >
                      {feedback.ok ? <CheckCircle2 className="w-4 h-4 text-india-green" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
                      <span>{feedback.msg}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Side Metric & Action Buttons */}
              <div className="w-full md:w-fit flex md:flex-col items-center md:items-end justify-between gap-4 shrink-0 border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                <div className="text-left md:text-right">
                  <div className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Est. Seats at Stake</div>
                  <div className={`text-lg font-bold font-mono mt-0.5 ${isCritical ? 'text-red-400' : 'text-white'}`}>
                    {rec.estimatedSeatsStake} Seats
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      selectState(rec.stateId);
                      setActivePanel('campaign');
                    }}
                    className="btn-secondary text-[11px] flex items-center gap-1 py-1.5 px-2.5 border-white/10 hover:border-white/20"
                    title="Open state details to inspect constituencies"
                  >
                    Details
                  </button>

                  <button
                    onClick={() => handleQuickDeploy(rec)}
                    disabled={!hasEnoughBudget}
                    className={`text-[11px] flex items-center gap-1.5 py-1.5 px-3 rounded-lg font-semibold transition-all border shrink-0 ${
                      feedback?.ok 
                        ? 'bg-india-green/10 border-india-green text-india-green cursor-default'
                        : !hasEnoughBudget
                        ? 'border-white/5 bg-white/[0.02] text-text-dim cursor-not-allowed'
                        : isCritical
                        ? 'bg-red-600/10 border-red-500/30 text-red-400 hover:bg-red-600 hover:text-white hover:border-red-500 shadow-md shadow-red-950/20'
                        : 'bg-saffron/10 border-saffron/30 text-saffron hover:bg-saffron hover:text-navy-950 hover:border-saffron'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Quick Deploy (₹{cost}Cr)
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
