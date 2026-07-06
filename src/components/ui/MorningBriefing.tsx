import { motion } from 'framer-motion';
import { Target, AlertTriangle, Zap, CheckCircle2, ChevronRight } from 'lucide-react';
import type { GameState } from '../../engine/types';

interface MorningBriefingProps {
  briefing: GameState['morningBriefing'];
  onClose: () => void;
}

export default function MorningBriefing({ briefing, onClose }: MorningBriefingProps) {
  if (!briefing || briefing.events.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl bg-navy-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="p-6 border-b border-white/10 bg-white/[0.02]">
          <h2 className="text-2xl font-display font-bold text-white flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-saffron/20 flex items-center justify-center text-saffron">
              <Zap className="w-4 h-4" />
            </span>
            Morning Briefing — Turn {briefing.turn}
          </h2>
          <p className="text-text-muted text-sm mt-1">Overnight developments and campaign intelligence</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 panel-scroll">
          {briefing.events.map((event, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`p-4 rounded-xl border flex gap-4 ${
                event.type === 'success' ? 'bg-india-green/10 border-india-green/20' :
                event.type === 'danger' ? 'bg-red-500/10 border-red-500/20' :
                'bg-blue-500/10 border-blue-500/20'
              }`}
            >
              <div className={`mt-1 ${
                event.type === 'success' ? 'text-india-green' :
                event.type === 'danger' ? 'text-red-500' :
                'text-blue-400'
              }`}>
                {event.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> :
                 event.type === 'danger' ? <AlertTriangle className="w-5 h-5" /> :
                 <Target className="w-5 h-5" />}
              </div>
              <div>
                <h4 className={`font-semibold text-sm ${
                  event.type === 'success' ? 'text-india-green' :
                  event.type === 'danger' ? 'text-red-400' :
                  'text-blue-300'
                }`}>
                  {event.title}
                </h4>
                <p className="text-sm text-text-primary mt-1 leading-relaxed">
                  {event.message}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="p-4 border-t border-white/10 bg-black/20 flex justify-end">
          <button
            onClick={onClose}
            className="btn-primary px-6 py-2 flex items-center gap-2"
          >
            Acknowledge & Begin Day <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
