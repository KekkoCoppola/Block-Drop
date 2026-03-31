import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Star, Settings, X, Volume2, Github, Smartphone } from 'lucide-react';
import { CARD_COLORS, VIBRATION_PATTERNS } from '../constants';
import { soundManager } from '../utils/sound';

interface StartMenuProps {
  onStart: () => void;
  highScore: number;
  isMusicOn: boolean;
  onToggleMusic: () => void;
  canContinue?: boolean;
}

export const StartMenu: React.FC<StartMenuProps> = ({ onStart, highScore, isMusicOn, onToggleMusic, canContinue }) => {
  const [activeModal, setActiveModal] = useState<'none' | 'options' | 'credits'>('none');
  const [volume, setVolume] = useState(50);
  const [vibrationEnabled, setVibrationEnabled] = useState(soundManager.isVibrationEnabled());

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setVolume(val);
    soundManager.setVolume(val / 100);
  };

  const toggleVibration = () => {
    const newState = !vibrationEnabled;
    setVibrationEnabled(newState);
    soundManager.toggleVibration(newState);
    if (newState) {
      soundManager.vibrate(VIBRATION_PATTERNS.DROP);
    }
  };

  // Generate random floating blocks for background matching logo colors (Cyan, Red, Yellow, Green)
  const LOGO_COLORS = [
    { bg: '#40C4FF', shadow: '#0091EA' }, // Cyan
    { bg: '#FF3D00', shadow: '#DD2C00' }, // Red
    { bg: '#FFEA00', shadow: '#FFD600' }, // Yellow
    { bg: '#00E676', shadow: '#00C853' }, // Green
  ];

  const floatingBlocks = Array.from({ length: 12 }).map((_, i) => {
    const style = LOGO_COLORS[i % 4];
    return {
      id: i,
      left: `${Math.random() * 100}%`,
      delay: Math.random() * 5,
      duration: 12 + Math.random() * 12,
      bg: style.bg,
      shadow: style.shadow
    };
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#111625] overflow-hidden safe-top safe-bottom">
      
      {/* Animated Background */}
      {floatingBlocks.map((block) => (
        <motion.div
          key={block.id}
          initial={{ y: -100, opacity: 0, rotate: 0 }}
          animate={{ y: '120vh', opacity: [0, 0.6, 0], rotate: 360 }}
          transition={{ 
            duration: block.duration, 
            repeat: Infinity, 
            delay: block.delay, 
            ease: "linear" 
          }}
          className="absolute w-12 h-12 rounded-xl pointer-events-none opacity-30"
          style={{ 
            left: block.left, 
            backgroundColor: block.bg,
            boxShadow: `inset 2px 2px 0px rgba(255, 255, 255, 0.4), 0 6px 0 ${block.shadow}` 
          }}
        />
      ))}

      {/* Main Menu Content */}
      <AnimatePresence>
        {activeModal === 'none' && (
          <motion.div
            key="main-menu"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="flex flex-col items-center z-10 w-full max-w-md px-6"
          >
            {/* --- NEW COOL LOGO --- */}
            <div className="mb-4 sm:mb-16 relative flex flex-col items-center justify-center">
                
                <img 
                  src="/logo.png" 
                  alt="Block Drop Logo" 
                  className="w-64 sm:w-80 h-auto object-contain drop-shadow-2xl z-20"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = document.getElementById('fallback-logo');
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />

                {/* Fallback Text Logo (shown if /logo.png is missing) */}
                <div id="fallback-logo" className="relative flex-col items-center justify-center hidden w-full">
                    {/* Visual Graphic: 3D Isometric Stack */}
                    <div className="relative w-20 h-20 sm:w-32 sm:h-32 mb-4 sm:mb-6 mx-auto">
                        {/* Glow behind - Removed blur for performance */}
                        <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-pulse" />
                        
                        {/* Bottom Block (Left) */}
                        <motion.div 
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute bottom-0 left-0 w-10 h-10 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl bg-blue-600 shadow-[-4px_4px_0px_#1e3a8a] z-10 border-t border-l border-white/20"
                        />
                        
                        {/* Bottom Block (Right) */}
                        <motion.div 
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                            className="absolute bottom-0 right-0 w-10 h-10 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl bg-purple-600 shadow-[-4px_4px_0px_#4c1d95] z-10 border-t border-l border-white/20"
                        />
    
                        {/* Top Dropping Block */}
                        <motion.div 
                            animate={{ y: [-40, 0, -5, 0], rotate: [5, 0, 0, 0] }}
                            transition={{ duration: 3, repeat: Infinity, times: [0, 0.3, 0.4, 1], ease: "easeOut", repeatDelay: 1 }}
                            className="absolute bottom-[25px] sm:bottom-[40px] left-[10px] sm:left-[16px] w-10 h-10 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl bg-yellow-400 shadow-[-4px_4px_0px_#a16207] z-20 border-t border-l border-white/40 flex items-center justify-center"
                        >
                            {/* Little number inside */}
                            <span className="font-black text-yellow-700/50 text-xl sm:text-2xl">8</span>
                        </motion.div>
                    </div>

                    {/* Text Logo */}
                    <div className="relative text-center">
                        <h1 className="text-5xl sm:text-6xl font-black italic tracking-tighter leading-[0.85] text-white drop-shadow-xl transform -skew-x-6">
                            BLOCK
                        </h1>
                        <h1 className="text-5xl sm:text-6xl font-black italic tracking-tighter leading-[0.85] text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 drop-shadow-lg transform -skew-x-6"
                            style={{ WebkitTextStroke: '1px rgba(255,255,255,0.1)' }}>
                            DROP
                        </h1>
                        
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                            className="h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent mt-4 opacity-80"
                        />
                        <p className="text-blue-200/80 font-bold tracking-[0.5em] text-[0.6rem] mt-2 uppercase">
                          Infinite Merge
                        </p>
                    </div>
                </div>
            </div>

            {highScore > 0 && (
               <motion.div 
                 initial={{ y: 20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 transition={{ delay: 0.3 }}
                 className="mb-6 sm:mb-10 bg-[#1A233A]/90 px-6 py-2 rounded-2xl border border-[#2A3B5C] shadow-xl flex items-center gap-3"
               >
                 <TrophyIcon />
                 <div className="flex flex-col">
                    <span className="text-slate-400 font-bold text-[8px] sm:text-[10px] uppercase tracking-wider">Record</span>
                    <span className="text-yellow-400 font-black text-xl sm:text-2xl leading-none">{highScore}</span>
                 </div>
               </motion.div>
            )}

            {/* Main Action Button */}
            <button
              onClick={() => {
                soundManager.vibrate(VIBRATION_PATTERNS.DROP);
                onStart();
              }}
              className="w-full group relative h-16 sm:h-20 bg-gradient-to-b from-[#FFEA00] to-[#FF9100] hover:from-[#FFD600] hover:to-[#FF6D00] rounded-2xl shadow-[0_6px_0_#00529B,0_15px_20px_rgba(0,0,0,0.4)] active:shadow-[0_0_0_#00529B] active:translate-y-[6px] transition-all mb-4 sm:mb-6 overflow-hidden border-2 border-[#FFF59D]"
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-0 right-0 p-4 opacity-20">
                 <Play size={80} fill="#00529B" className="text-[#00529B]" />
              </div>
              <div className="flex items-center justify-center gap-4 h-full relative z-10">
                 <div className="bg-[#00529B] p-2 rounded-full shadow-inner border border-[#40C4FF]">
                    <Play size={24} fill="white" className="text-white ml-1" />
                 </div>
                 <span className="text-2xl sm:text-3xl font-black text-white tracking-widest uppercase italic transform -skew-x-6 drop-shadow-[0_3px_0_#00529B]">
                    {canContinue ? "CONTINUA" : "GIOCA"}
                 </span>
              </div>
            </button>

            {/* Secondary Buttons Row */}
            <div className="flex gap-3 w-full">
                <button 
                  onClick={() => {
                    soundManager.vibrate(10);
                    soundManager.playClick();
                    setActiveModal('options');
                  }}
                  className="flex-1 py-3 bg-gradient-to-b from-[#40C4FF] to-[#0091EA] hover:from-[#00B0FF] hover:to-[#00B0FF] rounded-xl font-bold text-white shadow-[0_4px_0_#00529B] active:shadow-none active:translate-y-[4px] transition-all flex items-center justify-center gap-2 group border border-[#B3E5FC]"
                >
                    <Settings size={16} className="group-hover:rotate-90 transition-transform duration-500 drop-shadow-md" />
                    <span className="text-[10px] uppercase drop-shadow-md">Opzioni</span>
                </button>
                 <button 
                  onClick={() => {
                    soundManager.vibrate(10);
                    soundManager.playClick();
                    setActiveModal('credits');
                  }}
                  className="flex-1 py-3 bg-gradient-to-b from-[#40C4FF] to-[#0091EA] hover:from-[#00B0FF] hover:to-[#00B0FF] rounded-xl font-bold text-white shadow-[0_4px_0_#00529B] active:shadow-none active:translate-y-[4px] transition-all flex items-center justify-center gap-2 group border border-[#B3E5FC]"
                 >
                    <Star size={16} className="group-hover:text-yellow-300 transition-colors drop-shadow-md" />
                    <span className="text-[10px] uppercase drop-shadow-md">Crediti</span>
                </button>
            </div>
            
            <p className="mt-8 text-slate-600 text-[10px] font-semibold tracking-wide">
              v2.1
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OPTIONS MODAL */}
      <AnimatePresence>
        {activeModal === 'options' && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1A233A] w-full max-w-sm rounded-3xl p-6 border border-[#2A3B5C] shadow-2xl relative"
            >
              <button 
                onClick={() => setActiveModal('none')}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
              
              <h2 className="text-2xl font-black text-white mb-8 text-center uppercase tracking-wide">Opzioni</h2>
              
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Volume2 size={20} />
                    <span className="font-bold text-sm">Volume Principale</span>
                  </div>
                  <span className="text-blue-400 font-bold">{volume}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={volume} 
                  onChange={handleVolumeChange}
                  className="w-full h-2 bg-[#0B0F19] rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between p-4 bg-[#111625]/50 rounded-2xl border border-[#2A3B5C]/50">
                  <div className="flex items-center gap-3 text-slate-300">
                    <Volume2 size={20} className={isMusicOn ? "text-blue-400" : "text-slate-500"} />
                    <div className="flex flex-col">
                      <span className="font-bold text-sm">Musica 8-Bit</span>
                      <span className="text-[10px] text-slate-500">Loop incalzante</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      soundManager.playClick();
                      onToggleMusic();
                    }}
                    className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${isMusicOn ? 'bg-blue-600' : 'bg-[#2A3B5C]'}`}
                  >
                    <motion.div 
                      animate={{ x: isMusicOn ? 24 : 4 }}
                      className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
                    />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#111625]/50 rounded-2xl border border-[#2A3B5C]/50">
                <div className="flex items-center gap-3 text-slate-300">
                  <Smartphone size={20} className={vibrationEnabled ? "text-blue-400" : "text-slate-500"} />
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">Feedback Aptico</span>
                    <span className="text-[10px] text-slate-500">Vibrazione su mobile</span>
                  </div>
                </div>
                <button 
                  onClick={toggleVibration}
                  className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${vibrationEnabled ? 'bg-blue-600' : 'bg-[#2A3B5C]'}`}
                >
                  <motion.div 
                    animate={{ x: vibrationEnabled ? 24 : 4 }}
                    className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
                  />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREDITS MODAL */}
      <AnimatePresence>
        {activeModal === 'credits' && (
           <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             exit={{ scale: 0.9, opacity: 0 }}
             className="bg-[#1A233A] w-full max-w-sm rounded-3xl p-6 border border-[#2A3B5C] shadow-2xl relative text-center"
           >
             <button 
               onClick={() => setActiveModal('none')}
               className="absolute top-4 right-4 text-slate-400 hover:text-white"
             >
               <X size={24} />
             </button>
             
             <h2 className="text-2xl font-black text-white mb-6 text-center uppercase tracking-wide">Crediti</h2>
             
             <div className="flex flex-col items-center gap-4">
               <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg mb-2 p-1">
                 <div className="w-full h-full bg-[#111625] rounded-full flex items-center justify-center">
                    <Github size={40} className="text-white" />
                 </div>
               </div>
               
               <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Sviluppato da</p>
                  <h3 className="text-xl font-bold text-white">KekkoCoppola</h3>
               </div>

               <a 
                 href="https://github.com/KekkoCoppola" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="mt-4 px-6 py-3 bg-[#0B0F19] hover:bg-[#111625] border border-[#2A3B5C] rounded-xl text-blue-400 font-bold text-sm flex items-center gap-2 transition-colors"
               >
                 <Github size={16} />
                 github.com/KekkoCoppola
               </a>
             </div>
           </motion.div>
         </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Simple Icon component for the score
const TrophyIcon = () => (
    <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
        <Star size={20} className="text-yellow-400 fill-yellow-400" />
    </div>
);