/**
 * BHARAT NITI — Zustand Game Store (v2)
 * Central state management — extended with shadow ops, topics, benchmarks.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  GameState,
  GameMode,
  Difficulty,
  Party,
  CampaignActionType,
  ManifestoPromise,
  Notification,
  SaveSlot,
  CampaignSettings,
} from '../engine/types';
import { createInitialGameState, advanceTurn, applyTurnAction, generateMissingAllianceCandidates } from '../engine/gameState';
import { runElectionSimulation } from '../engine/electionSimulator';
import { CAMPAIGN_ACTIONS } from '../engine/data/campaignActions';
import { MANIFESTO_PROMISES } from '../engine/data/manifesto';
import { SHADOW_OPERATIONS, type ShadowOperationType } from '../engine/data/shadowOperations';
import { saveGame, loadGame, autosave, createSaveSlot, getAllSaveSlots, deleteSaveSlot } from '../db/saveEngine';

// ─── Store Types ──────────────────────────────────────────────────────────────

export type AppScreen =
  | 'main_menu'
  | 'game_setup'
  | 'game_dashboard'
  | 'state_detail'
  | 'campaign'
  | 'manifesto'
  | 'alliance'
  | 'polls'
  | 'candidates'
  | 'shadow_ops'
  | 'election_day'
  | 'results'
  | 'save_load';

export interface GameStore {
  // ── App state
  screen: AppScreen;
  gameState: GameState | null;
  saveSlots: SaveSlot[];
  isLoading: boolean;
  loadingMessage: string;
  isTurnAdvancing: boolean;

  // ── Navigation
  setScreen: (screen: AppScreen) => void;

  // ── Game lifecycle
  startNewGame: (params: {
    mode: GameMode;
    playerPartyId: string;
    difficulty: Difficulty;
    targetState?: string;
    customPartyConfig?: Partial<Party>;
    settings?: Partial<CampaignSettings>;
  }) => Promise<void>;
  loadGameFromSlot: (slotId: string) => Promise<void>;
  returnToMainMenu: () => void;

  // ── Turn management
  endTurn: () => Promise<void>;
  triggerElection: () => Promise<void>;

  // ── Player actions
  performCampaignAction: (
    actionType: CampaignActionType,
    targetStateId: string,
    targetConstituencyId?: string,
  ) => { success: boolean; message: string };

  // ── Shadow operations (black budget)
  performShadowOp: (
    opType: ShadowOperationType,
    targetStateId?: string,
    targetPartyId?: string,
  ) => { success: boolean; message: string; exposed?: boolean };

  // ── Rally topics
  commitToTopic: (topicId: string, stateId: string, cost: number) => { success: boolean; message: string };
  removeActiveTopic: (topicId: string, stateId: string) => void;

  // ── Alliance
  toggleManifestoPromise: (promise: ManifestoPromise) => void;
  proposeAlliance: (targetPartyId: string) => void;
  confirmAlliance: (allianceId: string) => void;
  updateAllianceSeatSharing: (allianceId: string, stateId: string, playerPercentage: number) => void;
  commissionInternalSurvey: (stateId: string) => { success: boolean; message: string };

  // ── Selection
  selectState: (stateId: string | undefined) => void;
  selectConstituency: (cId: string | undefined) => void;
  setActivePanel: (panel: GameState['activePanel']) => void;

  // ── Save/Load
  saveToSlot: (slotNumber: 1 | 2 | 3) => Promise<void>;
  loadSaveSlots: () => Promise<void>;
  deleteSave: (slotId: string) => Promise<void>;

  // ── Notifications
  markNotificationRead: (id: string) => void;
  dismissAllNotifications: () => void;
  addNotification: (notif: Omit<Notification, 'id' | 'timestamp'>) => void;
}

// ─── Store Implementation ─────────────────────────────────────────────────────

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => ({
    screen: 'main_menu',
    gameState: null,
    saveSlots: [],
    isLoading: false,
    loadingMessage: '',
    isTurnAdvancing: false,

    // ── Navigation ──────────────────────────────────────────────────────────
    setScreen: (screen) => set({ screen }),

    // ── Game Lifecycle ──────────────────────────────────────────────────────
    startNewGame: async (params) => {
      set({ isLoading: true, loadingMessage: 'Initialising campaign...' });
      await new Promise(r => setTimeout(r, 1500));

      try {
        const gameState = createInitialGameState(params);
        set({
          gameState,
          screen: 'game_dashboard',
          isLoading: false,
          loadingMessage: '',
        });
        await autosave(gameState);
      } catch (err) {
        console.error('Failed to start game:', err);
        set({ isLoading: false, loadingMessage: '' });
      }
    },

    loadGameFromSlot: async (slotId) => {
      set({ isLoading: true, loadingMessage: 'Loading campaign...' });
      const result = await loadGame(slotId);
      if (result) {
        const hydratedState: GameState = {
          ...result.state,
          settings: {
            campaignDays: result.state.settings?.campaignDays ?? 60,
            maxTurns: result.state.settings?.maxTurns ?? result.state.totalTurns,
            aiDifficulty: result.state.settings?.aiDifficulty ?? result.state.difficulty,
            campaignBudgetMultiplier: result.state.settings?.campaignBudgetMultiplier ?? 1,
            randomEvents: result.state.settings?.randomEvents ?? true,
            politicalEvents: result.state.settings?.politicalEvents ?? true,
            allianceMode: result.state.settings?.allianceMode ?? true,
            shadowOperations: result.state.settings?.shadowOperations ?? true,
            opinionPollAccuracy: result.state.settings?.opinionPollAccuracy ?? 82,
            blackMoney: result.state.settings?.blackMoney ?? true,
            simulationDifficulty: result.state.settings?.simulationDifficulty ?? result.state.difficulty,
          },
        };
        set({ gameState: hydratedState, screen: 'game_dashboard', isLoading: false });
      } else {
        set({ isLoading: false });
        console.error('Save slot not found:', slotId);
      }
    },

    returnToMainMenu: () => set({ screen: 'main_menu', gameState: null }),

    // ── Turn Management ─────────────────────────────────────────────────────
    endTurn: async () => {
      const { gameState } = get();
      if (!gameState || get().isTurnAdvancing) return;

      set({ isTurnAdvancing: true });
      await new Promise(r => setTimeout(r, 800));

      try {
        const newState = advanceTurn(gameState);

        if (newState.phase === 'election_day') {
          const electionResult = runElectionSimulation(newState);
          newState.electionResult = electionResult;
          set({ gameState: newState, isTurnAdvancing: false, screen: 'election_day' });
          await autosave(newState);
        } else {
          set({ gameState: newState, isTurnAdvancing: false });
          if (newState.currentTurn % 5 === 0) {
            await autosave(newState);
          }
        }
      } catch (err) {
        console.error('Turn advance failed:', err);
        set({ isTurnAdvancing: false });
      }
    },

    triggerElection: async () => {
      // Legacy transition - ElectionDay component now handles moving to 'results'
      const { gameState } = get();
      if (!gameState) return;
      set({ screen: 'results' });
    },

    // ── Player Campaign Actions ─────────────────────────────────────────────
    performCampaignAction: (actionType, targetStateId, targetConstituencyId) => {
      const { gameState } = get();
      if (!gameState) return { success: false, message: 'No active game' };

      const actionDef = CAMPAIGN_ACTIONS[actionType];
      if (!actionDef) return { success: false, message: 'Invalid action' };

      const playerParty = gameState.parties[gameState.playerPartyId];
      if (!playerParty) return { success: false, message: 'Player party not found' };

      const budget = playerParty.currentBudget ?? playerParty.startingBudget;
      if (budget < actionDef.cost) {
        return {
          success: false,
          message: `Insufficient funds. Need ₹${actionDef.cost} Cr, have ₹${budget.toFixed(0)} Cr. End turn to earn income!`,
        };
      }

      if (gameState.actionsTakenThisTurn >= gameState.maxActionsPerTurn) {
        return { success: false, message: `Action limit reached! Max ${gameState.maxActionsPerTurn} actions per turn.` };
      }
      if (gameState.budgetSpentThisTurn + actionDef.cost > gameState.maxBudgetPerTurn) {
        return { success: false, message: `Budget limit reached! You can only spend up to ₹${gameState.maxBudgetPerTurn} Cr this turn.` };
      }

      const action = {
        partyId: gameState.playerPartyId,
        type: 'campaign' as const,
        campaignAction: actionType,
        targetStateId,
        targetConstituencyId,
        cost: actionDef.cost,
        timestamp: Date.now(),
      };

      const newState = { ...gameState };
      // Deep clone benchmarks so mutations work
      newState.benchmarks = JSON.parse(JSON.stringify(newState.benchmarks ?? {}));
      newState.constituencies = JSON.parse(JSON.stringify(newState.constituencies ?? {}));
      applyTurnAction(action, newState);

      newState.actionsTakenThisTurn++;
      newState.budgetSpentThisTurn += actionDef.cost;
      newState.stats.totalActionsPerformed++;
      newState.stats.totalBudgetSpent += actionDef.cost;
      if (!newState.stats.statesCampaignedIn.includes(targetStateId)) {
        newState.stats.statesCampaignedIn.push(targetStateId);
      }
      if (actionType === 'mega_rally' || actionType === 'star_campaigner') newState.stats.ralliesHeld++;

      const locationLabel = targetConstituencyId 
        ? `${newState.constituencies[targetConstituencyId]?.name ?? targetConstituencyId} (${newState.states[targetStateId]?.name ?? targetStateId})`
        : newState.states[targetStateId]?.name ?? targetStateId;

      newState.notifications = [
        ...newState.notifications,
        {
          id: `notif_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          title: `${actionDef.name} launched!`,
          message: `Campaigning in ${locationLabel}. ₹${actionDef.cost} Cr spent.`,
          type: 'success' as const,
          turn: newState.currentTurn,
          timestamp: Date.now(),
          isRead: false,
          icon: actionDef.icon,
        },
      ];

      set({ gameState: newState });
      return { success: true, message: `${actionDef.name} launched successfully in ${locationLabel}!` };
    },

    // ── Shadow Operations (Black Budget) ────────────────────────────────────
    performShadowOp: (opType, targetStateId, targetPartyId) => {
      const { gameState } = get();
      if (!gameState) return { success: false, message: 'No active game' };

      const opDef = SHADOW_OPERATIONS[opType];
      if (!opDef) return { success: false, message: 'Unknown operation' };

      const playerParty = gameState.parties[gameState.playerPartyId] as Party & { blackBudget?: number };
      if (!playerParty) return { success: false, message: 'Player party not found' };

      const blackBudget = playerParty.blackBudget ?? 0;
      if (opDef.cost > 0 && blackBudget < opDef.cost) {
        return {
          success: false,
          message: `Insufficient black budget. Need ₹${opDef.cost} Cr black funds, have ₹${blackBudget.toFixed(0)} Cr.`,
        };
      }

      if (gameState.actionsTakenThisTurn >= gameState.maxActionsPerTurn) {
        return { success: false, message: `Action limit reached! Max ${gameState.maxActionsPerTurn} actions per turn.` };
      }
      if (opDef.cost > 0 && gameState.budgetSpentThisTurn + opDef.cost > gameState.maxBudgetPerTurn) {
        return { success: false, message: `Budget limit reached! You can only spend up to ₹${gameState.maxBudgetPerTurn} Cr this turn.` };
      }

      const newState = JSON.parse(JSON.stringify(gameState)) as GameState;
      const pp = newState.parties[newState.playerPartyId] as Party & { blackBudget?: number };

      // Deduct cost and apply limits
      pp.blackBudget = (pp.blackBudget ?? 0) - opDef.cost;
      newState.actionsTakenThisTurn++;
      if (opDef.cost > 0) newState.budgetSpentThisTurn += opDef.cost;

      // Apply effects
      const effects = opDef.effects;

      // Popularity effects
      if (effects.popularityDelta) {
        if (effects.target === 'player') {
          pp.currentPopularity = Math.max(0, Math.min(100, (pp.currentPopularity ?? 30) + effects.popularityDelta));
        } else if (effects.target === 'opponent' || effects.target === 'all_opponents') {
          const targets = effects.target === 'all_opponents'
            ? Object.keys(newState.parties).filter(id => id !== newState.playerPartyId)
            : targetPartyId ? [targetPartyId] : Object.keys(newState.parties).filter(id => id !== newState.playerPartyId).slice(0, 1);

          for (const tid of targets) {
            const tp = newState.parties[tid];
            if (tp) {
              tp.currentPopularity = Math.max(0, Math.min(100, (tp.currentPopularity ?? 30) + effects.popularityDelta));
            }
          }
        }
      }

      if (effects.statePopularityDelta && targetStateId) {
        const stateData = newState.states[targetStateId];
        if (stateData?.popularityByParty) {
          if (effects.target === 'player') {
            stateData.popularityByParty[newState.playerPartyId] = Math.max(0, Math.min(100,
              (stateData.popularityByParty[newState.playerPartyId] ?? 30) + (effects.statePopularityDelta ?? 0)
            ));
          } else {
            const tgt = targetPartyId ?? Object.keys(newState.parties).find(id => id !== newState.playerPartyId);
            if (tgt && stateData.popularityByParty[tgt] !== undefined) {
              stateData.popularityByParty[tgt] = Math.max(0, Math.min(100,
                (stateData.popularityByParty[tgt] ?? 30) + (effects.statePopularityDelta ?? 0)
              ));
            }
          }
        }
      }

      // Budget gains
      if (effects.budgetGain) {
        pp.currentBudget = (pp.currentBudget ?? 0) + effects.budgetGain;
      }
      if (effects.blackBudgetGain) {
        pp.blackBudget = (pp.blackBudget ?? 0) + effects.blackBudgetGain;
      }

      // Check for exposure
      let exposed = false;
      if (Math.random() < opDef.exposure.probability) {
        exposed = true;
        pp.currentPopularity = Math.max(0, (pp.currentPopularity ?? 30) + opDef.exposure.playerPopularity);
        if (opDef.exposure.blackBudgetLoss) {
          pp.blackBudget = Math.max(0, (pp.blackBudget ?? 0) - opDef.exposure.blackBudgetLoss);
        }

        newState.notifications = [
          ...newState.notifications,
          {
            id: `notif_${Date.now()}_exp`,
            title: '🚨 EXPOSED! Operation Compromised!',
            message: opDef.exposure.description,
            type: 'danger' as const,
            turn: newState.currentTurn,
            timestamp: Date.now(),
            isRead: false,
            icon: 'AlertTriangle',
          },
        ];
      } else {
        newState.notifications = [
          ...newState.notifications,
          {
            id: `notif_${Date.now()}_shadow`,
            title: `🕵️ ${opDef.name} — Success`,
            message: `Operation completed without a trace. Results will show in 1-2 turns.`,
            type: 'info' as const,
            turn: newState.currentTurn,
            timestamp: Date.now(),
            isRead: false,
            icon: opDef.icon,
          },
        ];
      }

      set({ gameState: newState });
      return { success: true, message: exposed ? 'EXPOSED!' : 'Operation successful!', exposed };
    },

    // ── Rally Topics ────────────────────────────────────────────────────────
    commitToTopic: (topicId, stateId, cost) => {
      const { gameState } = get();
      if (!gameState) return { success: false, message: 'No active game' };

      const playerParty = gameState.parties[gameState.playerPartyId];
      const budget = playerParty?.currentBudget ?? 0;
      if (budget < cost) {
        return { success: false, message: `Need ₹${cost} Cr. You have ₹${budget.toFixed(0)} Cr.` };
      }

      if (gameState.actionsTakenThisTurn >= gameState.maxActionsPerTurn) {
        return { success: false, message: `Action limit reached! Max ${gameState.maxActionsPerTurn} actions per turn.` };
      }
      if (gameState.budgetSpentThisTurn + cost > gameState.maxBudgetPerTurn) {
        return { success: false, message: `Budget limit reached! You can only spend up to ₹${gameState.maxBudgetPerTurn} Cr this turn.` };
      }

      const currentTopics = gameState.activeTopics?.[stateId] ?? [];
      if (currentTopics.length >= 3) {
        return { success: false, message: 'Max 3 active topics per state. Remove one first.' };
      }
      if (currentTopics.includes(topicId)) {
        return { success: false, message: 'Topic already active in this state.' };
      }

      const newState = { ...gameState };
      (newState.parties[newState.playerPartyId] as Party).currentBudget = Math.max(0, budget - cost);
      
      newState.actionsTakenThisTurn++;
      newState.budgetSpentThisTurn += cost;

      newState.activeTopics = {
        ...(newState.activeTopics ?? {}),
        [stateId]: [...currentTopics, topicId],
      };
      newState.notifications = [
        ...newState.notifications,
        {
          id: `notif_topic_${Date.now()}`,
          title: `Topic Committed: ${topicId}`,
          message: `Your party will campaign on this agenda in ${newState.states[stateId]?.name ?? stateId}. Demographic bonus active!`,
          type: 'success' as const,
          turn: newState.currentTurn,
          timestamp: Date.now(),
          isRead: false,
          icon: 'Target',
        },
      ];

      set({ gameState: newState });
      return { success: true, message: 'Topic committed!' };
    },

    removeActiveTopic: (topicId, stateId) => {
      const { gameState } = get();
      if (!gameState) return;

      const newTopics = (gameState.activeTopics?.[stateId] ?? []).filter(t => t !== topicId);
      set({
        gameState: {
          ...gameState,
          activeTopics: {
            ...(gameState.activeTopics ?? {}),
            [stateId]: newTopics,
          },
        },
      });
    },

    // ── Manifesto ───────────────────────────────────────────────────────────
    toggleManifestoPromise: (promise) => {
      const { gameState } = get();
      if (!gameState) return;

      const exists = gameState.playerManifesto.some(p => p.type === promise.type);
      const newManifesto = exists
        ? gameState.playerManifesto.filter(p => p.type !== promise.type)
        : [...gameState.playerManifesto, promise];

      set({ gameState: { ...gameState, playerManifesto: newManifesto } });
    },

    // ── Alliances ───────────────────────────────────────────────────────────
    proposeAlliance: (targetPartyId) => {
      const { gameState } = get();
      if (!gameState) return;

      const existingPlayerAlliance = Object.values(gameState.alliances).find(
        a => a.memberPartyIds.includes(gameState.playerPartyId) && a.status !== 'broken'
      );

      if (existingPlayerAlliance) {
        if (existingPlayerAlliance.memberPartyIds.includes(targetPartyId)) return;

        const targetCompatibility = 55;
        set({
          gameState: {
            ...gameState,
            alliances: {
              ...gameState.alliances,
              [existingPlayerAlliance.id]: {
                ...existingPlayerAlliance,
                memberPartyIds: [...existingPlayerAlliance.memberPartyIds, targetPartyId],
                trustByParty: {
                  ...(existingPlayerAlliance.trustByParty ?? {}),
                  [targetPartyId]: 58,
                },
                compatibilityByParty: {
                  ...(existingPlayerAlliance.compatibilityByParty ?? {}),
                  [targetPartyId]: targetCompatibility,
                },
                voteTransferByParty: {
                  ...(existingPlayerAlliance.voteTransferByParty ?? {}),
                  [targetPartyId]: 50,
                },
                relationshipByParty: {
                  ...(existingPlayerAlliance.relationshipByParty ?? {}),
                  [targetPartyId]: 60,
                },
              },
            },
            stats: { ...gameState.stats, alliancesFormed: gameState.stats.alliancesFormed + 1 },
          },
        });
        return;
      }

      const allianceId = `alliance_${Date.now()}`;
      const playerAbbr = gameState.parties[gameState.playerPartyId]?.abbreviation ?? 'P';
      const targetAbbr = gameState.parties[targetPartyId]?.abbreviation ?? 'T';

      const newAlliance = {
        id: allianceId,
        name: `${playerAbbr}-${targetAbbr} Alliance`,
        leadPartyId: gameState.playerPartyId,
        memberPartyIds: [gameState.playerPartyId, targetPartyId],
        status: 'proposed' as const,
        stability: 75,
        seatSharing: {},
        stateSeatSharing: {},
        sharedBudget: 0,
        formationTurn: gameState.currentTurn,
        breakdownProbability: 0.08,
        ideology: 'mixed',
        trustByParty: {
          [gameState.playerPartyId]: 65,
          [targetPartyId]: 60,
        },
        compatibilityByParty: {
          [gameState.playerPartyId]: 70,
          [targetPartyId]: 60,
        },
        voteTransferByParty: {
          [gameState.playerPartyId]: 55,
          [targetPartyId]: 50,
        },
        relationshipByParty: {
          [gameState.playerPartyId]: 68,
          [targetPartyId]: 60,
        },
      };

      set({
        gameState: {
          ...gameState,
          alliances: { ...gameState.alliances, [allianceId]: newAlliance },
          stats: { ...gameState.stats, alliancesFormed: gameState.stats.alliancesFormed + 1 },
        },
      });
    },

    confirmAlliance: (allianceId) => {
      const { gameState } = get();
      if (!gameState) return;

      const alliance = gameState.alliances[allianceId];
      if (!alliance) return;

      const newState = {
        ...gameState,
        alliances: {
          ...gameState.alliances,
          [allianceId]: { ...alliance, status: 'confirmed' as const },
        },
      };

      generateMissingAllianceCandidates(newState, allianceId);

      set({ gameState: newState });
    },

    updateAllianceSeatSharing: (allianceId, stateId, playerPercentage) => {
      const { gameState } = get();
      if (!gameState) return;

      const alliance = gameState.alliances[allianceId];
      if (!alliance) return;

      set({
        gameState: {
          ...gameState,
          alliances: {
            ...gameState.alliances,
            [allianceId]: {
              ...alliance,
              stateSeatSharing: {
                ...(alliance.stateSeatSharing ?? {}),
                [stateId]: playerPercentage,
              },
            },
          },
        },
      });
    },

    commissionInternalSurvey: (stateId) => {
      const { gameState } = get();
      if (!gameState) return { success: false, message: 'No active game state' };

      const playerParty = gameState.parties[gameState.playerPartyId];
      if (!playerParty) return { success: false, message: 'Player party not found' };

      const currentBudget = playerParty.currentBudget ?? playerParty.startingBudget;
      const SURVEY_COST = 15; // ₹15 Cr

      if (currentBudget < SURVEY_COST) {
        return { success: false, message: `Insufficient budget! Commissioning an Internal Survey costs ₹${SURVEY_COST}Cr (Current: ₹${currentBudget.toFixed(0)}Cr)` };
      }

      const turnsPlayed = gameState.actionsTakenThisTurn ?? 0;
      if (turnsPlayed >= gameState.maxActionsPerTurn) {
        return { success: false, message: `Maximum actions (${gameState.maxActionsPerTurn}) reached for this turn!` };
      }

      const budgetSpentThisTurn = gameState.budgetSpentThisTurn ?? 0;
      if (budgetSpentThisTurn + SURVEY_COST > gameState.maxBudgetPerTurn) {
        return { success: false, message: `Action exceeds your turn budget cap of ₹${gameState.maxBudgetPerTurn}Cr!` };
      }

      const stateData = gameState.states[stateId];
      if (!stateData) return { success: false, message: 'State data not found' };

      const updatedParty = {
        ...playerParty,
        currentBudget: currentBudget - SURVEY_COST,
      };

      const updatedParties = {
        ...gameState.parties,
        [gameState.playerPartyId]: updatedParty,
      };

      const internalSurveys = {
        ...(gameState.internalSurveys ?? {}),
        [stateId]: {
          turn: gameState.currentTurn,
          popularityByParty: { ...(stateData.popularityByParty ?? {}) },
        },
      };

      const newState = {
        ...gameState,
        parties: updatedParties,
        internalSurveys,
        actionsTakenThisTurn: turnsPlayed + 1,
        budgetSpentThisTurn: budgetSpentThisTurn + SURVEY_COST,
        stats: {
          ...gameState.stats,
          totalActionsPerformed: gameState.stats.totalActionsPerformed + 1,
          totalBudgetSpent: gameState.stats.totalBudgetSpent + SURVEY_COST,
        },
      };

      set({ gameState: newState });
      return { success: true, message: `Commissioned highly accurate Internal Survey for ${stateId} (Cost: ₹15Cr)` };
    },

    // ── Selection ───────────────────────────────────────────────────────────
    selectState: (stateId) => {
      const { gameState, screen } = get();
      if (!gameState) return;
      set({ gameState: { ...gameState, selectedStateId: stateId } });
      if (stateId && screen !== 'results') {
        get().setScreen('state_detail');
      }
      if (!stateId && screen === 'state_detail') {
        get().setScreen('game_dashboard');
      }
    },

    selectConstituency: (cId) => {
      const { gameState } = get();
      if (!gameState) return;
      set({ gameState: { ...gameState, selectedConstituencyId: cId } });
    },

    setActivePanel: (panel) => {
      const { gameState } = get();
      if (!gameState) return;
      set({ gameState: { ...gameState, activePanel: panel } });
    },

    // ── Save / Load ─────────────────────────────────────────────────────────
    saveToSlot: async (slotNumber) => {
      const { gameState } = get();
      if (!gameState) return;
      const slot = createSaveSlot(gameState, slotNumber);
      await saveGame(slot, gameState);
      await get().loadSaveSlots();
    },

    loadSaveSlots: async () => {
      const slots = await getAllSaveSlots();
      set({ saveSlots: slots });
    },

    deleteSave: async (slotId) => {
      await deleteSaveSlot(slotId);
      await get().loadSaveSlots();
    },

    // ── Notifications ───────────────────────────────────────────────────────
    markNotificationRead: (id) => {
      const { gameState } = get();
      if (!gameState) return;
      set({
        gameState: {
          ...gameState,
          notifications: gameState.notifications.map(n =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        },
      });
    },

    dismissAllNotifications: () => {
      const { gameState } = get();
      if (!gameState) return;
      set({
        gameState: {
          ...gameState,
          notifications: gameState.notifications.map(n => ({ ...n, isRead: true })),
        },
      });
    },

    addNotification: (notif) => {
      const { gameState } = get();
      if (!gameState) return;
      set({
        gameState: {
          ...gameState,
          notifications: [
            ...gameState.notifications,
            {
              ...notif,
              id: `notif_${Date.now()}_${Math.random().toString(36).slice(2)}`,
              timestamp: Date.now(),
            },
          ],
        },
      });
    },
  }))
);

// ─── Computed selectors (stable references) ───────────────────────────────────

export const selectPlayerParty = (state: GameStore) =>
  state.gameState ? state.gameState.parties[state.gameState.playerPartyId] : undefined;

export const selectPlayerBudget = (state: GameStore) => {
  const party = selectPlayerParty(state);
  return party?.currentBudget ?? party?.startingBudget ?? 0;
};

export const selectPlayerBlackBudget = (state: GameStore) => {
  const party = selectPlayerParty(state);
  return (party as (Party & { blackBudget?: number }) | undefined)?.blackBudget ?? 0;
};

export const selectPlayerPopularity = (state: GameStore) => {
  const party = selectPlayerParty(state);
  return party?.currentPopularity ?? party?.startingPopularity ?? 0;
};

export const selectUnreadNotificationsCount = (state: GameStore) =>
  state.gameState?.notifications.filter(n => !n.isRead).length ?? 0;

export const selectLatestPoll = (state: GameStore) => state.gameState?.latestPoll;

export const selectSelectedState = (state: GameStore) => {
  const g = state.gameState;
  if (!g?.selectedStateId) return null;
  return g.states[g.selectedStateId] ?? null;
};

export const selectTurnIncome = (state: GameStore) => state.gameState?.turnIncome ?? 0;

