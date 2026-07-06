/**
 * BHARAT NITI — Manifesto Promises Data
 */

import type { ManifestoPromise } from '../types';

export const MANIFESTO_PROMISES: ManifestoPromise[] = [
  {
    type: 'free_electricity',
    name: 'Free Electricity (300 units/month)',
    description: 'Promise free electricity up to 300 units per month for all households.',
    popularityBonus: 12,
    implementationCost: 8000,
    budgetImpact: 5,
    credibilityImpact: 3,
    issueAlignment: ['electricity'],
    targetDemographic: ['urban', 'semi_urban', 'rural', 'middle_class', 'poor'],
  },
  {
    type: 'free_water',
    name: 'Free Water Supply',
    description: '20,000 litres per month free water for all households.',
    popularityBonus: 10,
    implementationCost: 5000,
    budgetImpact: 4,
    credibilityImpact: 3,
    issueAlignment: ['water_supply'],
    targetDemographic: ['urban', 'rural', 'poor'],
  },
  {
    type: 'employment_programs',
    name: 'Employment Guarantee Scheme',
    description: 'Guarantee 100 days employment to every eligible adult in rural areas.',
    popularityBonus: 11,
    implementationCost: 12000,
    budgetImpact: 6,
    credibilityImpact: 2,
    issueAlignment: ['employment', 'agriculture'],
    targetDemographic: ['rural', 'poor', 'farmers'],
  },
  {
    type: 'healthcare_expansion',
    name: 'Universal Healthcare',
    description: 'Free healthcare up to ₹10 lakh per family per year at government hospitals.',
    popularityBonus: 13,
    implementationCost: 15000,
    budgetImpact: 8,
    credibilityImpact: 4,
    issueAlignment: ['healthcare'],
    targetDemographic: ['all', 'poor', 'middle_class', 'rural'],
  },
  {
    type: 'education_reform',
    name: 'Free Education Reform',
    description: 'Free education from KG to graduation with quality improvement programs.',
    popularityBonus: 10,
    implementationCost: 10000,
    budgetImpact: 5,
    credibilityImpact: 3,
    issueAlignment: ['education'],
    targetDemographic: ['youth', 'parents', 'poor', 'rural'],
  },
  {
    type: 'infrastructure',
    name: 'Infrastructure Mega Plan',
    description: 'Build 10,000 km of roads, 50 new airports, and expand railway network.',
    popularityBonus: 9,
    implementationCost: 50000,
    budgetImpact: 10,
    credibilityImpact: 5,
    issueAlignment: ['roads', 'public_transport', 'industry', 'investment'],
    targetDemographic: ['business', 'urban', 'rural'],
  },
  {
    type: 'tax_changes',
    name: 'Tax Relief for Middle Class',
    description: 'Raise income tax exemption limit to ₹10 lakh and reduce GST on essentials.',
    popularityBonus: 8,
    implementationCost: 20000,
    budgetImpact: 7,
    credibilityImpact: 2,
    issueAlignment: ['inflation', 'employment'],
    targetDemographic: ['middle_class', 'urban', 'business'],
  },
  {
    type: 'startup_support',
    name: 'Startup India 2.0',
    description: '₹1 lakh crore startup fund, streamlined permits, and 3-year tax holiday.',
    popularityBonus: 7,
    implementationCost: 10000,
    budgetImpact: 6,
    credibilityImpact: 2,
    issueAlignment: ['employment', 'industry', 'investment'],
    targetDemographic: ['youth', 'urban', 'educated'],
  },
  {
    type: 'agriculture_schemes',
    name: 'Farmer Support Package',
    description: 'Loan waiver, MSP guarantee, crop insurance, and ₹6000/month income support.',
    popularityBonus: 14,
    implementationCost: 25000,
    budgetImpact: 8,
    credibilityImpact: 1,
    issueAlignment: ['agriculture', 'water_supply', 'employment'],
    targetDemographic: ['farmers', 'rural', 'poor'],
  },
  {
    type: 'womens_welfare',
    name: 'Women Empowerment Yojana',
    description: '₹1000/month cash transfer to women, free LPG refill, maternity benefit.',
    popularityBonus: 12,
    implementationCost: 8000,
    budgetImpact: 5,
    credibilityImpact: 3,
    issueAlignment: ['employment', 'education'],
    targetDemographic: ['women', 'poor', 'rural', 'semi_urban'],
  },
  {
    type: 'pension_schemes',
    name: 'Universal Pension Scheme',
    description: '₹3000/month pension for all citizens above 60 not covered by other schemes.',
    popularityBonus: 11,
    implementationCost: 12000,
    budgetImpact: 6,
    credibilityImpact: 3,
    issueAlignment: ['employment'],
    targetDemographic: ['senior_citizens', 'rural', 'poor'],
  },
  {
    type: 'housing',
    name: 'Housing for All Scheme',
    description: 'Build 2 crore affordable homes in 5 years for homeless and BPL families.',
    popularityBonus: 10,
    implementationCost: 30000,
    budgetImpact: 7,
    credibilityImpact: 2,
    issueAlignment: ['housing', 'roads', 'electricity'],
    targetDemographic: ['poor', 'rural', 'urban', 'migrants'],
  },
  {
    type: 'public_transport',
    name: 'Metro & Bus Network Expansion',
    description: 'Extend metro to 50 cities and launch electric bus fleet in all state capitals.',
    popularityBonus: 8,
    implementationCost: 20000,
    budgetImpact: 9,
    credibilityImpact: 3,
    issueAlignment: ['public_transport', 'environment', 'infrastructure'],
    targetDemographic: ['urban', 'youth', 'middle_class'],
  },
  {
    type: 'industrial_corridors',
    name: 'Industrial Corridor Mission',
    description: 'Build 5 new industrial corridors to attract ₹10 lakh crore in investment.',
    popularityBonus: 6,
    implementationCost: 40000,
    budgetImpact: 10,
    credibilityImpact: 4,
    issueAlignment: ['industry', 'employment', 'investment'],
    targetDemographic: ['business', 'urban', 'youth'],
  },
];

export function getManifestoPromise(type: string): ManifestoPromise | undefined {
  return MANIFESTO_PROMISES.find(p => p.type === type);
}

/** Total popularity bonus if all promises made */
export function getTotalManifestoPopularity(promises: ManifestoPromise[]): number {
  return promises.reduce((acc, p) => acc + p.popularityBonus, 0);
}

/** Total credibility impact */
export function getTotalCredibilityImpact(promises: ManifestoPromise[]): number {
  return promises.reduce((acc, p) => acc + p.credibilityImpact, 0);
}
