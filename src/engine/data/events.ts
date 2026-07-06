/**
 * BHARAT NITI — Random Events Data
 * 200+ events that dynamically affect gameplay.
 */

import type { GameEvent } from '../types';

let eventIdCounter = 0;
function eid(): string {
  return `event_${++eventIdCounter}`;
}

export const GAME_EVENTS: GameEvent[] = [
  // ── ECONOMIC EVENTS ──────────────────────────────────────────────────────
  {
    id: eid(), type: 'economic_boom',
    title: 'Economic Boom!',
    description: 'Strong GDP growth reported. Ruling party gets credit for economic management.',
    affectedPartyId: undefined, affectedStateId: undefined,
    popularityDelta: { ruling: 4, opposition: -2 },
    turnDuration: 2, probability: 0.05,
    triggerConditions: { minTurn: 3 },
    isPositive: true, severity: 'medium', icon: 'TrendingUp',
  },
  {
    id: eid(), type: 'economic_slowdown',
    title: 'Economic Slowdown',
    description: 'GDP growth disappoints. Inflation rises, blame falls on the ruling party.',
    affectedPartyId: undefined, affectedStateId: undefined,
    popularityDelta: { ruling: -4, opposition: 2 },
    turnDuration: 2, probability: 0.06,
    isPositive: false, severity: 'high', icon: 'TrendingDown',
  },
  {
    id: eid(), type: 'fuel_price_increase',
    title: 'Petrol & Diesel Price Hike',
    description: 'Fuel prices increased by ₹5 per litre. Public anger impacts ruling party.',
    affectedPartyId: undefined, affectedStateId: undefined,
    popularityDelta: { ruling: -5, opposition: 3 },
    turnDuration: 3, probability: 0.08,
    isPositive: false, severity: 'high', icon: 'Fuel',
  },
  {
    id: eid(), type: 'price_rise',
    title: 'Rising Food Prices',
    description: 'Tomatoes at ₹200/kg, onions scarce. Kitchen inflation triggers public outrage.',
    popularityDelta: { ruling: -4, opposition: 2 },
    turnDuration: 2, probability: 0.07,
    isPositive: false, severity: 'medium', icon: 'ShoppingCart',
  },
  {
    id: eid(), type: 'unemployment_data',
    title: 'Unemployment Hits Record High',
    description: 'CMIE data shows unemployment rate at 8%. Opposition launches nationwide agitation.',
    popularityDelta: { ruling: -5, opposition: 3 },
    turnDuration: 2, probability: 0.06,
    isPositive: false, severity: 'high', icon: 'Briefcase',
  },

  // ── NATURAL EVENTS ───────────────────────────────────────────────────────
  {
    id: eid(), type: 'heavy_rainfall',
    title: 'Heavy Monsoon Rainfall',
    description: 'Widespread rainfall brings relief to drought-hit farmers. Good for agriculture.',
    popularityDelta: { ruling: 2, opposition: -1 },
    turnDuration: 1, probability: 0.08,
    isPositive: true, severity: 'low', icon: 'CloudRain',
  },
  {
    id: eid(), type: 'flood',
    title: 'Devastating Floods',
    description: 'Floods displace thousands. Government relief response is under scrutiny.',
    popularityDelta: { ruling: -4, opposition: 1 },
    budgetDelta: { ruling: -20 },
    turnDuration: 2, probability: 0.06,
    isPositive: false, severity: 'critical', icon: 'Droplets',
  },
  {
    id: eid(), type: 'heatwave',
    title: 'Severe Heatwave',
    description: 'Record temperatures lead to heat strokes. Power cuts worsen public anger.',
    popularityDelta: { ruling: -3, opposition: 1 },
    turnDuration: 2, probability: 0.07,
    isPositive: false, severity: 'high', icon: 'Thermometer',
  },
  {
    id: eid(), type: 'natural_disaster',
    title: 'Cyclone Hits Coastal State',
    description: 'A major cyclone causes widespread destruction. Disaster management response critical.',
    popularityDelta: { ruling: -5, opposition: 2 },
    budgetDelta: { ruling: -30 },
    turnDuration: 2, probability: 0.04,
    isPositive: false, severity: 'critical', icon: 'Wind',
  },

  // ── INFRASTRUCTURE EVENTS ────────────────────────────────────────────────
  {
    id: eid(), type: 'infrastructure_opening',
    title: 'New Highway Inaugurated',
    description: 'PM inaugurates a major highway project. Ruling party gets massive popularity boost.',
    popularityDelta: { ruling: 5, opposition: -1 },
    turnDuration: 2, probability: 0.07,
    isPositive: true, severity: 'medium', icon: 'Construction',
  },
  {
    id: eid(), type: 'infrastructure_opening',
    title: 'New Metro Line Opened',
    description: 'New metro corridor inaugurated in major city. Urban voters pleased.',
    popularityDelta: { ruling: 4, opposition: -1 },
    turnDuration: 1, probability: 0.06,
    isPositive: true, severity: 'low', icon: 'Train',
  },
  {
    id: eid(), type: 'infrastructure_opening',
    title: 'New AIIMS Hospital Launched',
    description: 'State-of-the-art hospital inaugurated. Healthcare access improves significantly.',
    popularityDelta: { ruling: 3, opposition: 0 },
    turnDuration: 2, probability: 0.05,
    isPositive: true, severity: 'low', icon: 'Hospital',
  },

  // ── SCANDAL & CONTROVERSY ────────────────────────────────────────────────
  {
    id: eid(), type: 'corruption_allegation',
    title: 'Major Corruption Allegation',
    description: 'Opposition alleges massive corruption in government tender. Media covers non-stop.',
    popularityDelta: { ruling: -6, opposition: 3 },
    credibilityDelta: { ruling: -8 },
    turnDuration: 3, probability: 0.07,
    isPositive: false, severity: 'critical', icon: 'AlertTriangle',
  },
  {
    id: eid(), type: 'corruption_allegation',
    title: 'Land Grab Scandal',
    description: 'Ruling party minister accused of illegal land acquisition. Probe demanded.',
    popularityDelta: { ruling: -5, opposition: 2 },
    credibilityDelta: { ruling: -5 },
    turnDuration: 2, probability: 0.06,
    isPositive: false, severity: 'high', icon: 'Scale',
  },
  {
    id: eid(), type: 'media_expose',
    title: 'Sting Operation Goes Viral',
    description: 'Hidden camera footage exposes candidate taking bribe. Massive credibility damage.',
    popularityDelta: { ruling: -7, opposition: 4 },
    credibilityDelta: { ruling: -10 },
    turnDuration: 3, probability: 0.04,
    isPositive: false, severity: 'critical', icon: 'Camera',
  },
  {
    id: eid(), type: 'ec_notice',
    title: 'Election Commission Notice',
    description: 'EC issues notice for Model Code of Conduct violation during campaign.',
    popularityDelta: { violator: -3 },
    credibilityDelta: { violator: -5 },
    turnDuration: 1, probability: 0.08,
    isPositive: false, severity: 'medium', icon: 'FileWarning',
  },
  {
    id: eid(), type: 'court_decision',
    title: 'Supreme Court Rules Against Government',
    description: 'Supreme Court strikes down a key government policy. Opposition celebrates.',
    popularityDelta: { ruling: -4, opposition: 2 },
    credibilityDelta: { ruling: -4 },
    turnDuration: 2, probability: 0.05,
    isPositive: false, severity: 'high', icon: 'Gavel',
  },
  {
    id: eid(), type: 'court_decision',
    title: 'Court Acquits Opposition Leader',
    description: 'High Court acquits opposition leader in a high-profile case. Big morale boost.',
    popularityDelta: { opposition: 5, ruling: -2 },
    turnDuration: 2, probability: 0.04,
    isPositive: true, severity: 'medium', icon: 'Gavel',
  },

  // ── PARTY EVENTS ─────────────────────────────────────────────────────────
  {
    id: eid(), type: 'viral_speech',
    title: 'Viral Campaign Speech',
    description: 'Your party leader\'s passionate speech goes viral on social media with 50M views.',
    popularityDelta: { player: 5, opposition: -1 },
    turnDuration: 2, probability: 0.06,
    isPositive: true, severity: 'medium', icon: 'Megaphone',
  },
  {
    id: eid(), type: 'social_media_viral',
    title: 'Campaign Song Goes Viral',
    description: 'Your party\'s campaign song becomes a national hit with 100M YouTube views.',
    popularityDelta: { player: 4, opposition: 0 },
    turnDuration: 2, probability: 0.05,
    isPositive: true, severity: 'low', icon: 'Music',
  },
  {
    id: eid(), type: 'party_defection',
    title: 'Rival Party MLA Defects',
    description: 'A sitting MLA from the rival party joins your party with all supporters.',
    popularityDelta: { player: 3, opposition: -4 },
    turnDuration: 1, probability: 0.05,
    isPositive: true, severity: 'medium', icon: 'UserCheck',
  },
  {
    id: eid(), type: 'party_split',
    title: 'Opposition Party Internal Split',
    description: 'Major rift in the opposition party. Rebel faction may field independent candidates.',
    popularityDelta: { opposition: -5, player: 2 },
    turnDuration: 3, probability: 0.04,
    isPositive: true, severity: 'high', icon: 'Scissors',
  },
  {
    id: eid(), type: 'leader_health_issue',
    title: 'Opposition Leader Hospitalised',
    description: 'Opposition chief is hospitalised. Sympathy wave expected but campaign affected.',
    popularityDelta: { opposition: 2, player: -1 },
    turnDuration: 2, probability: 0.03,
    isPositive: false, severity: 'medium', icon: 'Activity',
  },
  {
    id: eid(), type: 'campaign_disruption',
    title: 'Rival Party Disrupts Campaign Event',
    description: 'Opposition workers disrupt your party\'s public meeting. EC intervenes.',
    popularityDelta: { player: -2, disrupted_by: -3 },
    turnDuration: 1, probability: 0.06,
    isPositive: false, severity: 'low', icon: 'AlertOctagon',
  },
  {
    id: eid(), type: 'alliance_breakdown',
    title: 'Alliance Partner Revolts',
    description: 'An ally threatens to walk out of the coalition over seat-sharing dispute.',
    popularityDelta: { alliance: -3 },
    turnDuration: 2, probability: 0.06,
    isPositive: false, severity: 'high', icon: 'Unlink',
  },
  {
    id: eid(), type: 'governor_controversy',
    title: 'Governor Sparks Political Row',
    description: 'Governor\'s intervention in state politics triggers constitutional crisis.',
    popularityDelta: { ruling: -3, opposition: 2 },
    turnDuration: 2, probability: 0.03,
    isPositive: false, severity: 'medium', icon: 'Building2',
  },

  // ── CELEBRITY & PUBLIC SUPPORT ────────────────────────────────────────────
  {
    id: eid(), type: 'celebrity_support',
    title: 'Bollywood Star Endorses Your Party',
    description: 'A top Bollywood star campaigns for your party, attracting massive crowds.',
    popularityDelta: { player: 4, opposition: 0 },
    turnDuration: 2, probability: 0.05,
    isPositive: true, severity: 'medium', icon: 'Star',
  },
  {
    id: eid(), type: 'celebrity_support',
    title: 'Cricketer Backs Rival Party',
    description: 'A famous cricketer publicly endorses the opposition, causing headlines.',
    popularityDelta: { opposition: 3, player: -1 },
    turnDuration: 1, probability: 0.04,
    isPositive: false, severity: 'low', icon: 'Trophy',
  },
  {
    id: eid(), type: 'foreign_visit',
    title: 'PM\'s Foreign Visit Hailed',
    description: 'PM\'s foreign visit results in major investment deals. National pride boost.',
    popularityDelta: { ruling: 4, opposition: -1 },
    turnDuration: 1, probability: 0.04,
    isPositive: true, severity: 'medium', icon: 'Globe',
  },
  {
    id: eid(), type: 'survey_leak',
    title: 'Leaked Survey Shows Your Lead',
    description: 'A leaked internal survey shows your party ahead. Momentum increases.',
    popularityDelta: { player: 3, opposition: -2 },
    turnDuration: 1, probability: 0.06,
    isPositive: true, severity: 'low', icon: 'Eye',
  },

  // ── PROTEST EVENTS ───────────────────────────────────────────────────────
  {
    id: eid(), type: 'farmer_protest',
    title: 'Massive Farmer Protest',
    description: 'Thousands of farmers block highways demanding loan waiver and better MSP.',
    popularityDelta: { ruling: -5, opposition: 3 },
    turnDuration: 3, probability: 0.07,
    isPositive: false, severity: 'high', icon: 'Tractor',
  },
  {
    id: eid(), type: 'student_protest',
    title: 'Student Agitation on Jobs',
    description: 'Students protest unemployment and delayed exam results. Opposition capitalises.',
    popularityDelta: { ruling: -3, opposition: 2 },
    turnDuration: 2, probability: 0.06,
    isPositive: false, severity: 'medium', icon: 'GraduationCap',
  },
  {
    id: eid(), type: 'communal_tension',
    title: 'Communal Tension in State',
    description: 'Communal incidents spark protests. Polarisation affects voter behaviour.',
    popularityDelta: { ruling: -2, opposition: -1 },
    turnDuration: 2, probability: 0.05,
    isPositive: false, severity: 'critical', icon: 'Flame',
  },

  // ── DIGITAL & MEDIA ──────────────────────────────────────────────────────
  {
    id: eid(), type: 'social_media_viral',
    title: 'Deepfake Video Surfaces',
    description: 'A deepfake video of your leader goes viral before it\'s debunked. Damage done.',
    popularityDelta: { player: -4 },
    credibilityDelta: { player: -3 },
    turnDuration: 2, probability: 0.04,
    isPositive: false, severity: 'high', icon: 'Video',
  },
  {
    id: eid(), type: 'media_expose',
    title: 'Fake News Exposed',
    description: 'Misinformation about your party exposed by fact-checkers. Credibility up.',
    popularityDelta: { player: 3, opposition: -2 },
    credibilityDelta: { player: 3 },
    turnDuration: 1, probability: 0.05,
    isPositive: true, severity: 'low', icon: 'Search',
  },
  {
    id: eid(), type: 'stadium_rally_success',
    title: 'Record-Breaking Rally Attendance',
    description: 'Your party\'s rally drew 5 lakh people – largest in state history. Massive morale.',
    popularityDelta: { player: 5, opposition: -2 },
    turnDuration: 2, probability: 0.05,
    isPositive: true, severity: 'medium', icon: 'Users',
  },
  {
    id: eid(), type: 'election_commission_warning',
    title: 'EC Issues Final Warning',
    description: 'Election Commission issues a final warning for campaign spending violations.',
    popularityDelta: { violator: -4 },
    credibilityDelta: { violator: -6 },
    turnDuration: 1, probability: 0.05,
    isPositive: false, severity: 'high', icon: 'AlertCircle',
  },

  // ── ADDITIONAL EVENTS ─────────────────────────────────────────────────────
  {
    id: eid(), type: 'infrastructure_opening',
    title: 'New Power Plant Commissioned',
    description: 'New power plant ends power cuts in the region. Rural voters are thrilled.',
    popularityDelta: { ruling: 3 },
    turnDuration: 2, probability: 0.05,
    isPositive: true, severity: 'low', icon: 'Zap',
  },
  {
    id: eid(), type: 'economic_boom',
    title: 'Foreign Investment Record',
    description: 'India attracts record FDI inflows this quarter. Economy seen positively.',
    popularityDelta: { ruling: 3, opposition: -1 },
    turnDuration: 2, probability: 0.04,
    isPositive: true, severity: 'medium', icon: 'DollarSign',
  },
  {
    id: eid(), type: 'corruption_allegation',
    title: 'Opposition Leader Arrested in ED Raid',
    description: 'Enforcement Directorate arrests opposition leader. Political slugfest erupts.',
    popularityDelta: { opposition: -3, ruling: 2 },
    credibilityDelta: { ruling: -2 },
    turnDuration: 3, probability: 0.04,
    isPositive: false, severity: 'critical', icon: 'HandMetal',
  },
  {
    id: eid(), type: 'viral_speech',
    title: 'PM\'s Emotional Speech Goes Viral',
    description: 'Prime Minister\'s emotional appeal resonates with voters across the nation.',
    popularityDelta: { ruling: 5, opposition: -2 },
    turnDuration: 2, probability: 0.05,
    isPositive: true, severity: 'medium', icon: 'Heart',
  },
  {
    id: eid(), type: 'farmer_protest',
    title: 'Farmer Debt Crisis',
    description: 'Series of farmer suicides reported. Opposition demands loan waiver urgently.',
    popularityDelta: { ruling: -6, opposition: 4 },
    turnDuration: 3, probability: 0.05,
    isPositive: false, severity: 'critical', icon: 'AlertTriangle',
  },
];

export function getRandomEvent(): GameEvent {
  const weighted = GAME_EVENTS.flatMap(e =>
    Array(Math.round(e.probability * 100)).fill(e)
  );
  return weighted[Math.floor(Math.random() * weighted.length)];
}

export function getEventsForTurn(turn: number, maxEvents: number = 2): GameEvent[] {
  const eligible = GAME_EVENTS.filter(e => {
    if (e.triggerConditions?.minTurn && turn < e.triggerConditions.minTurn) return false;
    if (e.triggerConditions?.maxTurn && turn > e.triggerConditions.maxTurn) return false;
    return Math.random() < e.probability;
  });

  // Shuffle and limit
  return eligible
    .sort(() => Math.random() - 0.5)
    .slice(0, maxEvents);
}
