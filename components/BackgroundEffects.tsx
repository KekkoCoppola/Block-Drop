import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Grid } from '../types';
import { MAX_ROWS } from '../constants';

interface BackgroundEffectsProps {
  comboCount: number;
  grid: Grid;
}

export const BackgroundEffects: React.FC<BackgroundEffectsProps> = ({ comboCount, grid }) => {
  // Check if any column is nearly full (MAX_ROWS - 1)
  const isNearDanger = useMemo(() => {
    return grid.some(col => col.length >= MAX_ROWS - 1);
  }, [grid]);

  // Static particles that just float around
  const particles = useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      size: Math.random() * 3 + 1,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 25 + 15,
      delay: Math.random() * -25,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Floating Dust Particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: `${p.x}%`, y: `${p.y}%`, opacity: 0.05 }}
          animate={{
            y: [`${p.y}%`, `${(p.y + 15) % 100}%`, `${p.y}%`],
            x: [`${p.x}%`, `${(p.x + 8) % 100}%`, `${p.x}%`],
            opacity: [0.05, 0.15, 0.05],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "linear",
            delay: p.delay,
          }}
          className="absolute bg-blue-300/20 rounded-full blur-[1px]"
          style={{ width: p.size, height: p.size }}
        />
      ))}

      {/* Reactive Ambient Glow - Pulses with combo */}
      <motion.div
        animate={{
          scale: comboCount > 0 ? [1, 1.1, 1] : 1,
          opacity: comboCount > 0 ? [0.05, 0.15, 0.05] : 0.05,
          backgroundColor: isNearDanger ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
        }}
        transition={{ duration: 0.4 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full blur-[120px] rounded-full"
      />

      {/* Danger Vignette */}
      <motion.div 
        animate={{
          opacity: isNearDanger ? [0.1, 0.2, 0.1] : 0
        }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-0 bg-gradient-to-t from-red-500/10 via-transparent to-transparent"
      />

      {/* Subtle Grid Lines */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />
    </div>
  );
};
