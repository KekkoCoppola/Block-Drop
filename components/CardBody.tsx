import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { getCardStyle } from '../constants';

interface CardBodyProps {
  value: number;
  isMerge?: boolean;
  isFull?: boolean;
  isHidden?: boolean;
  styleOverride?: React.CSSProperties;
}

export const CardBody: React.FC<CardBodyProps> = memo(({
  value,
  isMerge,
  isFull,
  isHidden,
  styleOverride
}) => {
  const style = getCardStyle(value);

  return (
    <div
      className="relative w-full h-full flex items-center justify-center overflow-hidden"
      style={{
        backgroundColor: style.backgroundColor,
        boxShadow: isFull
          ? `${style.boxShadow}, 0 0 0 2px rgba(255, 69, 58, 0.9), 0 0 18px 2px rgba(255, 69, 58, 0.45)`
          : style.boxShadow,
        borderRadius: '16px',
        ...styleOverride
      }}
    >
      {!isHidden && (
        <>
          {/* Light falloff across the face. Sits under everything else so the
              numeral and effects read on top of lit plastic, not flat fill. */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none rounded-[16px]"
            style={{ backgroundImage: style.faceGradient }}
          />

          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            key={value}
            className="tnum font-black text-4xl z-10 leading-none"
            style={{
              color: style.ink,
              textShadow: style.inkShadow,
              letterSpacing: '-0.03em',
            }}
          >
            {value}
          </motion.span>

          {/* Merge: a single diagonal glint reading as light raking across the
              fresh surface, plus a brief bloom. One idea, two layers. */}
          {isMerge && (
            <>
              <motion.div
                initial={{ left: '-120%', top: '-120%' }}
                animate={{ left: '110%', top: '110%' }}
                transition={{ duration: 0.55, delay: 0.12, ease: 'easeInOut' }}
                className="absolute w-[200%] h-[200%] bg-gradient-to-br from-transparent via-white/45 to-transparent rotate-45 z-30 pointer-events-none"
              />
              <motion.div
                initial={{ opacity: 0.85, scale: 0.85 }}
                animate={{ opacity: 0, scale: 1.4 }}
                transition={{ duration: 0.36, ease: 'easeOut' }}
                className="absolute inset-0 bg-white z-20 pointer-events-none rounded-[16px]"
              />
            </>
          )}

          {/* Danger is a slow breath, not a strobe: the column is about to end
              the run and the player needs to read it while still playing. */}
          {isFull && (
            <motion.div
              animate={{ opacity: [0.12, 0.34, 0.12] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 z-10 pointer-events-none rounded-[16px]"
              style={{ backgroundColor: 'rgba(255, 69, 58, 0.75)', mixBlendMode: 'overlay' }}
            />
          )}
        </>
      )}
    </div>
  );
});
