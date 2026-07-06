/**
 * BHARAT NITI — State Detail Screen (v3)
 * Full breakdown of a selected state, including its constituencies.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, MapPin, Users, TrendingUp, AlertCircle,
  DollarSign, BarChart2, Target, CheckCircle, Shield,
  Activity, Sparkles, X, ChevronRight, BarChart
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import type { Constituency, Candidate, DemographicGroup } from '../engine/types';

export default function StateDetail() {
  const { gameState, selectState, setActivePanel, selectConstituency, commissionInternalSurvey } = useGameStore();
  const [surveyMessage, setSurveyMessage] = useState<string | null>(null);
  const [surveyError, setSurveyError] = useState<string | null>(null);
  const [selectedConstId, setSelectedConstId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'safe' | 'likely' | 'swing' | 'tossup'>('all');

  if (!gameState?.selectedStateId) return null;

  const stateId = gameState.selectedStateId;
  const stateData = gameState.states[stateId];
  if (!stateData) return null;

  const playerPartyId = gameState.playerPartyId;
  const playerParty = gameState.parties[playerPartyId];
  const rulingParty = gameState.parties[stateData.rulingPartyId];

  // Filter constituencies by type according to mode (lok_sabha vs assembly)
  const constsType = gameState.mode === 'lok_sabha' ? 'lok_sabha' : 'state_assembly';
  const stateConsts = Object.values(gameState.constituencies).filter(
    c => c.stateId === stateId && c.type === constsType
  );

  // Analyze each constituency
  const analyzedConsts = stateConsts.map(c => {
    const pops = Object.entries(c.popularityByParty ?? {});
    let winner = 'Unknown';
    let runnerUp = 'Unknown';
    let margin = 0;

    if (pops.length > 0) {
      const sorted = [...pops].sort((a, b) => b[1] - a[1]);
      winner = sorted[0][0];
      margin = sorted[0][1] - (sorted[1]?.[1] ?? 0);
      runnerUp = sorted[1]?.[0] ?? 'Unknown';
    }

    let category: 'safe' | 'likely' | 'swing' | 'tossup' = 'tossup';
    if (margin > 15) category = 'safe';
    else if (margin >= 8) category = 'likely';
    else if (margin >= 3) category = 'swing';

    return {
      c,
      winner,
      runnerUp,
      margin,
      category,
    };
  });

  // Calculate totals for dashboard
  const safeCount = analyzedConsts.filter(ac => ac.category === 'safe').length;
  const likelyCount = analyzedConsts.filter(ac => ac.category === 'likely').length;
  const swingCount = analyzedConsts.filter(ac => ac.category === 'swing').length;
  const tossupCount = analyzedConsts.filter(ac => ac.category === 'tossup').length;

  const playerPop = stateData.popularityByParty?.[playerPartyId] ?? 0;
  const playerSpent = stateData.campaignSpentByParty?.[playerPartyId] ?? 0;

  // Filtered list
  const filteredConsts = analyzedConsts.filter(ac => {
    if (filterType === 'all') return true;
    return ac.category === filterType;
  });

  const selectedConstData = selectedConstId ? gameState.constituencies[selectedConstId] : null;

  // Compute stats for modal
  const getModalConstWinnerAndMargin = (c: Constituency) => {
    const pops = Object.entries(c.popularityByParty ?? {});
    if (pops.length === 0) return { winner: 'Unknown', margin: 0, runnerUp: 'Unknown' };
    const sorted = [...pops].sort((a, b) => b[1] - a[1]);
    const winner = sorted[0][0];
    const margin = sorted[0][1] - (sorted[1]?.[1] ?? 0);
    const runnerUp = sorted[1]?.[0] ?? 'Unknown';
    return { winner, margin, runnerUp };
  };

  const selectedWinnerInfo = selectedConstData ? getModalConstWinnerAndMargin(selectedConstData) : null;

  return (
    <div className="w-full h-full bg-navy-900 flex flex-col relative text-text-primary">
      {/* ── HEADER ── */}
      <div className="hud-bar px-6 py-3 flex items-center gap-4 flex-shrink-0">
        <button
          onClick={() => { selectState(undefined); setActivePanel('map'); }}
          className="flex items-center gap-2 text-text-muted hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Map</span>
        </button>
        <div className="h-5 w-px bg-white/[0.08]" />
        <div>
          <span className="font-display font-bold text-lg text-white">{stateData.name}</span>
          <span className="ml-2 text-text-muted text-sm">• Capital: {stateData.capital}</span>
        </div>
        <div className="flex gap-2 ml-auto">
          <span className="badge-saffron">{stateData.lokSabhaSeats} Lok Sabha Seats</span>
          <span className="badge-blue">{stateData.assemblySeats} Assembly Seats</span>
        </div>
      </div>

      {/* ── STATE DETAILS DASHBOARD ── */}
      <div className="p-6 overflow-y-auto panel-scroll flex-1 space-y-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-6 gap-6">
          
          {/* Card 1: Key Indicators */}
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-xs uppercase tracking-wider text-text-muted font-bold flex items-center gap-2">
              <Shield className="w-4 h-4 text-saffron" /> State Profile
            </h3>
            <div className="space-y-2.5">
              {[
                { label: 'Literacy', value: `${stateData.literacy}%` },
                { label: 'Urbanization', value: `${stateData.urbanization}%` },
                { label: 'GDP Index', value: `${stateData.gdpPerCapita}/100` },
                { label: 'Ruling Party', value: rulingParty?.abbreviation ?? 'NDA' },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center text-xs">
                  <span className="text-text-muted">{row.label}</span>
                  <span className="font-bold text-white">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Campaign Status */}
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-xs uppercase tracking-wider text-text-muted font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent-gold" /> Campaign Status
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-text-muted">Popularity</span>
                  <span className="font-bold text-india-green">{playerPop.toFixed(1)}%</span>
                </div>
                <div className="progress-bar h-1.5">
                  <div
                    className="progress-fill"
                    style={{ width: `${playerPop}%`, backgroundColor: playerParty?.colour ?? '#FF9933' }}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-muted">Total Spent Here</span>
                <span className="font-bold text-accent-gold">₹{playerSpent.toFixed(0)}Cr</span>
              </div>

              <div className="h-px bg-white/[0.06] my-2" />
              {gameState.internalSurveys?.[stateId] ? (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold text-accent-gold tracking-wider">
                    <span>Internal Survey Report</span>
                    <span>Turn {gameState.internalSurveys[stateId].turn}</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    {Object.entries(gameState.internalSurveys[stateId].popularityByParty)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 3)
                      .map(([pid, pop]) => {
                        const partyInfo = gameState.parties[pid];
                        return (
                          <div key={pid} className="flex justify-between items-center py-0.5">
                            <span className="text-text-muted">{partyInfo?.abbreviation ?? pid}</span>
                            <span className="font-semibold text-white">{pop.toFixed(1)}%</span>
                          </div>
                        );
                      })
                    }
                  </div>
                </div>
              ) : (
                <div className="text-center py-1">
                  <div className="text-[10px] text-text-dim leading-normal mb-1.5">No active ground survey. Run a bias-free survey to see exact support.</div>
                </div>
              )}
              
              <button
                onClick={() => {
                  const res = commissionInternalSurvey(stateId);
                  if (res.success) {
                    setSurveyMessage(res.message);
                    setSurveyError(null);
                    setTimeout(() => setSurveyMessage(null), 4000);
                  } else {
                    setSurveyError(res.message);
                    setSurveyMessage(null);
                    setTimeout(() => setSurveyError(null), 4000);
                  }
                }}
                className="w-full btn-secondary text-[11px] flex items-center justify-center gap-1.5 py-1.5 border-accent-gold/30 hover:border-accent-gold hover:text-accent-gold font-semibold"
              >
                📊 Commission Survey (₹15Cr)
              </button>
              
              {surveyMessage && (
                <div className="text-[10px] text-india-green font-bold text-center mt-1 animate-pulse">
                  {surveyMessage}
                </div>
              )}
              {surveyError && (
                <div className="text-[10px] text-red-400 font-bold text-center mt-1">
                  {surveyError}
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Priority Issues */}
          <div className="glass-card p-5 space-y-3 col-span-1 lg:col-span-2">
            <h3 className="text-xs uppercase tracking-wider text-text-muted font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" /> State Primary Issues
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
              {stateData.primaryIssues.slice(0, 4).map((issue, i) => (
                <div key={issue}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-text-muted capitalize">{issue.replace(/_/g, ' ')}</span>
                    <span className="font-bold text-white">{(stateData.issueScores as any)?.[issue] ?? 60}%</span>
                  </div>
                  <div className="progress-bar h-1">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${(stateData.issueScores as any)?.[issue] ?? 60}%`,
                        backgroundColor: i === 0 ? '#EF4444' : i === 1 ? '#F97316' : '#F4C430',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 4: Voter Demographics */}
          <div className="glass-card p-5 space-y-3 col-span-1 lg:col-span-2">
            <h3 className="text-xs uppercase tracking-wider text-text-muted font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-accent-blue" /> Voter Demographics
            </h3>
            <div className="space-y-2.5 max-h-[160px] overflow-y-auto panel-scroll pr-1">
              {stateData.demographics && Object.entries(stateData.demographics).map(([demoKey, percent]) => {
                const demoLabel = demoKey.replace(/_/g, ' ');
                const demoPop = stateData.popularityByDemographic?.[playerPartyId]?.[demoKey as DemographicGroup] ?? playerPop;
                
                return (
                  <div key={demoKey} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold">
                      <span className="capitalize text-text-primary">{demoLabel} ({percent}%)</span>
                      <span className="text-india-green" style={{ color: demoPop > 45 ? '#10B981' : '#F59E0B' }}>{demoPop.toFixed(1)}% support</span>
                    </div>
                    {/* Share size */}
                    <div className="progress-bar h-1">
                      <div
                        className="progress-fill bg-accent-blue/80"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    {/* Support level */}
                    <div className="progress-bar h-0.5 bg-black/40">
                      <div
                        className="progress-fill"
                        style={{ width: `${demoPop}%`, backgroundColor: playerParty?.colour ?? '#FF9933' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── CONSTITUENCY CLASSIFICATION CHIPS ── */}
        <div className="max-w-7xl mx-auto flex flex-wrap gap-3">
          {[
            { id: 'all', label: 'All Constituencies', count: stateConsts.length, colour: 'bg-white/5 border-white/10 hover:bg-white/10' },
            { id: 'safe', label: 'Safe Seats (>15%)', count: safeCount, colour: 'bg-india-green/10 border-india-green/20 text-india-green hover:bg-india-green/20' },
            { id: 'likely', label: 'Likely Seats (8-15%)', count: likelyCount, colour: 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20' },
            { id: 'swing', label: 'Swing Seats (3-8%)', count: swingCount, colour: 'bg-saffron/10 border-saffron/20 text-saffron hover:bg-saffron/20' },
            { id: 'tossup', label: 'Toss-up (<3%)', count: tossupCount, colour: 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' },
          ].map(chip => (
            <button
              key={chip.id}
              onClick={() => setFilterType(chip.id as any)}
              className={`px-4 py-2 rounded-xl border text-xs font-semibold transition-all flex items-center gap-2 ${chip.colour} ${filterType === chip.id ? 'ring-2 ring-saffron' : ''}`}
            >
              <span>{chip.label}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-black/40 text-[10px]">{chip.count}</span>
            </button>
          ))}
        </div>

        {/* ── CONSTITUENCY TABLE ── */}
        <div className="max-w-7xl mx-auto glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-bold text-sm text-white">Battleground Status</h3>
            <button
              onClick={() => { selectState(undefined); setActivePanel('campaign'); }}
              className="px-4 py-1.5 bg-saffron text-black hover:bg-saffron/90 font-bold rounded-lg text-xs transition-colors"
            >
              🚀 Open Campaign Panel
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[11px] uppercase tracking-wider text-text-muted bg-white/[0.02]">
                  <th className="px-6 py-3">No.</th>
                  <th className="px-6 py-3">Constituency</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Incumbent</th>
                  <th className="px-6 py-3">Player Pop</th>
                  <th className="px-6 py-3">Projected Winner</th>
                  <th className="px-6 py-3">Margin</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {filteredConsts.map(ac => {
                  const winnerParty = gameState.parties[ac.winner];
                  const incumbentParty = gameState.parties[ac.c.incumbentPartyId];
                  const playerCpop = ac.c.popularityByParty?.[playerPartyId] ?? 0;
                  
                  return (
                    <tr key={ac.c.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-3.5 font-bold text-text-muted">{ac.c.number}</td>
                      <td className="px-6 py-3.5 font-bold text-white flex items-center gap-2">
                        {ac.c.name}
                        {ac.c.isReserved && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[9px] font-bold">
                            {ac.c.reservedFor ?? 'SC'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 capitalize text-text-muted">{ac.c.isUrban ? 'Urban' : 'Rural'}</td>
                      <td className="px-6 py-3.5 font-semibold" style={{ color: incumbentParty?.colour }}>
                        {incumbentParty?.abbreviation ?? ac.c.incumbentPartyId}
                      </td>
                      <td className="px-6 py-3.5 font-bold text-white">{playerCpop.toFixed(1)}%</td>
                      <td className="px-6 py-3.5 font-bold" style={{ color: winnerParty?.colour }}>
                        {winnerParty?.abbreviation ?? ac.winner}
                      </td>
                      <td className="px-6 py-3.5 font-bold text-white">{ac.margin.toFixed(1)}%</td>
                      <td className="px-6 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                          ${ac.category === 'safe' ? 'bg-india-green/10 text-india-green' :
                            ac.category === 'likely' ? 'bg-blue-500/10 text-blue-400' :
                            ac.category === 'swing' ? 'bg-saffron/10 text-saffron' :
                            'bg-red-500/10 text-red-400'
                          }
                        `}>
                          {ac.category}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedConstId(ac.c.id)}
                          className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded border border-white/10 text-[11px] font-bold text-text-muted hover:text-white transition-colors"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredConsts.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-text-dim">
                      No constituencies match the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── CONSTITUENCY DETAIL MODAL ── */}
      <AnimatePresence>
        {selectedConstData && selectedWinnerInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-xl bg-navy-950 border border-white/10 shadow-2xl rounded-2xl overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1">
                    Constituency Report
                  </div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {selectedConstData.name}
                    {selectedConstData.isReserved && (
                      <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 text-xs font-bold">
                        {selectedConstData.reservedFor} Reserved
                      </span>
                    )}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedConstId(null)}
                  className="p-2 hover:bg-white/5 rounded-full text-text-muted hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                
                {/* Projected Winner Banner */}
                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Projected Outcome</div>
                    <div className="text-lg font-bold mt-1" style={{ color: gameState.parties[selectedWinnerInfo.winner]?.colour }}>
                      {gameState.parties[selectedWinnerInfo.winner]?.name ?? selectedWinnerInfo.winner} Leading
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Projected Margin</div>
                    <div className="text-lg font-bold text-white mt-1">{selectedWinnerInfo.margin.toFixed(1)}%</div>
                  </div>
                </div>

                {/* Grid of Campaign stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                    <div className="text-[10px] text-text-muted uppercase tracking-widest mb-2 font-bold">Campaign Spend</div>
                    <div className="text-2xl font-bold text-accent-gold">
                      ₹{(selectedConstData.campaignSpendByParty?.[playerPartyId] ?? 0).toFixed(1)}Cr
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                    <div className="text-[10px] text-text-muted uppercase tracking-widest mb-2 font-bold">Local Demographics</div>
                    <div className="text-xs text-white font-semibold">
                      {selectedConstData.isUrban ? 'Highly Urban Metropolitan' : 'predominantly rural/farming community'}
                    </div>
                  </div>
                </div>

                {/* Organization Strengths */}
                <div className="space-y-3">
                  <h4 className="text-xs uppercase tracking-wider text-text-muted font-bold">Campaign Infrastructure</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Ground (Rally)', val: selectedConstData.groundStrength?.[playerPartyId] ?? 0, colour: 'text-saffron' },
                      { label: 'Booth Workers', val: selectedConstData.boothStrength?.[playerPartyId] ?? 0, colour: 'text-india-green' },
                      { label: 'Digital Cells', val: selectedConstData.digitalStrength?.[playerPartyId] ?? 0, colour: 'text-blue-400' },
                    ].map(inf => (
                      <div key={inf.label} className="p-3 rounded-lg border border-white/5 bg-black/20 text-center">
                        <div className="text-[10px] text-text-muted mb-1">{inf.label}</div>
                        <div className={`text-sm font-bold ${inf.colour}`}>₹{inf.val.toFixed(1)}Cr</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Issues & Momentum */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                    <span className="text-text-muted">Constituency Top Issue</span>
                    <span className="font-bold text-white capitalize">{selectedConstData.majorIssue?.replace(/_/g, ' ') ?? 'None'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                    <span className="text-text-muted">Constituency Momentum</span>
                    <span className={`font-bold ${((selectedConstData.momentum?.[playerPartyId] ?? 0) >= 0) ? 'text-india-green' : 'text-red-400'}`}>
                      {((selectedConstData.momentum?.[playerPartyId] ?? 0) >= 0 ? '+' : '')}
                      {(selectedConstData.momentum?.[playerPartyId] ?? 0).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-white/10 bg-black/40 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedConstId(null)}
                  className="px-4 py-2 hover:bg-white/5 rounded-lg text-xs font-bold text-text-muted transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    selectState(undefined);
                    setActivePanel('campaign');
                    selectConstituency(selectedConstData.id);
                  }}
                  className="px-5 py-2 bg-saffron text-black font-bold rounded-lg text-xs hover:bg-saffron/90 transition-colors"
                >
                  🎯 Target Constituency
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
