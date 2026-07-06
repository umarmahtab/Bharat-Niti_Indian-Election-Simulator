/**
 * BHARAT NITI — Save/Load Screen
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, FolderOpen, Trash2, ArrowLeft, Clock, Calendar } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

export default function SaveLoadScreen() {
  const { gameState, saveSlots, saveToSlot, loadGameFromSlot, deleteSave, setScreen, returnToMainMenu } = useGameStore();
  const [saving, setSaving] = useState(false);

  const slots: (1 | 2 | 3)[] = [1, 2, 3];

  async function handleSave(slot: 1 | 2 | 3) {
    if (!gameState) return;
    setSaving(true);
    await saveToSlot(slot);
    setSaving(false);
  }

  return (
    <div className="w-full h-full animated-bg flex flex-col">
      {/* Header */}
      <div className="hud-bar px-8 py-4 flex items-center gap-4">
        <button
          onClick={() => gameState ? setScreen('game_dashboard') : returnToMainMenu()}
          className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>
        <h1 className="font-display font-bold text-xl text-text-primary">Save / Load Campaign</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-8 flex items-start justify-center">
        <div className={`w-full max-w-5xl grid grid-cols-1 ${gameState ? 'lg:grid-cols-3' : ''} gap-6`}>
          <div className={`${gameState ? 'lg:col-span-2' : ''} space-y-4`}>
            {slots.map((slotNum, i) => {
              const save = saveSlots.find(s => s.slotNumber === slotNum);

              return (
                <motion.div
                  key={slotNum}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card p-5"
                >
                  <div className="flex items-center gap-4">
                    {/* Slot number */}
                    <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                      <span className="font-display font-bold text-lg text-text-muted">{slotNum}</span>
                    </div>

                    {/* Save info */}
                    {save ? (
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-text-primary">{save.gameName}</div>
                        <div className="flex gap-3 text-xs text-text-muted mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {save.gameMode === 'lok_sabha' ? 'Lok Sabha' : `${save.targetState ?? 'State'} Assembly`}
                          </span>
                          <span>Turn {save.currentTurn}/{save.totalTurns}</span>
                          <span className="capitalize">{save.difficulty}</span>
                          {save.isAutosave && <span className="badge-saffron">Autosave</span>}
                        </div>
                        <div className="text-xs text-text-dim mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(save.timestamp).toLocaleString('en-IN')}
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1">
                        <div className="text-text-muted text-sm">Empty Slot</div>
                        <div className="text-text-dim text-xs">No save data</div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      {gameState && (
                        <button
                          onClick={() => handleSave(slotNum)}
                          disabled={saving}
                          className="btn-secondary text-xs flex items-center gap-1.5 py-2"
                        >
                          <Save className="w-3.5 h-3.5" />
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                      )}
                      {save && (
                        <>
                          <button
                            onClick={() => loadGameFromSlot(save.id)}
                            className="btn-primary text-xs flex items-center gap-1.5 py-2"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                            Load
                          </button>
                          <button
                            onClick={() => deleteSave(save.id)}
                            className="p-2 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete save"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            <p className="text-center text-text-dim text-xs mt-4">
              Game is automatically saved every 5 turns
            </p>
          </div>

          {gameState && (
            <div className="glass-card p-6 space-y-4 h-fit border border-white/10 shadow-xl bg-navy-950/40">
              <h2 className="font-display font-bold text-base text-saffron border-b border-white/10 pb-2 flex items-center gap-2">
                ⚙️ Active Settings
              </h2>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span className="text-text-muted">Campaign Days:</span>
                  <span className="text-white font-medium">{gameState.settings?.campaignDays ?? 60} Days</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span className="text-text-muted">Maximum Turns:</span>
                  <span className="text-white font-medium">{gameState.settings?.maxTurns ?? 20} Turns</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span className="text-text-muted">Campaign Budget:</span>
                  <span className="text-white font-medium">{gameState.settings?.campaignBudgetMultiplier ?? 1}x</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span className="text-text-muted">AI Difficulty:</span>
                  <span className="text-white font-medium capitalize">{gameState.settings?.aiDifficulty ?? gameState.difficulty}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span className="text-text-muted">Simulation Difficulty:</span>
                  <span className="text-white font-medium capitalize">{gameState.settings?.simulationDifficulty ?? gameState.difficulty}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span className="text-text-muted">Opinion Poll Accuracy:</span>
                  <span className="text-white font-medium">{gameState.settings?.opinionPollAccuracy ?? 82}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span className="text-text-muted">Random Events:</span>
                  <span className={gameState.settings?.randomEvents !== false ? 'text-india-green font-bold' : 'text-red-400 font-bold'}>
                    {gameState.settings?.randomEvents !== false ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span className="text-text-muted">Political Events:</span>
                  <span className={gameState.settings?.politicalEvents !== false ? 'text-india-green font-bold' : 'text-red-400 font-bold'}>
                    {gameState.settings?.politicalEvents !== false ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span className="text-text-muted">Alliance Mode:</span>
                  <span className={gameState.settings?.allianceMode !== false ? 'text-india-green font-bold' : 'text-red-400 font-bold'}>
                    {gameState.settings?.allianceMode !== false ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span className="text-text-muted">Shadow Operations:</span>
                  <span className={gameState.settings?.shadowOperations !== false ? 'text-india-green font-bold' : 'text-red-400 font-bold'}>
                    {gameState.settings?.shadowOperations !== false ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span className="text-text-muted">Black Money:</span>
                  <span className={gameState.settings?.blackMoney !== false ? 'text-india-green font-bold' : 'text-red-400 font-bold'}>
                    {gameState.settings?.blackMoney !== false ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
