/**
 * BHARAT NITI — States & Union Territories Data
 * Refactored to load from states.json data file.
 */

import type { StateData } from '../types';
import { STATES_DATA as rawStates } from '../../data/dataLoader';

export const STATES_DATA: Record<string, StateData> = rawStates;

export const ALL_STATES = Object.values(STATES_DATA);
export const STATES_LIST = ALL_STATES.map(s => s.name);
export const LS_TOTAL_SEATS = ALL_STATES.reduce((acc, s) => acc + s.lokSabhaSeats, 0);
export const LS_MAJORITY = Math.ceil(LS_TOTAL_SEATS / 2) + 1;

export function getState(id: string): StateData | undefined {
  return STATES_DATA[id];
}

export function getStatesByRegion(region: string): StateData[] {
  return ALL_STATES.filter(s => s.region === region);
}
