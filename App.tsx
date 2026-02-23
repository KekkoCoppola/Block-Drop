import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameLogic } from './hooks/useGameLogic';
import { Column } from './components/Column';
import { NextCard } from './components/NextCard';
import { GameOverModal } from './components/GameOverModal';
import { ComboOverlay } from './components/ComboOverlay';
import { StartMenu } from './components/StartMenu';
import { ConfirmationModal } from './components/ConfirmationModal';
import { BackgroundEffects } from './components/BackgroundEffects';
import { COLUMNS } from './constants';
import { Trophy, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';
import { soundManager } from './utils/sound';

interface DragState {
  type: 'new' | 'existing';
  value: number;
  fromCol?: number;
}

const App: React.FC = () => {
  const { 
    grid, 
    score, 
    highScore, 
    nextCardValue, 
    isGameOver, 
    isGameStarted,
    comboEvent,
    dropCard, 
    moveCard,
    resetGame, 
    startGame,
    pauseGame
  } = useGameLogic();

  const [dragX, setDragX] = useState<number | null>(null);
  const [activeColIndex, setActiveColIndex] = useState<number | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isMusicOn, setIsMusicOn] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Track if we just broke the high score
  useEffect(() => {
    if (score > highScore && highScore > 0 && !isNewRecord) {
      setIsNewRecord(true);
      soundManager.vibrate(50);
    }
    if (score === 0) {
      setIsNewRecord(false);
    }
  }, [score, highScore, isNewRecord]);

  // Initialize Sound Context on mount (user interaction required for play)
  useEffect(() => {
    const handleInteraction = () => {
        soundManager.init();
        window.removeEventListener('click', handleInteraction);
        window.removeEventListener('touchstart', handleInteraction);
    };
    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    return () => {
        window.removeEventListener('click', handleInteraction);
        window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  const toggleMusic = () => {
    const newState = !isMusicOn;
    setIsMusicOn(newState);
    soundManager.toggleMusic(newState);
  };

  // Handle Dragging logic
  const updateActiveColumn = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const colWidth = rect.width / COLUMNS;
    const colIndex = Math.floor(relativeX / colWidth);
    
    // Clamp index
    const clampedIndex = Math.max(0, Math.min(COLUMNS - 1, colIndex));
    setActiveColIndex(clampedIndex);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isGameOver || !isGameStarted) return;
    
    // Start dragging new card (default action if background is clicked)
    setDragState({ type: 'new', value: nextCardValue });
    setDragX(e.clientX);
    updateActiveColumn(e.clientX);
  };

  const handleCardDragStart = (colIndex: number, cardValue: number, e: React.PointerEvent) => {
    if (isGameOver || !isGameStarted) return;
    e.stopPropagation(); // Stop background handler
    
    setDragState({ type: 'existing', value: cardValue, fromCol: colIndex });
    setDragX(e.clientX);
    updateActiveColumn(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState || isGameOver) return;
    setDragX(e.clientX);
    updateActiveColumn(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragState || isGameOver) return;

    if (activeColIndex !== null) {
      if (dragState.type === 'new') {
        dropCard(activeColIndex);
      } else if (dragState.type === 'existing' && dragState.fromCol !== undefined) {
        moveCard(dragState.fromCol, activeColIndex);
      }
    }
    
    setDragState(null);
    setDragX(null);
    setActiveColIndex(null);
  };

  // Prevent default touch behaviors
  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault();
    document.addEventListener('touchmove', preventDefault, { passive: false });
    return () => document.removeEventListener('touchmove', preventDefault);
  }, []);

  const handleRestartClick = () => {
    // If game has practically not started (score 0), just reset immediately
    if (score === 0 && !isGameOver) {
      resetGame();
    } else {
      setShowResetConfirm(true);
    }
  };

  const confirmRestart = () => {
    setShowResetConfirm(false);
    resetGame();
  };

  return (
    <motion.div 
      animate={comboEvent ? { 
        x: [0, -4 * Math.min(comboEvent.count, 4), 4 * Math.min(comboEvent.count, 4), 0],
        y: [0, 2 * Math.min(comboEvent.count, 4), -2 * Math.min(comboEvent.count, 4), 0],
        scale: comboEvent.count >= 3 ? [1, 1.01, 1] : 1
      } : {}}
      transition={{ duration: 0.15, ease: "linear" }}
      className="fixed inset-0 bg-slate-950 text-white flex flex-col no-select overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]"
    >
      
      {/* Background Ambient Glow */}
      <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[60%] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

      <BackgroundEffects comboCount={comboEvent?.count || 0} grid={grid} />

      {/* Combo Flash Overlay */}
      <AnimatePresence>
        {comboEvent && comboEvent.count >= 3 && (
            <motion.div 
                key={`flash-${comboEvent.id}`}
                initial={{ opacity: 0.3 }}
                animate={{ opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 bg-white z-[5] pointer-events-none"
            />
        )}
      </AnimatePresence>

      {/* Start Menu */}
      {!isGameStarted && <StartMenu onStart={startGame} highScore={highScore} />}

      {/* GAMEPLAY UI (Only visible when game is started) */}
      {isGameStarted && (
        <>
            {/* Hero Score Section */}
            <div className="relative pt-8 pb-2 flex flex-col items-center justify-center z-10">
                
                {/* Top Controls Row */}
                <div className="absolute top-2 w-full px-6 flex items-center text-slate-400">
                  <div className="flex-1 flex justify-start">
                    {/* HOME BUTTON */}
                    <button 
                        onClick={() => {
                            soundManager.vibrate(10);
                            soundManager.playPop();
                            pauseGame();
                        }}
                        className="p-2 rounded-full bg-slate-900/50 border border-slate-800 hover:bg-slate-800 transition-colors"
                    >
                        <Home size={16} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1 rounded-full border border-slate-800">
                      <Trophy size={14} className="text-yellow-500" />
                      <span className="font-bold text-sm tracking-wide">{highScore}</span>
                  </div>
                  
                  <div className="flex-1 flex justify-end gap-2">
                      {/* MUSIC TOGGLE */}
                      <button 
                          onClick={() => {
                              soundManager.vibrate(10);
                              soundManager.playClick();
                              toggleMusic();
                          }}
                          className={`p-2 rounded-full border transition-colors ${
                              isMusicOn 
                              ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' 
                              : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800'
                          }`}
                      >
                          {isMusicOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
                      </button>

                      {/* RESTART */}
                      <button 
                          onClick={() => {
                              soundManager.vibrate(10);
                              soundManager.playPop();
                              handleRestartClick();
                          }}
                          className="p-2 rounded-full bg-slate-900/50 border border-slate-800 hover:bg-slate-800 transition-colors"
                      >
                          <RotateCcw size={16} />
                      </button>
                  </div>
                </div>

                {/* Big Central Score */}
                <div className="flex flex-col items-center mt-6 relative">
                <AnimatePresence>
                    {isNewRecord && (
                        <>
                            {/* Confetti-like burst */}
                            {Array.from({ length: 12 }).map((_, i) => (
                                <motion.div
                                    key={`confetti-${i}`}
                                    initial={{ x: 0, y: 0, scale: 0 }}
                                    animate={{ 
                                        x: (Math.random() - 0.5) * 300, 
                                        y: (Math.random() - 0.5) * 200 - 50,
                                        scale: [0, 1, 0],
                                        rotate: Math.random() * 360
                                    }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="absolute w-2 h-2 bg-yellow-400 rounded-sm z-0"
                                />
                            ))}
                            
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                                animate={{ 
                                    opacity: 1, 
                                    scale: [1, 1.1, 1], 
                                    y: 0,
                                    boxShadow: [
                                        "0 0 20px rgba(234,179,8,0.5)",
                                        "0 0 40px rgba(234,179,8,0.8)",
                                        "0 0 20px rgba(234,179,8,0.5)"
                                    ]
                                }}
                                transition={{ 
                                    scale: { repeat: Infinity, duration: 2 },
                                    boxShadow: { repeat: Infinity, duration: 2 }
                                }}
                                className="absolute -top-8 bg-yellow-500 text-slate-950 text-[10px] font-black px-4 py-1.5 rounded-full z-20"
                            >
                                NUOVO RECORD!
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                <div className="absolute -right-12 top-1/2 -translate-y-1/2 flex flex-col items-center opacity-40">
                    <span className="text-[8px] font-bold tracking-widest uppercase text-slate-500">LV</span>
                    <span className="text-xl font-black text-slate-400 leading-none">{Math.floor(score / 3000) + 1}</span>
                </div>

                <motion.h1 
                    key={score}
                    initial={{ scale: 1.1, y: -5 }}
                    animate={{ 
                        scale: isNewRecord ? [1, 1.2, 1] : 1, 
                        y: 0,
                        color: isNewRecord ? '#FACC15' : '#FFFFFF',
                        textShadow: isNewRecord 
                            ? '0 0 30px rgba(250, 204, 21, 0.6)' 
                            : '0 0 15px rgba(255,255,255,0.3)'
                    }}
                    className="text-[5rem] font-black leading-none tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all duration-300"
                >
                    {score}
                </motion.h1>
                <p className="text-blue-400/60 font-bold uppercase tracking-[0.3em] text-[0.6rem] mt-1">PUNTEGGIO</p>
                </div>
            </div>

            {/* Main Game Area */}
            <main 
                className="flex-1 relative flex flex-col justify-end pb-12"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            >
                {/* Combo Feedback Text */}
                <ComboOverlay comboEvent={comboEvent} />

                {/* Next Card Indicator */}
                <NextCard 
                  value={dragState ? dragState.value : nextCardValue} 
                  xPosition={dragX}
                  isMoving={dragState?.type === 'existing'}
                />

                {/* Grid Container */}
                <div className="px-6 w-full max-w-lg mx-auto h-[55vh]">
                <div 
                    ref={containerRef}
                    className="w-full h-full bg-slate-900/40 backdrop-blur-sm rounded-3xl border border-slate-800/50 flex shadow-2xl relative overflow-hidden"
                >
                    {/* Grid Vertical Lines visual */}
                    <div className="absolute inset-0 flex pointer-events-none">
                        <div className="flex-1 border-r border-slate-800/30"></div>
                        <div className="flex-1 border-r border-slate-800/30"></div>
                        <div className="flex-1 border-r border-slate-800/30"></div>
                        <div className="flex-1"></div>
                    </div>

                    {grid.map((cards, i) => (
                    <Column 
                        key={i} 
                        colIndex={i} 
                        cards={cards} 
                        isActive={activeColIndex === i}
                        onCardDragStart={handleCardDragStart}
                        draggingFromThisCol={dragState?.type === 'existing' && dragState.fromCol === i}
                    />
                    ))}
                </div>
                </div>
                
                {/* Instruction Hint */}
                {isGameStarted && !dragState && grid.every(c => c.length === 0) && (
                    <div className="absolute bottom-4 w-full text-center text-slate-600 text-[10px] uppercase font-bold tracking-widest animate-pulse pointer-events-none">
                        TRASCINA PER GIOCARE
                    </div>
                )}
            </main>
        </>
      )}

      {/* Game Over Overlay */}
      <GameOverModal 
        isOpen={isGameOver}
        score={score} 
        highScore={highScore} 
        onRestart={confirmRestart}
      />

      {/* Reset Confirmation Modal */}
      <ConfirmationModal 
        isOpen={showResetConfirm}
        title="Ricominciare?"
        message="Sei sicuro di voler terminare la partita? Il punteggio attuale andrà perso."
        onConfirm={confirmRestart}
        onCancel={() => setShowResetConfirm(false)}
      />
    </motion.div>
  );
};

export default App;
