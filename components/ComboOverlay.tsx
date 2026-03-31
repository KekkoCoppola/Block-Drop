import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ComboEvent } from '../types';

interface ComboOverlayProps {
  comboEvent: ComboEvent | null;
}

export const ComboOverlay: React.FC<ComboOverlayProps> = ({ comboEvent }) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50 overflow-hidden">
      <AnimatePresence>
        {comboEvent && (
          <motion.div
            key={comboEvent.id}
            initial={{ scale: 0.5, opacity: 0, rotate: -15, y: 50 }}
            animate={{ 
              scale: [0.5, 1.2, 1, 1], 
              opacity: [0, 1, 1, 0], 
              rotate: [10, -5, 0, 0],
              y: [20, 0, -40, -50]
            }}
            transition={{ 
              duration: 1.2, 
              times: [0, 0.2, 0.8, 1],
              ease: "easeOut" 
            }}
            className="flex flex-col items-center"
            style={{ willChange: 'transform, opacity' }}
          >
            <h1 
              className="text-3xl sm:text-6xl font-black text-white italic tracking-tighter"
              style={{ 
                WebkitTextStroke: '2px black',
                textShadow: '2px 2px 0px #000'
              }}
            >
              {comboEvent.text}
            </h1>
            <span className="text-yellow-400 font-bold text-xl sm:text-2xl mt-1 sm:mt-2 drop-shadow-md">
                x{comboEvent.count}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};