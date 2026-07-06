/**
 * BHARAT NITI — AI Engine (v3)
 * Intelligent AI decision-making at state and constituency levels.
 */

import type { GameState, TurnAction, CampaignActionType, AIPersonality } from './types';
import { CAMPAIGN_ACTIONS } from './data/campaignActions';
import { getCampaignPriorities } from './campaignWarRoom';

type AIIntent = 'defend' | 'swing' | 'expand' | 'counter';

/** Clamp a number to [min, max] */
function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/** Score a state for AI targeting based on personality and situation */
function scoreStateForParty(
  partyId: string,
  stateId: string,
  state: GameState,
  personality: AIPersonality,
): number {
  const stateData = state.states[stateId];
  const party = state.parties[partyId];
  if (!stateData || !party) return 0;

  const partyPop = stateData.popularityByParty?.[partyId] ?? (party.currentPopularity ?? 30);
  const incumbentPop = stateData.popularityByParty?.[stateData.rulingPartyId] ?? 50;
  const seats = stateData.lokSabhaSeats;
  const isStrong = party.strongStates.includes(stateId);
  const isWeak = party.weakStates.includes(stateId);

  let score = 0;

  // More seats = more valuable
  score += seats * 2;

  switch (personality) {
    case 'aggressive_campaigner':
      // Attack everywhere, focus on opposition strongholds
      score += (100 - partyPop) * 0.3;
      if (incumbentPop > 50) score += 20;
      break;

    case 'welfare_focus':
      // Focus on states where welfare issues dominate
      if (stateData.primaryIssues.includes('employment') ||
          stateData.primaryIssues.includes('healthcare')) {
        score += 25;
      }
      score += partyPop * 0.2;
      break;

    case 'digital_focus':
      // Focus on urban, high-urbanisation states
      score += stateData.urbanization * 0.3;
      break;

    case 'alliance_builder':
      // Focus on swing states, look for coalition-building
      score += Math.abs(partyPop - 50) < 15 ? 30 : 0;
      score += seats;
      break;

    case 'regional_specialist':
      // Heavily focus on home state and adjacent states
      if (party.homeState === stateId) score += 60;
      if (isStrong) score += 40;
      if (isWeak) score -= 20;
      break;

    case 'development_focus':
      // Focus on GDP-lagging states with infrastructure issues
      if (stateData.primaryIssues.includes('roads') ||
          stateData.primaryIssues.includes('electricity')) {
        score += 20;
      }
      score += (100 - stateData.gdpPerCapita) * 0.2;
      break;

    case 'grassroots_focus':
      // Focus on rural, low-urbanisation states
      score += (100 - stateData.urbanization) * 0.3;
      if (stateData.primaryIssues.includes('agriculture')) score += 20;
      break;

    case 'defensive_campaigner':
      // Protect strongholds, don't overextend
      if (isStrong || stateData.rulingPartyId === partyId) score += 50;
      if (isWeak) score -= 30;
      score += partyPop * 0.4;
      break;

    case 'youth_focused':
      // Target highly urbanized or high literacy states where youth population is active
      score += stateData.literacy * 0.2;
      score += stateData.urbanization * 0.2;
      break;
  }

  return score;
}

/** Choose best campaign action for AI based on personality */
function chooseCampaignAction(
  partyId: string,
  stateId: string,
  state: GameState,
  personality: AIPersonality,
  budget: number,
  recentActions: CampaignActionType[],
  intent: AIIntent,
): CampaignActionType | null {
  const affordable = Object.values(CAMPAIGN_ACTIONS).filter(a => a.cost <= budget);
  if (affordable.length === 0) return null;

  // Check cooldowns
  const cooldowns = state.aiCooldowns[partyId] ?? {};

  const available = affordable.filter(a => {
    const cooldown = cooldowns[a.type] ?? 0;
    return cooldown <= 0;
  });

  if (available.length === 0) return null;

  // Personality-based action selection
  const scored = available.map(action => {
    let score = action.popularityGain;

    if (recentActions.includes(action.type)) score -= 12;

    if (intent === 'defend') {
      if (action.type === 'booth_workers' || action.type === 'door_to_door' || action.type === 'data_analytics') score += 10;
      if (action.type === 'candidate_promotion') score += 8;
    } else if (intent === 'swing') {
      if (action.type === 'public_meeting' || action.type === 'door_to_door') score += 10;
      if (action.type === 'volunteer_recruitment') score += 7;
    } else if (intent === 'expand') {
      if (action.type === 'mega_rally' || action.type === 'roadshow' || action.type === 'star_campaigner') score += 9;
      if (action.type === 'social_media') score += 7;
    } else if (intent === 'counter') {
      if (action.type === 'booth_workers' || action.type === 'it_cell' || action.type === 'tv_ads') score += 10;
      if (action.type === 'opinion_survey') score += 7;
    }

    switch (personality) {
      case 'aggressive_campaigner':
        if (action.type === 'mega_rally' || action.type === 'star_campaigner') score += 10;
        if (action.type === 'tv_ads') score += 5;
        break;
      case 'welfare_focus':
        if (action.type === 'door_to_door' || action.type === 'public_meeting') score += 10;
        if (action.type === 'manifesto_launch') score += 8;
        break;
      case 'digital_focus':
        if (action.type === 'social_media' || action.type === 'it_cell') score += 15;
        if (action.type === 'whatsapp_campaign') score += 8;
        break;
      case 'grassroots_focus':
        if (action.type === 'door_to_door' || action.type === 'booth_workers') score += 10;
        if (action.type === 'volunteer_recruitment') score += 8;
        break;
      case 'development_focus':
        if (action.type === 'press_conference' || action.type === 'newspaper_ads') score += 8;
        if (action.type === 'manifesto_launch') score += 10;
        break;
      case 'regional_specialist':
        if (action.type === 'roadshow') score += 10;
        if (action.type === 'candidate_promotion') score += 8;
        break;
      case 'defensive_campaigner':
        if (action.type === 'booth_workers') score += 10;
        if (action.type === 'data_analytics') score += 8;
        break;
      case 'alliance_builder':
        if (action.type === 'press_conference') score += 5;
        if (action.type === 'manifesto_launch') score += 5;
        break;
      case 'youth_focused':
        if (action.type === 'social_media' || action.type === 'whatsapp_campaign') score += 12;
        if (action.type === 'it_cell') score += 10;
        break;
    }

    return { action, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const shortlist = scored.slice(0, 3);
  if (shortlist.length === 0) return null;

  const weightTotal = shortlist.reduce((acc, s) => acc + Math.max(1, s.score), 0);
  let roll = Math.random() * weightTotal;
  for (const item of shortlist) {
    roll -= Math.max(1, item.score);
    if (roll <= 0) return item.action.type;
  }

  return shortlist[0].action.type;
}

function hasPlayerPressureInState(state: GameState, stateId: string): boolean {
  const constituencyPressure = Object.values(state.constituencies)
    .filter(c => c.stateId === stateId)
    .some(c => (c.campaignSpendByParty?.[state.playerPartyId] ?? 0) > 8);

  const stateSpend = state.states[stateId]?.campaignSpentByParty?.[state.playerPartyId] ?? 0;
  return constituencyPressure || stateSpend > 35;
}

function buildStateBuckets(
  partyId: string,
  state: GameState,
  personality: AIPersonality,
): Record<AIIntent, string[]> {
  const states = Object.values(state.states);
  const defend: Array<{ stateId: string; score: number }> = [];
  const swing: Array<{ stateId: string; score: number }> = [];
  const expand: Array<{ stateId: string; score: number }> = [];
  const counter: Array<{ stateId: string; score: number }> = [];

  for (const s of states) {
    const ourPop = s.popularityByParty?.[partyId] ?? 25;
    const playerPop = s.popularityByParty?.[state.playerPartyId] ?? 25;
    const seats = s.lokSabhaSeats;
    const baseScore = scoreStateForParty(partyId, s.id, state, personality);

    if (ourPop >= 52 || s.rulingPartyId === partyId) {
      defend.push({ stateId: s.id, score: baseScore + ourPop + seats });
    }
    if (Math.abs(ourPop - playerPop) <= 10 && ourPop >= 22) {
      swing.push({ stateId: s.id, score: baseScore + seats * 3 });
    }
    if (ourPop >= 15 && ourPop <= 45) {
      expand.push({ stateId: s.id, score: baseScore + (50 - ourPop) + seats * 2 });
    }
    if (hasPlayerPressureInState(state, s.id)) {
      counter.push({ stateId: s.id, score: baseScore + seats * 2 + 25 });
    }
  }

  const sortDesc = (arr: Array<{ stateId: string; score: number }>) => arr.sort((a, b) => b.score - a.score).map(x => x.stateId);
  return {
    defend: sortDesc(defend),
    swing: sortDesc(swing),
    expand: sortDesc(expand),
    counter: sortDesc(counter),
  };
}

/** Score and select a specific constituency for the AI to target inside a state */
function chooseConstituencyForAI(
  partyId: string,
  stateId: string,
  state: GameState,
  personality: AIPersonality
): string | null {
  const stateConsts = Object.values(state.constituencies).filter(c => c.stateId === stateId);
  if (stateConsts.length === 0) return null;

  // Score each constituency
  const scored = stateConsts.map(c => {
    const ourPop = c.popularityByParty?.[partyId] ?? 30;
    const playerPop = c.popularityByParty?.[state.playerPartyId] ?? 30;
    
    let score = 0;

    // Swing / Toss-up: very high priority
    const isSwing = Math.abs(ourPop - playerPop) < 15;
    if (isSwing) score += 35;

    // Unwinnable: skip it
    const isUnwinnable = ourPop < 25;
    if (isUnwinnable) score -= 50;

    // Protect strongholds
    const isStronghold = ourPop > 55;
    if (isStronghold) {
      if (personality === 'defensive_campaigner') {
        score += 25;
      } else {
        score += 8;
      }
    }

    // Reaction to player: counter player campaigning
    const playerSpend = c.campaignSpendByParty?.[state.playerPartyId] ?? 0;
    if (playerSpend > 0) {
      if (personality === 'aggressive_campaigner') {
        score += 25; // fight player
      } else if (personality === 'defensive_campaigner' && isStronghold) {
        score += 20; // defend stronghold from player
      }
    }

    // SC/ST representation
    if (c.isReserved && (personality === 'grassroots_focus' || personality === 'welfare_focus')) {
      score += 15;
    }

    // Urban/Rural matching
    if (c.isUrban && (personality === 'digital_focus' || personality === 'youth_focused')) {
      score += 20;
    }
    if (!c.isUrban && personality === 'grassroots_focus') {
      score += 15;
    }

    return { id: c.id, score };
  });

  scored.sort((a, b) => b.score - a.score);
  // Only target if score is reasonable (keeps AI from wasting budget on completely dead seats)
  return scored[0]?.score > -20 ? scored[0].id : null;
}

/**
 * Execute AI turn for all AI-controlled parties.
 * Returns list of actions taken.
 */
export function runAITurn(state: GameState): TurnAction[] {
  const actions: TurnAction[] = [];
  const now = Date.now();
  const previousTurnActions = state.turnActions[state.currentTurn - 1] ?? [];

  for (const [partyId, party] of Object.entries(state.parties)) {
    // Skip player party
    if (partyId === state.playerPartyId) continue;

    const budget = party.currentBudget ?? party.startingBudget;
    const personality = party.aiPersonality;
    const recentlyTargetedStates = state.aiTargets[partyId] ?? [];
    const recentActions = previousTurnActions
      .filter(a => a.partyId === partyId && a.type === 'campaign' && !!a.campaignAction)
      .map(a => a.campaignAction as CampaignActionType);

    // Save budget for late campaign pushes (last 25% of turns)
    const isLateGame = state.currentTurn / state.totalTurns > 0.75;
    let spendCap = budget;
    if (!isLateGame) {
      const difficulty = state.settings?.aiDifficulty ?? state.difficulty;
      const saveFactor = difficulty === 'easy' ? 0.40 : difficulty === 'normal' ? 0.55 : 0.75;
      spendCap = budget * saveFactor;
    }

    const priorities = getCampaignPriorities(state, partyId);
    const eligibleTargets = priorities.filter(p => p.priorityScore >= 20);

    const targetQueue: Array<{ stateId: string; intent: AIIntent }> = [];
    for (const rec of eligibleTargets) {
      const stateId = rec.stateId;
      const ourPop = state.states[stateId]?.popularityByParty?.[partyId] ?? 25;
      
      let intent: AIIntent = 'expand';
      const playerSpent = state.states[stateId]?.campaignSpentByParty?.[state.playerPartyId] ?? 0;
      
      if (playerSpent > 15) {
        intent = 'counter';
      } else if (ourPop >= 50 || state.states[stateId]?.rulingPartyId === partyId) {
        intent = 'defend';
      } else if (rec.stars >= 4) {
        intent = 'swing';
      }

      // Check repeat penalty
      const repeatPenalty = recentlyTargetedStates.includes(stateId) ? 0.75 : 1.0;
      if (rec.stars < 5 && Math.random() > repeatPenalty) continue;

      targetQueue.push({ stateId, intent });
      if (targetQueue.length >= 4) break;
    }

    let tempBudget = spendCap;
    const targetedStatesThisTurn: string[] = [];

    for (const target of targetQueue) {
      const stateId = target.stateId;
      const actionType = chooseCampaignAction(partyId, stateId, state, personality, tempBudget, recentActions, target.intent);
      if (!actionType) continue;

      const actionDef = CAMPAIGN_ACTIONS[actionType];
      if (!actionDef || actionDef.cost > tempBudget) continue;

      // Determine if this action targets a constituency or the state-wide level
      let targetConstituencyId: string | undefined = undefined;
      
      const isConstituencyAction = 
        actionType === 'public_meeting' ||
        actionType === 'door_to_door' ||
        actionType === 'booth_workers' ||
        actionType === 'candidate_promotion';

      if (isConstituencyAction) {
        const chosenConst = chooseConstituencyForAI(partyId, stateId, state, personality);
        if (chosenConst) {
          targetConstituencyId = chosenConst;
        }
      }

      actions.push({
        partyId,
        type: 'campaign',
        campaignAction: actionType,
        targetStateId: stateId,
        targetConstituencyId,
        cost: actionDef.cost,
        timestamp: now,
      });

      tempBudget -= actionDef.cost;
      recentActions.push(actionType);
      targetedStatesThisTurn.push(stateId);
      
      // Keep party budget state in sync locally
      party.currentBudget = tempBudget;

      if (!state.aiCooldowns[partyId]) state.aiCooldowns[partyId] = {};
      state.aiCooldowns[partyId][actionType] = Math.max(
        state.aiCooldowns[partyId][actionType] ?? 0,
        actionDef.cooldown
      );
    }

    state.aiTargets[partyId] = targetedStatesThisTurn.slice(0, 3);
  }

  return actions;
}

/**
 * Decide if AI party should propose alliance.
 */
export function shouldProposeAlliance(
  partyId: string,
  targetPartyId: string,
  state: GameState,
): boolean {
  const party = state.parties[partyId];
  const target = state.parties[targetPartyId];
  if (!party || !target) return false;

  const personality = party.aiPersonality;
  const playerPop = Object.values(state.parties).find(p => p.id === state.playerPartyId)?.currentPopularity ?? 50;

  // Alliance builders are more likely to form alliances
  if (personality === 'alliance_builder') {
    return playerPop > 40; // Form alliances when player is strong
  }

  // Defensive campaigners form alliances when weak
  if (personality === 'defensive_campaigner') {
    return (party.currentPopularity ?? 30) < 25;
  }

  // Others form alliances when player has more than 45% popularity
  return playerPop > 45 && Math.random() < 0.3;
}

/**
 * Calculate alliance stability change per turn.
 */
export function calculateAllianceStability(allianceId: string, state: GameState): number {
  const alliance = state.alliances[allianceId];
  if (!alliance) return 0;

  let stabilityDelta = 0;

  // Check if members are competitive in same seats
  for (const memberId of alliance.memberPartyIds) {
    for (const otherId of alliance.memberPartyIds) {
      if (memberId === otherId) continue;
      const member = state.parties[memberId];
      const other = state.parties[otherId];

      // Competing ideologies reduce stability
      if (member?.ideology === other?.ideology) {
        stabilityDelta -= 0.5;
      }
    }
  }

  // Budget sharing reduces friction
  if (alliance.sharedBudget > 100) stabilityDelta += 1;

  // Large alliances are less stable
  if (alliance.memberPartyIds.length > 3) stabilityDelta -= 1;

  return stabilityDelta;
}
