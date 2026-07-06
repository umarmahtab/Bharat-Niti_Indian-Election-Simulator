/**
 * BHARAT NITI — Shadow Operations (Black Budget System)
 * Backdoor political operations funded via black money.
 * High reward, high risk – exposure can devastate your campaign.
 */

export type ShadowOperationType =
  | 'news_channel_deal'
  | 'bollywood_endorsement'
  | 'fund_protest'
  | 'ec_complaint'
  | 'buy_opinion_poll'
  | 'mla_poaching'
  | 'corporate_donation'
  | 'anti_campaign'
  | 'defection_drama'
  | 'ground_muscle'
  | 'sting_operation'
  | 'social_media_troll_army'
  | 'electoral_bond_collection';

export type ShadowEffectTarget = 'player' | 'opponent' | 'all_opponents' | 'specific_party';

export interface ShadowEffect {
  target: ShadowEffectTarget;
  popularityDelta?: number;          // ±% national popularity
  statePopularityDelta?: number;    // ±% in target state
  budgetGain?: number;               // Cr added to campaign budget
  blackBudgetGain?: number;          // Cr added to black budget
  opponentTurnBlock?: number;        // turns opponent loses (simulated EC notice)
  credibilityDelta?: number;         // hidden credibility stat
}

export interface ExposureConsequence {
  probability: number;               // 0–1 chance of getting caught
  playerPopularity: number;          // popularity hit if caught
  description: string;               // news headline when caught
  blackBudgetLoss?: number;          // additional black budget loss
}

export interface ShadowOperation {
  id: ShadowOperationType;
  name: string;
  description: string;
  flavourText: string;               // Immersive narrative text
  icon: string;
  cost: number;                      // Black budget cost in Cr
  cooldown: number;                  // turns before reuse
  effects: ShadowEffect;
  exposure: ExposureConsequence;
  targetType: 'state' | 'national' | 'party';
  category: 'media' | 'money' | 'intelligence' | 'ground' | 'defection';
}

export const SHADOW_OPERATIONS: Record<ShadowOperationType, ShadowOperation> = {

  // ── MEDIA OPERATIONS ──────────────────────────────────────────────────────

  news_channel_deal: {
    id: 'news_channel_deal',
    name: 'Pay Prime-Time Anchor',
    description: 'Fund a leading news anchor to run 48-hour favorable coverage cycle with attack on opposition.',
    flavourText: '"Breaking news: Sources confirm opposition leader under CBI scanner…" — A deal that never appears on paper.',
    icon: 'Tv',
    cost: 18,
    cooldown: 3,
    effects: {
      target: 'player',
      popularityDelta: 5,
      statePopularityDelta: 8,
      credibilityDelta: -3,
    },
    exposure: {
      probability: 0.25,
      playerPopularity: -14,
      description: 'Journalist leaks WhatsApp chat showing payment to anchor!',
      blackBudgetLoss: 10,
    },
    targetType: 'state',
    category: 'media',
  },

  bollywood_endorsement: {
    id: 'bollywood_endorsement',
    name: 'Bollywood Star Endorsement',
    description: 'Pay an A-list Bollywood celebrity to campaign for your party. Urban youth goes wild.',
    flavourText: '"I stand with [PARTY]! Jai Hind!" — The star smiles for cameras as the cheque clears.',
    icon: 'Star',
    cost: 22,
    cooldown: 5,
    effects: {
      target: 'player',
      popularityDelta: 8,
      statePopularityDelta: 12,
      credibilityDelta: 1,
    },
    exposure: {
      probability: 0.15,
      playerPopularity: -6,
      description: 'Actor\'s agency accidentally posts payment receipt on social media!',
    },
    targetType: 'national',
    category: 'media',
  },

  social_media_troll_army: {
    id: 'social_media_troll_army',
    name: 'Troll Army Deployment',
    description: 'Deploy 500 fake accounts to flood social media with opposition scandals and party propaganda.',
    flavourText: 'A basement in Noida. 50 laptops. One goal — #OppositionScandal trending by morning.',
    icon: 'Bot',
    cost: 10,
    cooldown: 2,
    effects: {
      target: 'all_opponents',
      popularityDelta: -4,
      statePopularityDelta: -6,
      credibilityDelta: -2,
    },
    exposure: {
      probability: 0.30,
      playerPopularity: -10,
      description: 'Tech journalists expose fake account network linked to your party\'s server!',
      blackBudgetLoss: 5,
    },
    targetType: 'national',
    category: 'media',
  },

  // ── INTELLIGENCE OPERATIONS ───────────────────────────────────────────────

  fund_protest: {
    id: 'fund_protest',
    name: 'Fund Opposition Protest',
    description: 'Secretly fund agitators to hold massive protests against the ruling party or a rival.',
    flavourText: 'Trucks arrive at midnight. By morning, 10,000 "spontaneous" protesters fill the capital.',
    icon: 'Megaphone',
    cost: 14,
    cooldown: 4,
    effects: {
      target: 'opponent',
      popularityDelta: -8,
      statePopularityDelta: -12,
      credibilityDelta: -1,
    },
    exposure: {
      probability: 0.30,
      playerPopularity: -12,
      description: 'Video surfaces showing your party worker handing cash to protest organizer!',
      blackBudgetLoss: 8,
    },
    targetType: 'state',
    category: 'intelligence',
  },

  anti_campaign: {
    id: 'anti_campaign',
    name: 'Anonymous Attack Campaign',
    description: 'Run targeted anonymous smear ads against an opponent in a specific state. No fingerprints.',
    flavourText: 'Hoardings appear overnight. Millions of WhatsApp forwards. No one knows who paid for it.',
    icon: 'Crosshair',
    cost: 9,
    cooldown: 2,
    effects: {
      target: 'opponent',
      statePopularityDelta: -9,
      popularityDelta: -5,
      credibilityDelta: -1,
    },
    exposure: {
      probability: 0.28,
      playerPopularity: -9,
      description: 'Investigative portal traces anonymous ads back to your election cell!',
    },
    targetType: 'state',
    category: 'intelligence',
  },

  sting_operation: {
    id: 'sting_operation',
    name: 'Sting Operation Setup',
    description: 'Commission a sting operation to catch an opposition leader accepting a bribe. Devastating.',
    flavourText: 'A hidden camera. A briefcase of fake notes. One gullible minister. This could end them.',
    icon: 'Camera',
    cost: 25,
    cooldown: 6,
    effects: {
      target: 'opponent',
      popularityDelta: -14,
      statePopularityDelta: -18,
      credibilityDelta: -2,
    },
    exposure: {
      probability: 0.35,
      playerPopularity: -18,
      description: 'EXPOSED: Sting video revealed to be staged! Court issues contempt notice!',
      blackBudgetLoss: 15,
    },
    targetType: 'party',
    category: 'intelligence',
  },

  ec_complaint: {
    id: 'ec_complaint',
    name: 'Strategic EC Complaint',
    description: 'File spurious but technically valid complaints with the Election Commission to distract rival.',
    flavourText: 'Your lawyers draft 47 pages of complaint. The goal? Make them spend a week answering questions.',
    icon: 'FileWarning',
    cost: 5,
    cooldown: 3,
    effects: {
      target: 'opponent',
      popularityDelta: -3,
      credibilityDelta: 1,
    },
    exposure: {
      probability: 0.18,
      playerPopularity: -4,
      description: 'EC dismisses complaint as frivolous, reprimands your party publicly!',
    },
    targetType: 'party',
    category: 'intelligence',
  },

  buy_opinion_poll: {
    id: 'buy_opinion_poll',
    name: 'Commission Biased Poll',
    description: 'Pay a polling agency to publish a favourable survey showing your lead. Boost morale.',
    flavourText: '"New survey: [PARTY] at 48%!" — The pollster\'s fee was settled in Mauritius.',
    icon: 'BarChart2',
    cost: 8,
    cooldown: 3,
    effects: {
      target: 'player',
      popularityDelta: 4,
      statePopularityDelta: 5,
      credibilityDelta: -1,
    },
    exposure: {
      probability: 0.25,
      playerPopularity: -7,
      description: 'Whistleblower inside polling agency reveals bias — Opposition demands ban!',
    },
    targetType: 'national',
    category: 'media',
  },

  // ── DEFECTION & MONEY ─────────────────────────────────────────────────────

  mla_poaching: {
    id: 'mla_poaching',
    name: 'MLA/MP Poaching',
    description: 'Lure sitting MLAs or MPs from opposition to join your party with financial incentives.',
    flavourText: 'A resort in Gurgaon. 25 legislators. Private jets. By dawn, the numbers shift.',
    icon: 'UserMinus',
    cost: 30,
    cooldown: 6,
    effects: {
      target: 'opponent',
      popularityDelta: -6,
      statePopularityDelta: -10,
      credibilityDelta: 3,
    },
    exposure: {
      probability: 0.35,
      playerPopularity: -16,
      description: 'Audio tape of "horse trading" negotiations leaks to opposition — SC takes suo motu!',
      blackBudgetLoss: 20,
    },
    targetType: 'state',
    category: 'defection',
  },

  defection_drama: {
    id: 'defection_drama',
    name: 'High-Profile Defection',
    description: 'Convince a senior opposition minister to dramatically resign and join your party on camera.',
    flavourText: '"Today I leave [PARTY] to serve the people properly." — The press conference is your moment.',
    icon: 'LogIn',
    cost: 20,
    cooldown: 8,
    effects: {
      target: 'player',
      popularityDelta: 10,
      statePopularityDelta: 14,
      credibilityDelta: 4,
    },
    exposure: {
      probability: 0.28,
      playerPopularity: -10,
      description: 'Defector reveals on live TV that he was "purchased" for ₹50 crore!',
      blackBudgetLoss: 10,
    },
    targetType: 'party',
    category: 'defection',
  },

  // ── BLACK MONEY INCOME ────────────────────────────────────────────────────

  corporate_donation: {
    id: 'corporate_donation',
    name: 'Backdoor Corporate Funding',
    description: 'Accept off-the-books corporate donations routed through shell companies. Fills your war chest.',
    flavourText: 'A Cayman Islands LLC. A Delhi charity. ₹200 crore. The CFO smiles knowingly.',
    icon: 'Banknote',
    cost: 0,
    cooldown: 4,
    effects: {
      target: 'player',
      budgetGain: 60,
      blackBudgetGain: 25,
      credibilityDelta: -2,
    },
    exposure: {
      probability: 0.22,
      playerPopularity: -13,
      description: 'Income Tax raids expose shell company linked to your party treasurer!',
      blackBudgetLoss: 40,
    },
    targetType: 'national',
    category: 'money',
  },

  electoral_bond_collection: {
    id: 'electoral_bond_collection',
    name: 'Electoral Bond Drive',
    description: 'Use political leverage to get corporates to buy electoral bonds in your favour. Legal but grey.',
    flavourText: 'The minister calls the SEBI-regulated company. The next day, ₹100 Cr in bonds arrive.',
    icon: 'Receipt',
    cost: 0,
    cooldown: 5,
    effects: {
      target: 'player',
      budgetGain: 80,
      blackBudgetGain: 30,
      credibilityDelta: -1,
    },
    exposure: {
      probability: 0.15,
      playerPopularity: -9,
      description: 'SC orders disclosure of bond donors — your corporate links become front-page news!',
      blackBudgetLoss: 30,
    },
    targetType: 'national',
    category: 'money',
  },

  ground_muscle: {
    id: 'ground_muscle',
    name: 'Booth-Level "Encouragement"',
    description: 'Deploy party strongmen near polling booths to "ensure" turnout among your supporters.',
    flavourText: 'Local neta makes calls. Morning of election day. Booths run smoothly — for your party.',
    icon: 'Users',
    cost: 12,
    cooldown: 3,
    effects: {
      target: 'player',
      statePopularityDelta: 7,
      credibilityDelta: -4,
    },
    exposure: {
      probability: 0.40,
      playerPopularity: -15,
      description: 'Video of booth capturing goes viral — Election Commission orders re-poll!',
      blackBudgetLoss: 10,
    },
    targetType: 'state',
    category: 'ground',
  },
};

export const ALL_SHADOW_OPERATIONS = Object.values(SHADOW_OPERATIONS);

export const BENCHMARK_LEVELS = [
  { level: 1, points: 15, voteShareBonus: 1.5, label: 'Early Presence' },
  { level: 2, points: 35, voteShareBonus: 3.0, label: 'Ground Warming' },
  { level: 3, points: 60, voteShareBonus: 5.0, label: 'Visible Force' },
  { level: 4, points: 100, voteShareBonus: 7.0, label: 'Mass Mobilised' },
  { level: 5, points: 150, voteShareBonus: 9.5, label: 'Dominant Wave' },
  { level: 6, points: 215, voteShareBonus: 12.0, label: 'Unstoppable Surge' },
  { level: 7, points: 295, voteShareBonus: 14.5, label: 'Category Leader' },
  { level: 8, points: 390, voteShareBonus: 17.0, label: 'Election Machine' },
  { level: 9, points: 500, voteShareBonus: 19.5, label: 'Total Control' },
  { level: 10, points: 630, voteShareBonus: 22.0, label: '🔒 LOCKED — Category Dominance' },
];

/** Map campaign action types to their category */
export const ACTION_CATEGORY_MAP: Record<string, 'rally' | 'booth' | 'digital'> = {
  mega_rally: 'rally',
  roadshow: 'rally',
  public_meeting: 'rally',
  star_campaigner: 'rally',
  radio_campaign: 'rally',
  press_conference: 'rally',
  manifesto_launch: 'rally',
  booth_workers: 'booth',
  door_to_door: 'booth',
  volunteer_recruitment: 'booth',
  candidate_promotion: 'booth',
  social_media: 'digital',
  it_cell: 'digital',
  whatsapp_campaign: 'digital',
  newspaper_ads: 'digital',
  tv_ads: 'digital',
  data_analytics: 'digital',
  opinion_survey: 'digital',
};

/** Get turn income for a party based on its size and game mode */
export function calculatePartyTurnIncome(
  startingBudget: number,
  isNational: boolean,
  difficultyMultiplier: number,
  isPlayerParty: boolean,
): number {
  // Base income: heavily nerfed so money is tight
  let base = 0;
  if (startingBudget >= 3000) base = 12; // Large national (BJP, INC)
  else if (startingBudget >= 1500) base = 8;  // Medium national
  else if (startingBudget >= 800) base = 5;  // Regional strong
  else if (startingBudget >= 400) base = 3;  // Regional mid
  else base = 2; // Small party

  if (!isNational) base *= 0.75; // Regional parties earn less

  // Player gets difficulty scaling
  if (isPlayerParty) base = Math.round(base * difficultyMultiplier);

  return Math.max(1, Math.round(base));
}

/** Calculate black budget income per turn (20-30% of turn income, lower) */
export function calculateBlackTurnIncome(turnIncome: number): number {
  return Math.round(turnIncome * 0.25);
}


