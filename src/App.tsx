/**
 * BHARAT NITI — Root App Component
 * Routes between screens using the game store.
 */

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from './store/gameStore';
import MainMenu from './screens/MainMenu';
import GameSetup from './screens/GameSetup';
import GameDashboard from './screens/GameDashboard';
import StateDetail from './screens/StateDetail';
import ElectionDay from './screens/ElectionDay';
import ElectionResults from './screens/ElectionResults';
import SaveLoadScreen from './screens/SaveLoadScreen';
import LoadingOverlay from './components/ui/LoadingOverlay';

const screenVariants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 1.02 },
};

export default function App() {
  const { screen, isLoading, loadingMessage, loadSaveSlots } = useGameStore();

  useEffect(() => {
    loadSaveSlots();
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-navy-900">
      {/* Global background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-radial from-navy-800/50 via-navy-900 to-navy-950" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-saffron/[0.03] rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-blue/[0.03] rounded-full blur-3xl" />
      </div>

      {/* Screen routing */}
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          variants={screenVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0"
        >
          {screen === 'main_menu' && <MainMenu />}
          {screen === 'game_setup' && <GameSetup />}
          {(screen === 'game_dashboard' || screen === 'campaign' ||
            screen === 'manifesto' || screen === 'alliance' ||
            screen === 'polls' || screen === 'candidates') && <GameDashboard />}
          {screen === 'state_detail' && <StateDetail />}
          {screen === 'election_day' && <ElectionDay />}
          {screen === 'results' && <ElectionResults />}
          {screen === 'save_load' && <SaveLoadScreen />}
        </motion.div>
      </AnimatePresence>

      {/* Loading overlay */}
      <AnimatePresence>
        {isLoading && <LoadingOverlay message={loadingMessage} />}
      </AnimatePresence>
    </div>
  );
}
