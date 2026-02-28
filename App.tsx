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
    secondNextCardValue,
    isGameOver, 
    isGameStarted,
    comboEvent,
    lastActionId,
    maxValReached,
    dropCard, 
    moveCard,
    resetGame, 
    startGame,
    pauseGame
  } = useGameLogic();

  const [dragX, setDragX] = useState<number | null>(null);
  const [dragY, setDragY] = useState<number | null>(null);
  const [startDragPos, setStartDragPos] = useState<{x: number, y: number} | null>(null);
  const [hasMoved, setHasMoved] = useState(false);
  const [activeColIndex, setActiveColIndex] = useState<number | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isMusicOn, setIsMusicOn] = useState(true);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [beat, setBeat] = useState({ count: 0, phase: 0 });
  const [isShaking, setIsShaking] = useState(false);
  
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
    soundManager.setOnBeatCallback((count, phase) => {
        setBeat({ count, phase });
    });

    const handleInteraction = () => {
        soundManager.init();
        if (isMusicOn) {
            soundManager.toggleMusic(true);
        }
        window.removeEventListener('click', handleInteraction);
        window.removeEventListener('touchstart', handleInteraction);
    };
    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    return () => {
        window.removeEventListener('click', handleInteraction);
        window.removeEventListener('touchstart', handleInteraction);
    };
  }, [isMusicOn]);

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
    
    if (clampedIndex !== activeColIndex && dragState) {
        soundManager.vibrate(5);
    }
    
    setActiveColIndex(clampedIndex);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isGameOver || !isGameStarted) return;
    
    // Start dragging new card
    setDragState({ type: 'new', value: nextCardValue });
    setDragX(e.clientX);
    setDragY(e.clientY);
    setStartDragPos({ x: e.clientX, y: e.clientY });
    setHasMoved(false);
    updateActiveColumn(e.clientX);
  };

  const handleCardDragStart = (colIndex: number, cardValue: number, e: React.PointerEvent, isTop: boolean) => {
    if (isGameOver || !isGameStarted) return;
    e.stopPropagation(); // Stop background handler
    
    if (!isTop) {
        soundManager.vibrate(20);
        soundManager.playPop();
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 400);
        return;
    }
    
    setDragState({ type: 'existing', value: cardValue, fromCol: colIndex });
    setDragX(e.clientX);
    setDragY(e.clientY);
    setStartDragPos({ x: e.clientX, y: e.clientY });
    setHasMoved(false);
    updateActiveColumn(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState || isGameOver) return;
    
    setDragX(e.clientX);
    setDragY(e.clientY);
    updateActiveColumn(e.clientX);

    if (!hasMoved && startDragPos) {
        const dist = Math.sqrt(Math.pow(e.clientX - startDragPos.x, 2) + Math.pow(e.clientY - startDragPos.y, 2));
        if (dist > 15) {
            setHasMoved(true);
            soundManager.vibrate(5);
        }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragState || isGameOver) return;

    if (activeColIndex !== null && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      
      // If it's a tap (hasn't moved much), we drop from the top slot
      // If it's a drag (hasMoved is true), we drop from the current finger position
      const relativeY = !hasMoved ? -100 : (dragY !== null ? dragY - rect.top : 0);
      
      if (dragState.type === 'new') {
        dropCard(activeColIndex, relativeY);
      } else if (dragState.type === 'existing' && dragState.fromCol !== undefined) {
        if (hasMoved) {
            moveCard(dragState.fromCol, activeColIndex, relativeY);
        }
        // If it was just a tap on an existing card, we do nothing to avoid confusion
      }
    }
    
    setDragState(null);
    setDragX(null);
    setDragY(null);
    setStartDragPos(null);
    setHasMoved(false);
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
      animate={isGameOver ? {
        x: [0, -10, 10, -10, 10, 0],
        transition: { duration: 0.4 }
      } : comboEvent ? { 
        x: [0, -4 * Math.min(comboEvent.count, 4), 4 * Math.min(comboEvent.count, 4), 0],
        y: [0, 2 * Math.min(comboEvent.count, 4), -2 * Math.min(comboEvent.count, 4), 0],
        scale: comboEvent.count >= 3 ? [1, 1.01, 1] : 1
      } : {}}
      transition={{ duration: 0.15, ease: "linear" }}
      className="fixed inset-0 bg-slate-950 text-white flex flex-col no-select overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]"
    >
      
      {/* Background Ambient Glow */}
      <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[60%] bg-blue-500/10 blur-[60px] rounded-full pointer-events-none" />

      <BackgroundEffects 
        comboCount={comboEvent?.count || 0} 
        grid={grid} 
        beat={beat} 
        maxValReached={maxValReached} 
      />

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
      {!isGameStarted && (
        <StartMenu 
          onStart={startGame} 
          highScore={highScore} 
          isMusicOn={isMusicOn}
          onToggleMusic={toggleMusic}
          canContinue={score > 0 || grid.some(col => col.length > 0)}
        />
      )}

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

                  <motion.div 
                    animate={score > highScore * 0.9 && score <= highScore && highScore > 0 ? {
                        boxShadow: ["0 0 0px rgba(234,179,8,0)", "0 0 15px rgba(234,179,8,0.4)", "0 0 0px rgba(234,179,8,0)"],
                        borderColor: ["rgba(30,41,59,0.5)", "rgba(234,179,8,0.5)", "rgba(30,41,59,0.5)"]
                    } : {}}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="flex items-center gap-2 bg-slate-900/50 px-3 py-1 rounded-full border border-slate-800"
                  >
                      <Trophy size={14} className="text-yellow-500" />
                      <span className="font-bold text-sm tracking-wide">{highScore}</span>
                  </motion.div>
                  
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
                <div className="flex flex-col items-center mt-2 sm:mt-6 relative">
                <motion.h1 
                    key={score}
                    initial={{ scale: 1.1, y: -5 }}
                    animate={{ 
                        scale: isNewRecord ? [1, 1.1, 1] : 1, 
                        y: 0,
                        color: isNewRecord ? '#FACC15' : '#FFFFFF',
                        textShadow: isNewRecord 
                            ? '0 0 30px rgba(250, 204, 21, 0.6)' 
                            : '0 0 15px rgba(255,255,255,0.3)'
                    }}
                    className="text-[4rem] sm:text-[5rem] font-black leading-none tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all duration-300"
                >
                    {score}
                </motion.h1>
                <p className="text-blue-400/60 font-bold uppercase tracking-[0.3em] text-[0.5rem] sm:text-[0.6rem] mt-1">PUNTEGGIO</p>
                </div>
            </div>

            {/* Main Game Area */}
            <main 
                className="flex-1 relative flex flex-col justify-end pb-12"
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            >
                {/* Combo Feedback Text */}
                <ComboOverlay comboEvent={comboEvent} />

                {/* Next Card Indicator */}
                <NextCard 
                  value={dragState?.type === 'new' ? dragState.value : nextCardValue} 
                  secondNextValue={secondNextCardValue}
                  xPosition={dragState?.type === 'new' && hasMoved ? dragX : null}
                  yPosition={dragState?.type === 'new' && hasMoved ? dragY : null}
                  isMoving={false}
                  isTouching={dragState?.type === 'new' && !hasMoved}
                  onPointerDown={handlePointerDown}
                />

                {/* Floating Card for Existing Drag */}
                {dragState?.type === 'existing' && hasMoved && (
                    <div className="fixed inset-0 pointer-events-none z-[100]">
                        <NextCard 
                            value={dragState.value}
                            xPosition={dragX}
                            yPosition={dragY}
                            isMoving={true}
                            isTouching={false}
                            showLabel={false}
                        />
                    </div>
                )}

                {/* Grid Container */}
                <div className="px-6 w-full max-w-lg mx-auto h-[55vh]">
                <motion.div 
                    ref={containerRef}
                    animate={isShaking ? {
                        x: [0, -10, 10, -10, 10, 0],
                        transition: { duration: 0.4 }
                    } : {}}
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
                        draggingFromThisCol={dragState?.type === 'existing' && dragState.fromCol === i && hasMoved}
                        lastActionId={lastActionId}
                        dragValue={dragState?.value}
                        isDraggingActive={hasMoved}
                    />
                    ))}
                </motion.div>
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
