/**
 * BHARAT NITI — Loading Overlay
 */

import { motion } from 'framer-motion';

interface Props { message?: string; }

export default function LoadingOverlay({ message = 'Loading...' }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-navy-950/90 backdrop-blur-md"
    >
      {/* Ashoka Chakra spinner */}
      <div className="relative w-24 h-24 mb-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="w-24 h-24"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,153,51,0.2)" strokeWidth="2" />
            <circle cx="50" cy="50" r="45" fill="none" stroke="#FF9933" strokeWidth="2"
              strokeDasharray="70 214" strokeLinecap="round" />
            {/* 24 spokes */}
            {Array.from({ length: 24 }).map((_, i) => (
              <line
                key={i}
                x1="50" y1="50"
                x2={50 + 40 * Math.cos((i * 15 - 90) * Math.PI / 180)}
                y2={50 + 40 * Math.sin((i * 15 - 90) * Math.PI / 180)}
                stroke="#FF9933"
                strokeWidth="1"
                opacity="0.6"
              />
            ))}
            <circle cx="50" cy="50" r="5" fill="#FF9933" />
          </svg>
        </motion.div>
      </div>

      <motion.p
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="text-text-secondary text-sm font-medium tracking-widest uppercase"
      >
        {message}
      </motion.p>

      <p className="mt-2 text-text-muted text-xs">भारत नीति</p>
    </motion.div>
  );
}
