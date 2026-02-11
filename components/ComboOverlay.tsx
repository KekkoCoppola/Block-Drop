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
              scale: [0.5, 1.5, 1.2], 
              opacity: [0, 1, 0], 
              rotate: [15, -10, 0],
              y: -100
            }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <h1 
              className="text-6xl font-black text-white italic tracking-tighter drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]"
              style={{ 
                WebkitTextStroke: '2px black',
                textShadow: '0 0 20px rgba(255,255,255,0.8), 4px 4px 0px #000'
              }}
            >
              {comboEvent.text}
            </h1>
            <span className="text-yellow-400 font-bold text-2xl mt-2 drop-shadow-md">
                +{comboEvent.count} CHAIN
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};