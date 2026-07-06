import statesRaw from './states.json';
import loksabhaRaw from './loksabha.json';
import type { StateData, Constituency } from '../engine/types';

// Cast JSON imports to types
export const STATES_DATA = statesRaw as unknown as Record<string, StateData>;
export const LOKSABHA_DATA = loksabhaRaw as unknown as Record<string, {
  stateId: string;
  totalSeats: number;
  constituencies: Array<{
    number: number;
    name: string;
    isUrban: boolean;
    isReserved: boolean;
    reservedFor?: 'SC' | 'ST';
    incumbentPartyId: string;
    incumbentMargin: number;
  }>;
}>;

function validateLokSabhaData(): void {
  const issues: string[] = [];
  const constituencyIds = new Set<string>();
  let computedSeats = 0;

  for (const [stateId, state] of Object.entries(LOKSABHA_DATA)) {
    if (!state || !Array.isArray(state.constituencies)) {
      issues.push(`Missing constituencies array for state ${stateId}`);
      continue;
    }

    if (state.totalSeats !== state.constituencies.length) {
      issues.push(`Seat mismatch for ${stateId}: totalSeats=${state.totalSeats}, constituencies=${state.constituencies.length}`);
    }

    computedSeats += state.constituencies.length;

    for (const c of state.constituencies) {
      if (!c.name || typeof c.number !== 'number') {
        issues.push(`Invalid constituency entry in ${stateId} seat ${String(c.number)}`);
        continue;
      }

      const cid = `${stateId.replace(/\s+/g, '')}_LS_${c.number}`;
      if (constituencyIds.has(cid)) {
        issues.push(`Duplicate constituency generated id ${cid}`);
      }
      constituencyIds.add(cid);

      if (!c.incumbentPartyId) {
        issues.push(`Missing incumbentPartyId in ${stateId} seat ${c.number}`);
      }
    }
  }

  if (computedSeats !== 543) {
    issues.push(`Total Lok Sabha seats must be 543, found ${computedSeats}`);
  }

  if (issues.length > 0) {
    throw new Error(`Lok Sabha data validation failed:\n${issues.join('\n')}`);
  }
}

validateLokSabhaData();

export function getStatesData(): Record<string, StateData> {
  return STATES_DATA;
}

export function getLokSabhaData() {
  return LOKSABHA_DATA;
}

export function getConstituenciesForState(stateId: string): Array<Omit<Constituency, 'popularityByParty' | 'campaignIntensity' | 'candidatesByParty' | 'turnout'>> {
  const stateData = LOKSABHA_DATA[stateId];
  if (!stateData) return [];

  return stateData.constituencies.map(c => ({
    id: `${stateId.replace(/\s+/g, '')}_LS_${c.number}`,
    name: c.name,
    stateId: stateId,
    type: 'lok_sabha' as const,
    number: c.number,
    isUrban: c.isUrban,
    isReserved: c.isReserved,
    reservedFor: c.reservedFor,
    incumbentPartyId: c.incumbentPartyId,
    incumbentMargin: c.incumbentMargin
  }));
}

export function getAllConstituencies(): Array<Omit<Constituency, 'popularityByParty' | 'campaignIntensity' | 'candidatesByParty' | 'turnout'>> {
  const all: ReturnType<typeof getConstituenciesForState> = [];
  for (const stateId of Object.keys(LOKSABHA_DATA)) {
    all.push(...getConstituenciesForState(stateId));
  }
  return all;
}

export function getTotalSeats(): number {
  return Object.values(LOKSABHA_DATA).reduce((sum, s) => sum + s.totalSeats, 0);
}

export function getMajorityMark(): number {
  return Math.ceil(getTotalSeats() / 2) + 1;
}

/**
 * FUTURE PROOFING: Dynamic Loader for State Assembly Mode.
 * This is designed to load assembly files dynamically from a sub-directory
 * without needing to change any existing game routing or logic later on.
 */
export async function getAssemblyData(stateId: string): Promise<any | null> {
  try {
    // Normalizing file name, e.g. "Uttar Pradesh" -> "uttar-pradesh"
    const fileSlug = stateId.toLowerCase().replace(/\s+/g, '-');
    // Using dynamic import so it is completely dynamic and doesn't break if files aren't there yet
    const module = await import(`./assembly/${fileSlug}.json`);
    return module.default;
  } catch (error) {
    console.warn(`Assembly data for state ${stateId} not found. Ensure assembly json file exists in src/data/assembly/`);
    return null;
  }
}
