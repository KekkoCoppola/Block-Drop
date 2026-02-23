import React from 'react';
import { CardData } from '../types';
import { Card } from './Card';
import { MAX_ROWS } from '../constants';

interface ColumnProps {
  cards: CardData[];
  colIndex: number;
  onCardDragStart: (colIndex: number, cardValue: number, e: React.PointerEvent) => void;
  isActive: boolean;
  draggingFromThisCol?: boolean;
}

export const Column: React.FC<ColumnProps> = ({ cards, colIndex, onCardDragStart, isActive, draggingFromThisCol }) => {
  const isFull = cards.length >= MAX_ROWS;

  return (
    <div 
      className={`relative h-full flex-1 group transition-all duration-300 ${isActive ? 'bg-white/10 ring-2 ring-inset ring-white/20' : ''}`}
    >
      {/* Active Highlight Glow */}
      <div className={`absolute inset-0 bg-gradient-to-b from-blue-500/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 ${isActive ? 'opacity-100' : ''} pointer-events-none`} />

      {/* Full Indicator (Subtle red glow at top) */}
      {isFull && (
        <div className="absolute top-0 left-0 w-full h-1/4 bg-gradient-to-b from-red-500/20 to-transparent pointer-events-none z-0" />
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
              onDragStart={(e) => onCardDragStart(colIndex, card.value, e)}
            />
          );
        })}
      </div>
    </div>
  );
};