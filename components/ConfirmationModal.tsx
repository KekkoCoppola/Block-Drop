import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onConfirm, onCancel, title, message }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-slate-800 border border-slate-700 w-full max-w-xs rounded-2xl p-6 shadow-2xl"
          >
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-slate-400 mb-6 text-sm leading-relaxed">{message}</p>
            
            <div className="flex gap-3">
              <button 
                onClick={onCancel}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-bold text-sm transition-colors"
              >
                Annulla
              </button>
              <button 
                onClick={onConfirm}
                className="flex-1 py-3 bg-red-500 hover:bg-red-400 rounded-xl text-white font-bold text-sm shadow-lg shadow-red-500/20 transition-colors"
              >
                Conferma
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};