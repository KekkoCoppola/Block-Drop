import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameLogic } from './hooks/useGameLogic';
import { Column } from './components/Column';
import { NextCard } from './components/NextCard';
import { GameOverModal } from './components/GameOverModal';
import { ComboOverlay } from './components/ComboOverlay';
import { StartMenu } from './components/StartMenu';
import { ConfirmationModal } from './components/ConfirmationModal';
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
  
  const containerRef = useRef<HTMLDivElement>(null);

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
        x: [0, -4, 4, -4, 4, 0],
        y: [0, 2, -2, 2, -2, 0]
      } : {}}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-slate-950 text-white flex flex-col no-select overflow-hidden"
    >
      
      {/* Background Ambient Glow */}
      <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[60%] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Start Menu */}
      {!isGameStarted && <StartMenu onStart={startGame} highScore={highScore} />}

      {/* GAMEPLAY UI (Only visible when game is started) */}
      {isGameStarted && (
        <>
            {/* Hero Score Section */}
            <div className="relative pt-10 pb-4 flex flex-col items-center justify-center z-10">
                
                {/* Top Controls Row */}
                <div className="absolute top-4 w-full px-6 flex justify-between items-center text-slate-400">
                {/* HOME BUTTON */}
                <button 
                    onClick={pauseGame}
                    className="p-2 rounded-full bg-slate-900/50 border border-slate-800 hover:bg-slate-800 transition-colors"
                >
                    <Home size={16} />
                </button>

                <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1 rounded-full border border-slate-800">
                    <Trophy size={14} className="text-yellow-500" />
                    <span className="font-bold text-sm tracking-wide">{highScore}</span>
                </div>
                
                <div className="flex gap-2">
                    {/* MUSIC TOGGLE */}
                    <button 
                        onClick={toggleMusic}
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
                        onClick={handleRestartClick}
                        className="p-2 rounded-full bg-slate-900/50 border border-slate-800 hover:bg-slate-800 transition-colors"
                    >
                        <RotateCcw size={16} />
                    </button>
                </div>
                </div>

                {/* Big Central Score */}
                <div className="flex flex-col items-center mt-6">
                <h1 className="text-[5rem] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                    {score}
                </h1>
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
