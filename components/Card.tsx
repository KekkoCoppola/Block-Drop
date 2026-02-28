import React, { useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { CardData } from '../types';
import { getCardStyle } from '../constants';
import { CardBody } from './CardBody';
import { MergeParticles } from './MergeParticles';

interface CardProps {
  card: CardData;
  index: number; 
  isTop: boolean;
  onDragStart?: (e: React.PointerEvent) => void;
  isHidden?: boolean; 
  isFull?: boolean;
  columnHeight?: number;
}

export const Card: React.FC<CardProps> = memo(({ card, index, isTop, onDragStart, isHidden, isFull, columnHeight }) => {
  const style = getCardStyle(card.value);
  const isMerge = card.isMerging;
  
  // Memoize random rotation so it doesn't change on re-renders, only on mount
  const randomRotate = useMemo(() => Math.random() * 20 - 10, []);

  // Calculate natural Y from top (relative to container)
  // bottom: index * 25% means natural Y from top is:
  // columnHeight - (index * 0.25 * columnHeight) - cardHeight
  // cardHeight is roughly 0.24 * columnHeight
  const naturalYFromTop = columnHeight ? columnHeight - (index * 0.25 * columnHeight) - (0.24 * columnHeight) : 0;
  
  // initial y relative to natural position
  const initialY = (card.dropFromY !== undefined && columnHeight) 
    ? card.dropFromY - naturalYFromTop 
    : -800;

  // Ghost Style (When being dragged from this column)
  const ghostStyle = isHidden ? {
      opacity: 0.6,
      transform: 'scale(0.9)',
      boxShadow: 'inset 0 0 20px rgba(255,255,255,0.1)',
      border: '2px dashed rgba(255,255,255,0.4)',
      backgroundColor: 'rgba(255,255,255,0.02)'
  } : {};

  // CLEAN & DIRECT DROP ANIMATION
  const dropVariants = {
    initial: { 
      scale: 1, 
      y: initialY, 
      rotate: 0,
      opacity: card.dropFromY !== undefined ? 1 : 0
    },
    animate: { 
      scale: 1,
      y: 0, 
      rotate: 0, 
      opacity: 1,
      transition: { 
        y: {
          type: "spring", 
          stiffness: 400, 
          damping: 40,
          mass: 1,
        },
        opacity: { duration: 0.2 }
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
      initial={isMerge ? mergeVariants.initial : dropVariants.initial} 
      animate={isMerge ? mergeVariants.animate : dropVariants.animate}
      whileHover={!isHidden ? { scale: 1.05, zIndex: 100 } : {}}
      whileTap={!isHidden ? { scale: 0.95 } : {}}
      className="absolute flex items-center justify-center select-none"
      style={{
        bottom: `${index * 25}%`, 
        height: '24%', 
        marginBottom: '0.5%',
        width: '94%',
        left: '3%',
        zIndex: isMerge ? 50 : index, 
        touchAction: 'none',
        cursor: 'grab',
        willChange: 'transform, opacity',
      }}
      onPointerDown={(e) => {
        if (onDragStart) {
          onDragStart(e);
        }
      }}
    >
        {/* Main Card Body */}
        <CardBody 
            value={card.value}
            isMerge={isMerge}
            isFull={isFull}
            isHidden={isHidden}
            styleOverride={ghostStyle}
        />

        {/* --- MINIMAL COLOR EXPLOSION MERGE --- */}
        {isMerge && !isHidden && (
            <>
            <MergeParticles color={style.accent} />
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
            </>
        )}
    </motion.div>
  );
});
