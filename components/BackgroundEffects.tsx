import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Grid } from '../types';
import { MAX_ROWS } from '../constants';

interface BackgroundEffectsProps {
  comboCount: number;
  grid: Grid;
  beat: { count: number; phase: number };
  maxValReached?: number;
}

/**
 * The board's weather. It reports two things and nothing else: how far the run
 * has progressed (the ambient hue warms as higher blocks appear) and how close
 * it is to ending (danger rises from the floor). Everything here stays under
 * the merge — the merge is the loud moment, and a background that also pulses
 * six ways at once is what stopped it reading before.
 */
export const BackgroundEffects: React.FC<BackgroundEffectsProps> = ({ comboCount, grid, beat, maxValReached = 3 }) => {
  const reduceMotion = useReducedMotion();

  // How full the board is, 0..1 — a continuous signal rather than a binary flag,
  // so pressure builds visibly instead of snapping on at the last moment.
  const pressure = useMemo(() => {
    const filled = grid.reduce((sum, col) => sum + col.length, 0);
    return Math.min(1, filled / (grid.length * MAX_ROWS));
  }, [grid]);

  const isNearDanger = useMemo(
    () => grid.some(col => col.length >= MAX_ROWS - 1),
    [grid]
  );

  /* Progress reads as a warming ambient: blue early, violet mid-run, gold deep.
     These are radial gradients that fade to transparent, not tinted shapes — a
     flat colour inside a rounded box draws its own hard edge across the board,
     which is exactly what it used to do. The three layers cross-fade on
     opacity so the tier change is a temperature shift, not a swap. */
  const tier = maxValReached >= 10 ? 2 : maxValReached >= 7 ? 1 : 0;

  const washes = useMemo(
    () => [
      'radial-gradient(ellipse 70% 100% at 50% 0%, rgba(64,196,255,0.16) 0%, rgba(64,196,255,0.05) 45%, transparent 78%)',
      'radial-gradient(ellipse 70% 100% at 50% 0%, rgba(168,85,247,0.18) 0%, rgba(168,85,247,0.06) 45%, transparent 78%)',
      'radial-gradient(ellipse 70% 100% at 50% 0%, rgba(255,214,10,0.16) 0%, rgba(255,159,10,0.05) 45%, transparent 78%)',
    ],
    []
  );

  const comboTint = ['rgba(64,196,255,0.14)', 'rgba(168,85,247,0.16)', 'rgba(255,214,10,0.16)'][tier];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Static field. Free, and it gives the board somewhere to sit. */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '76px 76px',
        }}
      />

      {/* Ambient wash, tied to how far the run has come. */}
      {washes.map((image, i) => (
        <motion.div
          key={i}
          animate={{ opacity: tier === i ? 1 : 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          className="absolute inset-x-0 top-0 h-3/5"
          style={{ backgroundImage: image }}
        />
      ))}

      {/* The music's downbeat, once per bar. This is the only ambient loop left,
          and it exists because the soundtrack is generated live — the room
          should breathe with it. */}
      {!reduceMotion && (
        <motion.div
          key={`beat-${beat.count}`}
          initial={{ opacity: 0.5, scale: 0.98 }}
          animate={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="absolute inset-x-0 top-0 h-2/5 origin-top"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 60% 100% at 50% 0%, rgba(255,255,255,0.07) 0%, transparent 70%)',
          }}
        />
      )}

      {/* Combo heat: a brief lift under a chain, scaled by its length. */}
      {!reduceMotion && comboCount > 0 && (
        <motion.div
          key={`combo-heat-${comboCount}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, Math.min(1, 0.32 * comboCount), 0] }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(ellipse 80% 60% at 50% 55%, ${comboTint} 0%, transparent 72%)`,
          }}
        />
      )}

      {/* Pressure rising from the floor. Opacity tracks fullness continuously;
          the breath only starts once a column is one block from the top. */}
      <motion.div
        animate={{
          opacity: isNearDanger && !reduceMotion
            ? [0.35 + pressure * 0.2, 0.6 + pressure * 0.2, 0.35 + pressure * 0.2]
            : pressure * 0.5,
        }}
        transition={
          isNearDanger && !reduceMotion
            ? { duration: 1.9, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.8, ease: 'easeOut' }
        }
        className="absolute inset-x-0 bottom-0 h-2/5"
        style={{
          background: 'linear-gradient(0deg, rgba(255,69,58,0.30) 0%, transparent 100%)',
        }}
      />
    </div>
  );
};
