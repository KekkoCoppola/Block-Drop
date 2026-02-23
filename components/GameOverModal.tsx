import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface GameOverModalProps {
  isOpen: boolean;
  score: number;
  highScore: number;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ isOpen, score, highScore, onRestart }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-slate-800 border border-slate-700 w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl"
          >
            <h2 className="text-4xl font-black text-white mb-2 leading-none">PARTITA<br/>TERMINATA</h2>
            <p className="text-slate-400 mb-8 mt-2">Spazio esaurito!</p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-900/50 p-4 rounded-2xl">
                <p className="text-slate-500 text-[10px] font-bold uppercase">Punti</p>
                <p className="text-3xl font-black text-white">{score}</p>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-2xl">
                <p className="text-slate-500 text-[10px] font-bold uppercase">Record</p>
                <p className="text-3xl font-black text-yellow-400">{highScore}</p>
              </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={onRestart}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-600/30"
              >
                <RefreshCw size={20} />
                Riprova
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};