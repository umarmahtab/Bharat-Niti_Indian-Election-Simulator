/**
 * BHARAT NITI — Core Game Engine Types
 * All type definitions for the game engine, decoupled from React.
 */

// ─── Enums ─────────────────────────────────────────────────────────────────

export type GameMode = 'lok_sabha' | 'state_assembly';
export type Difficulty = 'easy' | 'normal' | 'hard' | 'legendary';
export type GamePhase = 'setup' | 'campaign' | 'election_day' | 'results' | 'government_formation';
export type Region = 'north' | 'south' | 'east' | 'west' | 'northeast' | 'central' | 'union_territory';
export type AIPersonality =
  | 'aggressive_campaigner'
  | 'welfare_focus'
  | 'digital_focus'
  | 'alliance_builder'
  | 'regional_specialist'
  | 'development_focus'
  | 'grassroots_focus'
  | 'defensive_campaigner'
  | 'youth_focused';

export type Ideology =
  | 'hindu_nationalism'
  | 'congress_secular'
  | 'left_wing'
  | 'regional_pride'
  | 'social_justice'
  | 'populist'
  | 'centrist'
  | 'dravidian'
  | 'socialist'
  | 'libertarian'
  | 'custom';

export type CampaignActionType =
  | 'mega_rally'
  | 'roadshow'
  | 'public_meeting'
  | 'door_to_door'
  | 'booth_workers'
  | 'social_media'
  | 'tv_ads'
  | 'newspaper_ads'
  | 'radio_campaign'
  | 'whatsapp_campaign'
  | 'it_cell'
  | 'data_analytics'
  | 'opinion_survey'
  | 'volunteer_recruitment'
  | 'candidate_promotion'
  | 'manifesto_launch'
  | 'press_conference'
  | 'star_campaigner';

export type CampaignCategory = 'rally' | 'booth' | 'digital';

export type DemographicGroup =
  | 'women'
  | 'youth'
  | 'farmers'
  | 'urban'
  | 'rural'
  | 'business'
  | 'students'
  | 'govt_employees'
  | 'elderly'
  | 'lower_income'
  | 'obc'
  | 'sc_st'
  | 'minority'
  | 'urban_middle';

export type StateIssue =
  | 'employment'
  | 'inflation'
  | 'roads'
  | 'water_supply'
  | 'agriculture'
  | 'industry'
  | 'crime'
  | 'healthcare'
  | 'education'
  | 'housing'
  | 'electricity'
  | 'environment'
  | 'public_transport'
  | 'tourism'
  | 'investment'
  | 'infrastructure'
  | 'drug_menace'
  | 'floods'
  | 'peace'
  | 'pollution';

export type ManifestoPromiseType =
  | 'free_electricity'
  | 'free_water'
  | 'employment_programs'
  | 'healthcare_expansion'
  | 'education_reform'
  | 'infrastructure'
  | 'tax_changes'
  | 'startup_support'
  | 'agriculture_schemes'
  | 'womens_welfare'
  | 'pension_schemes'
  | 'housing'
  | 'public_transport'
  | 'industrial_corridors';

export type EventType =
  | 'economic_boom'
  | 'economic_slowdown'
  | 'heavy_rainfall'
  | 'flood'
  | 'heatwave'
  | 'infrastructure_opening'
  | 'fuel_price_increase'
  | 'corruption_allegation'
  | 'viral_speech'
  | 'party_defection'
  | 'campaign_disruption'
  | 'leader_health_issue'
  | 'court_decision'
  | 'ec_notice'
  | 'celebrity_support'
  | 'farmer_protest'
  | 'student_protest'
  | 'communal_tension'
  | 'natural_disaster'
  | 'foreign_visit'
  | 'election_commission_warning'
  | 'alliance_breakdown'
  | 'survey_leak'
  | 'media_expose'
  | 'stadium_rally_success'
  | 'party_split'
  | 'governor_controversy'
  | 'unemployment_data'
  | 'price_rise'
  | 'social_media_viral';

export type AllianceStatus = 'proposed' | 'negotiating' | 'confirmed' | 'broken';
export type GovernmentType = 'majority' | 'coalition' | 'minority' | 'president_rule';

// ─── Rally Topic ─────────────────────────────────────────────────────────────

export interface RallyTopic {
  id: string;
  name: string;
  description: string;
  icon: string;
  targetDemographics: DemographicGroup[];
  voteShareBonus: number;           // % vote share bonus in aligned states
  urbanCondition?: 'urban' | 'rural' | 'both';  // where this topic resonates
  requiredIssue?: StateIssue;       // only boosts if state has this issue
  cost: number;                     // Cr to commit to this topic
  turns: number;                    // how many turns it stays active
}

// ─── Benchmark System ────────────────────────────────────────────────────────

export interface BenchmarkLock {
  partyId: string;
  turn: number;
  voteShareBonus: number;
  label: string;
}

export interface CategoryBenchmarks {
  progress: Record<string, number>; // partyId -> cumulative points
  locks: Record<number, BenchmarkLock>; // level 1-10 -> lock info
}

export interface StateBenchmarks {
  rally: CategoryBenchmarks;
  booth: CategoryBenchmarks;
  digital: CategoryBenchmarks;
}

// ─── Party ─────────────────────────────────────────────────────────────────

export interface Party {
  id: string;
  name: string;
  abbreviation: string;
  leader: string;
  colour: string;
  secondaryColour?: string;
  symbolDescription: string;
  symbolEmoji: string;
  homeState: string;
  strongStates: string[];
  weakStates: string[];
  ideology: Ideology;
  aiPersonality: AIPersonality;
  startingPopularity: number;     // 0-100
  startingBudget: number;          // in crores
  isNational: boolean;
  isCustom?: boolean;
  customSymbolDataUrl?: string;    // uploaded image
  foundedYear: number;
  description: string;
  leadershipProfiles?: {
    national?: {
      primeMinisterCandidate?: string;
      nationalPresident?: string;
    };
    states?: Record<string, {
      chiefMinisterCandidate?: string;
      statePresident?: string;
    }>;
  };
  // Dynamic game state (populated at runtime)
  currentPopularity?: number;
  currentBudget?: number;
  seatsContested?: number;
  seatsWon?: number;
  voteShare?: number;
  allianceId?: string;
}

// ─── State & UT ─────────────────────────────────────────────────────────────

export interface StateData {
  id: string;
  name: string;
  capital: string;
  region: Region;
  isUT: boolean;
  assemblySeats: number;
  lokSabhaSeats: number;
  population: number;              // in millions
  literacy: number;                // 0-100%
  urbanization: number;            // 0-100%
  gdpPerCapita: number;            // relative index 0-100
  primaryIssues: StateIssue[];
  rulingPartyId: string;
  rulingAlliance?: string;
  secondPartyId?: string;
  thirdPartyId?: string;
  // Dynamic
  issueScores?: Record<StateIssue, number>;  // 0-100 severity
  popularityByParty?: Record<string, number>;
  campaignSpentByParty?: Record<string, number>;
  swingPercentage?: number;
  lastElectionVictorId?: string;
  lastElectionMargin?: number;
  momentum?: Record<string, number>;
  demographics?: Record<DemographicGroup, number>;
  popularityByDemographic?: Record<string, Record<DemographicGroup, number>>;
}

// ─── Constituency ───────────────────────────────────────────────────────────

export interface Constituency {
  id: string;
  name: string;
  stateId: string;
  type: 'lok_sabha' | 'state_assembly';
  number: number;
  isUrban: boolean;
  isRural?: boolean;
  isSemiUrban?: boolean;
  isReserved?: boolean;           // SC/ST reserved
  reservedFor?: 'SC' | 'ST';
  incumbentPartyId: string;
  incumbentMargin?: number;       // % margin of victory last election
  registeredVoters?: number;      // in thousands
  // Dynamic game state
  candidatesByParty?: Record<string, Candidate>;
  popularityByParty?: Record<string, number>;
  campaignIntensity?: number;     // 0-100
  campaignSpendByParty?: Record<string, number>;
  boothStrength?: Record<string, number>;
  digitalStrength?: Record<string, number>;
  groundStrength?: Record<string, number>;
  momentum?: Record<string, number>;
  majorIssue?: StateIssue;
  predictedWinner?: string;
  predictedMargin?: number;
  actualWinner?: string;
  actualVoteShare?: Record<string, number>;
  actualMargin?: number;
  turnout?: number;               // 0-100%
}

// ─── Candidate ──────────────────────────────────────────────────────────────

export interface Candidate {
  id: string;
  name: string;
  partyId: string;
  constituencyId: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  popularity: number;             // 0-100
  integrity: number;              // 0-100
  education: number;              // 0-100
  experience: number;             // 0-100
  publicSpeaking: number;         // 0-100
  localInfluence: number;         // 0-100
  campaignSkill: number;          // 0-100
  isIncumbent?: boolean;
  controversies?: string[];
  winsCount?: number;
}

// ─── Alliance ───────────────────────────────────────────────────────────────

export interface Alliance {
  id: string;
  name: string;
  leadPartyId: string;
  memberPartyIds: string[];
  status: AllianceStatus;
  stability: number;              // 0-100
  seatSharing: Record<string, number[]>;  // partyId -> constituency IDs
  stateSeatSharing: Record<string, number>;  // stateId -> percentage (0-100) for leadParty
  sharedBudget: number;
  formationTurn: number;
  breakdownProbability: number;  // 0-1 per turn
  ideology: string;
  trustByParty?: Record<string, number>; // 0-100
  compatibilityByParty?: Record<string, number>; // 0-100
  voteTransferByParty?: Record<string, number>; // 0-100
  relationshipByParty?: Record<string, number>; // 0-100
  regionalImportanceByState?: Record<string, number>; // 0-100
}

export interface CampaignSettings {
  campaignDays: number;
  maxTurns: number;
  aiDifficulty: Difficulty;
  campaignBudgetMultiplier: number;
  randomEvents: boolean;
  politicalEvents: boolean;
  allianceMode: boolean;
  shadowOperations: boolean;
  opinionPollAccuracy: number; // 0-100
  blackMoney: boolean;
  simulationDifficulty: Difficulty;
}

// ─── Campaign Action ────────────────────────────────────────────────────────

export interface CampaignAction {
  type: CampaignActionType;
  name: string;
  description: string;
  cost: number;                   // in crores
  popularityGain: number;         // base % gain
  credibilityImpact: number;      // -10 to +10
  duration: number;               // turns it lasts
  cooldown: number;               // turns before reuse
  targetType: 'state' | 'constituency' | 'national';
  icon: string;                   // lucide icon name
  requires?: CampaignActionType[];
  maxPerState?: number;
  urbanEffect?: number;           // modifier for urban areas
  ruralEffect?: number;           // modifier for rural areas
}

// ─── Manifesto Promise ──────────────────────────────────────────────────────

export interface ManifestoPromise {
  type: ManifestoPromiseType;
  name: string;
  description: string;
  popularityBonus: number;        // 0-15
  implementationCost: number;     // annual cost in crores
  budgetImpact: number;           // upfront campaign cost in crores
  credibilityImpact: number;      // -5 to +10
  issueAlignment: StateIssue[];   // which issues this addresses
  targetDemographic: string[];
  isPromised?: boolean;
}

// ─── Random Event ───────────────────────────────────────────────────────────

export interface GameEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  affectedPartyId?: string;       // null = all parties affected
  affectedStateId?: string;       // null = national
  popularityDelta: Record<string, number>;  // partyId -> delta (can be negative)
  budgetDelta?: Record<string, number>;
  credibilityDelta?: Record<string, number>;
  turnDuration: number;           // how many turns this event lasts
  probability: number;            // 0-1
  triggerConditions?: {
    minTurn?: number;
    maxTurn?: number;
    requiresParty?: string;
    requiresState?: string;
    requiresMinPopularity?: number;
    requiresMaxPopularity?: number;
  };
  isPositive: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  icon: string;
  turn?: number;
}

// ─── Poll Result ─────────────────────────────────────────────────────────────

export interface PollResult {
  turn: number;
  isExitPoll?: boolean;
  national: {
    byParty: Record<string, { voteShare: number; projectedSeats: number; swing: number }>;
    confidence: number;           // 0-100
    margin: number;               // confidence interval margin
    winner?: string;
    trend?: 'up' | 'down' | 'flat';
    undecided?: number;
    sampleSize?: number;
  };
  byState: Record<string, {
    rulingParty: string;
    popularityByParty: Record<string, number>;
    topIssues: StateIssue[];
    swing: number;
  }>;
  pollsterName: string;
  isAccurate: boolean;            // some polls have hidden inaccuracies
  bias: number;                   // hidden bias factor -10 to +10
}

// ─── Election Result ─────────────────────────────────────────────────────────

export interface ElectionResult {
  gameMode: GameMode;
  targetState?: string;           // for state assembly
  byParty: Record<string, {
    seatsWon: number;
    voteShare: number;
    seatChange: number;
    budgetSpent: number;
  }>;
  byConstituency: Record<string, {
    winner: string;
    voteShare: Record<string, number>;
    margin: number;
    turnout: number;
    runnerUp?: string;
  }>;
  byState: Record<string, {
    seatsByParty: Record<string, number>;
    swingParty: string;
    swingPercent: number;
  }>;
  governmentType: GovernmentType;
  governingAlliance?: string;
  governingParty?: string;
  primeMinisterPartyId?: string;
  majorityThreshold: number;
  winnerPartyId: string;
  totalSeats: number;
  timestamp: number;
}

// ─── Turn Action (player/AI) ─────────────────────────────────────────────────

export interface TurnAction {
  partyId: string;
  type: 'campaign' | 'alliance' | 'manifesto' | 'candidate' | 'budget_transfer';
  campaignAction?: CampaignActionType;
  targetStateId?: string;
  targetConstituencyId?: string;
  allianceAction?: 'propose' | 'accept' | 'reject' | 'break';
  alliancePartnerId?: string;
  manifestoPromise?: ManifestoPromiseType;
  cost: number;
  timestamp: number;
}

// ─── Save Slot ──────────────────────────────────────────────────────────────

export interface SaveSlot {
  id: string;
  slotNumber: 1 | 2 | 3;
  gameName: string;
  playerPartyId: string;
  playerPartyName: string;
  gameMode: GameMode;
  targetState?: string;
  currentTurn: number;
  totalTurns: number;
  difficulty: Difficulty;
  timestamp: number;
  elapsedMs: number;
  thumbnail?: string;             // base64 screenshot
  isAutosave?: boolean;
}

// ─── Full Game State ─────────────────────────────────────────────────────────

export interface GameState {
  // Meta
  id: string;
  mode: GameMode;
  targetState?: string;           // for state assembly elections
  difficulty: Difficulty;
  phase: GamePhase;
  currentTurn: number;
  totalTurns: number;             // e.g. 20 for lok sabha
  electionDate: string;           // display string
  startDate: string;
  isPaused: boolean;
  speed: 1 | 2 | 3;

  // Parties
  parties: Record<string, Party>;
  playerPartyId: string;
  settings?: CampaignSettings;

  // Map data
  states: Record<string, StateData>;
  constituencies: Record<string, Constituency>;

  // Active alliances
  alliances: Record<string, Alliance>;

  // Manifesto
  playerManifesto: ManifestoPromise[];

  // Events
  activeEvents: GameEvent[];
  eventHistory: GameEvent[];

  // Polls
  polls: PollResult[];
  latestPoll?: PollResult;
  internalSurveys?: Record<string, { turn: number; popularityByParty: Record<string, number> }>;

  // Turn history
  turnActions: Record<number, TurnAction[]>;    // indexed by turn number
  morningBriefing?: {
    turn: number;
    events: { title: string; message: string; type: 'success' | 'danger' | 'info'; icon?: string }[];
  };
  showMorningBriefing?: boolean;

  // Results (after election)
  electionResult?: ElectionResult;

  // AI state
  aiTargets: Record<string, string[]>;   // partyId -> target state IDs this turn
  aiCooldowns: Record<string, Record<string, number>>;  // partyId -> actionType -> turns remaining

  // 🔹 Turn Limits 🔹
  actionsTakenThisTurn: number;
  budgetSpentThisTurn: number;
  maxActionsPerTurn: number;
  maxBudgetPerTurn: number;

  // 🔹 NEW: Benchmark & Topic Systems 🔹
  turnIncome: number;                     // player's income this turn (for display)
  benchmarks: Record<string, StateBenchmarks>; // stateId -> benchmarks
  activeTopics: Record<string, string[]>; // stateId -> committed topic IDs (max 3)

  // UI state (not persisted in exact form)
  selectedStateId?: string;
  selectedConstituencyId?: string;
  activePanel?: 'map' | 'warroom' | 'campaign' | 'alliance' | 'manifesto' | 'polls' | 'candidates' | 'results' | 'shadow';
  notifications: Notification[];

  // Statistics
  stats: GameStats;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'danger' | 'event';
  turn: number;
  timestamp: number;
  isRead: boolean;
  icon?: string;
}

export interface GameStats {
  totalActionsPerformed: number;
  totalBudgetSpent: number;
  statesCampaignedIn: string[];
  ralliesHeld: number;
  alliancesFormed: number;
  eventsTriggered: number;
  pollHighest: number;
  pollLowest: number;
  turnsPlayed: number;
}

// ─── UI Types ────────────────────────────────────────────────────────────────

export interface MapTooltipData {
  stateId: string;
  stateName: string;
  rulingParty: string;
  rulingPartyColour: string;
  seats: number;
  playerPopularity: number;
  topIssue: StateIssue;
  x: number;
  y: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  colour?: string;
  [key: string]: string | number | undefined;
}
