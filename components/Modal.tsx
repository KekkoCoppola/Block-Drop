import React, { useEffect, useId, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  /** Omit to make the dialog non-dismissable (game over has no way back). */
  onClose?: () => void;
  title: string;
  /** Hide the title visually while keeping it as the dialog's accessible name. */
  hideTitle?: boolean;
  children: React.ReactNode;
  maxWidth?: string;
}

/**
 * The one dialog shell for the game. Before this, four hand-rolled overlays
 * drifted apart on material, radius and padding, and none of them handled focus
 * or Escape — a keyboard user could tab straight out of an open dialog into the
 * board behind it.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  hideTitle,
  children,
  maxWidth = 'max-w-sm',
}) => {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return;

    restoreFocusRef.current = document.activeElement as HTMLElement | null;

    // Move focus into the dialog so the next Tab lands inside it.
    const focusable = panelRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    (focusable ?? panelRef.current)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key !== 'Tab' || !panelRef.current) return;

      // Cycle focus inside the panel rather than escaping to the board.
      const nodes = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const items: HTMLElement[] = [];
      for (let i = 0; i < nodes.length; i++) {
        const el = nodes[i];
        if (!el.hasAttribute('disabled')) items.push(el);
      }
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      restoreFocusRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-5"
          style={{ backgroundColor: 'rgba(6, 9, 16, 0.82)' }}
          onPointerDown={(e) => {
            if (onClose && e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={reduceMotion ? { opacity: 0 } : { scale: 0.94, opacity: 0, y: 14 }}
            animate={reduceMotion ? { opacity: 1 } : { scale: 1, opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { scale: 0.96, opacity: 0, y: 10 }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            className={`relative w-full ${maxWidth} rounded-3xl p-6 outline-none`}
            style={{
              backgroundColor: '#1a233a',
              /* Same lit-from-above logic as the blocks, at panel scale. */
              boxShadow: [
                'inset 0 1px 0 rgba(255,255,255,0.13)',
                'inset 0 -1px 0 rgba(0,0,0,0.4)',
                '0 1px 0 rgba(255,255,255,0.05)',
                '0 24px 60px -12px rgba(0,0,0,0.8)',
              ].join(', '),
              border: '1px solid #2a3b5c',
            }}
          >
            <h2
              id={titleId}
              className={
                hideTitle
                  ? 'sr-only'
                  : 'text-2xl font-black text-ink mb-6 text-center uppercase tracking-wide'
              }
              style={hideTitle ? undefined : { letterSpacing: '0.02em' }}
            >
              {title}
            </h2>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Chiudi"
                className="absolute top-3.5 right-3.5 w-10 h-10 grid place-items-center rounded-full text-ink-muted hover:text-ink hover:bg-white/5 active:scale-95 transition-all"
              >
                <X size={20} aria-hidden />
              </button>
            )}

            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
