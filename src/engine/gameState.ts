/**
 * BHARAT NITI — Game State Factory & Turn Engine (v2)
 *
 * Changes:
 *  - Per-turn income for all parties (based on party size)
 *  - Black budget income per turn (separate from campaign budget)
 *  - Benchmark system initialisation
 *  - Category tracking in applyTurnAction
 *  - Proper state vs national scoping
 */

import type {
  GameState, GameMode, Difficulty, Party, StateData, Constituency, Candidate,
  GameEvent, TurnAction, StateBenchmarks, CategoryBenchmarks, CampaignSettings, DemographicGroup
} from './types';
import { PARTIES } from './data/parties';
import { STATES_DATA, ALL_STATES } from './data/states';
import { getEventsForTurn } from './data/events';
import { CAMPAIGN_ACTIONS } from './data/campaignActions';
import { getConstituenciesForState } from '../data/dataLoader';
import { runAITurn, calculateAllianceStability, shouldProposeAlliance } from './aiEngine';
import { quickSeatProjection } from './electionSimulator';
import {
  BENCHMARK_LEVELS,
  ACTION_CATEGORY_MAP,
  calculatePartyTurnIncome,
  calculateBlackTurnIncome,
} from './data/shadowOperations';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: CampaignSettings = {
  campaignDays: 60,
  maxTurns: 20,
  aiDifficulty: 'normal',
  campaignBudgetMultiplier: 1,
  randomEvents: true,
  politicalEvents: true,
  allianceMode: true,
  shadowOperations: true,
  opinionPollAccuracy: 82,
  blackMoney: true,
  simulationDifficulty: 'normal',
};

function normalizeSettings(mode: GameMode, settings?: Partial<CampaignSettings>): CampaignSettings {
  const baseTurns = mode === 'lok_sabha' ? 20 : 15;
  return {
    ...DEFAULT_SETTINGS,
    maxTurns: baseTurns,
    ...settings,
  };
}

function getEligiblePartiesForState(
  mode: GameMode,
  state: StateData,
  parties: Record<string, Party>,
  incumbentPartyId: string,
): string[] {
  // National parties (BJP, INC, BSP, AAP) are eligible everywhere by default.
  // Regional parties are only eligible in home state, strong states, or if listed as ruling/major in state database.
  return Object.values(parties)
    .filter(p =>
      p.isNational ||
      p.homeState === state.id ||
      p.strongStates.includes(state.id) ||
      p.id === incumbentPartyId ||
      p.id === state.rulingPartyId ||
      p.id === state.secondPartyId ||
      p.id === state.thirdPartyId
    )
    .map(p => p.id);
}

function generateCandidate(partyId: string, constituencyId: string, stateId: string): Candidate {
  const rnd = () => Math.floor(Math.random() * 40) + 40;
  const gender = Math.random() < 0.28 ? 'female' : 'male';

  const names = {
    male: ['Rajesh Kumar', 'Suresh Singh', 'Amit Sharma', 'Vikram Yadav', 'Mohan Gupta',
           'Anil Verma', 'Ravi Patel', 'Sanjay Mishra', 'Deepak Tiwari', 'Arvind Chauhan',
           'Ramesh Dubey', 'Manoj Tripathi', 'Pankaj Jaiswal', 'Kuldeep Rana', 'Santosh Bind'],
    female: ['Priya Singh', 'Sunita Devi', 'Kavita Sharma', 'Meena Gupta', 'Anita Yadav',
             'Rekha Patel', 'Sangita Mishra', 'Usha Verma', 'Lata Kumar', 'Savita Joshi',
             'Manju Devi', 'Pushpa Chauhan', 'Geeta Rani', 'Sarla Verma', 'Rita Tiwari'],
    other: ['Alex Kumar', 'Robin Singh'],
  };

  const namePool = names[gender as 'male' | 'female' | 'other'];
  const name = namePool[Math.floor(Math.random() * namePool.length)];

  return {
    id: `cand_${partyId}_${constituencyId}`,
    name,
    partyId,
    constituencyId,
    age: Math.floor(Math.random() * 30) + 35,
    gender,
    popularity: rnd(),
    integrity: rnd(),
    education: rnd(),
    experience: Math.floor(Math.random() * 5),
    publicSpeaking: rnd(),
    localInfluence: rnd(),
    campaignSkill: rnd(),
    isIncumbent: false,
    winsCount: Math.floor(Math.random() * 3),
  };
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function generateConstituencies(
  mode: GameMode,
  targetState: string | undefined,
  parties: Record<string, Party>
): Record<string, Constituency> {
  const constituencies: Record<string, Constituency> = {};

  const statesToProcess = targetState
    ? ALL_STATES.filter(s => s.id === targetState)
    : ALL_STATES;

  for (const state of statesToProcess) {
    if (mode === 'lok_sabha') {
      const realConsts = getConstituenciesForState(state.id);
      for (const rc of realConsts) {
        const id = rc.id;

        // Generate candidates for top parties
        const uniqueParties = getEligiblePartiesForState(mode, state, parties, rc.incumbentPartyId);

        const candidatesByParty: Record<string, Candidate> = {};
        for (const pid of uniqueParties) {
          candidatesByParty[pid] = generateCandidate(pid, id, state.id);
        }
        if (candidatesByParty[rc.incumbentPartyId]) {
          candidatesByParty[rc.incumbentPartyId].isIncumbent = true;
          candidatesByParty[rc.incumbentPartyId].popularity = Math.min(100, candidatesByParty[rc.incumbentPartyId].popularity + 15);
        }

        const primaryIssues = state.primaryIssues;
        const majorIssue = primaryIssues[rc.number % primaryIssues.length];

        const popularityByParty: Record<string, number> = {};
        const campaignSpendByParty: Record<string, number> = {};
        const boothStrength: Record<string, number> = {};
        const digitalStrength: Record<string, number> = {};
        const groundStrength: Record<string, number> = {};
        const momentum: Record<string, number> = {};

        for (const partyId of uniqueParties) {
          const statePop = state.popularityByParty?.[partyId] ?? parties[partyId]?.startingPopularity ?? 10;
          const variance = (Math.random() - 0.5) * 10;
          popularityByParty[partyId] = Math.max(2, Math.min(100, statePop + variance));
          boothStrength[partyId] = 0;
          digitalStrength[partyId] = 0;
          groundStrength[partyId] = 0;
          campaignSpendByParty[partyId] = 0;
          momentum[partyId] = 0;
        }

        constituencies[id] = {
          ...rc,
          candidatesByParty,
          popularityByParty,
          campaignSpendByParty,
          boothStrength,
          digitalStrength,
          groundStrength,
          momentum,
          majorIssue,
          campaignIntensity: 0,
          turnout: Math.floor(Math.random() * 15) + 60,
        };
      }
    } else {
      // Mock/Programmatic generation for state_assembly (for future-proofing)
      const seatCount = state.assemblySeats;
      for (let i = 1; i <= seatCount; i++) {
        const id = `${state.id}_assembly_${i}`;
        const isUrban = Math.random() < (state.urbanization / 100);
        const isReserved = Math.random() < 0.2;
        const reservedFor = isReserved ? (Math.random() < 0.6 ? 'SC' : 'ST') : undefined;

        let incumbent = state.rulingPartyId;
        const incChance = Math.random();
        if (incChance > 0.65 && state.secondPartyId) incumbent = state.secondPartyId;
        if (incChance > 0.85 && state.thirdPartyId) incumbent = state.thirdPartyId;

        const uniqueParties = getEligiblePartiesForState(mode, state, parties, incumbent);

        const candidatesByParty: Record<string, Candidate> = {};
        for (const pid of uniqueParties) {
          candidatesByParty[pid] = generateCandidate(pid, id, state.id);
        }
        if (candidatesByParty[incumbent]) {
          candidatesByParty[incumbent].isIncumbent = true;
          candidatesByParty[incumbent].popularity = Math.min(100, candidatesByParty[incumbent].popularity + 15);
        }

        const primaryIssues = state.primaryIssues;
        const majorIssue = primaryIssues[i % primaryIssues.length];

        const popularityByParty: Record<string, number> = {};
        const campaignSpendByParty: Record<string, number> = {};
        const boothStrength: Record<string, number> = {};
        const digitalStrength: Record<string, number> = {};
        const groundStrength: Record<string, number> = {};
        const momentum: Record<string, number> = {};

        for (const partyId of uniqueParties) {
          const statePop = state.popularityByParty?.[partyId] ?? parties[partyId]?.startingPopularity ?? 10;
          const variance = (Math.random() - 0.5) * 10;
          popularityByParty[partyId] = Math.max(2, Math.min(100, statePop + variance));
          boothStrength[partyId] = 0;
          digitalStrength[partyId] = 0;
          groundStrength[partyId] = 0;
          campaignSpendByParty[partyId] = 0;
          momentum[partyId] = 0;
        }

        constituencies[id] = {
          id,
          name: `${state.name} Assembly Constituency ${i}`,
          stateId: state.id,
          type: 'state_assembly',
          number: i,
          isUrban,
          isReserved,
          reservedFor,
          incumbentPartyId: incumbent,
          incumbentMargin: Math.floor(Math.random() * 15) + 2,
          candidatesByParty,
          popularityByParty,
          campaignSpendByParty,
          boothStrength,
          digitalStrength,
          groundStrength,
          momentum,
          majorIssue,
          campaignIntensity: 0,
          turnout: Math.floor(Math.random() * 15) + 60,
        };
      }
    }
  }

  return constituencies;
}

function initStatePopularities(parties: Record<string, Party>, states: Record<string, StateData>): void {
  for (const state of Object.values(states)) {
    if (!state.popularityByParty) state.popularityByParty = {};
    if (!state.campaignSpentByParty) state.campaignSpentByParty = {};
    if (!state.momentum) state.momentum = {};

    for (const party of Object.values(parties)) {
      let basePop = party.startingPopularity;
      if (party.homeState === state.id) basePop += 10;
      if (party.strongStates.includes(state.id)) basePop += 12;
      if (party.weakStates.includes(state.id)) basePop -= 10;
      if (state.rulingPartyId === party.id) basePop += 8;
      const noise = (Math.random() - 0.5) * 10;
      state.popularityByParty[party.id] = Math.max(2, Math.min(100, basePop + noise));
      state.campaignSpentByParty[party.id] = 0;
      state.momentum[party.id] = 0;
    }

    state.demographics = {
      women: 49,
      youth: 36,
      farmers: Math.round(Math.max(10, 60 - state.urbanization)),
      urban: state.urbanization,
      rural: 100 - state.urbanization,
      business: Math.round(state.urbanization * 0.16 + 5),
      students: Math.round(state.literacy * 0.12 + 4),
      govt_employees: Math.round(state.gdpPerCapita * 0.08 + 2),
      elderly: 10,
      lower_income: Math.round(Math.max(15, 80 - state.gdpPerCapita)),
      obc: 40,
      sc_st: state.isUT ? 12 : 21,
      minority: state.id === 'Punjab' ? 58 : state.id === 'Jammu & Kashmir' ? 68 : 16,
      urban_middle: Math.round(state.urbanization * 0.4 + 10),
    };

    state.popularityByDemographic = {};
    for (const party of Object.values(parties)) {
      const statePop = state.popularityByParty[party.id] ?? 30;
      state.popularityByDemographic[party.id] = {
        women: statePop,
        youth: statePop,
        farmers: statePop,
        urban: statePop,
        rural: statePop,
        business: statePop,
        students: statePop,
        govt_employees: statePop,
        elderly: statePop,
        lower_income: statePop,
        obc: statePop,
        sc_st: statePop,
        minority: statePop,
        urban_middle: statePop,
      };

      const pDemo = state.popularityByDemographic[party.id];
      if (party.ideology === 'hindu_nationalism' || party.aiPersonality === 'digital_focus') {
        pDemo.urban = Math.min(100, pDemo.urban + 6);
        pDemo.business = Math.min(100, pDemo.business + 5);
        pDemo.urban_middle = Math.min(100, pDemo.urban_middle + 4);
      }
      if (party.ideology === 'left_wing' || party.aiPersonality === 'grassroots_focus' || party.aiPersonality === 'welfare_focus') {
        pDemo.farmers = Math.min(100, pDemo.farmers + 7);
        pDemo.rural = Math.min(100, pDemo.rural + 6);
        pDemo.lower_income = Math.min(100, pDemo.lower_income + 5);
      }
      if (party.aiPersonality === 'youth_focused') {
        pDemo.youth = Math.min(100, pDemo.youth + 8);
        pDemo.students = Math.min(100, pDemo.students + 8);
      }
    }

    state.issueScores = {} as Record<string, number>;
    for (const issue of state.primaryIssues) {
      (state.issueScores as Record<string, number>)[issue] = Math.floor(Math.random() * 40) + 50;
    }
    state.swingPercentage = 0;
  }
}

/** Create empty benchmark structure for a state */
function createEmptyCategoryBenchmarks(): CategoryBenchmarks {
  return { progress: {}, locks: {} };
}

function createEmptyStateBenchmarks(): StateBenchmarks {
  return {
    rally: createEmptyCategoryBenchmarks(),
    booth: createEmptyCategoryBenchmarks(),
    digital: createEmptyCategoryBenchmarks(),
  };
}

function hasActiveAlliance(partyId: string, state: GameState): boolean {
  return Object.values(state.alliances).some(
    a => a.status !== 'broken' && a.memberPartyIds.includes(partyId)
  );
}

function runAIAllianceNegotiations(state: GameState, turn: number): void {
  if (state.settings?.allianceMode === false) return;

  const aiPartyIds = Object.keys(state.parties).filter(pid => pid !== state.playerPartyId);

  for (const partyId of aiPartyIds) {
    if (hasActiveAlliance(partyId, state)) continue;

    const candidates = aiPartyIds.filter(pid => pid !== partyId && !hasActiveAlliance(pid, state));
    if (candidates.length === 0) continue;

    const scored = candidates
      .map(targetPartyId => {
        const party = state.parties[partyId];
        const target = state.parties[targetPartyId];
        if (!party || !target) return null;

        let compatibility = 45;
        if (party.ideology === target.ideology) compatibility += 20;
        compatibility += party.weakStates.filter(s => target.strongStates.includes(s)).length * 4;
        compatibility += target.weakStates.filter(s => party.strongStates.includes(s)).length * 4;
        compatibility -= party.strongStates.filter(s => target.strongStates.includes(s)).length * 3;

        return { targetPartyId, compatibility: clamp(compatibility, 10, 90) };
      })
      .filter((x): x is { targetPartyId: string; compatibility: number } => !!x)
      .sort((a, b) => b.compatibility - a.compatibility);

    const best = scored[0];
    if (!best || best.compatibility < 48) continue;
    if (!shouldProposeAlliance(partyId, best.targetPartyId, state)) continue;

    const allianceId = `ai_alliance_${partyId}_${best.targetPartyId}_${turn}`;
    state.alliances[allianceId] = {
      id: allianceId,
      name: `${state.parties[partyId].abbreviation}-${state.parties[best.targetPartyId].abbreviation} Front`,
      leadPartyId: partyId,
      memberPartyIds: [partyId, best.targetPartyId],
      status: 'confirmed',
      stability: clamp(58 + best.compatibility * 0.35, 45, 90),
      seatSharing: {},
      stateSeatSharing: {},
      sharedBudget: 0,
      formationTurn: turn,
      breakdownProbability: 0.08,
      ideology: 'mixed',
      trustByParty: {
        [partyId]: 60,
        [best.targetPartyId]: 56,
      },
      compatibilityByParty: {
        [partyId]: best.compatibility,
        [best.targetPartyId]: best.compatibility,
      },
      voteTransferByParty: {
        [partyId]: 52,
        [best.targetPartyId]: 50,
      },
      relationshipByParty: {
        [partyId]: 58,
        [best.targetPartyId]: 56,
      },
      };

    generateMissingAllianceCandidates(state, allianceId);

    state.notifications.push({
      id: `notif_ai_alliance_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      title: 'New Opposition Alliance',
      message: `${state.parties[partyId].abbreviation} and ${state.parties[best.targetPartyId].abbreviation} formed a pre-poll front.`,
      type: 'warning',
      turn,
      timestamp: Date.now(),
      isRead: false,
      icon: 'Users',
    });
  }
}

/** Check and lock benchmark levels after a spend update */
function checkAndLockBenchmarks(
  stateId: string,
  partyId: string,
  category: 'rally' | 'booth' | 'digital',
  state: GameState,
): void {
  const stateBm = state.benchmarks[stateId];
  if (!stateBm) return;

  const cat = stateBm[category];
  const partyPoints = cat.progress[partyId] ?? 0;

  for (const bm of BENCHMARK_LEVELS) {
    if (cat.locks[bm.level]) continue; // already locked
    if (partyPoints >= bm.points) {
      cat.locks[bm.level] = {
        partyId,
        turn: state.currentTurn,
        voteShareBonus: bm.voteShareBonus,
        label: bm.label,
      };
    }
  }
}

/**
 * Dynamic candidate generator for newly formed alliances.
 * Ensures allied parties have representation for seat-sharing.
 */
export function generateMissingAllianceCandidates(state: GameState, allianceId: string) {
  const alliance = state.alliances[allianceId];
  if (!alliance) return;

  for (const c of Object.values(state.constituencies)) {
    const isTargetMode = state.mode === 'lok_sabha'
      ? c.type === 'lok_sabha'
      : (c.type === 'state_assembly' && c.stateId === state.targetState);
    if (!isTargetMode) continue;

    const stateData = state.states[c.stateId];
    if (!stateData) continue;

    const eligibleParties = getEligiblePartiesForState(state.mode, stateData, state.parties, c.incumbentPartyId);

    for (const pid of alliance.memberPartyIds) {
      if (!eligibleParties.includes(pid)) continue;

      if (!c.candidatesByParty) c.candidatesByParty = {};
      if (!c.candidatesByParty[pid]) {
        c.candidatesByParty[pid] = generateCandidate(pid, c.id, c.stateId);
        if (!c.popularityByParty) c.popularityByParty = {};
        const statePop = state.states[c.stateId]?.popularityByParty?.[pid] ?? 10;
        c.popularityByParty[pid] = Math.max(5, Math.min(45, statePop + (Math.random() - 0.5) * 10));
      }
    }
  }
}

// ─── createInitialGameState ───────────────────────────────────────────────────

export function createInitialGameState(params: {
  mode: GameMode;
  playerPartyId: string;
  difficulty: Difficulty;
  targetState?: string;
  customPartyConfig?: Partial<Party>;
  settings?: Partial<CampaignSettings>;
}): GameState {
  const { mode, playerPartyId, difficulty, targetState, customPartyConfig, settings } = params;
  const effectiveSettings = normalizeSettings(mode, settings);

  // Clone parties
  const parties: Record<string, Party> = {};
  for (const [id, party] of Object.entries(PARTIES)) {
    parties[id] = {
      ...party,
      currentPopularity: party.startingPopularity,
      currentBudget: party.startingBudget,
      // Black budget starts at 10% of starting budget
      blackBudget: Math.round(party.startingBudget * 0.1),
    } as Party & { blackBudget: number };
  }

  if (playerPartyId === 'CUSTOM' && customPartyConfig) {
    parties['CUSTOM'] = { ...(parties['CUSTOM'] ?? {}), ...customPartyConfig } as Party;
  }

  // Difficulty adjustments
  const diffMultiplier = { easy: 1.4, normal: 1.0, hard: 0.75, legendary: 0.55 }[difficulty];
  const playerParty = parties[playerPartyId];
  if (playerParty) {
    playerParty.currentBudget = Math.round((playerParty.currentBudget ?? playerParty.startingBudget) * diffMultiplier * effectiveSettings.campaignBudgetMultiplier);
    playerParty.currentPopularity = Math.max(
      10,
      Math.round((playerParty.currentPopularity ?? playerParty.startingPopularity) * Math.min(1.1, diffMultiplier))
    );
  }

  // Clone states
  const states: Record<string, StateData> = {};
  const statesToInclude = targetState
    ? { [targetState]: STATES_DATA[targetState] }
    : STATES_DATA;

  for (const [id, state] of Object.entries(statesToInclude)) {
    if (!state) continue;
    states[id] = { ...state };
  }

  initStatePopularities(parties, states);

  // Generate constituencies
  const constituencies = generateConstituencies(mode, targetState, parties);

  // Initialise benchmarks for all states
  const benchmarks: Record<string, StateBenchmarks> = {};
  for (const sid of Object.keys(states)) {
    benchmarks[sid] = createEmptyStateBenchmarks();
    // Init progress for all parties at 0
    for (const pid of Object.keys(parties)) {
      benchmarks[sid].rally.progress[pid] = 0;
      benchmarks[sid].booth.progress[pid] = 0;
      benchmarks[sid].digital.progress[pid] = 0;
    }
  }

  // Calculate player's starting turn income for display
  const pp = parties[playerPartyId];
  const turnIncome = pp
    ? calculatePartyTurnIncome(pp.startingBudget, pp.isNational, diffMultiplier, true)
    : 25;

  // Set turn budget cap (e.g., cannot spend more than 5% of starting budget or 50 Cr per turn)
  const maxBudgetPerTurn = pp ? Math.max(50, Math.round(pp.startingBudget * 0.05)) : 50;

  const totalTurns = Math.max(5, effectiveSettings.maxTurns);

  return {
    id: `game_${Date.now()}`,
    mode,
    targetState,
    difficulty,
    phase: 'campaign',
    currentTurn: 1,
    totalTurns,
    electionDate: mode === 'lok_sabha' ? 'May 2025 — Lok Sabha' : `2025 — ${targetState ?? ''} Assembly`,
    startDate: new Date().toISOString(),
    isPaused: false,
    speed: 1,
    parties,
    playerPartyId,
    settings: effectiveSettings,
    states,
    constituencies,
    alliances: {},
    playerManifesto: [],
    activeEvents: [],
    eventHistory: [],
    polls: [],
    internalSurveys: {},
    turnActions: {},
    aiTargets: {},
    aiCooldowns: {},
    selectedStateId: undefined,
    activePanel: 'warroom',
    notifications: [],
    // ── New fields ──
    actionsTakenThisTurn: 0,
    budgetSpentThisTurn: 0,
    maxActionsPerTurn: 4,
    maxBudgetPerTurn,
    turnIncome,
    benchmarks,
    activeTopics: {},
    stats: {
      totalActionsPerformed: 0,
      totalBudgetSpent: 0,
      statesCampaignedIn: [],
      ralliesHeld: 0,
      alliancesFormed: 0,
      eventsTriggered: 0,
      pollHighest: 0,
      pollLowest: 100,
      turnsPlayed: 0,
    },
  };
}

// ─── advanceTurn ─────────────────────────────────────────────────────────────

export function advanceTurn(state: GameState): GameState {
  const newState = { ...state };
  const turn = newState.currentTurn;
  const diffMultiplier = { easy: 1.4, normal: 1.0, hard: 0.75, legendary: 0.55 }[newState.difficulty] ?? 1.0;

  const pp = newState.parties[newState.playerPartyId];
  const baseBudgetCap = pp ? Math.max(50, Math.round(pp.startingBudget * 0.05)) : 50;

  // Reset limits for the new turn & escalate in late campaign (final 35% of turns)
  const isLateCampaign = (turn / newState.totalTurns) >= 0.65;
  if (isLateCampaign) {
    newState.maxActionsPerTurn = 6;
    newState.maxBudgetPerTurn = baseBudgetCap * 2;
  } else {
    newState.maxActionsPerTurn = 4;
    newState.maxBudgetPerTurn = baseBudgetCap;
  }
  newState.actionsTakenThisTurn = 0;
  newState.budgetSpentThisTurn = 0;

  newState.morningBriefing = {
    turn,
    events: []
  };

  // 1. Resolve active events
  newState.activeEvents = newState.activeEvents
    .filter(e => e.turnDuration > 0)
    .map(e => ({ ...e, turnDuration: e.turnDuration - 1 }));

  // 2. Trigger new random events
  const eventsEnabled = newState.settings?.randomEvents !== false;
  const newEvents = eventsEnabled ? getEventsForTurn(turn, 2) : [];
  for (const event of newEvents) {
    const eventWithTurn = { ...event, turn };
    applyEventEffects(eventWithTurn, newState);
    newState.activeEvents.push(eventWithTurn);
    newState.eventHistory.push(eventWithTurn);
    newState.notifications.push({
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      title: eventWithTurn.title,
      message: eventWithTurn.description,
      type: eventWithTurn.isPositive ? 'success' : 'danger',
      turn,
      timestamp: Date.now(),
      isRead: false,
      icon: eventWithTurn.icon,
    });
    newState.morningBriefing.events.push({
      title: `Event: ${eventWithTurn.title}`,
      message: eventWithTurn.description,
      type: eventWithTurn.isPositive ? 'success' : 'danger',
      icon: eventWithTurn.icon
    });
  }
  newState.stats.eventsTriggered += newEvents.length;

  // 3. ─── Award per-turn income to ALL parties ────────────────────────────
  for (const [partyId, party] of Object.entries(newState.parties)) {
    const isPlayer = partyId === newState.playerPartyId;
    const income = calculatePartyTurnIncome(
      party.startingBudget,
      party.isNational,
      isPlayer ? diffMultiplier : 1.0,
      isPlayer,
    );
    const blackIncome = calculateBlackTurnIncome(income);

    party.currentBudget = (party.currentBudget ?? 0) + income;
    // Black budget (stored as party extension — safe to cast)
    const p = party as Party & { blackBudget?: number };
    p.blackBudget = (p.blackBudget ?? 0) + blackIncome;

    // Update player's displayed turn income
    if (isPlayer) {
      newState.turnIncome = income;
    }
  }

  // 4. Run AI turns
  const aiActions = runAITurn(newState);
  for (const action of aiActions) {
    applyTurnAction(action, newState);
    
    // Add significant AI actions to morning briefing
    if (action.campaignAction) {
      const def = CAMPAIGN_ACTIONS[action.campaignAction];
      const p = newState.parties[action.partyId];
      if (def && p) {
        let msg = `${p.abbreviation} executed ${def.name}`;
        if (action.targetStateId) msg += ` in ${newState.states[action.targetStateId]?.name ?? 'Unknown'}`;
        
        newState.morningBriefing.events.push({
          title: `AI Action: ${p.abbreviation}`,
          message: msg,
          type: 'danger',
          icon: 'AlertTriangle'
        });
      }
    }
  }

  runAIAllianceNegotiations(newState, turn);
  
  // Store AI actions in turn history for the Morning Briefing
  if (!newState.turnActions[turn]) newState.turnActions[turn] = [];
  newState.turnActions[turn].push(...aiActions);

  // 5. Update alliance stability
  for (const [allianceId, alliance] of Object.entries(newState.alliances)) {
    const delta = calculateAllianceStability(allianceId, newState);
    alliance.stability = Math.max(0, Math.min(100, alliance.stability + delta));

    if (alliance.stability < 20 && Math.random() < 0.3) {
      alliance.status = 'broken';
      newState.notifications.push({
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        title: 'Alliance Breakdown!',
        message: `The ${alliance.name} alliance is collapsing due to internal conflicts.`,
        type: 'warning',
        turn,
        timestamp: Date.now(),
        isRead: false,
        icon: 'Unlink',
      });
    }
  }

  // 5.5 Update state-level and constituency momentum and intensity
  for (const s of Object.values(newState.states)) {
    if (!s.momentum) s.momentum = {};
    for (const pid of Object.keys(newState.parties)) {
      const currentMom = s.momentum[pid] ?? 0;
      // Momentum affects state popularity: popularity changes by 5% of momentum score
      if (currentMom !== 0) {
        if (!s.popularityByParty) s.popularityByParty = {};
        const currentPop = s.popularityByParty[pid] ?? 30;
        s.popularityByParty[pid] = clamp(parseFloat((currentPop + currentMom * 0.05).toFixed(2)), 1, 100);
      }
      // Momentum decays by 15% (multiplied by 0.85) each turn
      s.momentum[pid] = parseFloat((currentMom * 0.85).toFixed(2));
    }
  }

  for (const c of Object.values(newState.constituencies)) {
    if (c.momentum) {
      for (const pid of Object.keys(c.momentum)) {
        c.momentum[pid] = parseFloat((c.momentum[pid] * 0.8).toFixed(2));
      }
    } else {
      c.momentum = {};
    }
    c.campaignIntensity = Math.max(0, Math.floor((c.campaignIntensity ?? 0) * 0.85));
  }

  // 6. Update AI cooldowns
  for (const partyId of Object.keys(newState.aiCooldowns)) {
    for (const actionType of Object.keys(newState.aiCooldowns[partyId])) {
      newState.aiCooldowns[partyId][actionType] = Math.max(
        0,
        (newState.aiCooldowns[partyId][actionType] ?? 0) - 1
      );
    }
  }

  // 7. Opinion poll or Exit Poll
  const isExitPollTime = turn === newState.totalTurns;
  const isNormalPollTime = turn % 3 === 0 && turn < newState.totalTurns;

  if (isNormalPollTime || isExitPollTime) {
    const projection = quickSeatProjection(newState);
    const pollAccuracy = isExitPollTime ? 97 : clamp(newState.settings?.opinionPollAccuracy ?? 82, 50, 99);
    
    const confidence = isExitPollTime ? 98 : clamp(Math.round(pollAccuracy + (Math.random() * 6 - 3)), 50, 99);
    const margin = isExitPollTime ? 1 : Math.max(2, Math.round((100 - confidence) / 3));
    const undecided = isExitPollTime ? 0 : clamp(parseFloat((Math.random() * 4 + 2).toFixed(1)), 1, 12);
    const sampleSize = isExitPollTime ? Math.round(180000 + Math.random() * 70000) : Math.round(8000 + Math.random() * 22000);
    const pollsterName = isExitPollTime ? 'Joint National Exit Poll' : getRandomPollsterName();
    
    let trend: 'up' | 'down' | 'flat' = 'flat';
    if (newState.polls.length > 0) {
      const prevPoll = newState.polls[newState.polls.length - 1];
      const prevShare = prevPoll.national.byParty[newState.playerPartyId]?.voteShare ?? 30;
      const currentShare = projection[newState.playerPartyId]?.voteShare ?? 30;
      if (currentShare - prevShare > 1.2) trend = 'up';
      else if (prevShare - currentShare > 1.2) trend = 'down';
    }

    const poll = {
      turn,
      isExitPoll: isExitPollTime,
      national: {
        byParty: Object.fromEntries(
          Object.entries(projection).map(([pid, d]) => [pid, {
            voteShare: d.voteShare,
            projectedSeats: d.projectedSeats,
            swing: d.swing,
          }])
        ),
        confidence,
        margin,
        winner: Object.entries(projection).sort((a, b) => b[1].projectedSeats - a[1].projectedSeats)[0]?.[0],
        trend,
        undecided,
        sampleSize,
      },
      byState: Object.fromEntries(
        Object.entries(newState.states).map(([sid, s]) => [sid, {
          rulingParty: s.rulingPartyId,
          popularityByParty: s.popularityByParty ?? {},
          topIssues: s.primaryIssues,
          swing: s.swingPercentage ?? 0,
        }])
      ),
      pollsterName,
      isAccurate: isExitPollTime ? true : Math.random() > 0.2,
      bias: isExitPollTime ? 0 : (Math.random() - 0.5) * 10,
    };
    newState.polls.push(poll);
    newState.latestPoll = poll;
  }

  // 8. Advance turn counter
  newState.currentTurn = turn + 1;
  newState.stats.turnsPlayed++;

  // 9. Check election day
  if (newState.currentTurn > newState.totalTurns) {
    newState.phase = 'election_day';
  }

  return newState;
}

// ─── applyTurnAction ─────────────────────────────────────────────────────────

export function applyTurnAction(action: TurnAction, state: GameState): void {
  if (action.type !== 'campaign') return;

  const campaignDef = CAMPAIGN_ACTIONS[action.campaignAction ?? ''];
  if (!campaignDef) return;

  const party = state.parties[action.partyId];
  if (!party) return;

  // Deduct budget
  const budget = party.currentBudget ?? party.startingBudget;
  party.currentBudget = Math.max(0, budget - action.cost);

  const category = ACTION_CATEGORY_MAP[action.campaignAction ?? ''];

  if (action.targetConstituencyId) {
    // 🎯 TARGETED CONSTITUENCY CAMPAIGN
    const targetConst = state.constituencies[action.targetConstituencyId];
    if (targetConst) {
      if (!targetConst.popularityByParty) targetConst.popularityByParty = {};
      if (!targetConst.campaignSpendByParty) targetConst.campaignSpendByParty = {};
      if (!targetConst.boothStrength) targetConst.boothStrength = {};
      if (!targetConst.digitalStrength) targetConst.digitalStrength = {};
      if (!targetConst.groundStrength) targetConst.groundStrength = {};
      if (!targetConst.momentum) targetConst.momentum = {};

      const isUrban = targetConst.isUrban;
      const modifier = isUrban ? (campaignDef.urbanEffect ?? 1.0) : (campaignDef.ruralEffect ?? 1.0);
      const gain = campaignDef.popularityGain * modifier * 1.5; // Targeted campaigns are more effective in that seat

      // Update constituency-level popularity
      const current = targetConst.popularityByParty[action.partyId] ?? (party.currentPopularity ?? 30);
      targetConst.popularityByParty[action.partyId] = Math.min(100, current + gain);
      targetConst.campaignSpendByParty[action.partyId] = (targetConst.campaignSpendByParty[action.partyId] ?? 0) + action.cost;

      // Update targeted strengths
      if (category === 'rally') {
        targetConst.groundStrength[action.partyId] = (targetConst.groundStrength[action.partyId] ?? 0) + action.cost;
      } else if (category === 'booth') {
        targetConst.boothStrength[action.partyId] = (targetConst.boothStrength[action.partyId] ?? 0) + action.cost;
      } else if (category === 'digital') {
        targetConst.digitalStrength[action.partyId] = (targetConst.digitalStrength[action.partyId] ?? 0) + action.cost;
      }

      // Add positive momentum
      targetConst.momentum[action.partyId] = Math.min(10, (targetConst.momentum[action.partyId] ?? 0) + 1.5);
      targetConst.campaignIntensity = Math.min(100, (targetConst.campaignIntensity ?? 0) + 10);
      
      if (action.partyId === state.playerPartyId) {
        state.notifications.push({
          id: `notif_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          title: `Constituency Campaign Executed`,
          message: `Your ${campaignDef.name} generated a +${gain.toFixed(1)}% surge in ${targetConst.name}!`,
          type: 'info',
          turn: state.currentTurn,
          timestamp: Date.now(),
          isRead: false,
          icon: 'Target',
        });
      }

      // Diffuse to state-level popularity
      const stateData = state.states[targetConst.stateId];
      if (stateData) {
        if (!stateData.popularityByParty) stateData.popularityByParty = {};
        if (!stateData.campaignSpentByParty) stateData.campaignSpentByParty = {};
        if (!stateData.momentum) stateData.momentum = {};

        const stateSeats = stateData.lokSabhaSeats || 1;
        applyDemographicCampaignEffects(stateData, action.partyId, action.campaignAction ?? '', gain / Math.sqrt(stateSeats));
        stateData.campaignSpentByParty[action.partyId] = (stateData.campaignSpentByParty[action.partyId] ?? 0) + action.cost;
        
        // Add relative momentum state-wide (+4 for constituency campaign)
        stateData.momentum[action.partyId] = Math.min(100, (stateData.momentum[action.partyId] ?? 0) + 4);

        // Contribute to state benchmarks at 50% effectiveness
        if (category && state.benchmarks?.[targetConst.stateId]) {
          const bm = state.benchmarks[targetConst.stateId];
          const catBm = bm[category];
          catBm.progress[action.partyId] = (catBm.progress[action.partyId] ?? 0) + action.cost * 0.5;
          checkAndLockBenchmarks(targetConst.stateId, action.partyId, category, state);
        }
      }
    }
  } else if (action.targetStateId) {
    // 🗺️ STATE-WIDE CAMPAIGN
    const stateData = state.states[action.targetStateId];
    if (stateData) {
      if (!stateData.popularityByParty) stateData.popularityByParty = {};
      if (!stateData.campaignSpentByParty) stateData.campaignSpentByParty = {};
      if (!stateData.momentum) stateData.momentum = {};

      const isUrbanState = stateData.urbanization > 40;
      const modifier = isUrbanState ? (campaignDef.urbanEffect ?? 1.0) : (campaignDef.ruralEffect ?? 1.0);
      const gain = campaignDef.popularityGain * modifier;

      applyDemographicCampaignEffects(stateData, action.partyId, action.campaignAction ?? '', gain);
      stateData.campaignSpentByParty[action.partyId] = (stateData.campaignSpentByParty[action.partyId] ?? 0) + action.cost;

      // Add relative momentum state-wide (+6 for state-wide campaign, +15 for leader visits)
      const momentumGain = action.campaignAction === 'mega_rally' || action.campaignAction === 'star_campaigner' ? 15 : 6;
      stateData.momentum[action.partyId] = Math.min(100, (stateData.momentum[action.partyId] ?? 0) + momentumGain);

      if (action.partyId === state.playerPartyId) {
        state.notifications.push({
          id: `notif_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          title: `State Campaign Executed`,
          message: `Your ${campaignDef.name} boosted state-wide popularity in ${stateData.name} by +${gain.toFixed(1)}% and generated momentum.`,
          type: 'info',
          turn: state.currentTurn,
          timestamp: Date.now(),
          isRead: false,
          icon: 'Zap',
        });
      }

      // Update state benchmarks
      if (category && state.benchmarks?.[action.targetStateId]) {
        const bm = state.benchmarks[action.targetStateId];
        const catBm = bm[category];
        catBm.progress[action.partyId] = (catBm.progress[action.partyId] ?? 0) + action.cost;
        checkAndLockBenchmarks(action.targetStateId, action.partyId, category, state);
      }

      // Diffuse to all constituencies belonging to this state
      const stateConsts = Object.values(state.constituencies).filter(c => c.stateId === action.targetStateId);
      for (const sc of stateConsts) {
        if (!sc.popularityByParty) sc.popularityByParty = {};
        if (!sc.campaignSpendByParty) sc.campaignSpendByParty = {};
        if (!sc.boothStrength) sc.boothStrength = {};
        if (!sc.digitalStrength) sc.digitalStrength = {};
        if (!sc.groundStrength) sc.groundStrength = {};
        if (!sc.momentum) sc.momentum = {};

        const cCurrent = sc.popularityByParty[action.partyId] ?? (party.currentPopularity ?? 30);
        const cGain = gain * 0.7; // Diluted state-wide message
        sc.popularityByParty[action.partyId] = Math.min(100, cCurrent + cGain);
        sc.campaignSpendByParty[action.partyId] = (sc.campaignSpendByParty[action.partyId] ?? 0) + (action.cost / (stateConsts.length || 1));

        // Distribute strength
        const strengthShare = action.cost / (stateConsts.length || 1);
        if (category === 'rally') {
          sc.groundStrength[action.partyId] = (sc.groundStrength[action.partyId] ?? 0) + strengthShare;
        } else if (category === 'booth') {
          sc.boothStrength[action.partyId] = (sc.boothStrength[action.partyId] ?? 0) + strengthShare;
        } else if (category === 'digital') {
          sc.digitalStrength[action.partyId] = (sc.digitalStrength[action.partyId] ?? 0) + strengthShare;
        }
        
        sc.momentum[action.partyId] = Math.min(10, (sc.momentum[action.partyId] ?? 0) + 0.5);
      }
    }
  }

  // Update national popularity as average of all state popularities
  const stateValues = Object.values(state.states);
  const avgStatePop = stateValues.reduce(
    (acc, s) => acc + (s.popularityByParty?.[action.partyId] ?? 0), 0
  ) / (stateValues.length || 1);

  party.currentPopularity = Math.min(100, avgStatePop);
}

// ─── Apply event effects ──────────────────────────────────────────────────────

function applyEventEffects(event: GameEvent, state: GameState): void {
  const playerPartyId = state.playerPartyId;

  for (const [target, delta] of Object.entries(event.popularityDelta)) {
    let partyId: string | undefined;

    if (target === 'player') partyId = playerPartyId;
    else if (target === 'ruling') partyId = Object.values(state.states)[0]?.rulingPartyId;
    else if (target === 'opposition') partyId = playerPartyId;
    else if (PARTIES[target]) partyId = target;

    if (!partyId || !state.parties[partyId]) continue;

    const party = state.parties[partyId];
    party.currentPopularity = Math.max(
      0, Math.min(100, (party.currentPopularity ?? 30) + delta)
    );

    for (const stateData of Object.values(state.states)) {
      if (!stateData.popularityByParty) stateData.popularityByParty = {};
      if (!stateData.popularityByDemographic) stateData.popularityByDemographic = {};
      if (!stateData.popularityByDemographic[partyId]) {
        const defaultPop = stateData.popularityByParty[partyId] ?? (party.currentPopularity ?? 30);
        stateData.popularityByDemographic[partyId] = {
          women: defaultPop, youth: defaultPop, farmers: defaultPop, urban: defaultPop, rural: defaultPop,
          business: defaultPop, students: defaultPop, govt_employees: defaultPop, elderly: defaultPop,
          lower_income: defaultPop, obc: defaultPop, sc_st: defaultPop, minority: defaultPop, urban_middle: defaultPop
        };
      }

      const pDemo = stateData.popularityByDemographic[partyId];
      let eventTargets: DemographicGroup[] = [];

      if (event.type?.includes('farm') || event.type?.includes('rain') || event.type?.includes('flood') || event.type?.includes('cyclone') || event.type?.includes('disaster')) {
        eventTargets = ['farmers', 'rural'];
      } else if (event.type?.includes('unemployment') || event.type?.includes('job') || event.type?.includes('student') || event.type?.includes('youth')) {
        eventTargets = ['youth', 'students', 'lower_income'];
      } else if (event.type?.includes('price') || event.type?.includes('inflation') || event.type?.includes('slowdown')) {
        eventTargets = ['lower_income', 'women', 'elderly'];
      } else if (event.type?.includes('infra') || event.type?.includes('highway') || event.type?.includes('tech') || event.type?.includes('boom') || event.type?.includes('industry')) {
        eventTargets = ['business', 'urban', 'govt_employees', 'urban_middle'];
      } else {
        eventTargets = Object.keys(pDemo) as DemographicGroup[];
      }

      for (const demo of eventTargets) {
        if (pDemo[demo] !== undefined) {
          pDemo[demo] = Math.max(0, Math.min(100, pDemo[demo] + delta * 0.7));
        }
      }

      // Recalculate average popularity in state based on demographic distribution
      if (stateData.demographics) {
        let totalScore = 0;
        let totalWeight = 0;
        for (const [demoKey, pop] of Object.entries(pDemo)) {
          const dKey = demoKey as DemographicGroup;
          const weight = stateData.demographics[dKey] ?? 10;
          totalScore += pop * weight;
          totalWeight += weight;
        }
        if (totalWeight > 0) {
          stateData.popularityByParty[partyId] = parseFloat((totalScore / totalWeight).toFixed(2));
        }
      } else {
        const current = stateData.popularityByParty[partyId] ?? (party.currentPopularity ?? 30);
        stateData.popularityByParty[partyId] = Math.max(0, Math.min(100, current + delta * 0.5));
      }
    }
  }

  if (event.budgetDelta) {
    for (const [target, delta] of Object.entries(event.budgetDelta)) {
      let partyId: string | undefined;
      if (target === 'ruling') partyId = Object.values(state.states)[0]?.rulingPartyId;
      else if (target === 'player') partyId = playerPartyId;
      else if (PARTIES[target]) partyId = target;

      if (!partyId || !state.parties[partyId]) continue;
      const party = state.parties[partyId];
      party.currentBudget = Math.max(0, (party.currentBudget ?? 0) + delta);
    }
  }
}

function applyDemographicCampaignEffects(
  stateData: StateData,
  partyId: string,
  actionType: string,
  gain: number
): void {
  if (!stateData.popularityByDemographic) stateData.popularityByDemographic = {};
  if (!stateData.popularityByDemographic[partyId]) {
    const defaultPop = stateData.popularityByParty?.[partyId] ?? 30;
    stateData.popularityByDemographic[partyId] = {
      women: defaultPop,
      youth: defaultPop,
      farmers: defaultPop,
      urban: defaultPop,
      rural: defaultPop,
      business: defaultPop,
      students: defaultPop,
      govt_employees: defaultPop,
      elderly: defaultPop,
      lower_income: defaultPop,
      obc: defaultPop,
      sc_st: defaultPop,
      minority: defaultPop,
      urban_middle: defaultPop,
    };
  }

  const pDemo = stateData.popularityByDemographic[partyId];

  // Define target demographics based on action type
  let targets: Record<string, number> = {};

  if (actionType === 'social_media' || actionType === 'it_cell') {
    targets = { youth: 1.6, students: 1.5, urban: 1.4, urban_middle: 1.3 };
  } else if (actionType === 'whatsapp_campaign') {
    targets = { youth: 1.4, urban: 1.2, urban_middle: 1.2, women: 1.1 };
  } else if (actionType === 'door_to_door') {
    targets = { farmers: 1.5, rural: 1.4, lower_income: 1.3, elderly: 1.2 };
  } else if (actionType === 'booth_workers' || actionType === 'volunteer_recruitment') {
    targets = { youth: 1.3, rural: 1.2, farmers: 1.1 };
  } else if (actionType === 'mega_rally' || actionType === 'roadshow' || actionType === 'star_campaigner') {
    targets = { women: 1.2, youth: 1.2, rural: 1.1, urban: 1.1 };
  } else if (actionType === 'newspaper_ads' || actionType === 'tv_ads') {
    targets = { business: 1.3, govt_employees: 1.3, urban_middle: 1.2, elderly: 1.1 };
  } else if (actionType === 'radio_campaign') {
    targets = { farmers: 1.4, rural: 1.3, lower_income: 1.2 };
  } else {
    targets = { obc: 1.1, sc_st: 1.1, women: 1.1 };
  }

  // Apply popularity gains to demographics
  for (const [demoKey, weight] of Object.entries(targets)) {
    const dKey = demoKey as DemographicGroup;
    if (pDemo[dKey] !== undefined) {
      pDemo[dKey] = Math.min(100, pDemo[dKey] + gain * weight);
    }
  }

  // Recalculate average popularity in state based on demographic distribution
  if (stateData.demographics) {
    let totalScore = 0;
    let totalWeight = 0;
    for (const [demoKey, pop] of Object.entries(pDemo)) {
      const dKey = demoKey as DemographicGroup;
      const weight = stateData.demographics[dKey] ?? 10;
      totalScore += pop * weight;
      totalWeight += weight;
    }
    if (totalWeight > 0) {
      if (!stateData.popularityByParty) stateData.popularityByParty = {};
      stateData.popularityByParty[partyId] = parseFloat((totalScore / totalWeight).toFixed(2));
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const POLLSTERS = [
  'CVoter', 'India TV-CNX', 'ABP-CSDS', 'Times Now-ETG',
  'Republic-MATRIZE', 'Jan Ki Baat', 'IANS-IPA', 'NewsX-CNX',
  'Today\'s Chanakya', 'Lokniti-CSDS',
];

function getRandomPollsterName(): string {
  return POLLSTERS[Math.floor(Math.random() * POLLSTERS.length)];
}
