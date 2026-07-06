/**
 * BHARAT NITI — Main Menu Screen
 * Cinematic landing screen with animated India map background.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, FolderOpen, Settings, BookOpen, Trophy, Info, FileText, BarChart3, Power } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

const SLOGANS = [
  'Lead India to Victory',
  'Shape the Democratic Future',
  'Every Vote Counts',
  'From Booth to Parliament',
  'Bharat Ki Awaaz',
];

export default function MainMenu() {
  const { setScreen, saveSlots } = useGameStore();
  const [slogan, setSlogan] = useState(0);
  const [activeModal, setActiveModal] = useState<null | 'howto' | 'settings' | 'credits' | 'stats' | 'patch' | 'about' | 'exit'>(null);
  const [menuSettings, setMenuSettings] = useState({
    music: true,
    sfx: true,
    animations: true,
    compactHud: false,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setSlogan(s => (s + 1) % SLOGANS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    {
      icon: <Play className="w-5 h-5" />,
      label: 'New Campaign',
      sublabel: 'Start a fresh election campaign',
      action: () => setScreen('game_setup'),
      primary: true,
    },
    {
      icon: <FolderOpen className="w-5 h-5" />,
      label: 'Load Campaign',
      sublabel: saveSlots.length > 0 ? `${saveSlots.length} save${saveSlots.length > 1 ? 's' : ''} found` : 'No saves found',
      action: () => setScreen('save_load'),
      disabled: saveSlots.length === 0,
    },
    {
      icon: <BookOpen className="w-5 h-5" />,
      label: 'How to Play',
      sublabel: 'Game guide & tutorials',
      action: () => setActiveModal('howto'),
    },
    {
      icon: <Settings className="w-5 h-5" />,
      label: 'Settings',
      sublabel: 'Audio, visuals, and gameplay toggles',
      action: () => setActiveModal('settings'),
    },
    {
      icon: <Info className="w-5 h-5" />,
      label: 'Credits',
      sublabel: 'Team and acknowledgements',
      action: () => setActiveModal('credits'),
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      label: 'Statistics',
      sublabel: 'Your campaign profile summary',
      action: () => setActiveModal('stats'),
    },
    {
      icon: <FileText className="w-5 h-5" />,
      label: 'Patch Notes',
      sublabel: 'Latest gameplay improvements',
      action: () => setActiveModal('patch'),
    },
    {
      icon: <Info className="w-5 h-5" />,
      label: 'About',
      sublabel: 'Product and legal information',
      action: () => setActiveModal('about'),
    },
    {
      icon: <Power className="w-5 h-5" />,
      label: 'Exit',
      sublabel: 'Close the session',
      action: () => setActiveModal('exit'),
    },
  ];

  function renderModalContent() {
    if (!activeModal) return null;

    if (activeModal === 'howto') {
      return {
        title: 'How To Play',
        body: (
          <div className="space-y-2 text-sm text-text-secondary">
            <p>1. Pick election mode, party, and difficulty in setup.</p>
            <p>2. Build momentum using campaign, alliance, manifesto, and shadow strategy.</p>
            <p>3. Prioritize swing seats and protect strongholds each turn.</p>
            <p>4. Track polls, trends, and state-level issue match before spending budget.</p>
            <p>5. On election day, constituency math decides final seat outcomes.</p>
          </div>
        ),
      };
    }

    if (activeModal === 'settings') {
      return {
        title: 'Settings',
        body: (
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'music', label: 'Background Music' },
              { key: 'sfx', label: 'Sound Effects' },
              { key: 'animations', label: 'UI Animations' },
              { key: 'compactHud', label: 'Compact HUD' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setMenuSettings(prev => ({ ...prev, [item.key]: !(prev as Record<string, boolean>)[item.key] }))}
                className={`px-3 py-2 rounded-lg border text-xs font-semibold ${(menuSettings as Record<string, boolean>)[item.key] ? 'border-india-green/30 bg-india-green/10 text-india-green' : 'border-white/10 bg-white/[0.03] text-text-muted'}`}
              >
                {item.label}: {(menuSettings as Record<string, boolean>)[item.key] ? 'On' : 'Off'}
              </button>
            ))}
          </div>
        ),
      };
    }

    if (activeModal === 'credits') {
      return {
        title: 'Credits',
        body: (
          <div className="space-y-2 text-sm text-text-secondary">
            <p>Design and direction: Bharat Niti Core Team</p>
            <p>Simulation and AI systems: Campaign Intelligence Unit</p>
            <p>Frontend and UX: Interactive Strategy Studio</p>
            <p>Special thanks to playtesters and data validation contributors.</p>
          </div>
        ),
      };
    }

    if (activeModal === 'stats') {
      return {
        title: 'Statistics',
        body: (
          <div className="space-y-2 text-sm text-text-secondary">
            <p>Total Saves: {saveSlots.length}</p>
            <p>Highest Difficulty Completed: Not available yet</p>
            <p>Best Seat Win: Not available yet</p>
            <p>This panel is now functional and ready for progression telemetry wiring.</p>
          </div>
        ),
      };
    }

    if (activeModal === 'patch') {
      return {
        title: 'Patch Notes',
        body: (
          <div className="space-y-2 text-sm text-text-secondary">
            <p>v1.1: Strategy weighting and seat projection logic improved.</p>
            <p>v1.1: State detail back navigation now restores dashboard reliably.</p>
            <p>v1.1: Added pre-campaign settings for turn count, polls, events, and budget scaling.</p>
            <p>v1.1: Main menu utility sections are now interactive.</p>
          </div>
        ),
      };
    }

    if (activeModal === 'about') {
      return {
        title: 'About Bharat Niti',
        body: (
          <div className="space-y-2 text-sm text-text-secondary">
            <p>Bharat Niti is a strategy simulation about campaign execution, coalition building, and electoral math.</p>
            <p>All party attributes are gameplay abstractions and not endorsements.</p>
            <p>Offline-first experience. No account login required.</p>
          </div>
        ),
      };
    }

    return {
      title: 'Exit',
      body: (
        <div className="space-y-3 text-sm text-text-secondary">
          <p>Close Bharat Niti session?</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                window.close();
                setActiveModal(null);
              }}
              className="btn-primary"
            >
              Exit
            </button>
            <button onClick={() => setActiveModal(null)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      ),
    };
  }

  return (
    <div className="relative w-full h-full animated-bg star-bg overflow-hidden">

      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-saffron/10 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-blue/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-india-green/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '3s' }} />

      {/* Scan line effect */}
      <div className="scan-line" />

      {/* India map silhouette background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none select-none">
        <svg viewBox="0 0 400 500" className="w-[80%] h-[80%] max-w-2xl">
          <text x="200" y="300" textAnchor="middle" fontSize="300" fontFamily="serif" fill="white" opacity="0.5">🇮🇳</text>
        </svg>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex h-full">

        {/* Left: Logo & Branding */}
        <div className="flex flex-col justify-center items-start px-16 w-1/2">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Indian flag stripe decoration */}
            <div className="flex gap-1 mb-8">
              <div className="h-1 w-16 bg-saffron rounded-full" />
              <div className="h-1 w-16 bg-white/80 rounded-full" />
              <div className="h-1 w-16 bg-india-green rounded-full" />
            </div>

            {/* Game title */}
            <div className="mb-2">
              <span className="text-xs uppercase tracking-[0.3em] text-saffron font-semibold">
                Indian Election Strategy Game
              </span>
            </div>
            <h1 className="font-display font-bold leading-none mb-1">
              <span className="text-8xl text-gradient-saffron block">भारत</span>
              <span className="text-8xl text-white block">नीति</span>
            </h1>
            <p className="text-3xl font-light text-text-secondary mt-2 mb-8 font-display tracking-wide">
              Bharat Niti
            </p>

            {/* Animated slogan */}
            <div className="h-8 overflow-hidden mb-12">
              <AnimatePresence mode="wait">
                <motion.p
                  key={slogan}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.5 }}
                  className="text-text-muted text-lg italic"
                >
                  "{SLOGANS[slogan]}"
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Version badge */}
            <div className="flex items-center gap-2">
              <div className="badge-saffron text-xs">v1.0</div>
              <span className="text-text-dim text-xs">2024 General Election Edition</span>
            </div>
          </motion.div>
        </div>

        {/* Right: Menu */}
        <div className="flex flex-col justify-center items-center w-1/2 pr-16">
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm"
          >
            <div className="space-y-3">
              {menuItems.map((item, i) => (
                <motion.button
                  key={item.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                  onClick={item.action}
                  disabled={item.disabled}
                  className={`
                    w-full flex items-center gap-4 px-6 py-4 rounded-2xl
                    border transition-all duration-200 text-left group
                    ${item.primary
                      ? 'bg-saffron/10 border-saffron/30 hover:bg-saffron/20 hover:border-saffron/60 shadow-saffron'
                      : 'glass-card border-white/[0.08] hover:border-white/20 hover:bg-white/[0.07]'
                    }
                    ${item.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <div className={`
                    p-2.5 rounded-xl transition-colors
                    ${item.primary ? 'bg-saffron text-white' : 'bg-white/[0.06] text-text-muted group-hover:text-saffron'}
                  `}>
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <div className={`font-semibold text-sm ${item.primary ? 'text-saffron' : 'text-text-primary'}`}>
                      {item.label}
                    </div>
                    <div className="text-text-muted text-xs mt-0.5">{item.sublabel}</div>
                  </div>
                  {item.primary && (
                    <motion.div
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="text-saffron"
                    >
                      →
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-8 flex items-center justify-between"
            >
              <button
                onClick={() => setActiveModal('about')}
                className="flex items-center gap-1.5 text-text-dim text-xs hover:text-text-muted transition-colors"
              >
                <Info className="w-3.5 h-3.5" />
                About
              </button>
              <p className="text-text-dim text-xs">
                Offline · No Login · No Data Collection
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Credits modal */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
            onClick={() => setActiveModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="glass-card p-8 max-w-md w-full mx-4"
            >
              {(() => {
                const modal = renderModalContent();
                if (!modal) return null;
                return (
                  <>
                    <h2 className="font-display font-bold text-2xl text-gradient-saffron mb-4">
                      {modal.title}
                    </h2>
                    {modal.body}
                    <button onClick={() => setActiveModal(null)} className="btn-primary mt-6 w-full">
                      Close
                    </button>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
