import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CardData } from '../types';
import { getCardStyle } from '../constants';

interface CardProps {
  card: CardData;
  index: number; 
  isTop: boolean;
  onDragStart?: (e: React.PointerEvent) => void;
  isHidden?: boolean; 
  isFull?: boolean;
}

export const Card: React.FC<CardProps> = ({ card, index, isTop, onDragStart, isHidden, isFull }) => {
  const style = getCardStyle(card.value);
  const isMerge = card.isMerging;
  
  // Memoize random rotation so it doesn't change on re-renders, only on mount
  const randomRotate = useMemo(() => Math.random() * 20 - 10, []);

  // Ghost Style (When being dragged from this column)
  const ghostStyle = isHidden ? {
      opacity: 0.4,
      transform: 'scale(0.85)',
      boxShadow: 'none',
      border: '2px dashed rgba(255,255,255,0.3)',
      backgroundColor: 'rgba(255,255,255,0.05)'
  } : {};

  // CUTE & FLUID DROP ANIMATION
  const dropVariants = {
    initial: { 
      scale: 0.8, 
      y: -1000, 
      rotate: randomRotate 
    },
    animate: { 
      scale: 1, 
      y: 0, 
      rotate: 0, 
      transition: { 
        type: "spring", 
        stiffness: 180, 
        damping: 18,
        mass: 0.8,
      } 
    }
  };

  // Sharp Minimal Merge Animation
  const mergeVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { 
      scale: [1.2, 1], 
      opacity: 1,
      transition: { 
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1] // Sharp ease out
      } 
    }
  };

  // Sudden "Stamp" Text Animation
  const textVariants = {
    initial: { scale: 0.5, opacity: 0 },
    animate: { 
        scale: 1, 
        opacity: 1, 
        transition: {
            delay: 0.05, 
            duration: 0.2,
            ease: "easeOut"
        }
    }
  };

  const dangerGlow = isFull 
      ? `0 0 20px 5px rgba(255, 60, 60, 0.8)` 
      : style.boxShadow;

  return (
    <motion.div
      layoutId={card.id} // MAGICAL PROP: This enables fluid movement between columns
      layout // Also animate layout changes within column
      initial={isMerge ? mergeVariants.initial : (!card.isNew && !isHidden) ? false : dropVariants.initial} 
      animate={isMerge ? mergeVariants.animate : dropVariants.animate}
      whileHover={isTop && !isHidden ? { scale: 1.05, zIndex: 100 } : {}}
      whileTap={isTop && !isHidden ? { scale: 0.95 } : {}}
      className="absolute flex items-center justify-center select-none"
      style={{
        bottom: `${index * 25}%`, 
        height: '24%', 
        marginBottom: '0.5%',
        width: '94%',
        left: '3%',
        zIndex: isMerge ? 50 : index, 
        touchAction: 'none',
        cursor: isTop ? 'grab' : 'default',
      }}
      onPointerDown={(e) => {
        if (isTop && onDragStart) {
          onDragStart(e);
        }
      }}
    >
        {/* Main Card Body */}
        <div 
            className="relative w-full h-full flex items-center justify-center transition-all duration-200 overflow-hidden"
            style={{
                backgroundColor: style.backgroundColor,
                boxShadow: dangerGlow,
                borderRadius: style.borderRadius,
                ...ghostStyle
            }}
        >
            {!isHidden && (
                <>
                <motion.span 
                    variants={textVariants}
                    initial="initial"
                    animate="animate"
                    key={card.value}
                    className="font-black text-4xl z-10"
                    style={{
                        color: 'rgba(0,0,0,0.25)',
                        textShadow: '0px 1px 0px rgba(255,255,255,0.25)',
                    }}
                >
                    {card.value}
                </motion.span>

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

        {/* --- MINIMAL COLOR EXPLOSION MERGE --- */}
        {isMerge && !isHidden && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {/* 1. The "Exploding" Card Body */}
                <motion.div
                    initial={{ scale: 1, opacity: 1 }}
                    animate={{ 
                        scale: 2.2 + (card.comboLevel || 0) * 0.2, 
                        opacity: 0 
                    }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="absolute inset-0 rounded-xl z-20"
                    style={{ 
                        backgroundColor: style.backgroundColor,
                        boxShadow: `0 0 30px ${style.accent}`
                    }}
                />
                
                {/* 2. Sharp White Expansion Ring */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 1, border: '2px solid white' }}
                    animate={{ 
                        scale: 2.5, 
                        opacity: 0,
                        borderWidth: 0
                    }}
                    transition={{ duration: 0.4, ease: "circOut" }}
                    className="absolute inset-0 rounded-xl z-30"
                />

                {/* 3. Brief Impact Flash */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.6, 0] }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-[-20%] bg-white z-40 rounded-xl blur-lg"
                />
            </div>
        )}
    </motion.div>
  );
};
