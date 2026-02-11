import React from 'react';
import { motion } from 'framer-motion';
import { getCardStyle } from '../constants';

interface NextCardProps {
  value: number;
  xPosition?: number | null; 
}

export const NextCard: React.FC<NextCardProps> = ({ value, xPosition }) => {
  const style = getCardStyle(value);

  return (
    <div className="relative flex justify-center items-center h-28 mb-2 pointer-events-none">
      <motion.div
        layout
        key={value}
        initial={{ scale: 0.8, opacity: 0, y: -20, rotateX: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
        className="w-20 h-24 flex items-center justify-center shadow-2xl z-50 overflow-hidden"
        style={{
          // Use same visual logic as Card.tsx
          background: style.background,
          border: style.border,
          boxShadow: `0 20px 25px -5px rgba(0, 0, 0, 0.5), ${style.boxShadow}`,
          borderRadius: '16px',
          
          position: xPosition !== undefined && xPosition !== null ? 'fixed' : 'relative',
          left: xPosition !== undefined && xPosition !== null ? xPosition : undefined,
          top: xPosition !== undefined && xPosition !== null ? '20%' : undefined,
          transform: xPosition !== undefined && xPosition !== null ? 'translateX(-50%)' : undefined,
        }}
      >
        {/* Stamped Number */}
        <span 
            className="font-black text-4xl z-10"
            style={{
                color: 'rgba(0,0,0,0.25)',
                textShadow: '0px 1px 0px rgba(255,255,255,0.25)',
            }}
        >
            {value}
        </span>

         {/* Shine effect */}
         <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-white/10 to-transparent skew-x-12" />
      </motion.div>
      
      {/* "Next" Label if static */}
      {(xPosition === undefined || xPosition === null) && (
        <span className="absolute -top-4 text-slate-500 text-[10px] font-bold tracking-[0.2em] uppercase">
          PROSSIMO
        </span>
      )}
    </div>
  );
};