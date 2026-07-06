/**
 * BHARAT NITI — Election Day Screen (Live Ticker)
 * Simulates a news channel EVM counting process with fluctuating leads and declared wins.
 */

import { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { Tv, Radio, Award, AlertCircle, ChevronRight, Zap, CheckCircle2 } from 'lucide-react';

export default function ElectionDay() {
  const { gameState, triggerElection } = useGameStore();

  const [phase, setPhase] = useState<'intro' | 'counting' | 'done'>('intro');
  const [progress, setProgress] = useState(0);
  const [currentLeading, setCurrentLeading] = useState<Record<string, number>>({});
  const [currentWon, setCurrentWon] = useState<Record<string, number>>({});
  const [breakingAlert, setBreakingAlert] = useState<string>('EVM counting about to commence. Stay tuned for live trends...');

  if (!gameState || !gameState.electionResult) return null;

  const result = gameState.electionResult;
  const totalSeats = result.totalSeats;
  const majority = result.majorityThreshold;

  // Get top 5 parties to display
  const topParties = useMemo(() => {
    return Object.entries(result.byParty)
      .sort((a, b) => b[1].seatsWon - a[1].seatsWon)
      .slice(0, 5)
      .map(([partyId]) => partyId);
  }, [result]);

  // Shuffle constituencies once to randomize geographic counting order
  const shuffledConsts = useMemo(() => {
    return [...Object.entries(result.byConstituency)].sort(() => Math.random() - 0.5);
  }, [result]);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('counting'), 2500);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (phase !== 'counting') return;

    let step = 0;
    // Lok Sabha has 543 seats, Assembly has ~70-200. Count in ~50 steps total
    const totalSteps = 55;
    const stepSize = Math.max(1, Math.ceil(totalSeats / totalSteps));

    const interval = setInterval(() => {
      step++;
      const constsCounted = Math.min(totalSeats, step * stepSize);
      const pct = (constsCounted / totalSeats) * 100;
      setProgress(pct);

      const leading: Record<string, number> = {};
      const won: Record<string, number> = {};

      // Initialize all top parties at 0
      topParties.forEach(pid => {
        leading[pid] = 0;
        won[pid] = 0;
      });

      // Shuffled constituencies list
      for (let i = 0; i < totalSeats; i++) {
        const [cId, cResult] = shuffledConsts[i];
        const winner = cResult.winner;
        
        if (i < constsCounted) {
          // DECLARED WIN
          won[winner] = (won[winner] ?? 0) + 1;
        } else if (i < constsCounted + Math.ceil(totalSeats * 0.25)) {
          // CURRENTLY LEADING (Active Window)
          // Add minor lead fluctuation for close contests (margin < 6)
          const runnerUp = cResult.runnerUp ?? 'None';
          const isLeadFluctuating = cResult.margin < 6.0 && Math.random() < 0.45;
          const currentLead = isLeadFluctuating && runnerUp !== 'None' ? runnerUp : winner;
          
          leading[currentLead] = (leading[currentLead] ?? 0) + 1;
        }
      }

      setCurrentLeading(leading);
      setCurrentWon(won);

      // Generate realistic breaking news ticker alerts
      if (constsCounted < totalSeats) {
        const randomIndex = Math.floor(Math.random() * constsCounted);
        const declaredItem = shuffledConsts[randomIndex];
        const activeItem = shuffledConsts[Math.min(totalSeats - 1, constsCounted + Math.floor(Math.random() * 5))];

        if (declaredItem && Math.random() > 0.6) {
          const [cName, cRes] = declaredItem;
          const winnerAbbr = gameState.parties[cRes.winner]?.abbreviation ?? cRes.winner;
          setBreakingAlert(`🚨 DECISION: ${winnerAbbr} wins ${cName} seat by ${cRes.margin.toFixed(1)}% margin of votes!`);
        } else if (activeItem) {
          const [cName, cRes] = activeItem;
          const leaderAbbr = gameState.parties[cRes.winner]?.abbreviation ?? cRes.winner;
          const isClose = cRes.margin < 5;
          setBreakingAlert(isClose 
            ? `⚡ CLOSE CONTEST: Neck-and-neck race in ${cName} between ${leaderAbbr} and ${gameState.parties[cRes.runnerUp ?? '']?.abbreviation ?? 'rival'}!` 
            : `📊 TREND: ${leaderAbbr} leading comfortably in ${cName} with strong early rounds support.`);
        }
      }

      if (constsCounted >= totalSeats) {
        clearInterval(interval);
        setPhase('done');
        
        // Lock final exact figures
        const finalWon: Record<string, number> = {};
        topParties.forEach(pid => {
          finalWon[pid] = result.byParty[pid]?.seatsWon ?? 0;
        });
        setCurrentWon(finalWon);
        setCurrentLeading({});
        setBreakingAlert(`🎉 FINAL VERDICT: Election counting complete. ${gameState.parties[result.winnerPartyId]?.abbreviation} emerges as largest party!`);
      }
    }, 280);

    return () => clearInterval(interval);
  }, [phase, result, totalSeats, topParties, shuffledConsts, gameState.parties]);

  useEffect(() => {
    if (phase === 'done') {
      const t = setTimeout(() => triggerElection(), 4000);
      return () => clearTimeout(t);
    }
  }, [phase, triggerElection]);

  return (
    <div className="w-full h-full bg-navy-950 flex flex-col items-center justify-center p-6 relative overflow-hidden text-text-primary">
      {/* Studio grid backdrop */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />
      
      {/* Glow effects */}
      <div className="absolute top-[-10%] left-[20%] w-[60%] h-[30%] bg-saffron/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[20%] w-[50%] h-[35%] bg-india-green/5 rounded-full blur-[120px]" />

      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center flex-1 justify-between py-4">
        {/* Header Block */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 bg-red-600 border border-red-500 text-white px-3.5 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-3.5 shadow-md shadow-red-900/20">
            <Tv className="w-3.5 h-3.5 animate-pulse text-white" /> Live Election Results
          </div>
          <h1 className="font-display font-black text-3xl tracking-tight uppercase text-white mb-1">
            {phase === 'intro' ? 'EVM Counting Commencing' : phase === 'done' ? 'Final Verdict' : 'Live EVM Tally'}
          </h1>
          <p className="text-text-muted text-sm font-medium">
            {gameState.mode === 'lok_sabha' ? 'Lok Sabha (General Elections)' : `${gameState.states[gameState.targetState ?? '']?.name} Assembly Election`}
            {' '}• {totalSeats} Seats total (Majority Mark: {majority})
          </p>
        </motion.div>

        {/* Live Counters */}
        {phase !== 'intro' && (
          <div className="w-full space-y-3 mt-4 flex-1 flex flex-col justify-center max-w-3xl">
            <AnimatePresence>
              {topParties.map((pid) => {
                const party = gameState.parties[pid];
                const leadingCount = currentLeading[pid] || 0;
                const wonCount = currentWon[pid] || 0;
                const totalTally = leadingCount + wonCount;
                
                const isWinner = phase === 'done' && pid === result.winnerPartyId;
                const progressPct = (totalTally / totalSeats) * 100;
                const majorityPct = (majority / totalSeats) * 100;
                
                return (
                  <motion.div
                    key={pid}
                    layout
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className={`relative overflow-hidden glass-card p-3 border transition-all duration-300 flex items-center gap-4 ${
                      isWinner ? 'border-india-green/40 bg-india-green/5 shadow-lg shadow-india-green/5' : 'border-white/5 bg-navy-900/30'
                    }`}
                  >
                    {/* Progress Fill bar in background */}
                    <div 
                      className="absolute left-0 top-0 bottom-0 opacity-[0.07] transition-all duration-300"
                      style={{ 
                        width: `${progressPct}%`,
                        backgroundColor: party?.colour ?? '#fff'
                      }}
                    />

                    {/* Emoji / Symbol */}
                    <div className="w-11 h-11 rounded-lg bg-navy-950/60 border border-white/5 flex items-center justify-center text-xl shrink-0 shadow-inner z-10">
                      {party?.symbolEmoji ?? '🗳️'}
                    </div>

                    {/* Party Name */}
                    <div className="w-20 shrink-0 z-10">
                      <div className="font-display font-black text-lg text-white leading-none">{party?.abbreviation}</div>
                      <div className="text-[9px] text-text-dim mt-0.5 truncate uppercase font-bold tracking-wider">{party?.name}</div>
                    </div>

                    {/* Progress Bar & Majority marker */}
                    <div className="flex-1 relative z-10 flex items-center px-4">
                      <div className="w-full bg-navy-950/80 h-2.5 rounded-full overflow-hidden border border-white/5 relative">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: party?.colour ?? '#fff' }}
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPct}%` }}
                          transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                        />
                      </div>
                      
                      {/* Majority threshold marker line */}
                      <div 
                        className="absolute top-[-8px] bottom-[-8px] w-0.5 bg-saffron/40 border-r border-saffron/20 border-dashed z-20"
                        style={{ left: `${majorityPct}%` }}
                      />
                    </div>

                    {/* Breakdown Tally: Lead + Won = Total */}
                    <div className="flex items-center gap-4 shrink-0 text-right z-10 pr-2">
                      {phase !== 'done' && (
                        <div className="hidden sm:block">
                          <div className="text-[9px] text-text-dim uppercase tracking-wider leading-none">Lead / Won</div>
                          <div className="text-xs font-bold text-text-muted mt-0.5 font-mono">
                            {leadingCount} <span className="text-[10px] font-normal text-text-dim">L</span> + {wonCount} <span className="text-[10px] font-normal text-text-dim">W</span>
                          </div>
                        </div>
                      )}

                      <div>
                        <div className="text-[26px] font-display font-black leading-none tabular-nums" style={{ color: party?.colour ?? '#fff' }}>
                          {totalTally}
                        </div>
                        <div className="text-[9px] text-text-muted uppercase tracking-wider font-bold mt-0.5">
                          {phase === 'done' ? 'Seats Won' : 'Total Tally'}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Loading / Counting status indicator */}
        {phase === 'counting' && (
           <div className="my-6 text-center text-xs text-text-dim uppercase tracking-widest flex items-center justify-center gap-3">
             <div className="w-4.5 h-4.5 rounded-full border-2 border-t-saffron border-r-white border-b-india-green border-l-white/10 animate-spin" />
             Counting EVM Rounds... {Math.round(progress)}% Complete
           </div>
        )}

        {/* Skip Animation Button */}
        {phase === 'counting' && (
          <button 
            onClick={() => setPhase('done')}
            className="px-4 py-1.5 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-[10px] text-text-muted font-bold transition-all hover:text-white"
          >
            Skip to Final Results
          </button>
        )}

        {/* Ticker tape footer */}
        <div className="w-full mt-6 bg-navy-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl flex items-center h-12 relative z-10 shrink-0">
          <div className="bg-red-600 text-white font-display font-black text-xs px-4 h-full flex items-center shrink-0 tracking-wider uppercase border-r border-red-500 shadow-md">
            <Tv className="w-3.5 h-3.5 mr-1.5" /> Live Ticker
          </div>
          <div className="flex-1 overflow-hidden px-4 h-full flex items-center bg-black/30">
            <AnimatePresence mode="wait">
              <motion.div
                key={breakingAlert}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="text-xs text-white font-medium truncate tracking-wide"
              >
                {breakingAlert}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
