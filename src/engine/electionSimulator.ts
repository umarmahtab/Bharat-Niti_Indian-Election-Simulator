/**
 * BHARAT NITI — Election Simulator (v2 — FIXED)
 *
 * Key fixes:
 *  1. Power-law vote share → high popularity now wins decisively
 *  2. Proper state_assembly vs lok_sabha scoping
 *  3. Benchmark bonuses applied from category milestones
 *  4. Rally topic demographic bonuses applied
 *  5. Seat-sharing alliances properly reduce ceded party scores
 *  6. CM vs PM distinction for state elections
 */

import type { GameState, ElectionResult, Constituency } from './types';
import { RALLY_TOPICS } from './data/rallyTopics';

/** Gaussian noise */
function gaussianNoise(mean: number, stdDev: number): number {
  const u1 = Math.max(1e-10, Math.random());
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stdDev;
}

/** Clamp a number to [min, max] */
function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Get the sum of benchmark vote-share bonuses a party has locked in a state.
 */
function getBenchmarkBonus(partyId: string, stateId: string, state: GameState): number {
  const stateBenchmarks = state.benchmarks?.[stateId];
  if (!stateBenchmarks) return 0;

  let bonus = 0;
  for (const category of ['rally', 'booth', 'digital'] as const) {
    const cat = stateBenchmarks[category];
    if (!cat) continue;
    for (const [levelStr, lockInfo] of Object.entries(cat.locks)) {
      if (lockInfo.partyId === partyId) {
        bonus += lockInfo.voteShareBonus;
      }
    }
  }
  return bonus;
}

/**
 * Get rally topic bonus for a party in a constituency.
 */
function getTopicBonus(partyId: string, stateId: string, urbanization: number, state: GameState): number {
  if (partyId !== state.playerPartyId) return 0;

  const stateTopics = state.activeTopics?.[stateId] ?? [];
  const nationalTopics = state.activeTopics?.['national'] ?? [];
  const allTopicIds = [...new Set([...stateTopics, ...nationalTopics])];

  let bonus = 0;
  for (const topicId of allTopicIds) {
    const topic = RALLY_TOPICS[topicId];
    if (!topic) continue;

    // Check urban/rural condition
    if (topic.urbanCondition === 'urban' && urbanization < 30) continue;
    if (topic.urbanCondition === 'rural' && urbanization > 70) continue;

    bonus += topic.voteShareBonus * 0.4; // Scale: topic bonus → vote share impact
  }
  return Math.min(bonus, 20); // cap at 20 points
}

/**
 * Check if a party has ceded this specific constituency to an alliance partner based on seat-sharing percentage.
 */
function hasPartyCededConstituency(partyId: string, constituency: Constituency, state: GameState): boolean {
  for (const alliance of Object.values(state.alliances)) {
    if (alliance.status !== 'confirmed') continue;
    if (!alliance.memberPartyIds.includes(partyId)) continue;

    const sharing = alliance.stateSeatSharing?.[constituency.stateId] ?? 50;
    
    // Hash the constituency ID to get a pseudo-random 0-99 value that is consistent
    let hash = 0;
    for (let i = 0; i < constituency.id.length; i++) {
      hash = (hash + constituency.id.charCodeAt(i)) % 100;
    }

    const isPlayer = partyId === state.playerPartyId;
    const playerPartyInAlliance = alliance.memberPartyIds.includes(state.playerPartyId);
    
    // If player is in this alliance, determine who gets this seat based on 'sharing' %
    if (playerPartyInAlliance) {
      // If hash < sharing, it goes to player. Else, it goes to partner.
      if (isPlayer && hash >= sharing) return true; // Player cedes
      if (!isPlayer && hash < sharing) return true; // Partner cedes
    } else {
      // AI-AI alliance: split 50/50 for now
      if (hash >= 50 && alliance.leadPartyId === partyId) return true;
      if (hash < 50 && alliance.leadPartyId !== partyId) return true;
    }
  }
  return false;
}

/**
 * Get alliance vote-share consolidation bonus for a party in a state.
 * When allied parties cede seats to you, you inherit some of their vote base.
 */
function getAllianceBonus(partyId: string, stateId: string, state: GameState): number {
  for (const alliance of Object.values(state.alliances)) {
    if (alliance.status !== 'confirmed') continue;
    if (!alliance.memberPartyIds.includes(partyId)) continue;

    const sharing = alliance.stateSeatSharing?.[stateId];
    if (sharing === undefined) return 3; // basic alliance unity bonus

    const isLead = partyId === alliance.leadPartyId;
    const ourShare = isLead ? sharing : (100 - sharing);
    const partnerShare = 100 - ourShare;

    return 3 + (partnerShare / 12);
  }
  return 0;
}

/**
 * Calculate effective popularity for a party in a given state.
 */
function computeEffectivePopularity(
  partyId: string,
  stateId: string,
  state: GameState,
): number {
  const party = state.parties[partyId];
  const stateData = state.states[stateId];
  if (!party || !stateData) return 5;

  // Use state-specific popularity as the primary driver
  let pop = stateData.popularityByParty?.[partyId] ?? (party.currentPopularity ?? party.startingPopularity);

  // Home state bonus
  if (party.homeState === stateId) pop += 6;

  // Strong state bonus
  if (party.strongStates.includes(stateId)) pop += 9;

  // Weak state penalty
  if (party.weakStates.includes(stateId)) pop -= 7;

  // Campaign spend bonus — logarithmic so spending more has diminishing returns
  const spent = stateData.campaignSpentByParty?.[partyId] ?? 0;
  const spendBonus = Math.log1p(spent / 8) * 4;
  pop += spendBonus;

  // Manifesto resonance (player only)
  if (partyId === state.playerPartyId && state.playerManifesto.length > 0) {
    const primaryIssues = stateData.primaryIssues;
    const resonanceCount = state.playerManifesto.filter(
      p => p.issueAlignment.some(i => primaryIssues.includes(i))
    ).length;
    pop += resonanceCount * 2;
  }

  // Smaller noise so popularity has more impact (was ±3, now ±2)
  pop += gaussianNoise(0, 2);

  return clamp(pop, 1, 100);
}

/**
 * Simulate a single constituency result.
 * Uses POWER LAW vote share so popular parties win decisively.
 */
function simulateConstituency(
  constituency: Constituency,
  state: GameState,
  noiseScale = 1,
): Record<string, number> {
  const partyIds = Object.keys(constituency.candidatesByParty ?? {});
  const effectivePartyIds = partyIds.length > 0 ? partyIds : Object.keys(state.parties);
  const rawScores: Record<string, number> = {};
  const stateData = state.states[constituency.stateId];
  const urbanization = stateData?.urbanization ?? 50;

  for (const partyId of effectivePartyIds) {
    // Seat sharing: party ceded this specific constituency to alliance partner
    if (hasPartyCededConstituency(partyId, constituency, state)) {
      rawScores[partyId] = 0.5; // tiny residual
      continue;
    }

    // 1. Base Popularity at constituency level (40% weight anchor)
    const cPop = constituency.popularityByParty?.[partyId] ?? computeEffectivePopularity(partyId, constituency.stateId, state);

    // 2. Candidate Quality (15% weight)
    const candidate = constituency.candidatesByParty?.[partyId];
    let candidateScore = 50; // Neutral quality
    if (candidate) {
      candidateScore = (
        candidate.localInfluence * 0.25 +
        candidate.campaignSkill * 0.25 +
        candidate.popularity * 0.25 +
        candidate.integrity * 0.15 +
        candidate.experience * 0.10
      );
    } else {
      candidateScore = 15; // penalty for no candidate
    }

    // 3. Campaign Spending (10% weight - logarithmic diminishing returns)
    const spent = constituency.campaignSpendByParty?.[partyId] ?? 0;
    const spendFactor = Math.min(100, Math.log1p(spent / 2) * 20);

    // 4. Ground Campaign (12% weight - ground strength)
    const ground = constituency.groundStrength?.[partyId] ?? 0;
    const groundFactor = Math.min(100, Math.log1p(ground / 3) * 22);

    // 5. Booth Organisation (10% weight - booth strength)
    const booth = constituency.boothStrength?.[partyId] ?? 0;
    const boothFactor = Math.min(100, Math.log1p(booth / 3) * 22);

    // 6. Digital Campaign (8% weight - digital strength)
    const digital = constituency.digitalStrength?.[partyId] ?? 0;
    const digitalFactor = Math.min(100, Math.log1p(digital / 3) * 22);

    // 7. Momentum (8% weight)
    const momentum = constituency.momentum?.[partyId] ?? 0;
    const momentumFactor = clamp((momentum + 10) * 5, 0, 100);

    // 8. Issue Matching (10% weight)
    let issueAlignment = 50;
    if (partyId === state.playerPartyId && state.playerManifesto.length > 0) {
      const hasAlignment = state.playerManifesto.some(p => p.issueAlignment.includes(constituency.majorIssue ?? 'employment'));
      issueAlignment = hasAlignment ? 85 : 40;
    } else {
      issueAlignment = 55 + (gaussianNoise(0, 5));
    }

    // 9. Leader Visits (5% weight)
    let leaderVisits = 30;
    const benchmarks = state.benchmarks?.[constituency.stateId];
    if (benchmarks) {
      const locks = benchmarks.rally.locks;
      if (locks && Object.values(locks).some(l => l.partyId === partyId)) {
        leaderVisits = 85;
      }
    }
    if (state.parties[partyId]?.homeState === constituency.stateId) {
      leaderVisits = Math.max(leaderVisits, 75);
    }

    // 10. National Swing (7% weight)
    const partyObj = state.parties[partyId];
    const baseStartingPop = partyObj?.startingPopularity ?? 30;
    const nationalSwing = clamp(((partyObj?.currentPopularity ?? 30) - baseStartingPop) * 2 + 50, 0, 100);

    // 11. State Swing (5% weight)
    const statePop = stateData?.popularityByParty?.[partyId] ?? baseStartingPop;
    const stateSwing = clamp((statePop - baseStartingPop) * 2 + 50, 0, 100);

    // 12. Alliance Vote Transfer (5% weight)
    const allianceBonus = getAllianceBonus(partyId, constituency.stateId, state);
    const allianceFactor = clamp(allianceBonus * 8 + 50, 0, 100);

    // 13. Turnout Effect (5% weight)
    const turnoutPct = constituency.turnout ?? 65;
    const turnoutFactor = clamp(turnoutPct + (cPop > 40 ? 10 : -10), 0, 100);

    // Incumbency adjusts candidate score
    let incumbencyBonus = 0;
    if (constituency.incumbentPartyId === partyId) {
      incumbencyBonus = 6;
    }

    const factorScore = 
      candidateScore * 0.15 +
      spendFactor * 0.10 +
      groundFactor * 0.12 +
      boothFactor * 0.10 +
      digitalFactor * 0.08 +
      momentumFactor * 0.08 +
      issueAlignment * 0.10 +
      leaderVisits * 0.05 +
      nationalSwing * 0.07 +
      stateSwing * 0.05 +
      allianceFactor * 0.05 +
      turnoutFactor * 0.05;

    // final raw popularity combines base popularity + factor calculations
    let finalPopularity = (cPop * 0.4) + (factorScore * 0.6) + incumbencyBonus;

    // Apply benchmark and topic bonuses from state milestones
    const benchmarkBonus = getBenchmarkBonus(partyId, constituency.stateId, state);
    const topicBonus = getTopicBonus(partyId, constituency.stateId, urbanization, state);
    finalPopularity += benchmarkBonus + topicBonus;

    // Controlled randomness for upset potential without overpowering strategy.
    finalPopularity += gaussianNoise(0, 2.2 * noiseScale);

    const linearScore = Math.max(0.5, finalPopularity);

    // Strong but not runaway conversion to FPTP advantage.
    const converted = Math.pow(linearScore, 1.22);
    const anchor = Math.max(0.5, cPop * 0.55);
    rawScores[partyId] = converted * 0.82 + anchor * 0.18;
  }

  // Normalise to 100%
  const total = Object.values(rawScores).reduce((a, b) => a + b, 0) || 1;
  const normalised: Record<string, number> = {};
  for (const pid of effectivePartyIds) {
    normalised[pid] = ((rawScores[pid] ?? 0) / total) * 100;
  }
  return normalised;
}

/**
 * Run the full election simulation and return results.
 * Properly scoped to game mode (state_assembly vs lok_sabha).
 */
export function runElectionSimulation(state: GameState): ElectionResult {
  // ── Scope constituencies by mode ──────────────────────────────────────────
  const constituencies = Object.values(state.constituencies).filter(c => {
    if (state.mode === 'lok_sabha') return c.type === 'lok_sabha';
    // State assembly: only target state
    return c.type === 'state_assembly' && c.stateId === state.targetState;
  });

  const seatsByParty: Record<string, number> = {};
  const totalVotesByParty: Record<string, number> = {};
  const constituencyResults: ElectionResult['byConstituency'] = {};
  const stateResults: ElectionResult['byState'] = {};

  // Init counters
  for (const pid of Object.keys(state.parties)) {
    seatsByParty[pid] = 0;
    totalVotesByParty[pid] = 0;
  }

  // Simulate each constituency
  for (const c of constituencies) {
    const voteShare = simulateConstituency(c, state);
    let winner = '';
    let maxVotes = 0;

    for (const [pid, share] of Object.entries(voteShare)) {
      totalVotesByParty[pid] = (totalVotesByParty[pid] ?? 0) + share;
      if (share > maxVotes) {
        maxVotes = share;
        winner = pid;
      }
    }

    if (winner) seatsByParty[winner] = (seatsByParty[winner] ?? 0) + 1;

    const sorted = Object.entries(voteShare).sort((a, b) => b[1] - a[1]);
    const margin = sorted.length >= 2 ? sorted[0][1] - sorted[1][1] : sorted[0]?.[1] ?? 0;
    const turnout = clamp(gaussianNoise(65, 8), 45, 82);
    const runnerUp = sorted.length >= 2 ? sorted[1][0] : 'None';

    constituencyResults[c.id] = { winner, voteShare, margin, turnout, runnerUp } as any;

    // Aggregate state results
    if (!stateResults[c.stateId]) {
      stateResults[c.stateId] = { seatsByParty: {}, swingParty: '', swingPercent: 0 };
    }
    const sr = stateResults[c.stateId];
    sr.seatsByParty[winner] = (sr.seatsByParty[winner] ?? 0) + 1;
  }

  // Compute swing for each state
  for (const sid of Object.keys(stateResults)) {
    const sr = stateResults[sid];
    const stateData = state.states[sid];
    const incumbent = stateData?.rulingPartyId ?? '';
    const incumbentSeats = sr.seatsByParty[incumbent] ?? 0;
    const stateConstituencyCount = constituencies.filter(c => c.stateId === sid).length || 1;
    sr.swingPercent = ((incumbentSeats / stateConstituencyCount) - 0.5) * 20;
    const topParty = Object.entries(sr.seatsByParty).sort((a, b) => b[1] - a[1])[0];
    sr.swingParty = topParty?.[0] ?? '';
  }

  // Vote share %
  const totalVoteCasts = Object.values(totalVotesByParty).reduce((a, b) => a + b, 0) || 1;
  const voteShareByParty: Record<string, number> = {};
  for (const [pid, votes] of Object.entries(totalVotesByParty)) {
    voteShareByParty[pid] = (votes / totalVoteCasts) * 100;
  }

  // Determine winner
  const totalSeats = constituencies.length;
  const majorityThreshold = Math.ceil(totalSeats / 2) + 1;
  const sortedParties = Object.entries(seatsByParty).sort((a, b) => b[1] - a[1]);
  const winnerPartyId = sortedParties[0]?.[0] ?? '';
  const winnerSeats = sortedParties[0]?.[1] ?? 0;

  // Government formation
  let governmentType: ElectionResult['governmentType'] = 'minority';
  let governingParty = winnerPartyId;
  let governingAlliance: string | undefined;

  if (winnerSeats >= majorityThreshold) {
    governmentType = 'majority';
  } else {
    for (const alliance of Object.values(state.alliances)) {
      if (alliance.status !== 'confirmed') continue;
      const allianceSeats = alliance.memberPartyIds.reduce(
        (acc, pid) => acc + (seatsByParty[pid] ?? 0), 0
      );
      if (allianceSeats >= majorityThreshold) {
        governmentType = 'coalition';
        governingAlliance = alliance.id;
        governingParty = alliance.leadPartyId;
        break;
      }
    }
  }

  // Build byParty
  const byParty: ElectionResult['byParty'] = {};
  for (const [pid, seats] of Object.entries(seatsByParty)) {
    byParty[pid] = {
      seatsWon: seats,
      voteShare: voteShareByParty[pid] ?? 0,
      seatChange: 0,
      budgetSpent: Object.values(state.states).reduce(
        (acc, s) => acc + (s.campaignSpentByParty?.[pid] ?? 0), 0
      ),
    };
  }

  return {
    gameMode: state.mode,
    targetState: state.targetState,
    byParty,
    byConstituency: constituencyResults,
    byState: stateResults,
    governmentType,
    governingAlliance,
    governingParty,
    // State election: CM; National election: PM
    primeMinisterPartyId: governingParty,
    majorityThreshold,
    winnerPartyId,
    totalSeats,
    timestamp: Date.now(),
  };
}

/**
 * Quick seat projection for opinion polls.
 */
export function quickSeatProjection(
  state: GameState
): Record<string, { projectedSeats: number; voteShare: number; swing: number }> {
  const result: Record<string, { projectedSeats: number; voteShare: number; swing: number }> = {};

  const constituencies = Object.values(state.constituencies).filter(c => {
    if (state.mode === 'lok_sabha') return c.type === 'lok_sabha';
    return c.type === 'state_assembly' && c.stateId === state.targetState;
  });

  const seatTally: Record<string, number> = {};
  const voteBuckets: Record<string, number> = {};
  const partyIds = Object.keys(state.parties);
  for (const pid of partyIds) {
    seatTally[pid] = 0;
    voteBuckets[pid] = 0;
  }

  for (const constituency of constituencies) {
    const voteShare = simulateConstituency(constituency, state, 0.6);
    const ranking = Object.entries(voteShare).sort((a, b) => b[1] - a[1]);
    const winner = ranking[0]?.[0];
    if (winner) seatTally[winner] = (seatTally[winner] ?? 0) + 1;
    for (const [pid, share] of Object.entries(voteShare)) {
      voteBuckets[pid] = (voteBuckets[pid] ?? 0) + share;
    }
  }

  const totalSeats = constituencies.length || 1;
  const voteTotal = Object.values(voteBuckets).reduce((a, b) => a + b, 0) || 1;

  for (const pid of partyIds) {
    const party = state.parties[pid];
    const current = party.currentPopularity ?? party.startingPopularity;
    const starting = party.startingPopularity;
    result[pid] = {
      projectedSeats: clamp(seatTally[pid] ?? 0, 0, totalSeats),
      voteShare: ((voteBuckets[pid] ?? 0) / voteTotal) * 100,
      swing: clamp((current - starting) + gaussianNoise(0, 1.2), -15, 15),
    };
  }

  return result;
}
