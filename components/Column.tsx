import React, { memo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { CardData } from '../types';
import { Card } from './Card';
import { CardBody } from './CardBody';
import { MAX_ROWS } from '../constants';

interface ColumnProps {
  cards: CardData[];
  colIndex: number;
  onCardDragStart: (colIndex: number, cardValue: number, e: React.PointerEvent, isTop: boolean) => void;
  isActive: boolean;
  draggingFromThisCol?: boolean;
  /** Identity of the last action that landed *in this column*, or null. */
  impactKey?: string | null;
  dragValue?: number | null;
  isDraggingActive?: boolean;
}

export const Column: React.FC<ColumnProps> = memo(({ cards, colIndex, onCardDragStart, isActive, draggingFromThisCol, impactKey, dragValue, isDraggingActive }) => {
  const isFull = cards.length >= MAX_ROWS;
  const colRef = React.useRef<HTMLDivElement>(null);
  const [colHeight, setColHeight] = React.useState(0);
  const reduceMotion = useReducedMotion();

  const topCard = cards.length > 0 ? cards[cards.length - 1] : null;
  const isMergePossible = topCard && dragValue === topCard.value && !isFull && isDraggingActive;

  // The column height drives each card's drop distance, so it has to survive
  // rotation and resize, not just mount.
  React.useLayoutEffect(() => {
    const el = colRef.current;
    if (!el) return;
    setColHeight(el.offsetHeight);

    const observer = new ResizeObserver(([entry]) => {
      setColHeight(entry.contentRect.height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={colRef}
      className={`relative h-full flex-1 transition-colors duration-200 ${isActive ? 'bg-white/[0.04]' : ''}`}
    >
      {/* Targeting: a light column of air the block will fall through. Only the
          column under the pointer lights, and only while a drag is live. */}
      <div
        aria-hidden
        className={`absolute inset-0 pointer-events-none transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-0'}`}
        style={{
          background: 'linear-gradient(180deg, rgba(64,196,255,0.16) 0%, rgba(64,196,255,0.04) 45%, transparent 100%)',
          boxShadow: 'inset 1px 0 0 rgba(255,255,255,0.08), inset -1px 0 0 rgba(255,255,255,0.08)',
        }}
      />

      {/* A match is the one thing worth interrupting the player to say. It reads
          as the block's own promise: gold, and only on the landing zone. */}
      {isActive && isMergePossible && (
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: reduceMotion ? 0.4 : [0.25, 0.55, 0.25] }}
          transition={reduceMotion ? { duration: 0.2 } : { duration: 1, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-x-0 pointer-events-none z-0"
          style={{
            bottom: 0,
            height: `${Math.min(cards.length + 1, MAX_ROWS) * 25}%`,
            background: 'linear-gradient(0deg, rgba(255,214,10,0.35) 0%, transparent 100%)',
          }}
        />
      )}

      {/* Danger reads at the top of the stack, where the space is running out. */}
      {isFull && (
        <div
          aria-hidden
          className="absolute top-0 left-0 w-full h-1/4 pointer-events-none z-0"
          style={{ background: 'linear-gradient(180deg, rgba(255,69,58,0.28) 0%, transparent 100%)' }}
        />
      )}

      {/* Ghost of where the held block will land. */}
      {isActive && dragValue !== undefined && dragValue !== null && !isFull && (
        <div
          aria-hidden
          className="absolute w-[94%] left-[3%] opacity-25 pointer-events-none z-0"
          style={{
            bottom: `${cards.length * 25}%`,
            height: '24%',
            marginBottom: '0.5%',
          }}
        >
          <CardBody value={dragValue} isMerge={isMergePossible} />
        </div>
      )}

      {/* Impact: a single flash at the floor of the column that took the block.
          Keyed by action id so a repeat drop into the same column re-fires. */}
      <AnimatePresence>
        {impactKey && !reduceMotion && (
          <motion.div
            key={impactKey}
            aria-hidden
            initial={{ opacity: 0.55, scaleY: 1 }}
            animate={{ opacity: 0, scaleY: 1.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-x-0 bottom-0 h-8 pointer-events-none z-0 origin-bottom"
            style={{ background: 'linear-gradient(0deg, rgba(255,255,255,0.5) 0%, transparent 100%)' }}
          />
        )}
      </AnimatePresence>

      {/* Cards Container */}
      <div className="absolute bottom-0 w-full h-full pb-2">
        {cards.map((card, idx) => {
          const isTop = idx === cards.length - 1;
          const isHidden = draggingFromThisCol && isTop;
          return (
            <Card
              key={card.id}
              card={card}
              index={idx}
              isTop={isTop}
              isHidden={isHidden}
              isFull={isFull && isTop}
              columnHeight={colHeight}
              onDragStart={(e) => onCardDragStart(colIndex, card.value, e, isTop)}
            />
          );
        })}
      </div>
    </div>
  );
});
