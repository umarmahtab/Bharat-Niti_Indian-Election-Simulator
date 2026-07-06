/**
 * BHARAT NITI — Campaign War Room recommendation engine
 * Strategic analytics to recommend targeting priorities for both player and AI.
 */

import type { GameState, StateData, CampaignActionType } from './types';

export interface WarRoomRecommendation {
  stateId: string;
  stateName: string;
  seats: number;
  priorityScore: number;       // 0 to 100
  stars: number;               // 1 to 5
  explanation: string;         // why
  recommendedAction: string;   // action recommendation
  recommendedActionType: CampaignActionType;
  estimatedSeatsStake: number; // estimated seats to gain or lose
  status: 'critical' | 'high' | 'medium' | 'low' | 'negligible';
}

/**
 * Tactical priority engine for War Room recommendations.
 * Runs on both player and AI turns.
 */
export function getCampaignPriorities(state: GameState, partyId: string): WarRoomRecommendation[] {
  const recommendations: WarRoomRecommendation[] = [];
  const playerParty = state.parties[partyId];
  if (!playerParty) return [];

  // Determine state seats multiplier based on mode
  const isLS = state.mode === 'lok_sabha';
  const states = Object.values(state.states);

  // Find max seats for normalisation
  const maxSeats = states.reduce((max, s) => Math.max(max, isLS ? s.lokSabhaSeats : s.assemblySeats), 1);

  for (const s of states) {
    const seats = isLS ? s.lokSabhaSeats : s.assemblySeats;
    if (seats === 0) continue;

    // Get popularity of this party and closest rival
    const ourPop = s.popularityByParty?.[partyId] ?? 25;
    const rivalPops = Object.entries(s.popularityByParty ?? {})
      .filter(([pid]) => pid !== partyId)
      .map(([, pop]) => pop);
    const topRivalPop = rivalPops.length > 0 ? Math.max(...rivalPops) : 25;
    const margin = ourPop - topRivalPop;
    const absMargin = Math.abs(margin);

    // Closeness score: 100 if margin is 0, decaying to 10 if margin >= 30%
    const closenessScore = 100 - clamp(absMargin * 3, 0, 90);

    // Bounding weights
    const seatWeight = (seats / maxSeats) * 40; // up to 40 points
    const closenessWeight = closenessScore * 0.50; // up to 50 points

    // Momentum bonus: +5 if positive momentum, -5 if negative momentum
    const momentum = s.momentum?.[partyId] ?? 0;
    const momentumWeight = clamp(momentum * 0.5, -10, 10);

    let priorityScore = Math.round(seatWeight + closenessWeight + momentumWeight);

    // Home state or strong state bonus
    if (playerParty.homeState === s.id) priorityScore += 5;
    if (playerParty.strongStates.includes(s.id)) priorityScore += 5;

    // Clamp between 1 and 100
    priorityScore = clamp(priorityScore, 1, 100);

    // Stars determination
    let stars = 1;
    let status: WarRoomRecommendation['status'] = 'negligible';
    if (priorityScore >= 80) {
      stars = 5;
      status = 'critical';
    } else if (priorityScore >= 60) {
      stars = 4;
      status = 'high';
    } else if (priorityScore >= 40) {
      stars = 3;
      status = 'medium';
    } else if (priorityScore >= 20) {
      stars = 2;
      status = 'low';
    }

    // Explanation & WHY
    let explanation = '';
    let recommendedAction = '';
    let recommendedActionType: CampaignActionType = 'public_meeting';

    // Projected seats at stake
    const estimatedSeatsStake = Math.max(1, Math.round(seats * (closenessScore / 250)));

    if (absMargin < 5) {
      explanation = `${s.name} is a key battleground with ${seats} seats. The race is neck-and-neck (margin: ${margin >= 0 ? '+' : ''}${margin.toFixed(1)}%). Winning here is critical.`;
    } else if (margin < 0 && absMargin < 15) {
      explanation = `Player is trailing slightly in ${s.name} (-${absMargin.toFixed(1)}%). With a concentrated campaign push, we can swing these ${seats} seats.`;
    } else if (margin > 0 && margin < 15) {
      explanation = `Player holds a slim lead in ${s.name} (+${margin.toFixed(1)}%). Opposition is launching strong counter-offensives to snatch these seats.`;
    } else if (margin >= 15) {
      explanation = `${s.name} is a safe stronghold (+${margin.toFixed(1)}% lead). Minimal maintenance is required, though a digital presence helps prevent decay.`;
    } else {
      explanation = `${s.name} is an uphill battle (-${absMargin.toFixed(1)}% deficit). Spending capital here has low returns; focus on closer swing states instead.`;
    }

    // Dynamic action recommendations based on state benchmarks and issues
    const stateBenchmarks = state.benchmarks?.[s.id];
    const playerRallyPoints = stateBenchmarks?.rally.progress[partyId] ?? 0;
    const playerBoothPoints = stateBenchmarks?.booth.progress[partyId] ?? 0;
    const playerDigitalPoints = stateBenchmarks?.digital.progress[partyId] ?? 0;

    // Check what is weakest
    const weakest = Object.entries({
      rally: playerRallyPoints,
      booth: playerBoothPoints,
      digital: playerDigitalPoints,
    }).sort((a, b) => a[1] - b[1])[0][0];

    if (weakest === 'booth') {
      recommendedAction = "Strengthen Ground Networks: Recruit booth workers and run door-to-door drives to ensure high voter turnout.";
      recommendedActionType = 'booth_workers';
    } else if (weakest === 'digital') {
      recommendedAction = "Boost Digital Cell: Set up IT cell operations and deploy targeted social media campaigns to reach urban voters.";
      recommendedActionType = 'social_media';
    } else {
      if (stars >= 4) {
        recommendedAction = "Deploy Star Campaigner: Organise a high-profile mega rally to consolidate public support and generate positive momentum.";
        recommendedActionType = 'star_campaigner';
      } else {
        recommendedAction = "Conduct Public Meetings: Hold targeted town hall meetings in key constituencies to address local issues directly.";
        recommendedActionType = 'public_meeting';
      }
    }

    recommendations.push({
      stateId: s.id,
      stateName: s.name,
      seats,
      priorityScore,
      stars,
      explanation,
      recommendedAction,
      recommendedActionType,
      estimatedSeatsStake,
      status,
    });
  }

  // Sort by priorityScore descending
  return recommendations.sort((a, b) => b.priorityScore - a.priorityScore);
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
