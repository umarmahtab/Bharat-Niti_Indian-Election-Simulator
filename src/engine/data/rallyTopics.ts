/**
 * BHARAT NITI — Rally Topics
 * Campaign topics players commit to during rallies.
 * Each topic gives demographic-targeted vote share bonuses.
 */

import type { RallyTopic } from '../types';

export const RALLY_TOPICS: Record<string, RallyTopic> = {

  // ── WOMEN WELFARE ──────────────────────────────────────────────────────────

  free_travel_women: {
    id: 'free_travel_women',
    name: 'Free Travel for Women',
    description: 'Free bus & metro travel for all women. Boosts women vote share by 10%.',
    icon: 'Bus',
    targetDemographics: ['women', 'lower_income'],
    voteShareBonus: 10,
    urbanCondition: 'both',
    requiredIssue: 'public_transport',
    cost: 8,
    turns: 4,
  },

  mahila_samman: {
    id: 'mahila_samman',
    name: 'Mahila Samman Yojana',
    description: '₹2000/month direct cash transfer to all women. Massive rural women appeal.',
    icon: 'HeartHandshake',
    targetDemographics: ['women', 'lower_income', 'obc'],
    voteShareBonus: 14,
    urbanCondition: 'rural',
    cost: 12,
    turns: 5,
  },

  // ── FARMER WELFARE ────────────────────────────────────────────────────────

  kisan_samman: {
    id: 'kisan_samman',
    name: 'Kisan Loan Waiver',
    description: 'Complete waiver of all farm loans up to ₹2 lakhs. Major vote puller in rural seats.',
    icon: 'Tractor',
    targetDemographics: ['farmers', 'lower_income', 'obc'],
    voteShareBonus: 13,
    urbanCondition: 'rural',
    requiredIssue: 'agriculture',
    cost: 15,
    turns: 4,
  },

  msp_guarantee: {
    id: 'msp_guarantee',
    name: 'MSP Legal Guarantee',
    description: 'Legally guarantee Minimum Support Price for all crops. Farmers will trust you.',
    icon: 'Wheat',
    targetDemographics: ['farmers', 'obc'],
    voteShareBonus: 11,
    urbanCondition: 'rural',
    requiredIssue: 'agriculture',
    cost: 10,
    turns: 5,
  },

  // ── YOUTH & EMPLOYMENT ────────────────────────────────────────────────────

  rozgar_guarantee: {
    id: 'rozgar_guarantee',
    name: 'Rozgar Guarantee Scheme',
    description: '100 days guaranteed employment for all rural households. Youth and farmer magnet.',
    icon: 'Briefcase',
    targetDemographics: ['youth', 'farmers', 'lower_income'],
    voteShareBonus: 12,
    urbanCondition: 'rural',
    requiredIssue: 'employment',
    cost: 12,
    turns: 4,
  },

  startup_india: {
    id: 'startup_india',
    name: 'Startup India Boost',
    description: 'Tax holidays and funding for startups. Appeals to urban educated youth.',
    icon: 'Rocket',
    targetDemographics: ['youth', 'urban_middle', 'business'],
    voteShareBonus: 8,
    urbanCondition: 'urban',
    requiredIssue: 'industry',
    cost: 9,
    turns: 3,
  },

  government_jobs: {
    id: 'government_jobs',
    name: '10 Lakh Govt Jobs',
    description: 'Promise to create 10 lakh new government positions. Huge youth appeal.',
    icon: 'UserCheck',
    targetDemographics: ['youth', 'obc', 'sc_st'],
    voteShareBonus: 11,
    urbanCondition: 'both',
    requiredIssue: 'employment',
    cost: 10,
    turns: 4,
  },

  // ── LOWER INCOME & WELFARE ────────────────────────────────────────────────

  free_electricity: {
    id: 'free_electricity',
    name: 'Free 200 Units Electricity',
    description: 'Free 200 units of electricity per household per month. AAP model expanded nationally.',
    icon: 'Zap',
    targetDemographics: ['lower_income', 'obc', 'sc_st'],
    voteShareBonus: 12,
    urbanCondition: 'both',
    requiredIssue: 'electricity',
    cost: 11,
    turns: 4,
  },

  free_ration: {
    id: 'free_ration',
    name: 'Free Ration Extension',
    description: 'Extend free food grain scheme to all BPL families with additional pulses and oil.',
    icon: 'ShoppingBag',
    targetDemographics: ['lower_income', 'sc_st', 'farmers'],
    voteShareBonus: 9,
    urbanCondition: 'rural',
    cost: 8,
    turns: 5,
  },

  health_insurance: {
    id: 'health_insurance',
    name: 'Universal Health Insurance',
    description: '₹10 lakh health coverage for every family. Resonates with all demographics.',
    icon: 'Stethoscope',
    targetDemographics: ['elderly', 'lower_income', 'women'],
    voteShareBonus: 10,
    urbanCondition: 'both',
    requiredIssue: 'healthcare',
    cost: 13,
    turns: 4,
  },

  // ── SC/ST & OBC WELFARE ───────────────────────────────────────────────────

  reservation_extension: {
    id: 'reservation_extension',
    name: 'OBC Sub-Categorisation',
    description: 'Sub-categorise OBC reservations for most backward communities. Strong OBC appeal.',
    icon: 'Scale',
    targetDemographics: ['obc', 'lower_income'],
    voteShareBonus: 11,
    urbanCondition: 'both',
    cost: 5,
    turns: 5,
  },

  dalit_samman: {
    id: 'dalit_samman',
    name: 'Dalit Samman Abhiyan',
    description: 'Strengthen SC/ST atrocities act, increase scholarships and welfare funds.',
    icon: 'Shield',
    targetDemographics: ['sc_st', 'lower_income'],
    voteShareBonus: 13,
    urbanCondition: 'both',
    cost: 8,
    turns: 4,
  },

  // ── URBAN & MIDDLE CLASS ──────────────────────────────────────────────────

  income_tax_relief: {
    id: 'income_tax_relief',
    name: 'Income Tax Zero (Up to 10L)',
    description: 'Make income up to ₹10 lakhs completely tax-free. Middle class magnet.',
    icon: 'PiggyBank',
    targetDemographics: ['urban_middle', 'business', 'youth'],
    voteShareBonus: 9,
    urbanCondition: 'urban',
    cost: 10,
    turns: 4,
  },

  smart_city: {
    id: 'smart_city',
    name: 'Smart City Initiative',
    description: 'Digital infrastructure, metro expansion, better roads for urban centres.',
    icon: 'Building2',
    targetDemographics: ['urban_middle', 'business', 'youth'],
    voteShareBonus: 8,
    urbanCondition: 'urban',
    requiredIssue: 'infrastructure',
    cost: 12,
    turns: 3,
  },

  // ── NATIONAL SECURITY & DEVELOPMENT ──────────────────────────────────────

  border_security: {
    id: 'border_security',
    name: 'Strong Border Security',
    description: 'Modernise defence, stricter border control, zero terrorism policy.',
    icon: 'ShieldCheck',
    targetDemographics: ['urban_middle', 'elderly', 'business'],
    voteShareBonus: 7,
    urbanCondition: 'both',
    requiredIssue: 'peace',
    cost: 6,
    turns: 5,
  },

  infrastructure_push: {
    id: 'infrastructure_push',
    name: 'Viksit Bharat Infrastructure',
    description: 'Build highways, railways, and airports in every district. Development narrative.',
    icon: 'Construction',
    targetDemographics: ['business', 'youth', 'urban_middle', 'farmers'],
    voteShareBonus: 9,
    urbanCondition: 'both',
    requiredIssue: 'roads',
    cost: 11,
    turns: 4,
  },

};

export const ALL_RALLY_TOPICS = Object.values(RALLY_TOPICS);

export function getRallyTopic(id: string): RallyTopic | undefined {
  return RALLY_TOPICS[id];
}

/** Check if a topic resonates with a given state's properties */
export function topicResonatesWithState(
  topic: RallyTopic,
  urbanization: number,
  primaryIssues: string[],
): boolean {
  if (topic.urbanCondition === 'urban' && urbanization < 30) return false;
  if (topic.urbanCondition === 'rural' && urbanization > 70) return false;
  if (topic.requiredIssue && !primaryIssues.includes(topic.requiredIssue)) return false;
  return true;
}

