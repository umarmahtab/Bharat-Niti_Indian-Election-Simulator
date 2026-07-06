/**
 * BHARAT NITI — Game Setup Screen
 * Party selection, mode selection, difficulty.
 */

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Upload, Search, Globe, MapPin } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { PARTIES, NATIONAL_PARTIES, REGIONAL_PARTIES } from '../engine/data/parties';
import { ALL_STATES } from '../engine/data/states';
import type { Party, GameMode, Difficulty, CampaignSettings } from '../engine/types';

type SetupStep = 'mode' | 'party' | 'difficulty' | 'confirm';

const DIFFICULTIES = [
  {
    id: 'easy' as Difficulty,
    label: 'Prachar',
    hindi: 'प्रचार',
    desc: '1.3× starting budget. Weaker AI.',
    colour: '#10B981',
  },
  {
    id: 'normal' as Difficulty,
    label: 'Chunav',
    hindi: 'चुनाव',
    desc: 'Balanced campaign. Standard AI.',
    colour: '#F4C430',
  },
  {
    id: 'hard' as Difficulty,
    label: 'Mahachunauti',
    hindi: 'महाचुनौती',
    desc: '0.8× budget. Aggressive AI.',
    colour: '#F97316',
  },
  {
    id: 'legendary' as Difficulty,
    label: 'Samrat',
    hindi: 'सम्राट',
    desc: '0.6× budget. Expert AI. True test.',
    colour: '#EF4444',
  },
];

export default function GameSetup() {
  const { setScreen, startNewGame } = useGameStore();
  const [step, setStep] = useState<SetupStep>('mode');
  const [mode, setMode] = useState<GameMode>('lok_sabha');
  const [targetState, setTargetState] = useState<string | undefined>(undefined);
  const [selectedPartyId, setSelectedPartyId] = useState<string>('');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [partyTab, setPartyTab] = useState<'national' | 'regional' | 'custom'>('national');
  const [searchQuery, setSearchQuery] = useState('');
  const [customParty, setCustomParty] = useState<Partial<Party>>({
    name: '',
    abbreviation: '',
    leader: '',
    colour: '#7B3FE4',
    symbolEmoji: '⭐',
  });
  const [campaignSettings, setCampaignSettings] = useState<Partial<CampaignSettings>>({
    campaignDays: 60,
    maxTurns: mode === 'lok_sabha' ? 20 : 15,
    aiDifficulty: 'normal',
    campaignBudgetMultiplier: 1,
    randomEvents: true,
    politicalEvents: true,
    allianceMode: true,
    shadowOperations: true,
    opinionPollAccuracy: 82,
    blackMoney: true,
    simulationDifficulty: 'normal',
  });
  const [customSymbolUrl, setCustomSymbolUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps: SetupStep[] = ['mode', 'party', 'difficulty', 'confirm'];
  const stepIdx = steps.indexOf(step);

  const filteredParties = {
    national: NATIONAL_PARTIES.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.abbreviation.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    regional: REGIONAL_PARTIES.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.abbreviation.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    custom: [],
  };

  const selectedParty = selectedPartyId === 'CUSTOM'
    ? { ...PARTIES.CUSTOM, ...customParty }
    : PARTIES[selectedPartyId];

  function handleSymbolUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setCustomSymbolUrl(url);
      setCustomParty(p => ({ ...p, customSymbolDataUrl: url }));
    };
    reader.readAsDataURL(file);
  }

  function canAdvance(): boolean {
    if (step === 'mode') return true;
    if (step === 'party') {
      if (selectedPartyId === 'CUSTOM') {
        return !!(customParty.name && customParty.abbreviation && customParty.leader);
      }
      return !!selectedPartyId;
    }
    if (step === 'difficulty') return true;
    return true;
  }

  async function handleStart() {
    await startNewGame({
      mode,
      playerPartyId: selectedPartyId,
      difficulty,
      targetState,
      customPartyConfig: selectedPartyId === 'CUSTOM' ? customParty : undefined,
      settings: {
        ...campaignSettings,
        maxTurns: campaignSettings.maxTurns ?? (mode === 'lok_sabha' ? 20 : 15),
        aiDifficulty: campaignSettings.aiDifficulty ?? difficulty,
        simulationDifficulty: campaignSettings.simulationDifficulty ?? difficulty,
      },
    });
  }

  return (
    <div className="relative w-full h-full animated-bg overflow-hidden flex flex-col">

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-8 pt-6 pb-4">
        <button
          onClick={() => stepIdx > 0 ? setStep(steps[stepIdx - 1]) : setScreen('main_menu')}
          className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">{stepIdx === 0 ? 'Main Menu' : 'Back'}</span>
        </button>

        {/* Step indicator */}
        <div className="flex items-center gap-3">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`
                w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                transition-all duration-300
                ${i < stepIdx ? 'bg-saffron text-white' :
                  i === stepIdx ? 'bg-saffron/20 text-saffron border border-saffron/50' :
                  'bg-white/[0.05] text-text-dim border border-white/[0.08]'}
              `}>
                {i < stepIdx ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 h-px transition-colors ${i < stepIdx ? 'bg-saffron' : 'bg-white/[0.1]'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="w-20" /> {/* Spacer */}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-8 pb-8 relative z-10">
        <AnimatePresence mode="wait">

          {/* ── Step 1: Mode ──────────────────────────────────────────────── */}
          {step === 'mode' && (
            <motion.div
              key="mode"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="text-center mb-10">
                <h2 className="font-display font-bold text-4xl text-text-primary mb-2">
                  Choose Election Mode
                </h2>
                <p className="text-text-muted">Select the type of election campaign you want to lead</p>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-10">
                {/* Lok Sabha */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setMode('lok_sabha');
                    setTargetState(undefined);
                    setCampaignSettings(prev => ({ ...prev, maxTurns: 20 }));
                  }}
                  className={`
                    glass-card p-8 cursor-pointer border-2 transition-all duration-200
                    ${mode === 'lok_sabha' ? 'border-saffron/60 bg-saffron/10 shadow-saffron' : 'border-white/[0.08] hover:border-white/20'}
                  `}
                >
                  <div className="text-5xl mb-4">🏛️</div>
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-4 h-4 text-saffron" />
                    <span className="text-xs uppercase tracking-wider text-saffron font-semibold">National</span>
                  </div>
                  <h3 className="font-display font-bold text-2xl text-text-primary mb-2">
                    Lok Sabha Election
                  </h3>
                  <p className="text-text-muted text-sm leading-relaxed">
                    Contest all 543 constituencies across India. Win a majority to form the central government and become Prime Minister.
                  </p>
                  <div className="mt-4 flex gap-2 flex-wrap">
                    <span className="badge-saffron">543 Seats</span>
                    <span className="badge-blue">20 Turns</span>
                    <span className="badge-green">National Scale</span>
                  </div>
                </motion.div>

                {/* State Assembly */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setMode('state_assembly');
                    setCampaignSettings(prev => ({ ...prev, maxTurns: 15 }));
                  }}
                  className={`
                    glass-card p-8 cursor-pointer border-2 transition-all duration-200
                    ${mode === 'state_assembly' ? 'border-accent-blue/60 bg-accent-blue/10 shadow-blue-glow' : 'border-white/[0.08] hover:border-white/20'}
                  `}
                >
                  <div className="text-5xl mb-4">🏢</div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-accent-blue" />
                    <span className="text-xs uppercase tracking-wider text-accent-blue font-semibold">State</span>
                  </div>
                  <h3 className="font-display font-bold text-2xl text-text-primary mb-2">
                    State Assembly Election
                  </h3>
                  <p className="text-text-muted text-sm leading-relaxed">
                    Contest state legislative assembly elections. Win enough seats to form a state government and become Chief Minister.
                  </p>
                  <div className="mt-4 flex gap-2 flex-wrap">
                    <span className="badge-blue">Up to 403 Seats</span>
                    <span className="badge-saffron">15 Turns</span>
                    <span className="badge-green">Regional Focus</span>
                  </div>
                </motion.div>
              </div>

              {/* State selection for assembly mode */}
              <AnimatePresence>
                {mode === 'state_assembly' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="glass-card p-6"
                  >
                    <h3 className="font-semibold text-text-primary mb-4">Select State</h3>
                    <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto panel-scroll">
                      {ALL_STATES.map(state => (
                        <button
                          key={state.id}
                          onClick={() => setTargetState(state.id)}
                          className={`
                            text-left px-3 py-2 rounded-lg text-sm transition-all
                            ${targetState === state.id
                              ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30'
                              : 'bg-white/[0.04] text-text-secondary hover:bg-white/[0.08] border border-transparent'}
                          `}
                        >
                          <div className="font-medium truncate">{state.name}</div>
                          <div className="text-xs text-text-dim">{state.assemblySeats} seats</div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── Step 2: Party Selection ────────────────────────────────────── */}
          {step === 'party' && (
            <motion.div
              key="party"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-5xl mx-auto"
            >
              <div className="text-center mb-6">
                <h2 className="font-display font-bold text-4xl text-text-primary mb-2">
                  Choose Your Party
                </h2>
                <p className="text-text-muted">Select the political party you will lead to victory</p>
              </div>

              {/* Tab + Search bar */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex bg-white/[0.04] rounded-xl p-1 gap-1">
                  {(['national', 'regional', 'custom'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setPartyTab(tab)}
                      className={`
                        px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize
                        ${partyTab === tab ? 'bg-saffron text-white' : 'text-text-muted hover:text-text-primary'}
                      `}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                {partyTab !== 'custom' && (
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="text"
                      placeholder="Search parties..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="input-field pl-10"
                    />
                  </div>
                )}
              </div>

              {/* Party grid */}
              {partyTab !== 'custom' && (
                <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto panel-scroll pr-2">
                  {filteredParties[partyTab].map(party => (
                    <motion.button
                      key={party.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedPartyId(party.id)}
                      className={`
                        glass-card p-4 text-left border-2 transition-all duration-200
                        ${selectedPartyId === party.id
                          ? 'border-2 bg-white/[0.08]'
                          : 'border-white/[0.06] hover:border-white/20'}
                      `}
                      style={selectedPartyId === party.id ? { borderColor: party.colour } : {}}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold flex-shrink-0"
                          style={{ backgroundColor: party.colour + '20', border: `2px solid ${party.colour}40` }}
                        >
                          {party.symbolEmoji}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-text-primary">
                            {party.abbreviation}
                          </div>
                          <div className="text-text-muted text-xs truncate">{party.leader}</div>
                        </div>
                        {selectedPartyId === party.id && (
                          <div className="ml-auto flex-shrink-0">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: party.colour }}>
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="text-text-muted text-xs leading-relaxed line-clamp-2 mb-2">
                        {party.description}
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: party.colour + '20', color: party.colour }}>
                          {party.startingPopularity}% poll
                        </span>
                        <span className="badge text-xs bg-white/[0.05] text-text-dim">
                          ₹{party.startingBudget}Cr
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Custom party form */}
              {partyTab === 'custom' && (
                <div className="glass-card p-6 space-y-4">
                  <div onClick={() => setSelectedPartyId('CUSTOM')} className="cursor-pointer">
                    <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                      <span className="text-accent-purple">✦</span>
                      Create Your Own Party
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-text-muted mb-1 block">Party Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Jan Seva Party"
                        value={customParty.name ?? ''}
                        onChange={e => {
                          setCustomParty(p => ({ ...p, name: e.target.value }));
                          setSelectedPartyId('CUSTOM');
                        }}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-text-muted mb-1 block">Abbreviation *</label>
                      <input
                        type="text"
                        placeholder="e.g. JSP"
                        maxLength={8}
                        value={customParty.abbreviation ?? ''}
                        onChange={e => setCustomParty(p => ({ ...p, abbreviation: e.target.value.toUpperCase() }))}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-text-muted mb-1 block">Leader Name *</label>
                      <input
                        type="text"
                        placeholder="Your name"
                        value={customParty.leader ?? ''}
                        onChange={e => setCustomParty(p => ({ ...p, leader: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-text-muted mb-1 block">Party Colour</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={customParty.colour ?? '#7B3FE4'}
                          onChange={e => setCustomParty(p => ({ ...p, colour: e.target.value }))}
                          className="w-12 h-10 rounded-lg cursor-pointer border border-white/10 bg-transparent"
                        />
                        <input
                          type="text"
                          value={customParty.colour ?? '#7B3FE4'}
                          onChange={e => setCustomParty(p => ({ ...p, colour: e.target.value }))}
                          className="input-field flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-text-muted mb-1 block">Party Symbol (Emoji)</label>
                      <input
                        type="text"
                        placeholder="🌟"
                        value={customParty.symbolEmoji ?? '⭐'}
                        onChange={e => setCustomParty(p => ({ ...p, symbolEmoji: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-text-muted mb-1 block">Upload Symbol Image</label>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-secondary w-full flex items-center justify-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        {customSymbolUrl ? 'Symbol Uploaded ✓' : 'Upload Image'}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleSymbolUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                  {customSymbolUrl && (
                    <div className="flex items-center gap-3 p-3 bg-white/[0.04] rounded-xl">
                      <img src={customSymbolUrl} alt="Party symbol" className="w-12 h-12 object-contain rounded-lg" />
                      <div>
                        <div className="text-sm text-text-primary font-medium">Symbol uploaded</div>
                        <div className="text-xs text-text-muted">Will be used as party symbol</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Selected party summary */}
              {selectedParty && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 rounded-xl flex items-center gap-4"
                  style={{ backgroundColor: selectedParty.colour + '15', border: `1px solid ${selectedParty.colour}30` }}
                >
                  <div className="text-3xl">{selectedParty.symbolEmoji}</div>
                  <div>
                    <div className="font-semibold" style={{ color: selectedParty.colour }}>
                      {selectedParty.name}
                    </div>
                    <div className="text-text-muted text-sm">Led by {selectedParty.leader}</div>
                  </div>
                  <div className="ml-auto flex gap-3 text-sm text-text-secondary">
                    <span>📊 {selectedParty.startingPopularity}% base</span>
                    <span>💰 ₹{selectedParty.startingBudget}Cr</span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── Step 3: Difficulty ─────────────────────────────────────────── */}
          {step === 'difficulty' && (
            <motion.div
              key="difficulty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto"
            >
              <div className="text-center mb-10">
                <h2 className="font-display font-bold text-4xl text-text-primary mb-2">
                  Choose Difficulty
                </h2>
                <p className="text-text-muted">How challenging do you want your campaign to be?</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {DIFFICULTIES.map(diff => (
                  <motion.button
                    key={diff.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setDifficulty(diff.id);
                      setCampaignSettings(prev => ({ ...prev, aiDifficulty: diff.id, simulationDifficulty: diff.id }));
                    }}
                    className={`
                      glass-card p-6 text-left border-2 transition-all duration-200
                      ${difficulty === diff.id ? 'border-2' : 'border-white/[0.06] hover:border-white/20'}
                    `}
                    style={difficulty === diff.id ? { borderColor: diff.colour, backgroundColor: diff.colour + '15' } : {}}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-display font-bold text-xl" style={{ color: diff.colour }}>
                          {diff.label}
                        </div>
                        <div className="text-sm text-text-muted">{diff.hindi}</div>
                      </div>
                      {difficulty === diff.id && (
                        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: diff.colour }}>
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-text-secondary text-sm">{diff.desc}</p>
                  </motion.button>
                ))}
              </div>

              <div className="glass-card p-5 mt-5">
                <h3 className="font-semibold text-text-primary mb-4">Campaign Settings</h3>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs text-text-muted flex flex-col gap-1">
                    Campaign Days
                    <input
                      type="number"
                      min={15}
                      max={180}
                      value={campaignSettings.campaignDays ?? 60}
                      onChange={e => setCampaignSettings(prev => ({ ...prev, campaignDays: Number(e.target.value) || 60 }))}
                      className="input-field"
                    />
                  </label>
                  <label className="text-xs text-text-muted flex flex-col gap-1">
                    Maximum Turns
                    <input
                      type="number"
                      min={5}
                      max={40}
                      value={campaignSettings.maxTurns === undefined ? (mode === 'lok_sabha' ? 20 : 15) : campaignSettings.maxTurns}
                      onChange={e => setCampaignSettings(prev => ({ ...prev, maxTurns: e.target.value === '' ? ('' as any) : Number(e.target.value) }))}
                      className="input-field"
                    />
                  </label>
                  <label className="text-xs text-text-muted flex flex-col gap-1">
                    Campaign Budget
                    <select
                      value={String(campaignSettings.campaignBudgetMultiplier ?? 1)}
                      onChange={e => setCampaignSettings(prev => ({ ...prev, campaignBudgetMultiplier: Number(e.target.value) }))}
                      className="input-field"
                    >
                      <option value="0.75">Low (0.75x)</option>
                      <option value="1">Standard (1.0x)</option>
                      <option value="1.25">High (1.25x)</option>
                      <option value="1.5">Very High (1.5x)</option>
                    </select>
                  </label>
                  <label className="text-xs text-text-muted flex flex-col gap-1">
                    Poll Accuracy
                    <input
                      type="number"
                      min={50}
                      max={99}
                      value={campaignSettings.opinionPollAccuracy === undefined ? 82 : campaignSettings.opinionPollAccuracy}
                      onChange={e => setCampaignSettings(prev => ({ ...prev, opinionPollAccuracy: e.target.value === '' ? ('' as any) : Number(e.target.value) }))}
                      className="input-field"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3">
                  {[
                    { key: 'randomEvents', label: 'Random Events' },
                    { key: 'politicalEvents', label: 'Political Events' },
                    { key: 'allianceMode', label: 'Alliance Mode' },
                    { key: 'shadowOperations', label: 'Shadow Ops' },
                    { key: 'blackMoney', label: 'Black Money' },
                  ].map(item => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setCampaignSettings(prev => ({ ...prev, [item.key]: !(prev as Record<string, boolean>)[item.key] }))}
                      className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${(campaignSettings as Record<string, boolean>)[item.key] !== false ? 'bg-india-green/10 border-india-green/25 text-india-green' : 'bg-white/[0.04] border-white/10 text-text-muted'}`}
                    >
                      {item.label}: {(campaignSettings as Record<string, boolean>)[item.key] !== false ? 'On' : 'Off'}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Step 4: Confirm ────────────────────────────────────────────── */}
          {step === 'confirm' && selectedParty && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="text-center mb-8">
                <h2 className="font-display font-bold text-4xl text-text-primary mb-2">
                  Ready to Campaign?
                </h2>
                <p className="text-text-muted">Review your setup before launching your campaign</p>
              </div>

              <div className="glass-card p-8 space-y-6">
                {/* Party banner */}
                <div
                  className="p-6 rounded-xl text-center"
                  style={{ background: `linear-gradient(135deg, ${selectedParty.colour}20, transparent)`, border: `1px solid ${selectedParty.colour}30` }}
                >
                  <div className="text-5xl mb-3">{selectedParty.symbolEmoji}</div>
                  <h3 className="font-display font-bold text-2xl" style={{ color: selectedParty.colour }}>
                    {selectedParty.name}
                  </h3>
                  <p className="text-text-muted">Led by {selectedParty.leader}</p>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-white/[0.04] rounded-xl">
                    <div className="text-2xl font-bold text-saffron">{mode === 'lok_sabha' ? '543' : (targetState ? ALL_STATES.find(s => s.id === targetState)?.assemblySeats ?? '?' : '?')}</div>
                    <div className="text-xs text-text-muted mt-1">Total Seats</div>
                  </div>
                  <div className="text-center p-4 bg-white/[0.04] rounded-xl">
                    <div className="text-2xl font-bold text-accent-blue">₹{selectedParty.startingBudget}Cr</div>
                    <div className="text-xs text-text-muted mt-1">Starting Budget</div>
                  </div>
                  <div className="text-center p-4 bg-white/[0.04] rounded-xl">
                    <div className="text-2xl font-bold text-india-green">{selectedParty.startingPopularity}%</div>
                    <div className="text-xs text-text-muted mt-1">Initial Popularity</div>
                  </div>
                </div>

                {/* Config summary */}
                <div className="space-y-2">
                  {[
                    { label: 'Election Mode', value: mode === 'lok_sabha' ? 'Lok Sabha (National)' : `State Assembly${targetState ? ` — ${targetState}` : ''}` },
                    { label: 'Difficulty', value: DIFFICULTIES.find(d => d.id === difficulty)?.label ?? difficulty },
                    { label: 'AI Personality', value: selectedParty.aiPersonality?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) },
                    { label: 'Home State', value: selectedParty.homeState },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-center py-2 border-b border-white/[0.05]">
                      <span className="text-text-muted text-sm">{row.label}</span>
                      <span className="text-text-primary text-sm font-medium">{row.value}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleStart}
                  className="btn-primary w-full py-4 text-base font-bold"
                >
                  Launch Campaign
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Bottom navigation */}
      <div className="relative z-10 px-8 pb-6 flex justify-end">
        <button
          onClick={() => {
            if (step === 'confirm') return;
            setStep(steps[stepIdx + 1]);
          }}
          disabled={!canAdvance() || step === 'confirm'}
          className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
