import React from 'react';
import { soundManager } from '../utils/sound';
import { Modal } from './Modal';

interface ConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onConfirm, onCancel, title, message }) => {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} hideTitle maxWidth="max-w-xs">
      <h3 className="text-xl font-black text-ink mb-2 pr-8" style={{ letterSpacing: '-0.02em' }}>
        {title}
      </h3>
      <p className="text-ink-muted mb-6 text-sm leading-relaxed">{message}</p>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => {
            soundManager.playClick();
            onCancel();
          }}
          className="flex-1 h-12 rounded-xl text-ink font-bold text-sm active:translate-y-[2px] transition-all"
          style={{
            backgroundColor: '#2a3b5c',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 3px 0 #16203a',
          }}
        >
          Annulla
        </button>
        <button
          type="button"
          onClick={() => {
            soundManager.playPop();
            onConfirm();
          }}
          className="flex-1 h-12 rounded-xl text-white font-bold text-sm active:translate-y-[2px] transition-all"
          style={{
            background: 'linear-gradient(180deg, #FF6961 0%, #FF453A 100%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 3px 0 #A32017',
          }}
        >
          Conferma
        </button>
      </div>
    </Modal>
  );
};
