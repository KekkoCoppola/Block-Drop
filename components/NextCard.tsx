import React from 'react';
import { motion } from 'framer-motion';
import { getCardStyle } from '../constants';
import { Move } from 'lucide-react';
import { CardBody } from './CardBody';

interface NextCardProps {
  value: number;
  secondNextValue?: number;
  xPosition?: number | null;
  yPosition?: number | null;
  isMoving?: boolean; 
  isTouching?: boolean;
  showLabel?: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
}

export const NextCard: React.FC<NextCardProps> = ({ value, secondNextValue, xPosition, yPosition, isMoving, isTouching, showLabel = true, onPointerDown }) => {
  const style = getCardStyle(value);
  const secondStyle = secondNextValue ? getCardStyle(secondNextValue) : null;
  const isIdle = xPosition === undefined || xPosition === null;
  const isDragging = !isIdle;

  // If we are moving an existing card, we add extra visual flair
  const moveStyle = isMoving ? {
    border: '2px dashed #FACC15', // Yellow-400
    scale: 1.15,
    opacity: 0.9,
  } : {};

  return (
    <div 
      className={`relative flex justify-center items-center h-32 sm:h-36 mb-1 sm:mb-2 z-50 ${isIdle ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}`}
      onPointerDown={isIdle ? onPointerDown : undefined}
    >
      {/* Drop Zone Visual Hint (Subtle dashed area) */}
      {isIdle && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-24 h-28 border-2 border-dashed border-white/5 rounded-3xl" />
        </div>
      )}
      
      {/* The actual card that moves */}
      <motion.div
        key={value}
        initial={{ scale: 0.0, opacity: 0, y: 50, rotate: -20 }}
        animate={{ 
            scale: isDragging ? 1.15 : isTouching ? 1.1 : 1, 
            opacity: 1, 
            y: isDragging ? -15 : isTouching ? -12 : [0, -8, 0], 
            rotate: (isDragging || isTouching) ? 0 : [-1, 1, -1],
            x: isDragging ? xPosition! - (window.innerWidth / 2) : 0,
        }}
        transition={{ 
            y: (isDragging || isTouching) ? {
                type: "spring", 
                stiffness: 400, 
                damping: 30 
            } : {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
            },
            rotate: (isDragging || isTouching) ? {
                type: "spring", 
                stiffness: 400, 
                damping: 30 
            } : {
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut"
            },
            scale: {
                type: "spring", 
                stiffness: 400, 
                damping: 25
            },
            x: {
                type: "spring", 
                stiffness: 500, 
                damping: 35,
                mass: 0.5
            }
        }}
        className="w-20 h-24 flex items-center justify-center overflow-visible relative"
        style={{
          position: isDragging ? 'fixed' : 'relative',
          left: isDragging ? '50%' : 'auto',
          top: isDragging ? yPosition! - 60 : 'auto', // Offset to show card above finger
          marginLeft: isDragging ? '-40px' : '0', // Half width
          zIndex: 100,
          willChange: 'transform, opacity, top, left',
        }}
      >
        {/* Subtle Idle Glow */}
        {isIdle && (
            <motion.div 
                animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-[-10%] blur-xl rounded-2xl z-0"
                style={{ backgroundColor: style.accent }}
            />
        )}
        
        {/* Visual feedback when user is touching but not dragging yet */}
        {/* We can't easily detect "touching but not dragging" here without more props, 
            but we can use the fact that xPosition is null but the component is rendered with a value.
            Actually, the parent App.tsx handles the logic. 
            If isIdle is true, it shows the idle animation.
        */}
        
        {/* Move Glow */}
        {isMoving && (
            <motion.div 
                animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-[-20%] blur-2xl rounded-2xl z-0 bg-yellow-400"
            />
        )}

        <CardBody 
            value={value} 
            styleOverride={{
                ...moveStyle,
                boxShadow: isIdle ? style.boxShadow : isMoving ? `0 0 30px 10px rgba(250, 204, 21, 0.6), ${style.boxShadow}` : `0 20px 25px -5px rgba(0, 0, 0, 0.5), ${style.boxShadow}`,
                zIndex: 10
            }}
        />

         {/* Moving Icon Overlay */}
         {isMoving && (
             <motion.div 
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 rounded-2xl"
             >
                 <div className="bg-yellow-400 p-2 rounded-full shadow-lg">
                    <Move size={20} className="text-slate-900" />
                 </div>
             </motion.div>
         )}

         {/* Label attached to the moving card */}
         {isDragging && (
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`absolute top-[110%] text-white text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full backdrop-blur-md shadow-xl border whitespace-nowrap ${isMoving ? 'bg-yellow-600/90 border-yellow-400/50' : 'bg-slate-900/80 border-white/10'}`}
            >
                {isMoving ? "SPOSTA" : "RILASCIA"}
            </motion.div>
         )}
      </motion.div>
      
      {/* Idle Label */}
      {isIdle && showLabel && (
        <div className="absolute -top-10 sm:-top-8 flex flex-col items-center gap-1">
          <span className="text-slate-400 text-[10px] font-bold tracking-[0.2em] uppercase">
            PROSSIMO
          </span>
          <motion.span 
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-blue-400/60 text-[8px] font-black tracking-widest uppercase"
          >
            TRASCINA PER GIOCARE
          </motion.span>
        </div>
      )}

      {/* Second Next Card (Preview of what's after next) */}
      {isIdle && secondNextValue && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 0.6, x: 0 }}
          key={`second-${secondNextValue}`}
          className="absolute left-[calc(50%+60px)] w-12 h-14 flex items-center justify-center"
        >
          <CardBody 
            value={secondNextValue} 
            styleOverride={{
              scale: 0.6,
              opacity: 0.8,
              boxShadow: secondStyle?.boxShadow,
            }}
          />
        </motion.div>
      )}
    </div>
  );
};
