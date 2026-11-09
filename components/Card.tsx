import React, { memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
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
  const reduceMotion = useReducedMotion();
  const combo = card.comboLevel || 0;

  // Natural Y from the top of the column, derived from the same 25%/24% layout
  // the cards are positioned with below.
  const naturalYFromTop = columnHeight ? columnHeight - (index * 0.25 * columnHeight) - (0.24 * columnHeight) : 0;

  /* A card only falls if it was actually dropped this session — dropFromY is the
     pointer position the move came from. Cards restored from a save have no
     origin, and flying them in from off-screen made a resumed game replay itself
     and left the board looking empty for the first half second. Those settle in
     place instead. */
  const isRestored = card.dropFromY === undefined;
  const initialY = (!isRestored && columnHeight)
    ? card.dropFromY! - naturalYFromTop
    : 0;

  // Ghost Style (When being dragged from this column)
  const ghostStyle = isHidden ? {
      opacity: 0.55,
      transform: 'scale(0.92)',
      boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.28)',
      border: '2px dashed rgba(255,255,255,0.35)',
      backgroundColor: 'rgba(255,255,255,0.03)'
  } : {};

  /* The drop lands rather than glides: a stiff spring on Y, then a short squash
     on the vertical axis so the block reads as struck plastic on contact. */
  const dropVariants = {
    initial: {
      scaleY: 1,
      y: initialY,
      opacity: isRestored ? 0 : 1,
      scale: isRestored ? 0.94 : 1,
    },
    animate: {
      y: 0,
      opacity: 1,
      scale: 1,
      scaleY: reduceMotion || isRestored ? 1 : [1, 0.9, 1.03, 1],
      transition: isRestored
        ? { duration: 0.26, ease: [0.16, 1, 0.3, 1] }
        : {
            y: { type: 'spring', stiffness: 420, damping: 38, mass: 0.9 },
            opacity: { duration: 0.18 },
            scaleY: { duration: 0.34, times: [0, 0.62, 0.82, 1], ease: 'easeOut' }
          }
    }
  };

  const mergeVariants = {
    initial: { scale: 0.86, opacity: 0 },
    animate: {
      scale: reduceMotion ? 1 : [1.16, 1],
      opacity: 1,
      transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <motion.div
      initial={isMerge ? mergeVariants.initial : dropVariants.initial}
      animate={isMerge ? mergeVariants.animate : dropVariants.animate}
      whileHover={!isHidden ? { scale: 1.04, zIndex: 100 } : {}}
      whileTap={!isHidden ? { scale: 0.96 } : {}}
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
        transformOrigin: 'bottom center',
        willChange: 'transform, opacity',
      }}
      onPointerDown={(e) => {
        if (onDragStart) {
          onDragStart(e);
        }
      }}
    >
        <CardBody
            value={card.value}
            isMerge={isMerge}
            isFull={isFull}
            isHidden={isHidden}
            styleOverride={ghostStyle}
        />

        {/* --- The merge payoff ---------------------------------------------
            One idea: the block releases the energy it just absorbed, in its own
            colour. A shockwave ring carries the hue outward, debris follows it,
            and the whole thing scales with the combo so a chain visibly escalates
            instead of repeating one identical pop. */}
        {isMerge && !isHidden && !reduceMotion && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <MergeParticles color={style.accent} faceColor={style.backgroundColor} combo={combo} />

                {/* Coloured shockwave */}
                <motion.div
                    initial={{ scale: 0.92, opacity: 0.9 }}
                    animate={{ scale: 1.9 + combo * 0.22, opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0 rounded-[16px] z-20"
                    style={{ boxShadow: `0 0 0 3px ${style.accent}, 0 0 22px 4px ${style.backgroundColor}` }}
                />

                {/* Core bloom, brief and tinted so it does not wash to white */}
                <motion.div
                    initial={{ scale: 1, opacity: 0.7 }}
                    animate={{ scale: 1.5 + combo * 0.1, opacity: 0 }}
                    transition={{ duration: 0.34, ease: 'easeOut' }}
                    className="absolute inset-0 rounded-[16px] z-10"
                    style={{ backgroundColor: style.accent }}
                />
            </div>
        )}
    </motion.div>
  );
});
