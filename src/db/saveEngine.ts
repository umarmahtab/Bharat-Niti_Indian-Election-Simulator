/**
 * BHARAT NITI — Dexie.js Save Engine
 * Manages save/load via IndexedDB.
 */

import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { SaveSlot, GameState } from '../engine/types';

interface SaveRecord {
  slotId: string;
  slot: SaveSlot;
  state: GameState;
}

class BharatNitiDB extends Dexie {
  saves!: Table<SaveRecord, string>;

  constructor() {
    super('BharatNitiDB');
    this.version(1).stores({
      saves: 'slotId, &slot.slotNumber, slot.timestamp',
    });
  }
}

const db = new BharatNitiDB();

/** Save game to a slot */
export async function saveGame(
  slot: SaveSlot,
  state: GameState,
): Promise<void> {
  const record: SaveRecord = {
    slotId: slot.id,
    slot,
    state,
  };
  await db.saves.put(record);
}

/** Load game from slot ID */
export async function loadGame(slotId: string): Promise<{ slot: SaveSlot; state: GameState } | null> {
  const record = await db.saves.get(slotId);
  if (!record) return null;
  return { slot: record.slot, state: record.state };
}

/** Get all save slots */
export async function getAllSaveSlots(): Promise<SaveSlot[]> {
  const records = await db.saves.orderBy('slot.timestamp').reverse().toArray();
  return records.map(r => r.slot);
}

/** Delete a save slot */
export async function deleteSaveSlot(slotId: string): Promise<void> {
  await db.saves.delete(slotId);
}

/** Check if any saves exist */
export async function hasSaves(): Promise<boolean> {
  const count = await db.saves.count();
  return count > 0;
}

/** Create a save slot metadata object */
export function createSaveSlot(
  state: GameState,
  slotNumber: 1 | 2 | 3,
  isAutosave = false,
): SaveSlot {
  const playerParty = state.parties[state.playerPartyId];
  return {
    id: `save_${slotNumber}_${Date.now()}`,
    slotNumber,
    gameName: `${playerParty?.name ?? 'Unknown'} Campaign`,
    playerPartyId: state.playerPartyId,
    playerPartyName: playerParty?.name ?? 'Unknown Party',
    gameMode: state.mode,
    targetState: state.targetState,
    currentTurn: state.currentTurn,
    totalTurns: state.totalTurns,
    difficulty: state.difficulty,
    timestamp: Date.now(),
    elapsedMs: 0,
    isAutosave,
  };
}

/** Autosave: always uses a special slot */
export async function autosave(state: GameState): Promise<void> {
  const slot = createSaveSlot(state, 1, true);
  slot.id = 'autosave';
  await saveGame(slot, state);
}
