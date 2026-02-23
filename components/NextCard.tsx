import React from 'react';
import { motion } from 'framer-motion';
import { getCardStyle } from '../constants';
import { ArrowRightLeft } from 'lucide-react';

interface NextCardProps {
  value: number;
  xPosition?: number | null;
  isMoving?: boolean; 
}

export const NextCard: React.FC<NextCardProps> = ({ value, xPosition, isMoving }) => {
  const style = getCardStyle(value);

  // If we are moving an existing card, we add extra visual flair
  const moveStyle = isMoving ? {
    border: '3px solid #FACC15', // Yellow-400
    scale: 1.1,
  } : {};

  return (
    <div className="relative flex justify-center items-center h-28 mb-2 pointer-events-none z-50">
      <motion.div
        layout
        key={value} // Key helps react identify change
        initial={{ scale: 0.0, opacity: 0, y: 50, rotate: -20 }}
        animate={{ 
            scale: isMoving ? 1.15 : 1, 
            opacity: 1, 
            y: 0, 
            rotate: isMoving ? 5 : 0,
            x: xPosition !== undefined && xPosition !== null ? xPosition - (window.innerWidth / 2) : 0
        }}
        transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 25,
            mass: 0.5 
        }}
        className="w-20 h-24 flex items-center justify-center shadow-2xl overflow-hidden relative"
        style={{
          // Base styles
          backgroundColor: style.backgroundColor,
          border: style.border,
          boxShadow: `0 20px 25px -5px rgba(0, 0, 0, 0.5), ${style.boxShadow}`,
          borderRadius: '16px',
          
          // Positioning logic
          position: 'relative',
          top: xPosition !== undefined && xPosition !== null ? '10%' : '0%',
          
          // Move Overrides
          ...moveStyle
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
         <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-white/10 to-transparent skew-x-12 pointer-events-none" />

         {/* Moving Icon Overlay */}
         {isMoving && (
             <motion.div 
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-black/20 z-20"
             >
                 <div className="bg-white/90 p-2 rounded-full shadow-lg">
                    <ArrowRightLeft size={20} className="text-slate-900" />
                 </div>
             </motion.div>
         )}
      </motion.div>
      
      {/* Label: Changes based on state */}
      {(xPosition === undefined || xPosition === null) ? (
        <span className="absolute -top-4 text-slate-500 text-[10px] font-bold tracking-[0.2em] uppercase">
          PROSSIMO
        </span>
      ) : (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ 
                opacity: 1, 
                y: 0,
                x: xPosition - (window.innerWidth / 2)
            }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute top-[80%] text-white text-[10px] font-black tracking-widest uppercase bg-slate-900/80 px-3 py-1 rounded-full backdrop-blur-md shadow-xl border border-white/10"
        >
            {isMoving ? "SPOSTA" : "RILASCIA"}
        </motion.div>
      )}
    </div>
  );
};
