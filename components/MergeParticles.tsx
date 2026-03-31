import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  angle: number;
  distance: number;
}

interface MergeParticlesProps {
  color: string;
  count?: number;
}

export const MergeParticles: React.FC<MergeParticlesProps> = ({ color, count = 4 }) => {
  const particles = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      angle: (Math.PI * 2 * i) / count + (Math.random() * 0.4 - 0.2),
      distance: 40 + Math.random() * 40,
      size: 3 + Math.random() * 4,
      duration: 0.3 + Math.random() * 0.2,
      isSquare: Math.random() > 0.5,
    }));
  }, [count]);

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 }}
          animate={{
            x: Math.cos(p.angle) * p.distance,
            y: Math.sin(p.angle) * p.distance,
            scale: 0,
            opacity: 0,
            rotate: p.isSquare ? 90 : 0,
          }}
          transition={{
            duration: p.duration,
            ease: [0.1, 0.9, 0.2, 1],
          }}
          className={`absolute ${p.isSquare ? 'rounded-sm' : 'rounded-full'}`}
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: color,
            willChange: 'transform, opacity',
          }}
        />
      ))}
    </div>
  );
};
