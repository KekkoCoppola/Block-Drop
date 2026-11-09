import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
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
  const isIdle = xPosition === undefined || xPosition === null;
  const isDragging = !isIdle;
  const reduceMotion = useReducedMotion();

  const lifted = isDragging || isTouching;

  const moveStyle = isMoving ? {
    border: '2px dashed #FFD60A',
    opacity: 0.94,
  } : {};

  return (
    <div
      className={`relative flex justify-center items-center h-20 sm:h-36 mb-1 sm:mb-2 z-50 ${isIdle ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}`}
      onPointerDown={isIdle ? onPointerDown : undefined}
    >
      {/* The socket the next block rests in, so the launch point reads as part
          of the board rather than a card floating in space. */}
      {isIdle && (
        <div aria-hidden className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="w-16 h-[72px] sm:w-24 sm:h-28 rounded-3xl"
            style={{ border: '2px dashed rgba(255,255,255,0.07)' }}
          />
        </div>
      )}

      <motion.div
        key={value}
        initial={reduceMotion ? { opacity: 0 } : { scale: 0.5, opacity: 0, y: 28 }}
        animate={{
          scale: isDragging ? 1.14 : isTouching ? 1.09 : 1,
          opacity: 1,
          // One idle breath. Previously this floated, rotated and glowed at
          // three different periods, which read as jitter rather than life.
          y: lifted ? -14 : reduceMotion ? 0 : [0, -6, 0],
        }}
        transition={{
          scale: { type: 'spring', stiffness: 420, damping: 26 },
          opacity: { duration: 0.2 },
          y: lifted
            ? { type: 'spring', stiffness: 420, damping: 30 }
            : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' },
        }}
        className="w-16 h-[72px] sm:w-20 sm:h-24 flex items-center justify-center overflow-visible relative"
        style={{
          position: isDragging ? 'fixed' : 'relative',
          left: isDragging ? xPosition! : 'auto',
          top: isDragging ? yPosition! - 60 : 'auto',
          transform: isDragging ? 'translateX(-50%)' : 'none',
          zIndex: 100,
          willChange: 'transform, opacity',
        }}
      >
        {isMoving && (
          <motion.div
            aria-hidden
            animate={reduceMotion ? { opacity: 0.3 } : { opacity: [0.2, 0.45, 0.2] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-[-18%] rounded-2xl z-0"
            style={{ backgroundColor: '#FFD60A' }}
          />
        )}

        <CardBody
          value={value}
          styleOverride={{
            ...moveStyle,
            boxShadow: isMoving
              ? `${style.boxShadow}, 0 0 18px 5px rgba(255, 214, 10, 0.55)`
              : lifted
                ? `${style.boxShadow}, 0 14px 22px -8px rgba(0,0,0,0.7)`
                : style.boxShadow,
            zIndex: 10,
          }}
        />

        {isMoving && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 flex items-center justify-center z-20 rounded-2xl"
            style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
          >
            <span className="p-2 rounded-full" style={{ backgroundColor: '#FFD60A' }}>
              <Move size={18} style={{ color: '#0b0f19' }} aria-hidden />
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* The block after next. Explicitly a queue: smaller, dimmer, set to the
          side, so the player can plan one move ahead without it competing. */}
      {isIdle && secondNextValue !== undefined && (
        <motion.div
          key={`second-${secondNextValue}`}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 14, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="absolute left-[calc(50%+58px)] sm:left-[calc(50%+74px)] flex flex-col items-center gap-1.5"
          style={{ opacity: 0.62 }}
        >
          {showLabel && (
            <span className="text-[8px] font-black uppercase tracking-[0.14em] text-ink-faint">Poi</span>
          )}
          <div className="w-9 h-10 sm:w-11 sm:h-12">
            <CardBody value={secondNextValue} />
          </div>
        </motion.div>
      )}
    </div>
  );
};
