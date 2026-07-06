/**
 * BHARAT NITI — Glass Card Component
 */

import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  glow?: 'saffron' | 'blue' | 'green' | 'none';
  animate?: boolean;
  delay?: number;
}

export default function GlassCard({
  children,
  className,
  onClick,
  hover = false,
  glow = 'none',
  animate = false,
  delay = 0,
}: GlassCardProps) {
  const glowClass = {
    saffron: 'hover:shadow-saffron',
    blue: 'hover:shadow-blue-glow',
    green: 'hover:glow-green',
    none: '',
  }[glow];

  const content = (
    <div
      className={cn(
        'glass-card',
        hover && 'glass-card-hover',
        glowClass,
        onClick && 'cursor-pointer',
        className,
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
}
