import React from 'react';
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
  
  if (isHidden) return null;

  // Standard Drop Animation
  const dropVariants = {
    initial: { scale: 0.5, y: -100, opacity: 0 },
    animate: { 
      scale: 1, 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 500, 
        damping: 30,
        mass: 1
      } 
    }
  };

  // Explosive Merge Animation (The block swells then snaps back)
  const mergeVariants = {
    initial: { scale: 1.2, opacity: 0 },
    animate: { 
      scale: [1.2, 0.9, 1.05, 1], 
      opacity: 1,
      transition: { 
        duration: 0.4,
        ease: "circOut"
      } 
    }
  };

  // "Stamped" Text Animation
  const textVariants = {
    initial: { scale: 1.5, opacity: 0, filter: 'blur(4px)' },
    animate: { 
        scale: 1, 
        opacity: 1, 
        filter: 'blur(0px)',
        transition: {
            delay: 0.05, 
            type: "spring",
            stiffness: 400,
            damping: 12
        }
    }
  };

  const dangerGlow = isFull 
      ? `0 0 20px 5px rgba(255, 60, 60, 0.8)` 
      : style.boxShadow;

  return (
    <motion.div
      layout
      initial={isMerge ? mergeVariants.initial : dropVariants.initial}
      animate={isMerge ? mergeVariants.animate : dropVariants.animate}
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
                backgroundColor: style.background,
                boxShadow: dangerGlow,
                borderRadius: style.borderRadius,
            }}
        >
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

            {isMerge && (
                <motion.div 
                    initial={{ opacity: 0.6 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 bg-white z-20 pointer-events-none mix-blend-overlay rounded-xl"
                />
            )}

            {isFull && (
                <motion.div 
                    animate={{ opacity: [0, 0.4, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 bg-red-600 z-10 pointer-events-none mix-blend-overlay rounded-xl"
                />
            )}
        </div>

        {/* --- ENHANCED PARTICLE SYSTEM --- */}
        {isMerge && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {/* 1. Shockwave Ring */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0.8, borderWidth: "6px" }}
                    animate={{ scale: 2.2, opacity: 0, borderWidth: "0px" }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="absolute inset-0 border-white rounded-xl z-30"
                    style={{ borderColor: style.accent }}
                />
                
                {/* 2. Secondary Shockwave (Delayed) */}
                 <motion.div
                    initial={{ scale: 0.8, opacity: 0, borderWidth: "4px" }}
                    animate={{ scale: 1.8, opacity: 0, borderWidth: "0px" }}
                    transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
                    className="absolute inset-0 border-white rounded-xl z-30"
                />

                {/* 3. Block Debris - Primary Color */}
                {Array.from({ length: 8 }).map((_, i) => {
                    const angle = (i / 8) * 360 + Math.random() * 20;
                    const rad = angle * (Math.PI / 180);
                    const dist = 140 + Math.random() * 40;
                    
                    return (
                        <motion.div
                            key={`debris-main-${i}`}
                            initial={{ x: 0, y: 0, scale: 0.8, opacity: 1 }}
                            animate={{ 
                                x: Math.cos(rad) * dist, 
                                y: Math.sin(rad) * dist, 
                                scale: 0, 
                                opacity: 0,
                                rotate: Math.random() * 360
                            }}
                            transition={{ duration: 0.7, ease: "circOut" }}
                            className="absolute w-6 h-6 z-20 rounded-md"
                            style={{ 
                              backgroundColor: style.background,
                              boxShadow: 'inset -2px -2px 0 rgba(0,0,0,0.1)' 
                            }}
                        />
                    );
                })}

                {/* 4. Accent Debris - Lighter Color */}
                {Array.from({ length: 6 }).map((_, i) => {
                    const angle = (i / 6) * 360 + 45 + Math.random() * 20;
                    const rad = angle * (Math.PI / 180);
                    const dist = 100 + Math.random() * 30;
                    
                    return (
                        <motion.div
                            key={`debris-accent-${i}`}
                            initial={{ x: 0, y: 0, scale: 0.6, opacity: 1 }}
                            animate={{ 
                                x: Math.cos(rad) * dist, 
                                y: Math.sin(rad) * dist, 
                                scale: 0, 
                                opacity: 0,
                                rotate: -Math.random() * 360
                            }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="absolute w-4 h-4 z-20 rounded-full"
                            style={{ 
                              backgroundColor: style.accent,
                            }}
                        />
                    );
                })}

                {/* 5. Fast Sparks - White */}
                {Array.from({ length: 12 }).map((_, i) => {
                    const angle = Math.random() * 360;
                    const rad = angle * (Math.PI / 180);
                    const dist = 150 + Math.random() * 100;
                    
                    return (
                        <motion.div
                            key={`spark-${i}`}
                            initial={{ x: 0, y: 0, scale: 1 }}
                            animate={{ 
                                x: Math.cos(rad) * dist, 
                                y: Math.sin(rad) * dist, 
                                scale: 0, 
                                opacity: 0 
                            }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="absolute w-1 h-1 rounded-full z-20 bg-white"
                        />
                    );
                })}
            </div>
        )}
    </motion.div>
  );
};
