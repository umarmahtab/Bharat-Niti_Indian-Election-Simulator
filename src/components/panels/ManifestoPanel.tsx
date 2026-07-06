/**
 * BHARAT NITI — Manifesto Panel
 */

import { motion } from 'framer-motion';
import { Check, X, Zap, DollarSign, TrendingUp } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { MANIFESTO_PROMISES } from '../../engine/data/manifesto';

export default function ManifestoPanel() {
  const { gameState, toggleManifestoPromise } = useGameStore();
  if (!gameState) return null;

  const promised = gameState.playerManifesto;
  const totalBonus = promised.reduce((a, p) => a + p.popularityBonus, 0);
  const totalCost = promised.reduce((a, p) => a + p.budgetImpact, 0);
  const totalCredibility = promised.reduce((a, p) => a + p.credibilityImpact, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl text-text-primary">Manifesto Builder</h2>
          <p className="text-text-muted text-sm">Make promises to the people. Credibility matters.</p>
        </div>
      </div>

      {/* Summary bar */}
      <div className="glass-card p-4 grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-xl font-bold text-india-green">+{totalBonus}%</div>
          <div className="text-xs text-text-muted">Popularity Bonus</div>
        </div>
        <div className="text-center border-x border-white/[0.06]">
          <div className="text-xl font-bold text-accent-gold">₹{totalCost}Cr</div>
          <div className="text-xs text-text-muted">Campaign Cost</div>
        </div>
        <div className="text-center">
          <div className={`text-xl font-bold ${totalCredibility >= 0 ? 'text-accent-blue' : 'text-red-400'}`}>
            {totalCredibility >= 0 ? '+' : ''}{totalCredibility}
          </div>
          <div className="text-xs text-text-muted">Credibility</div>
        </div>
      </div>

      {/* Promises grid */}
      <div className="grid grid-cols-1 gap-3">
        {MANIFESTO_PROMISES.map(promise => {
          const isPromised = promised.some(p => p.type === promise.type);

          return (
            <motion.div
              key={promise.type}
              whileHover={{ scale: 1.01 }}
              onClick={() => toggleManifestoPromise(promise)}
              className={`
                glass-card p-4 cursor-pointer border-2 transition-all duration-200
                ${isPromised ? 'border-india-green/50 bg-india-green/10' : 'border-white/[0.06] hover:border-white/20'}
              `}
            >
              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 border-2 transition-all ${isPromised ? 'bg-india-green border-india-green' : 'border-white/20'}`}>
                  {isPromised && <Check className="w-3.5 h-3.5 text-white" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-text-primary mb-1">{promise.name}</div>
                  <p className="text-text-muted text-xs leading-relaxed mb-2">{promise.description}</p>

                  <div className="flex gap-3 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-india-green">
                      <TrendingUp className="w-3 h-3" />
                      +{promise.popularityBonus}% pop
                    </span>
                    <span className="flex items-center gap-1 text-xs text-accent-gold">
                      <DollarSign className="w-3 h-3" />
                      ₹{promise.budgetImpact}Cr
                    </span>
                    <span className={`flex items-center gap-1 text-xs ${promise.credibilityImpact >= 0 ? 'text-accent-blue' : 'text-red-400'}`}>
                      <Zap className="w-3 h-3" />
                      {promise.credibilityImpact >= 0 ? '+' : ''}{promise.credibilityImpact} credibility
                    </span>
                  </div>

                  <div className="mt-2 flex gap-1 flex-wrap">
                    {promise.issueAlignment.map(issue => (
                      <span key={issue} className="badge text-xs bg-saffron/10 text-saffron">
                        {issue.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
