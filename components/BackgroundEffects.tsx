import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid } from '../types';
import { MAX_ROWS } from '../constants';

interface BackgroundEffectsProps {
  comboCount: number;
  grid: Grid;
  beat: { count: number; phase: number };
  maxValReached?: number;
}

export const BackgroundEffects: React.FC<BackgroundEffectsProps> = ({ comboCount, grid, beat, maxValReached = 3 }) => {
  // Check if any column is nearly full (MAX_ROWS - 1)
  const isNearDanger = useMemo(() => {
    return grid.some(col => col.length >= MAX_ROWS - 1);
  }, [grid]);

  // Static particles that just float around
  const particles = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      size: Math.random() * 2 + 1,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 20 + 20,
      delay: Math.random() * -20,
      color: i % 3 === 0 ? 'rgba(59, 130, 246, 0.2)' : i % 3 === 1 ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.1)',
    }));
  }, []);

  // Color based on max value reached
  const themeColor = useMemo(() => {
    if (isNearDanger) return 'rgba(239, 68, 68, 0.15)';
    if (maxValReached >= 10) return 'rgba(234, 179, 8, 0.1)'; // Gold
    if (maxValReached >= 7) return 'rgba(168, 85, 247, 0.1)'; // Purple
    return 'rgba(59, 130, 246, 0.1)'; // Blue
  }, [maxValReached, isNearDanger]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Beat-Synced Pulsing Lights */}
      <motion.div
        key={`beat-${beat.count}`}
        initial={{ opacity: 0.1, scale: 0.95 }}
        animate={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="absolute top-[-10%] left-[-10%] w-[120%] h-[40%] bg-blue-500/5 blur-[60px] rounded-full pointer-events-none"
      />
      
      {/* Side Glows that pulse on beat */}
      <motion.div
        animate={{
            opacity: [0.02, 0.06, 0.02],
            scale: beat.count % 4 === 0 ? [1, 1.02, 1] : 1
        }}
        transition={{ duration: 0.5 }}
        className="absolute left-[-10%] top-1/4 w-40 h-1/2 bg-purple-500/10 blur-[50px] rounded-full"
      />
      <motion.div
        animate={{
            opacity: [0.02, 0.06, 0.02],
            scale: beat.count % 4 === 0 ? [1, 1.02, 1] : 1
        }}
        transition={{ duration: 0.5 }}
        className="absolute right-[-10%] top-1/3 w-40 h-1/2 bg-blue-500/10 blur-[50px] rounded-full"
      />

      {/* Floating Dust Particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: `${p.x}%`, y: `${p.y}%`, opacity: 0.05 }}
          animate={{
            y: [`${p.y}%`, `${(p.y + 20) % 100}%`, `${p.y}%`],
            x: [`${p.x}%`, `${(p.x + 10) % 100}%`, `${p.x}%`],
            opacity: comboCount > 0 ? [0.1, 0.3, 0.1] : [0.05, 0.15, 0.05],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "linear",
            delay: p.delay,
          }}
          className="absolute rounded-full blur-[1px]"
          style={{ 
            width: p.size, 
            height: p.size,
            backgroundColor: p.color
          }}
        />
      ))}

      {/* Reactive Ambient Glow - Pulses with combo */}
      <motion.div
        animate={{
          scale: comboCount > 0 ? [1, 1.1, 1] : 1,
          opacity: comboCount > 0 ? [0.08, 0.2, 0.08] : 0.06,
          backgroundColor: themeColor,
        }}
        transition={{ duration: 0.5 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full blur-[80px] rounded-full"
      />

      {/* Shooting Star effect on high combo */}
      <AnimatePresence>
        {comboCount >= 2 && (
          <motion.div
            initial={{ x: '-10%', y: '20%', opacity: 0 }}
            animate={{ x: '110%', y: '40%', opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute h-[1px] w-32 bg-gradient-to-r from-transparent via-white/40 to-transparent rotate-[15deg] blur-[1px]"
          />
        )}
      </AnimatePresence>

      {/* Danger Vignette */}
      <motion.div 
        animate={{
          opacity: isNearDanger ? [0.15, 0.3, 0.15] : 0
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="absolute inset-0 bg-gradient-to-t from-red-500/20 via-transparent to-transparent"
      />

      {/* Subtle Grid Lines */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }}
      />
    </div>
  );
};
