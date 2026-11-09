import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ComboEvent } from '../types';

interface ComboOverlayProps {
  comboEvent: ComboEvent | null;
}

/* A chain should look hotter the longer it runs. The word climbs the same ramp
   the score does — gold, orange, red — so the player reads the tier before
   reading the text. */
const comboTone = (count: number) => {
  if (count >= 6) return { fill: '#FF453A', glow: 'rgba(255,69,58,0.55)' };
  if (count >= 4) return { fill: '#FF9F0A', glow: 'rgba(255,159,10,0.5)' };
  return { fill: '#FFD60A', glow: 'rgba(255,214,10,0.45)' };
};

export const ComboOverlay: React.FC<ComboOverlayProps> = ({ comboEvent }) => {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="absolute inset-0 pointer-events-none flex items-center justify-center z-50 overflow-hidden"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence>
        {comboEvent && (
          <motion.div
            key={comboEvent.id}
            initial={reduceMotion ? { opacity: 0 } : { scale: 0.6, opacity: 0, rotate: -8, y: 40 }}
            animate={reduceMotion
              ? { opacity: [0, 1, 1, 0] }
              : {
                  scale: [0.6, 1.14, 1, 1],
                  opacity: [0, 1, 1, 0],
                  rotate: [6, -2, 0, 0],
                  y: [16, 0, -34, -46],
                }}
            transition={{ duration: 1.1, times: [0, 0.18, 0.76, 1], ease: 'easeOut' }}
            className="flex flex-col items-center"
            style={{ willChange: 'transform, opacity' }}
          >
            <span
              className="text-[2rem] sm:text-6xl font-black italic leading-none"
              style={{
                color: comboTone(comboEvent.count).fill,
                letterSpacing: '-0.04em',
                WebkitTextStroke: '2.5px rgba(0,0,0,0.85)',
                paintOrder: 'stroke fill',
                textShadow: `0 0 26px ${comboTone(comboEvent.count).glow}, 0 3px 0 rgba(0,0,0,0.7)`,
              }}
            >
              {comboEvent.text}
            </span>
            <span
              className="tnum font-black text-lg sm:text-2xl mt-1.5 text-ink"
              style={{
                WebkitTextStroke: '2px rgba(0,0,0,0.8)',
                paintOrder: 'stroke fill',
              }}
            >
              ×{comboEvent.count}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
