/**
 * BHARAT NITI — Party Leaderboard (compact sidebar version)
 */

import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function PartyLeaderboard({ compact = false }: { compact?: boolean }) {
  const { gameState } = useGameStore();
  if (!gameState) return null;

  const parties = Object.values(gameState.parties)
    .sort((a, b) => (b.currentPopularity ?? b.startingPopularity) - (a.currentPopularity ?? a.startingPopularity))
    .slice(0, compact ? 8 : 20);

  return (
    <div className={compact ? 'space-y-1' : 'space-y-2'}>
      {!compact && (
        <div className="section-header">Party Rankings</div>
      )}
      {compact && (
        <div className="px-1 py-1 text-xs uppercase tracking-wider text-text-dim font-semibold">Rankings</div>
      )}
      {parties.map((party, i) => {
        const pop = party.currentPopularity ?? party.startingPopularity;
        const isPlayer = party.id === gameState.playerPartyId;

        return (
          <motion.div
            key={party.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`
              flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors
              ${isPlayer ? 'bg-saffron/10 border border-saffron/20' : 'hover:bg-white/[0.03]'}
            `}
          >
            <span className="text-text-dim text-xs w-4 text-right tabular flex-shrink-0">{i + 1}</span>
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center text-xs flex-shrink-0"
              style={{ backgroundColor: party.colour + '25', border: `1px solid ${party.colour}40` }}
            >
              {party.symbolEmoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-xs font-semibold truncate ${isPlayer ? 'text-saffron' : 'text-text-primary'}`}>
                {party.abbreviation}
              </div>
            </div>
            <div className="flex-shrink-0 text-right">
              <div className="text-xs font-bold tabular" style={{ color: party.colour }}>
                {pop.toFixed(0)}%
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
