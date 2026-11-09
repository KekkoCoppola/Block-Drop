import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Play, Star, Settings, Volume2, Github, Smartphone, RotateCcw, Trophy } from 'lucide-react';
import { VIBRATION_PATTERNS } from '../constants';
import { soundManager } from '../utils/sound';
import { Modal } from './Modal';

interface StartMenuProps {
  onStart: () => void;
  onReset?: () => void;
  highScore: number;
  isMusicOn: boolean;
  onToggleMusic: () => void;
  canContinue?: boolean;
}

/* Blocks in the same four hues as the mark, falling behind the menu. They are
   the game's own material, not abstract decoration. */
const LOGO_COLORS = [
  { bg: '#40C4FF', shadow: '#0091EA' },
  { bg: '#FF3D00', shadow: '#DD2C00' },
  { bg: '#FFEA00', shadow: '#FFD600' },
  { bg: '#00E676', shadow: '#00C853' },
];

/** Shared switch, so music and haptics cannot drift apart. */
const Toggle: React.FC<{ on: boolean; onChange: () => void; label: string }> = ({ on, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    onClick={onChange}
    className="w-13 h-7 shrink-0 rounded-full relative transition-colors duration-200"
    style={{
      width: 52,
      height: 28,
      backgroundColor: on ? '#007AFF' : '#2a3b5c',
      boxShadow: on
        ? 'inset 0 1px 3px rgba(0,0,0,0.35), 0 0 12px rgba(0,122,255,0.4)'
        : 'inset 0 1px 3px rgba(0,0,0,0.45)',
    }}
  >
    <motion.span
      animate={{ x: on ? 26 : 3 }}
      transition={{ type: 'spring', stiffness: 520, damping: 34 }}
      className="absolute top-[3px] left-0 w-[22px] h-[22px] rounded-full bg-white"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.45)' }}
    />
  </button>
);

const SettingRow: React.FC<{
  icon: React.ReactNode;
  title: string;
  hint: string;
  children: React.ReactNode;
}> = ({ icon, title, hint, children }) => (
  <div
    className="flex items-center justify-between gap-3 p-4 rounded-2xl"
    style={{ backgroundColor: '#111625', border: '1px solid rgba(42,59,92,0.6)' }}
  >
    <div className="flex items-center gap-3 min-w-0">
      {icon}
      <div className="flex flex-col min-w-0">
        <span className="font-bold text-sm text-ink truncate">{title}</span>
        <span className="text-[11px] text-ink-faint truncate">{hint}</span>
      </div>
    </div>
    {children}
  </div>
);

export const StartMenu: React.FC<StartMenuProps> = ({ onStart, onReset, highScore, isMusicOn, onToggleMusic, canContinue }) => {
  const [activeModal, setActiveModal] = useState<'none' | 'options' | 'credits'>('none');
  const [volume, setVolume] = useState(50);
  const [vibrationEnabled, setVibrationEnabled] = useState(soundManager.isVibrationEnabled());
  const [logoFailed, setLogoFailed] = useState(false);
  const reduceMotion = useReducedMotion();

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setVolume(val);
    soundManager.setVolume(val / 100);
  };

  const toggleVibration = () => {
    const newState = !vibrationEnabled;
    setVibrationEnabled(newState);
    soundManager.toggleVibration(newState);
    if (newState) soundManager.vibrate(VIBRATION_PATTERNS.DROP);
  };

  const floatingBlocks = useMemo(
    () =>
      Array.from({ length: 8 }).map((_, i) => {
        const style = LOGO_COLORS[i % 4];
        return {
          id: i,
          left: `${6 + (i * 11.5) + Math.random() * 5}%`,
          size: 34 + Math.random() * 20,
          delay: Math.random() * 8,
          duration: 15 + Math.random() * 12,
          bg: style.bg,
          shadow: style.shadow,
        };
      }),
    []
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden safe-top safe-bottom" style={{ backgroundColor: '#111625' }}>

      {!reduceMotion && floatingBlocks.map((block) => (
        <motion.div
          key={block.id}
          aria-hidden
          initial={{ y: -140, opacity: 0, rotate: 0 }}
          animate={{ y: '120vh', opacity: [0, 0.34, 0.34, 0], rotate: 260 }}
          transition={{
            duration: block.duration,
            repeat: Infinity,
            delay: block.delay,
            ease: 'linear',
            opacity: { duration: block.duration, repeat: Infinity, times: [0, 0.12, 0.82, 1], delay: block.delay },
          }}
          className="absolute rounded-xl pointer-events-none"
          style={{
            left: block.left,
            width: block.size,
            height: block.size,
            backgroundColor: block.bg,
            boxShadow: `inset 0 2px 0 rgba(255,255,255,0.45), inset 0 -2px 0 rgba(0,0,0,0.2), 0 5px 0 ${block.shadow}`,
          }}
        />
      ))}

      <AnimatePresence>
        {activeModal === 'none' && (
          <motion.div
            key="main-menu"
            initial={reduceMotion ? { opacity: 0 } : { scale: 0.92, opacity: 0, y: 12 }}
            animate={reduceMotion ? { opacity: 1 } : { scale: 1, opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { scale: 0.94, opacity: 0 }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center z-10 w-full max-w-md px-6"
          >
            <div className="mb-8 sm:mb-12 relative flex flex-col items-center justify-center">
              {!logoFailed ? (
                <img
                  src="/logo.png"
                  alt="Block Drop"
                  width={320}
                  height={160}
                  className="w-60 sm:w-80 h-auto object-contain z-20"
                  style={{ filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.55))' }}
                  onError={() => setLogoFailed(true)}
                />
              ) : (
                /* Text fallback. Emphasis comes from weight, size and the
                   material behind it — never from gradient-filled type. */
                <div className="relative flex flex-col items-center justify-center w-full">
                  <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-5 mx-auto">
                    <motion.div
                      animate={reduceMotion ? {} : { y: [0, -5, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute bottom-0 left-0 w-12 h-12 sm:w-16 sm:h-16 rounded-xl"
                      style={{ backgroundColor: '#007AFF', boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.45), 0 5px 0 #004085' }}
                    />
                    <motion.div
                      animate={reduceMotion ? {} : { y: [0, -5, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                      className="absolute bottom-0 right-0 w-12 h-12 sm:w-16 sm:h-16 rounded-xl"
                      style={{ backgroundColor: '#AF52DE', boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.45), 0 5px 0 #6A238F' }}
                    />
                    <motion.div
                      animate={reduceMotion ? {} : { y: [-44, 0, -5, 0] }}
                      transition={{ duration: 3, repeat: Infinity, times: [0, 0.3, 0.4, 1], ease: 'easeOut', repeatDelay: 1 }}
                      className="absolute bottom-[30px] sm:bottom-[40px] left-[14px] sm:left-[16px] w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: '#FFCC00', boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.5), 0 5px 0 #997A00' }}
                    >
                      <span className="tnum font-black text-2xl" style={{ color: 'rgba(0,0,0,0.68)' }}>8</span>
                    </motion.div>
                  </div>

                  <div className="relative text-center">
                    <p
                      className="text-6xl sm:text-7xl font-black italic leading-[0.84] text-ink"
                      style={{ letterSpacing: '-0.05em', textShadow: '0 4px 0 rgba(0,0,0,0.45)' }}
                    >
                      BLOCK
                    </p>
                    <p
                      className="text-6xl sm:text-7xl font-black italic leading-[0.84]"
                      style={{ letterSpacing: '-0.05em', color: '#40C4FF', textShadow: '0 4px 0 rgba(0,0,0,0.45)' }}
                    >
                      DROP
                    </p>
                    <p className="text-ink-muted font-black tracking-[0.42em] text-[10px] mt-4 uppercase">
                      Infinite Merge
                    </p>
                  </div>
                </div>
              )}
            </div>

            {highScore > 0 && (
              <motion.div
                initial={{ y: 14, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.22, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="mb-8 px-5 py-2.5 rounded-2xl flex items-center gap-3"
                style={{
                  backgroundColor: 'rgba(26,35,58,0.92)',
                  border: '1px solid #2a3b5c',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 20px -8px rgba(0,0,0,0.7)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-full grid place-items-center shrink-0"
                  style={{ backgroundColor: 'rgba(255,214,10,0.14)', border: '1px solid rgba(255,214,10,0.32)' }}
                >
                  <Trophy size={19} className="text-gold" aria-hidden />
                </div>
                <div className="flex flex-col">
                  <span className="text-ink-faint font-black text-[9px] uppercase tracking-[0.16em]">Record</span>
                  <span className="tnum text-gold font-black text-2xl leading-none">{highScore}</span>
                </div>
              </motion.div>
            )}

            {/* Primary action. The extruded face is a darker amber — the block's
                own colour in shadow, the same rule the game pieces follow. */}
            <button
              type="button"
              onClick={() => {
                soundManager.vibrate(VIBRATION_PATTERNS.DROP);
                onStart();
              }}
              className="w-full group relative h-[68px] sm:h-[76px] rounded-2xl overflow-hidden active:translate-y-[5px] transition-all mb-3"
              style={{
                background: 'linear-gradient(180deg, #FFE95C 0%, #FFC400 52%, #FF9500 100%)',
                boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.75), inset 0 -3px 0 rgba(0,0,0,0.14), 0 6px 0 #B36B00, 0 16px 24px -10px rgba(0,0,0,0.65)',
              }}
            >
              <div className="flex items-center justify-center gap-3.5 h-full relative z-10">
                <span
                  className="w-11 h-11 rounded-full grid place-items-center shrink-0"
                  style={{ backgroundColor: '#00529B', boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,255,255,0.25)' }}
                >
                  <Play size={22} fill="white" className="text-white ml-0.5" aria-hidden />
                </span>
                <span
                  className="text-[26px] sm:text-3xl font-black text-white uppercase italic"
                  style={{ letterSpacing: '0.04em', textShadow: '0 3px 0 rgba(140,80,0,0.85)' }}
                >
                  {canContinue ? 'Continua' : 'Gioca'}
                </span>
              </div>
            </button>

            {canContinue && onReset && (
              <button
                type="button"
                onClick={() => {
                  soundManager.vibrate(10);
                  soundManager.playClick();
                  onReset();
                }}
                className="w-full h-12 rounded-2xl mb-6 flex items-center justify-center gap-2.5 active:translate-y-[3px] transition-all"
                style={{
                  backgroundColor: '#1a233a',
                  border: '1px solid #2a3b5c',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07), 0 4px 0 #0b0f19',
                }}
              >
                <RotateCcw size={17} className="text-ink-muted" aria-hidden />
                <span className="text-sm font-bold text-ink-muted uppercase tracking-wider">Nuova Partita</span>
              </button>
            )}

            <div className={`flex gap-3 w-full ${canContinue && onReset ? '' : 'mt-3'}`}>
              {([
                { key: 'options' as const, icon: Settings, label: 'Opzioni' },
                { key: 'credits' as const, icon: Star, label: 'Crediti' },
              ]).map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    soundManager.vibrate(10);
                    soundManager.playClick();
                    setActiveModal(key);
                  }}
                  className="flex-1 h-12 rounded-xl font-black text-white flex items-center justify-center gap-2 group active:translate-y-[3px] transition-all"
                  style={{
                    background: 'linear-gradient(180deg, #5CCDFF 0%, #0091EA 100%)',
                    boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.5), 0 4px 0 #00529B, 0 10px 16px -8px rgba(0,0,0,0.6)',
                  }}
                >
                  <Icon
                    size={16}
                    className={key === 'options' ? 'group-hover:rotate-90 transition-transform duration-500' : ''}
                    aria-hidden
                  />
                  <span className="text-[11px] uppercase tracking-wider">{label}</span>
                </button>
              ))}
            </div>

            <p className="mt-8 text-ink-faint/70 text-[10px] font-bold tracking-widest">v2.1</p>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal isOpen={activeModal === 'options'} onClose={() => setActiveModal('none')} title="Opzioni">
        <div className="space-y-4">
          <div
            className="p-4 rounded-2xl"
            style={{ backgroundColor: '#111625', border: '1px solid rgba(42,59,92,0.6)' }}
          >
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-3 text-ink">
                <Volume2 size={19} className="text-ink-muted" aria-hidden />
                <span className="font-bold text-sm">Volume</span>
              </div>
              <span className="tnum text-brand font-black text-sm">{volume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              aria-label="Volume principale"
              className="w-full"
            />
          </div>

          <SettingRow
            icon={<Volume2 size={19} className={isMusicOn ? 'text-brand' : 'text-ink-faint'} aria-hidden />}
            title="Musica 8-Bit"
            hint="Loop incalzante"
          >
            <Toggle
              on={isMusicOn}
              label="Musica 8-Bit"
              onChange={() => {
                soundManager.playClick();
                onToggleMusic();
              }}
            />
          </SettingRow>

          <SettingRow
            icon={<Smartphone size={19} className={vibrationEnabled ? 'text-brand' : 'text-ink-faint'} aria-hidden />}
            title="Feedback Aptico"
            hint="Vibrazione su mobile"
          >
            <Toggle on={vibrationEnabled} label="Feedback aptico" onChange={toggleVibration} />
          </SettingRow>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'credits'} onClose={() => setActiveModal('none')} title="Crediti">
        <div className="flex flex-col items-center gap-4 text-center">
          <div
            className="w-20 h-20 rounded-full grid place-items-center p-[3px]"
            style={{ background: 'linear-gradient(135deg, #40C4FF 0%, #AF52DE 100%)' }}
          >
            <div className="w-full h-full rounded-full grid place-items-center" style={{ backgroundColor: '#111625' }}>
              <Github size={38} className="text-ink" aria-hidden />
            </div>
          </div>

          <div>
            <p className="text-ink-faint text-[10px] font-black uppercase tracking-[0.16em] mb-1">Sviluppato da</p>
            <p className="text-xl font-black text-ink">KekkoCoppola</p>
          </div>

          <a
            href="https://github.com/KekkoCoppola"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 px-5 h-12 rounded-xl text-brand font-bold text-sm flex items-center gap-2 transition-colors hover:text-ink"
            style={{ backgroundColor: '#0b0f19', border: '1px solid #2a3b5c' }}
          >
            <Github size={16} aria-hidden />
            github.com/KekkoCoppola
          </a>
        </div>
      </Modal>
    </div>
  );
};
