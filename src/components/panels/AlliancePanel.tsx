/**
 * BHARAT NITI — Alliance Panel (v2)
 * Pre-poll alliance management with seat sharing per state.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Link, Unlink, CheckCircle, Crown, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';

export default function AlliancePanel() {
  const { gameState, proposeAlliance, confirmAlliance, updateAllianceSeatSharing } = useGameStore();
  const [expandedAlliance, setExpandedAlliance] = useState<string | null>(null);
  const [selectedStateForSharing, setSelectedStateForSharing] = useState<string>('');

  if (!gameState) return null;

  const allParties = Object.values(gameState.parties).filter(p => p.id !== gameState.playerPartyId);
  const alliances = Object.values(gameState.alliances);
  const playerAlliance = alliances.find(a => a.memberPartyIds.includes(gameState.playerPartyId));
  const stateIds = Object.keys(gameState.states);
  const effectiveStateId = selectedStateForSharing || stateIds[0] || '';

  function getCompatibility(partyId: string): { label: string; colour: string; score: number } {
    if (!gameState) return { label: 'Unknown', colour: '#888', score: 0 };
    const party = gameState.parties[partyId];
    const playerParty = gameState.parties[gameState.playerPartyId];
    if (!party || !playerParty) return { label: 'Unknown', colour: '#888', score: 0 };

    let score = 30; // base score

    if (party.ideology === playerParty.ideology) score += 30;
    if (!party.isNational && !playerParty.isNational) score += 10;
    if (party.isNational && playerParty.isNational) score += 5;

    const sharedStrong = party.weakStates.filter(s => playerParty.strongStates.includes(s)).length;
    score += sharedStrong * 5;

    // --- REAL WORLD BLOCS ---
    const indiaBloc = ['INC', 'SP', 'TMC', 'DMK', 'SS_UBT', 'NCP', 'RJD', 'JMM', 'AAP', 'CPI', 'CPI_M', 'NC', 'TVK'];
    const ndaBloc = ['BJP', 'TDP', 'JDU', 'SS', 'NCP_AP', 'LJP', 'JDS', 'AGP', 'SKM'];
    const ndaLeaning = ['BJD', 'YSRCP', 'BRS'];

    if (indiaBloc.includes(playerParty.id) && indiaBloc.includes(party.id)) {
      score += 60; // Huge boost for INDIA
    } else if (ndaBloc.includes(playerParty.id) && ndaBloc.includes(party.id)) {
      score += 60; // Huge boost for NDA
    } else if (
      (ndaBloc.includes(playerParty.id) && ndaLeaning.includes(party.id)) || 
      (ndaLeaning.includes(playerParty.id) && ndaBloc.includes(party.id))
    ) {
      score += 25; // NDA leaning
    } else if (
      (indiaBloc.includes(playerParty.id) && ndaBloc.includes(party.id)) ||
      (ndaBloc.includes(playerParty.id) && indiaBloc.includes(party.id))
    ) {
      score -= 70; // Hard opposite
    } else if (
      (party.ideology === 'hindu_nationalism' && playerParty.ideology === 'congress_secular') ||
      (party.ideology === 'congress_secular' && playerParty.ideology === 'hindu_nationalism')
    ) {
      score -= 30; // General ideology penalty
    }

    // Specific historic animosities
    const enemies = [
      ['TMC', 'CPI_M'], ['TMC', 'CPI'],
      ['SP', 'BSP'],
      ['DMK', 'AIADMK'],
      ['TDP', 'YSRCP'],
      ['BJP', 'INC'],
    ];

    for (const [p1, p2] of enemies) {
      if ((playerParty.id === p1 && party.id === p2) || (playerParty.id === p2 && party.id === p1)) {
        score -= 40; // Override penalty
      }
    }

    score = Math.max(0, Math.min(100, score));

    if (score >= 65) return { label: 'High', colour: '#10B981', score };
    if (score >= 40) return { label: 'Medium', colour: '#F4C430', score };
    return { label: 'Low', colour: '#EF4444', score };
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display font-bold text-2xl text-text-primary">Alliance Manager</h2>
        <p className="text-text-muted text-sm">Build pre-poll alliances with seat sharing to consolidate votes</p>
      </div>

      {/* ── Current Alliance ─────────────────────────────────────────────── */}
      {playerAlliance && (
        <div className="glass-card p-4 border border-india-green/30 bg-india-green/5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-india-green" />
              <span className="font-bold text-india-green text-base">{playerAlliance.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`badge ${
                playerAlliance.status === 'confirmed' ? 'badge-green' :
                playerAlliance.status === 'proposed' ? 'badge-saffron' : 'badge-red'
              }`}>
                {playerAlliance.status}
              </span>
              {playerAlliance.status === 'proposed' && (
                <button
                  onClick={() => confirmAlliance(playerAlliance.id)}
                  className="text-xs px-3 py-1 rounded-lg bg-india-green/20 text-india-green border border-india-green/30 hover:bg-india-green/30 transition-colors font-semibold"
                >
                  Confirm Alliance ✓
                </button>
              )}
            </div>
          </div>

          {/* Stability */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-text-muted mb-1">
              <span>Alliance Stability</span>
              <span className={playerAlliance.stability > 60 ? 'text-india-green' : playerAlliance.stability > 30 ? 'text-yellow-400' : 'text-red-400'}>
                {playerAlliance.stability.toFixed(0)}%
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${playerAlliance.stability}%`,
                  backgroundColor: playerAlliance.stability > 60 ? '#10B981' : playerAlliance.stability > 30 ? '#F4C430' : '#EF4444',
                }}
              />
            </div>
          </div>

          {/* Members */}
          <div className="flex gap-2 flex-wrap mb-3">
            {playerAlliance.memberPartyIds.map(pid => {
              const p = gameState.parties[pid];
              return p ? (
                <div key={pid} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/[0.08]">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.colour }} />
                  <span className="text-xs text-text-primary font-medium">{p.abbreviation}</span>
                  {pid === playerAlliance.leadPartyId && (
                    <Crown className="w-3 h-3 text-accent-gold" />
                  )}
                </div>
              ) : null;
            })}
          </div>

          {/* Seat Sharing Section */}
          {playerAlliance.status === 'confirmed' && (
            <div className="border-t border-white/[0.08] pt-3">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-3.5 h-3.5 text-saffron" />
                <span className="text-xs font-semibold text-text-primary uppercase tracking-wider">Pre-Poll Seat Sharing</span>
              </div>
              <p className="text-xs text-text-muted mb-3">
                Adjust the seat sharing percentage in each state. The party taking a larger share will contest more constituencies.
              </p>
              <div className="space-y-2">
                {stateIds.map(sid => {
                  const sharing = playerAlliance.stateSeatSharing?.[sid] ?? 50;
                  const stateName = gameState.states[sid]?.name ?? sid;
                  return (
                    <div key={sid} className="flex items-center gap-2">
                      <div className="text-xs text-text-muted w-28 truncate">{stateName}</div>
                      <div className="flex flex-col flex-1 gap-1">
                        <div className="flex items-center justify-between text-[10px] text-text-muted font-medium">
                          <span className="text-saffron">You: {sharing}%</span>
                          <span className="text-blue-400">Partner: {100 - (sharing as number)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={sharing as number}
                          onChange={(e) => updateAllianceSeatSharing(playerAlliance.id, sid, parseInt(e.target.value))}
                          className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-saffron"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Available Parties ─────────────────────────────────────────────── */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          {playerAlliance ? 'Expand Alliance' : 'Propose Alliance'}
        </h3>
        <div className="space-y-2 max-h-96 overflow-y-auto panel-scroll">
          {allParties.map(party => {
            const alreadyAllied = alliances.some(a =>
              a.memberPartyIds.includes(party.id) && a.memberPartyIds.includes(gameState.playerPartyId)
            );
            const compat = getCompatibility(party.id);
            const pop = party.currentPopularity ?? party.startingPopularity;

            return (
              <div
                key={party.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.06] transition-colors"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                  style={{ backgroundColor: party.colour + '20', border: `1px solid ${party.colour}40` }}
                >
                  {party.symbolEmoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-primary">{party.abbreviation}</div>
                  <div className="text-xs text-text-muted truncate">{party.leader}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-semibold" style={{ color: compat.colour }}>
                      ● {compat.label} compatibility ({compat.score}%)
                    </span>
                    <span className="text-xs text-text-dim">{pop.toFixed(0)}% national</span>
                  </div>
                  <div className="text-xs text-text-dim mt-0.5">{party.ideology.replace(/_/g, ' ')}</div>
                </div>
                <div className="flex-shrink-0">
                  {alreadyAllied ? (
                    <span className="text-xs text-india-green flex items-center gap-1">
                      <Link className="w-3 h-3" /> Allied
                    </span>
                  ) : (
                    <button
                      onClick={() => proposeAlliance(party.id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-saffron/10 text-saffron hover:bg-saffron/20 border border-saffron/20 transition-colors font-medium"
                    >
                      Propose
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alliance benefits info */}
      <div className="glass-card p-4 border border-blue-500/10">
        <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-2">Alliance Benefits</h3>
        <div className="space-y-1.5 text-xs text-text-muted">
          <div className="flex items-start gap-2">
            <span className="text-india-green">✓</span>
            <span>Confirmed alliance: +2% vote share bonus for each member in joint seats</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-india-green">✓</span>
            <span>Seat sharing: Contesting constituencies are organically divided based on your slider percentage.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-india-green">✓</span>
            <span>Alliance government formation: combined seats count toward majority</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-yellow-400">⚠</span>
            <span>Alliance stability decreases if ideologically opposed or competing in same states</span>
          </div>
        </div>
      </div>
    </div>
  );
}
