/**
 * BHARAT NITI — Events Feed
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { AlertTriangle, TrendingUp, TrendingDown, Star, Zap, Users, Flame } from 'lucide-react';

function EventIcon({ icon }: { icon?: string }) {
  const map: Record<string, React.ReactNode> = {
    TrendingUp: <TrendingUp className="w-3.5 h-3.5" />,
    TrendingDown: <TrendingDown className="w-3.5 h-3.5" />,
    AlertTriangle: <AlertTriangle className="w-3.5 h-3.5" />,
    Star: <Star className="w-3.5 h-3.5" />,
    Zap: <Zap className="w-3.5 h-3.5" />,
    Users: <Users className="w-3.5 h-3.5" />,
    Flame: <Flame className="w-3.5 h-3.5" />,
  };
  return <>{map[icon ?? ''] ?? <Zap className="w-3.5 h-3.5" />}</>;
}

export default function EventsFeed() {
  const { gameState } = useGameStore();
  if (!gameState) return null;

  const events = [
    ...gameState.notifications.slice(-15).reverse(),
    ...gameState.activeEvents.map(e => ({
      id: e.id,
      title: e.title,
      message: e.description,
      type: e.isPositive ? 'success' : 'danger',
      turn: 0,
      timestamp: Date.now(),
      isRead: false,
      icon: e.icon,
    } as typeof gameState.notifications[0])),
  ];

  if (events.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="text-2xl mb-2">📰</div>
        <p className="text-text-dim text-xs">Campaign events will appear here</p>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-2">
      <AnimatePresence>
        {events.map((event, i) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`
              p-3 rounded-xl border text-xs
              ${event.type === 'success' ? 'bg-india-green/10 border-india-green/20' :
                event.type === 'danger' ? 'bg-red-500/10 border-red-500/20' :
                event.type === 'warning' ? 'bg-saffron/10 border-saffron/20' :
                'bg-white/[0.04] border-white/[0.06]'}
              ${event.isRead ? 'opacity-60' : ''}
            `}
          >
            <div className="flex items-start gap-2">
              <div className={`
                mt-0.5 flex-shrink-0
                ${event.type === 'success' ? 'text-india-green' :
                  event.type === 'danger' ? 'text-red-400' :
                  event.type === 'warning' ? 'text-saffron' : 'text-text-muted'}
              `}>
                <EventIcon icon={event.icon} />
              </div>
              <div>
                <div className="font-semibold text-text-primary leading-tight">{event.title}</div>
                <p className="text-text-muted mt-0.5 leading-relaxed">{event.message}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
