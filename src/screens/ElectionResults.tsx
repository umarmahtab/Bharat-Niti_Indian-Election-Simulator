/**
 * BHARAT NITI — Election Results Screen (v3)
 * Redesigned Election Night dashboard with results map and detailed constituency stats.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, PieChart, Pie } from 'recharts';
import { Trophy, ArrowUp, ArrowDown, Home, RotateCcw, Crown, X, MapPin, Award, CheckCircle, Shield } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import IndiaMap from '../components/map/IndiaMap';

export default function ElectionResults() {
  const { gameState, selectState, setScreen, returnToMainMenu } = useGameStore();
  const [animCount, setAnimCount] = useState(0);

  if (!gameState?.electionResult) return null;
  
  const result = gameState.electionResult;
  const parties = gameState.parties;
  const isStateElection = gameState.mode === 'state_assembly';
  const electionLabel = isStateElection
    ? `${gameState.targetState ?? ''} Assembly Election`
    : 'Lok Sabha General Election';
  const leaderTitle = isStateElection ? 'Chief Minister' : 'Prime Minister';
  const majorityLabel = isStateElection ? 'Assembly Majority' : 'Lok Sabha Majority';
  
  const majorityThreshold = result.majorityThreshold;
  const winnerPartyId = result.winnerPartyId;
  const winningParty = parties[winnerPartyId];
  const winningLeaderName = isStateElection
    ? (winningParty?.leadershipProfiles?.states?.[gameState.targetState ?? '']?.chiefMinisterCandidate ?? winningParty?.leader)
    : (winningParty?.leadershipProfiles?.national?.primeMinisterCandidate ?? winningParty?.leader);

  // Animate total seats counter
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimCount(c => Math.min(c + 4, result.totalSeats));
    }, 20);
    return () => clearInterval(interval);
  }, [result.totalSeats]);

  const playerPartyId = gameState.playerPartyId;
  const playerParty = parties[playerPartyId];
  const playerResult = result.byParty[playerPartyId];
  const didWin = winnerPartyId === playerPartyId;

  // Seat data for chart
  const seatData = Object.entries(result.byParty)
    .map(([pid, data]) => ({
      name: parties[pid]?.abbreviation ?? pid,
      seats: data.seatsWon,
      colour: parties[pid]?.colour ?? '#888',
    }))
    .sort((a, b) => b.seats - a.seats)
    .slice(0, 6);

  // Vote share data for pie chart
  const voteData = Object.entries(result.byParty)
    .map(([pid, data]) => ({
      name: parties[pid]?.abbreviation ?? pid,
      value: parseFloat(data.voteShare.toFixed(1)),
      colour: parties[pid]?.colour ?? '#888',
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Get constituencies for the selected results state
  const selectedStateId = gameState.selectedStateId;
  const selectedStateData = selectedStateId ? gameState.states[selectedStateId] : null;

  const selectedStateConsts = selectedStateId
    ? Object.values(gameState.constituencies).filter(c => c.stateId === selectedStateId && c.type === (isStateElection ? 'state_assembly' : 'lok_sabha'))
    : [];

  const handleCloseStateDetails = () => {
    selectState(undefined);
  };

  return (
    <div className="w-full h-full bg-navy-900 overflow-y-auto panel-scroll flex flex-col text-text-primary">
      {/* Confetti effect for winner */}
      {didWin && (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: -20, x: `${Math.random() * 100}%`, opacity: 1 }}
              animate={{ y: '100vh', opacity: 0 }}
              transition={{ duration: 3 + Math.random() * 2, delay: Math.random() * 2, repeat: Infinity }}
              className="absolute w-1.5 h-3 rounded-full"
              style={{
                backgroundColor: ['#FF9933', '#138808', '#FFFFFF', '#0070CC', '#F4C430'][i % 5],
              }}
            />
          ))}
        </div>
      )}

      {/* Hero Banner */}
      <div
        className="px-8 py-10 text-center relative overflow-hidden shrink-0 border-b border-white/5"
        style={{ background: `linear-gradient(135deg, ${playerParty?.colour ?? '#FF9933'}15, transparent)` }}
      >
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-5xl mb-3"
          >
            {didWin ? '🏆' : '📊'}
          </motion.div>
          <h1 className="text-3xl font-display font-extrabold text-white tracking-tight">{electionLabel} Results</h1>
          <p className="text-sm text-text-muted mt-1 uppercase tracking-widest font-semibold">
            {governingBodyLabel(result.governmentType, winningParty?.name)}
          </p>

          {/* Quick numbers */}
          <div className="flex gap-10 mt-6 bg-black/40 px-8 py-3 rounded-2xl border border-white/5">
            <div>
              <div className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Total Seats</div>
              <div className="text-2xl font-bold text-white font-mono">{animCount}</div>
            </div>
            <div className="w-px bg-white/10" />
            <div>
              <div className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Majority Target</div>
              <div className="text-2xl font-bold text-saffron font-mono">{majorityThreshold}</div>
            </div>
            <div className="w-px bg-white/10" />
            <div>
              <div className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Player Seats</div>
              <div className="text-2xl font-bold font-mono" style={{ color: playerParty?.colour }}>
                {playerResult?.seatsWon ?? 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left statistics, Right Interactive Map */}
      <div className="p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-5 gap-6 flex-1 min-h-0">
        
        {/* Left Side: National Stats */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Government Formation Card */}
          <div className="glass-card p-5">
            <h3 className="font-semibold text-text-primary text-sm mb-4 flex items-center gap-2">
              <Crown className="w-4 h-4 text-accent-gold" />
              Government Formation
            </h3>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl text-center min-w-24 border border-white/5 bg-white/[0.01]">
                <div className="text-3xl mb-1">{winningParty?.symbolEmoji ?? '🗳️'}</div>
                <div className="font-bold text-xs" style={{ color: winningParty?.colour }}>
                  {winningParty?.abbreviation ?? winnerPartyId}
                </div>
              </div>
              <div className="flex-1 text-xs text-text-secondary leading-relaxed">
                {result.governmentType === 'majority'
                  ? `${winningParty?.name} has won a clear majority with ${result.byParty[winnerPartyId]?.seatsWon ?? 0} seats. ${leaderTitle}: ${winningLeaderName}.`
                  : result.governmentType === 'coalition'
                  ? `No party won an outright majority. ${winningParty?.name} is forming a coalition government. ${leaderTitle}: ${winningLeaderName}.`
                  : 'No party or alliance has secured a majority. Political negotiations are underway.'}
              </div>
            </div>
          </div>

          {/* Bar Chart: Seats Won */}
          <div className="glass-card p-5">
            <h4 className="text-xs uppercase tracking-wider text-text-muted font-bold mb-3">Seats Won by Party</h4>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={seatData} layout="vertical">
                <XAxis type="number" tick={{ fill: '#8892B0', fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#B0BAD0', fontSize: 10 }} width={45} />
                <Tooltip formatter={(v: any) => [`${v} Seats`, 'Seats Won']} />
                <Bar dataKey="seats" radius={[0, 4, 4, 0]}>
                  {seatData.map((entry, i) => (
                    <Cell key={i} fill={entry.colour} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart: Vote Share */}
          <div className="glass-card p-5">
            <h4 className="text-xs uppercase tracking-wider text-text-muted font-bold mb-3">Vote Share %</h4>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="45%" height={120}>
                <PieChart>
                  <Pie
                    data={voteData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={25}
                    outerRadius={45}
                    paddingAngle={3}
                  >
                    {voteData.map((entry, i) => (
                      <Cell key={i} fill={entry.colour} fillOpacity={0.8} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5">
                {voteData.slice(0, 4).map(d => (
                  <div key={d.name} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.colour }} />
                      <span className="text-text-muted">{d.name}</span>
                    </div>
                    <span className="font-bold text-white">{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Map & Interactive Details */}
        <div className="lg:col-span-3 flex flex-col h-[520px] glass-card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between bg-black/15">
            <h3 className="font-bold text-sm text-white">Electoral Map Projections</h3>
            <span className="text-[10px] text-text-muted font-semibold uppercase">Click state to view detailed results</span>
          </div>
          <div className="flex-1 relative bg-navy-950/30">
            <IndiaMap />
          </div>
        </div>
      </div>

      {/* State Constituency Detailed Table Panel */}
      <AnimatePresence>
        {selectedStateData && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-[#070b1a] border-t border-white/10 shadow-2xl h-[70vh] flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/35">
              <div>
                <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Constituency results</span>
                <h3 className="text-lg font-bold text-white">{selectedStateData.name} Breakdown</h3>
              </div>
              <button
                onClick={handleCloseStateDetails}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-text-muted hover:text-white border border-white/10 transition-colors"
              >
                <X className="w-4 h-4" /> Close
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto panel-scroll p-6">
              <div className="max-w-7xl mx-auto overflow-hidden rounded-xl border border-white/5">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-text-muted bg-white/[0.02]">
                      <th className="px-6 py-3">No.</th>
                      <th className="px-6 py-3">Constituency</th>
                      <th className="px-6 py-3">Winner</th>
                      <th className="px-6 py-3">Runner Up</th>
                      <th className="px-6 py-3">Margin</th>
                      <th className="px-6 py-3">Major Issue</th>
                      <th className="px-6 py-3">Turnout</th>
                      <th className="px-6 py-3">Winner candidate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {selectedStateConsts.map(sc => {
                      const res = result.byConstituency[sc.id];
                      if (!res) return null;

                      const winnerParty = parties[res.winner];
                      const runnerParty = parties[(res as any).runnerUp ?? ''];
                      const candidate = sc.candidatesByParty?.[res.winner];
                      
                      return (
                        <tr key={sc.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="px-6 py-3 font-bold text-text-muted">{sc.number}</td>
                          <td className="px-6 py-3 font-bold text-white flex items-center gap-1.5">
                            {sc.name}
                            {sc.isReserved && (
                              <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[9px] font-bold">
                                {sc.reservedFor}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-3 font-bold" style={{ color: winnerParty?.colour }}>
                            {winnerParty?.abbreviation ?? res.winner}
                          </td>
                          <td className="px-6 py-3 text-text-muted font-medium">
                            {runnerParty?.abbreviation ?? (res as any).runnerUp ?? '—'}
                          </td>
                          <td className="px-6 py-3 font-bold text-white">{res.margin.toFixed(1)}%</td>
                          <td className="px-6 py-3 capitalize text-text-muted">{sc.majorIssue?.replace(/_/g, ' ') ?? 'None'}</td>
                          <td className="px-6 py-3 text-text-muted">{res.turnout.toFixed(1)}%</td>
                          <td className="px-6 py-3 font-semibold text-white">{candidate?.name ?? 'Generic Candidate'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Action buttons */}
      <div className="px-8 py-6 border-t border-white/5 bg-black/15 flex gap-4 justify-center shrink-0">
        <button onClick={returnToMainMenu} className="btn-secondary flex items-center gap-2">
          <Home className="w-4 h-4" />
          Main Menu
        </button>
        <button onClick={() => setScreen('game_setup')} className="btn-primary flex items-center gap-2">
          <RotateCcw className="w-4 h-4" />
          New Campaign
        </button>
      </div>
    </div>
  );
}

function governingBodyLabel(type: string, winnerName?: string) {
  if (type === 'majority') return `🏆 Majority Government by ${winnerName || 'Winning Party'}`;
  if (type === 'coalition') return `🤝 Coalition Government led by ${winnerName || 'Winning Party'}`;
  return '⚠️ Minority Government / Political Negotiations Active';
}
