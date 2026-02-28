import React, { memo } from 'react';
import { motion } from 'framer-motion';
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
  lastActionId?: string;
  dragValue?: number | null;
  isDraggingActive?: boolean;
}

export const Column: React.FC<ColumnProps> = memo(({ cards, colIndex, onCardDragStart, isActive, draggingFromThisCol, lastActionId, dragValue, isDraggingActive }) => {
  const isFull = cards.length >= MAX_ROWS;
  const colRef = React.useRef<HTMLDivElement>(null);
  const [colHeight, setColHeight] = React.useState(0);
  
  const topCard = cards.length > 0 ? cards[cards.length - 1] : null;
  const isMergePossible = topCard && dragValue === topCard.value && !isFull && isDraggingActive;

  React.useLayoutEffect(() => {
    if (colRef.current) {
      setColHeight(colRef.current.offsetHeight);
    }
  }, []);

  return (
    <motion.div 
      ref={colRef}
      animate={lastActionId ? {
        y: [0, 4, 0],
        backgroundColor: ["rgba(255,255,255,0)", "rgba(255,255,255,0.1)", "rgba(255,255,255,0)"]
      } : {}}
      transition={{ duration: 0.2 }}
      className={`relative h-full flex-1 group transition-all duration-300 ${isActive ? 'bg-white/5 ring-1 ring-inset ring-white/10' : ''}`}
    >
      {/* Active Highlight Glow */}
      <div className={`absolute inset-0 bg-gradient-to-b from-blue-500/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 ${isActive ? 'opacity-100' : ''} pointer-events-none`} />

      {/* Drop Indicator Line */}
      {isActive && !isFull && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            className="absolute inset-x-0 top-0 bottom-0 border-x border-dashed border-white/20 pointer-events-none z-0"
          />
      )}

      {/* Merge Possible Glow */}
      {isActive && isMergePossible && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="absolute inset-0 bg-yellow-400/20 pointer-events-none z-0"
          />
      )}

      {/* Full Indicator (Subtle red glow at top) */}
      {isFull && (
        <div className="absolute top-0 left-0 w-full h-1/4 bg-gradient-to-b from-red-500/20 to-transparent pointer-events-none z-0" />
      )}

      {/* Ghost Preview */}
      {isActive && dragValue !== undefined && dragValue !== null && !isFull && (
          <div 
            className="absolute w-[94%] left-[3%] opacity-20 pointer-events-none z-0"
            style={{
                bottom: `${cards.length * 25}%`,
                height: '24%',
                marginBottom: '0.5%',
            }}
          >
              <CardBody value={dragValue} isMerge={isMergePossible} />
          </div>
      )}

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
    </motion.div>
  );
});
