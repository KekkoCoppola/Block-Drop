import React, { useMemo, memo } from 'react';
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
      className="relative w-full h-full flex items-center justify-center transition-all duration-200 overflow-hidden"
      style={{
        backgroundColor: style.backgroundColor,
        boxShadow: isFull ? `0 0 20px 5px rgba(255, 60, 60, 0.8)` : style.boxShadow,
        borderRadius: '16px',
        ...styleOverride
      }}
    >
      {!isHidden && (
        <>
          <motion.span 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            key={value}
            className="font-black text-4xl z-10"
            style={{
              color: 'rgba(0,0,0,0.25)',
              textShadow: '0px 1px 0px rgba(255,255,255,0.25)',
            }}
          >
            {value}
          </motion.span>

          {/* Shine effect - Unified to match Card.tsx */}
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-tr from-transparent via-white/10 to-white/20 pointer-events-none rounded-xl" />

          {/* Glint Effect on Merge */}
          {isMerge && (
            <motion.div 
              initial={{ left: '-100%', top: '-100%' }}
              animate={{ left: '100%', top: '100%' }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeInOut" }}
              className="absolute w-[200%] h-[200%] bg-gradient-to-br from-transparent via-white/40 to-transparent rotate-45 z-30 pointer-events-none"
            />
          )}

          {isMerge && (
            <motion.div 
              initial={{ opacity: 0.8, scale: 0.8 }}
              animate={{ opacity: 0, scale: 1.5 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 bg-white z-20 pointer-events-none rounded-xl"
            />
          )}

          {isFull && (
            <motion.div 
              animate={{ opacity: [0, 0.4, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-red-600 z-10 pointer-events-none mix-blend-overlay rounded-xl"
            />
          )}
        </>
      )}
    </div>
  );
});
