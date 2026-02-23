import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Star, Settings, X, Volume2, Github, Smartphone } from 'lucide-react';
import { CARD_COLORS, VIBRATION_PATTERNS } from '../constants';
import { soundManager } from '../utils/sound';

interface StartMenuProps {
  onStart: () => void;
  highScore: number;
}

export const StartMenu: React.FC<StartMenuProps> = ({ onStart, highScore }) => {
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

  // Generate random floating blocks for background
  const floatingBlocks = Array.from({ length: 15 }).map((_, i) => {
    const colorKey = (i % 6) + 1;
    const style = CARD_COLORS[colorKey];
    return {
      id: i,
      left: `${Math.random() * 100}%`,
      delay: Math.random() * 5,
      duration: 10 + Math.random() * 10,
      bg: style.bg,
      shadow: style.shadow
    };
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 overflow-hidden">
      
      {/* Animated Background */}
      {floatingBlocks.map((block) => (
        <motion.div
          key={block.id}
          initial={{ y: -100, opacity: 0, rotate: 0 }}
          animate={{ y: '120vh', opacity: [0, 0.4, 0], rotate: 360 }}
          transition={{ 
            duration: block.duration, 
            repeat: Infinity, 
            delay: block.delay, 
            ease: "linear" 
          }}
          className="absolute w-12 h-12 rounded-lg pointer-events-none opacity-20"
          style={{ 
            left: block.left, 
            backgroundColor: block.bg,
            boxShadow: `4px 4px 0 ${block.shadow}` 
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
            <div className="mb-16 relative flex flex-col items-center justify-center">
                
                {/* Visual Graphic: 3D Isometric Stack */}
                <div className="relative w-32 h-32 mb-6">
                    {/* Glow behind */}
                    <div className="absolute inset-0 bg-blue-500 blur-[50px] opacity-40 animate-pulse" />
                    
                    {/* Bottom Block (Left) */}
                    <motion.div 
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute bottom-0 left-0 w-16 h-16 rounded-xl bg-blue-600 shadow-[-4px_4px_0px_#1e3a8a] z-10 border-t border-l border-white/20"
                    />
                    
                    {/* Bottom Block (Right) */}
                    <motion.div 
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                        className="absolute bottom-0 right-0 w-16 h-16 rounded-xl bg-purple-600 shadow-[-4px_4px_0px_#4c1d95] z-10 border-t border-l border-white/20"
                    />

                    {/* Top Dropping Block */}
                    <motion.div 
                        animate={{ y: [-40, 0, -5, 0], rotate: [5, 0, 0, 0] }}
                        transition={{ duration: 3, repeat: Infinity, times: [0, 0.3, 0.4, 1], ease: "easeOut", repeatDelay: 1 }}
                        className="absolute bottom-[40px] left-[16px] w-16 h-16 rounded-xl bg-yellow-400 shadow-[-4px_4px_0px_#a16207] z-20 border-t border-l border-white/40 flex items-center justify-center"
                    >
                        {/* Little number inside */}
                        <span className="font-black text-yellow-700/50 text-2xl">8</span>
                    </motion.div>
                </div>

                {/* Text Logo */}
                <div className="relative text-center">
                    <h1 className="text-6xl font-black italic tracking-tighter leading-[0.85] text-white drop-shadow-xl transform -skew-x-6">
                        BLOCK
                    </h1>
                    <h1 className="text-6xl font-black italic tracking-tighter leading-[0.85] text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 drop-shadow-lg transform -skew-x-6"
                        style={{ WebkitTextStroke: '2px rgba(255,255,255,0.1)' }}>
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

            {highScore > 0 && (
               <motion.div 
                 initial={{ y: 20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 transition={{ delay: 0.3 }}
                 className="mb-10 bg-slate-800/80 backdrop-blur-md px-8 py-3 rounded-2xl border border-slate-700 shadow-xl flex items-center gap-3"
               >
                 <TrophyIcon />
                 <div className="flex flex-col">
                    <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Miglior Record</span>
                    <span className="text-yellow-400 font-black text-2xl leading-none">{highScore}</span>
                 </div>
               </motion.div>
            )}

            {/* Main Action Button */}
            <button
              onClick={() => {
                soundManager.vibrate(VIBRATION_PATTERNS.DROP);
                onStart();
              }}
              className="w-full group relative h-20 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-2xl shadow-[0_6px_0_#1e3a8a,0_15px_20px_rgba(0,0,0,0.4)] active:shadow-[0_0_0_#1e3a8a] active:translate-y-[6px] transition-all mb-6 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Play size={80} fill="white" />
              </div>
              <div className="flex items-center justify-center gap-4 h-full relative z-10">
                 <div className="bg-white/20 p-2 rounded-full shadow-inner">
                    <Play size={24} fill="white" className="text-white ml-1" />
                 </div>
                 <span className="text-3xl font-black text-white tracking-widest uppercase italic transform -skew-x-6">GIOCA</span>
              </div>
            </button>

            {/* Secondary Buttons Row */}
            <div className="flex gap-4 w-full">
                <button 
                  onClick={() => {
                    soundManager.vibrate(10);
                    soundManager.playClick();
                    setActiveModal('options');
                  }}
                  className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-slate-300 shadow-[0_4px_0_#1e293b] active:shadow-none active:translate-y-[4px] transition-all flex items-center justify-center gap-2 group"
                >
                    <Settings size={18} className="group-hover:rotate-90 transition-transform duration-500" />
                    <span className="text-xs uppercase">Opzioni</span>
                </button>
                 <button 
                  onClick={() => {
                    soundManager.vibrate(10);
                    soundManager.playClick();
                    setActiveModal('credits');
                  }}
                  className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-slate-300 shadow-[0_4px_0_#1e293b] active:shadow-none active:translate-y-[4px] transition-all flex items-center justify-center gap-2 group"
                 >
                    <Star size={18} className="group-hover:text-yellow-400 transition-colors" />
                    <span className="text-xs uppercase">Crediti</span>
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
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 w-full max-w-sm rounded-3xl p-6 border border-slate-700 shadow-2xl relative"
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
                  className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-700/50">
                <div className="flex items-center gap-3 text-slate-300">
                  <Smartphone size={20} className={vibrationEnabled ? "text-blue-400" : "text-slate-500"} />
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">Feedback Aptico</span>
                    <span className="text-[10px] text-slate-500">Vibrazione su mobile</span>
                  </div>
                </div>
                <button 
                  onClick={toggleVibration}
                  className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${vibrationEnabled ? 'bg-blue-600' : 'bg-slate-700'}`}
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
           <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             exit={{ scale: 0.9, opacity: 0 }}
             className="bg-slate-800 w-full max-w-sm rounded-3xl p-6 border border-slate-700 shadow-2xl relative text-center"
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
                 <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
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
                 className="mt-4 px-6 py-3 bg-slate-950 hover:bg-slate-900 border border-slate-700 rounded-xl text-blue-400 font-bold text-sm flex items-center gap-2 transition-colors"
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