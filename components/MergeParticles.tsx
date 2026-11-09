import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface MergeParticlesProps {
  /** Highlight colour of the merging block. */
  color: string;
  /** Face colour, mixed in so debris reads as pieces of the block itself. */
  faceColor?: string;
  /** Combo depth; a longer chain throws more, and further. */
  combo?: number;
}

export const MergeParticles: React.FC<MergeParticlesProps> = ({ color, faceColor, combo = 0 }) => {
  const count = Math.min(10, 5 + combo);

  const particles = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      // Even fan with jitter, so it scatters without ever looking like a clock face.
      angle: (Math.PI * 2 * i) / count + (Math.random() * 0.5 - 0.25),
      distance: 44 + Math.random() * 46 + combo * 8,
      size: 3 + Math.random() * 5,
      duration: 0.34 + Math.random() * 0.22,
      spin: Math.random() * 180 - 90,
      isSquare: Math.random() > 0.45,
      tint: Math.random() > 0.5 && faceColor ? faceColor : color,
    }));
  }, [count, combo, color, faceColor]);

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 }}
          animate={{
            x: Math.cos(p.angle) * p.distance,
            // Debris falls slightly as it flies, so it obeys the board's gravity.
            y: Math.sin(p.angle) * p.distance + 14,
            scale: 0,
            opacity: 0,
            rotate: p.spin,
          }}
          transition={{ duration: p.duration, ease: [0.1, 0.9, 0.2, 1] }}
          className={`absolute ${p.isSquare ? 'rounded-[2px]' : 'rounded-full'}`}
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.tint,
            willChange: 'transform, opacity',
          }}
        />
      ))}
    </div>
  );
};
