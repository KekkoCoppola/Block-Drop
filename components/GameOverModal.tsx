import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Trophy } from 'lucide-react';
import { soundManager } from '../utils/sound';
import { Modal } from './Modal';

interface GameOverModalProps {
  isOpen: boolean;
  score: number;
  highScore: number;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ isOpen, score, highScore, onRestart }) => {
  const isRecord = score > 0 && score >= highScore;

  return (
    // Deliberately not dismissable: the run is over and there is nothing to
    // return to behind it, so the only exit is the action.
    <Modal isOpen={isOpen} title="Partita terminata" hideTitle>
      <div className="text-center">
        {/* A new record is the reason to keep playing — lead with it when it
            happens, and stay quiet when it does not. */}
        {isRecord && (
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            // The pop lives in the keyframes, not in an elastic curve.
            animate={{ scale: [0.7, 1.06, 1], opacity: 1 }}
            transition={{ delay: 0.12, duration: 0.44, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 mb-4 px-3 h-8 rounded-full"
            style={{
              backgroundColor: 'rgba(255,214,10,0.12)',
              border: '1px solid rgba(255,214,10,0.4)',
            }}
          >
            <Trophy size={14} className="text-gold" aria-hidden />
            <span className="text-gold font-black text-[11px] uppercase tracking-[0.14em]">
              Nuovo record
            </span>
          </motion.div>
        )}

        <p
          className="text-4xl font-black text-ink leading-[0.92] mb-2"
          style={{ letterSpacing: '-0.03em' }}
        >
          PARTITA<br />TERMINATA
        </p>
        <p className="text-ink-muted mb-7 text-sm">Non c'è più spazio sulla griglia.</p>

        <div className="grid grid-cols-2 gap-3 mb-7">
          <div
            className="p-4 rounded-2xl"
            style={{ backgroundColor: '#0b0f19', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}
          >
            <p className="text-ink-faint text-[10px] font-black uppercase tracking-[0.12em] mb-1">Punti</p>
            <p className="tnum text-3xl font-black text-ink leading-none">{score}</p>
          </div>
          <div
            className="p-4 rounded-2xl"
            style={{ backgroundColor: '#0b0f19', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}
          >
            <p className="text-ink-faint text-[10px] font-black uppercase tracking-[0.12em] mb-1">Record</p>
            <p className="tnum text-3xl font-black text-gold leading-none">{highScore}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            soundManager.playPop();
            onRestart();
          }}
          className="w-full h-14 rounded-2xl text-white font-black text-base uppercase tracking-wide flex items-center justify-center gap-2.5 active:translate-y-[3px] transition-all"
          style={{
            background: 'linear-gradient(180deg, #4FC9FF 0%, #007AFF 100%)',
            boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.4), 0 4px 0 #00529B, 0 10px 18px -6px rgba(0,0,0,0.6)',
          }}
        >
          <RefreshCw size={19} aria-hidden />
          Riprova
        </button>
      </div>
    </Modal>
  );
};
