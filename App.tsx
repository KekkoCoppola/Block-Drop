import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';
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
    lastActionCol,
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
  
  // Native App Initialization
  useEffect(() => {
    const initNative = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          // Hide splash screen
          await SplashScreen.hide();
          
          // Style status bar
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: '#111625' });
        } catch (e) {
          console.warn('Capacitor plugins not available', e);
        }
      }
    };
    initNative();
  }, []);

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
    // If game has practically not started (grid empty), just reset immediately
    const isGridEmpty = grid.every(col => col.length === 0);
    if (isGridEmpty && !isGameOver) {
      resetGame();
    } else {
      setShowResetConfirm(true);
    }
  };

  const confirmRestart = () => {
    setShowResetConfirm(false);
    resetGame();
  };

  // Closing in on the record, but not past it yet — the one moment the record
  // chip is worth drawing the eye to.
  const isNearRecord = highScore > 0 && score > highScore * 0.9 && score <= highScore;

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
      className="fixed inset-0 bg-[#111625] text-white flex flex-col no-select overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]"
    >
      
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
                initial={{ opacity: 0.26 }}
                animate={{ opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.34, ease: 'easeOut' }}
                className="absolute inset-0 z-[5] pointer-events-none"
                /* Warm rather than white: a chain should feel like heat, and a
                   full-screen white flash on a dark board is punishing. */
                style={{ backgroundColor: comboEvent.count >= 5 ? '#FF9F0A' : '#FFD60A' }}
            />
        )}
      </AnimatePresence>

      {/* Start Menu */}
      {!isGameStarted && (
        <StartMenu 
          onStart={startGame} 
          onReset={() => setShowResetConfirm(true)}
          highScore={highScore} 
          isMusicOn={isMusicOn}
          onToggleMusic={toggleMusic}
          canContinue={score > 0 || grid.some(col => col.length > 0)}
        />
      )}

      {/* GAMEPLAY UI (Only visible when game is started) */}
      {isGameStarted && (
        <div className="flex flex-col h-full max-h-screen overflow-hidden safe-top safe-bottom">
            {/* Hero Score Section */}
            <header className="relative pt-12 pb-4 flex flex-col items-center justify-center z-10 shrink-0">
                
                {/* Top Controls Row. Icon buttons are 44px hit areas with the
                    glyph optically centred inside; anything smaller fails on
                    touch and the game is touch-first. */}
                <div className="absolute top-2 w-full px-3 flex items-center gap-2 text-ink-muted">
                  <div className="flex-1 flex justify-start">
                    <button
                        type="button"
                        aria-label="Torna al menu"
                        onClick={() => {
                            soundManager.vibrate(10);
                            soundManager.playPop();
                            pauseGame();
                        }}
                        className="w-11 h-11 grid place-items-center rounded-full bg-deep/70 border border-raised/60 hover:bg-surface hover:text-ink active:scale-95 transition-all"
                    >
                        <Home size={17} aria-hidden />
                    </button>
                  </div>

                  <motion.div
                    animate={isNearRecord ? {
                        boxShadow: ["0 0 0 0 rgba(255,214,10,0)", "0 0 14px 0 rgba(255,214,10,0.35)", "0 0 0 0 rgba(255,214,10,0)"],
                        borderColor: ["rgba(42,59,92,0.6)", "rgba(255,214,10,0.55)", "rgba(42,59,92,0.6)"]
                    } : {}}
                    transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                    className="flex items-center gap-1.5 bg-deep/70 px-3 h-8 rounded-full border border-raised/60"
                  >
                      <Trophy size={13} className="text-gold" aria-hidden />
                      <span className="sr-only">Record</span>
                      <span className="tnum font-bold text-[13px] tracking-wide text-ink">{highScore}</span>
                  </motion.div>

                  <div className="flex-1 flex justify-end gap-1.5">
                      <button
                          type="button"
                          aria-label={isMusicOn ? 'Disattiva musica' : 'Attiva musica'}
                          aria-pressed={isMusicOn}
                          onClick={() => {
                              soundManager.vibrate(10);
                              soundManager.playClick();
                              toggleMusic();
                          }}
                          className={`w-11 h-11 grid place-items-center rounded-full border active:scale-95 transition-all ${
                              isMusicOn
                              ? 'bg-brand/15 border-brand/50 text-brand'
                              : 'bg-deep/70 border-raised/60 hover:bg-surface hover:text-ink'
                          }`}
                      >
                          {isMusicOn ? <Volume2 size={17} aria-hidden /> : <VolumeX size={17} aria-hidden />}
                      </button>

                      <button
                          type="button"
                          aria-label="Ricomincia la partita"
                          onClick={() => {
                              soundManager.vibrate(10);
                              soundManager.playPop();
                              handleRestartClick();
                          }}
                          className="w-11 h-11 grid place-items-center rounded-full bg-deep/70 border border-raised/60 hover:bg-surface hover:text-ink active:scale-95 transition-all"
                      >
                          <RotateCcw size={17} aria-hidden />
                      </button>
                  </div>
                </div>

                {/* The score is the one number the player watches. Tabular
                    figures hold the digit columns so it counts up in place
                    instead of shifting under the eye. */}
                <div className="flex flex-col items-center mt-1 sm:mt-3 relative">
                  <h1 className="sr-only">Punteggio</h1>
                  <motion.output
                      key={score}
                      aria-live="polite"
                      initial={{ scale: 1.08, y: -4 }}
                      animate={{
                          scale: isNewRecord ? [1, 1.08, 1] : 1,
                          y: 0,
                      }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      className="tnum block text-[3.25rem] sm:text-[5rem] font-black leading-none transition-colors duration-300"
                      style={{
                          letterSpacing: '-0.045em',
                          color: isNewRecord ? '#FFD60A' : '#F2F6FF',
                          textShadow: isNewRecord
                            ? '0 0 26px rgba(255,214,10,0.45), 0 2px 0 rgba(0,0,0,0.4)'
                            : '0 2px 0 rgba(0,0,0,0.4)',
                      }}
                  >
                      {score}
                  </motion.output>
                </div>
            </header>

            {/* Main Game Area */}
            <main 
                className="flex-1 relative flex flex-col justify-between pb-4 min-h-0"
                onPointerDown={handlePointerDown}
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
                <div className="px-6 w-full max-w-lg mx-auto flex-1 min-h-0 mb-4">
                <motion.div 
                    ref={containerRef}
                    animate={isShaking ? {
                        x: [0, -10, 10, -10, 10, 0],
                        transition: { duration: 0.4 }
                    } : {}}
                    className="w-full h-full rounded-3xl flex relative overflow-hidden"
                    style={{
                        backgroundColor: 'rgba(8, 11, 19, 0.72)',
                        /* A well cut into the board: the rim catches light at the
                           top, the interior falls away, and blocks land inside it
                           rather than resting on a flat panel. */
                        boxShadow: [
                            'inset 0 2px 3px rgba(0,0,0,0.85)',
                            'inset 0 -1px 0 rgba(255,255,255,0.06)',
                            '0 1px 0 rgba(255,255,255,0.06)',
                            '0 24px 50px -20px rgba(0,0,0,0.9)',
                        ].join(', '),
                        border: '1px solid rgba(42,59,92,0.55)',
                    }}
                >
                    {/* Column guides */}
                    <div aria-hidden className="absolute inset-0 flex pointer-events-none">
                        <div className="flex-1" style={{ borderRight: '1px solid rgba(120,160,220,0.15)' }} />
                        <div className="flex-1" style={{ borderRight: '1px solid rgba(120,160,220,0.15)' }} />
                        <div className="flex-1" style={{ borderRight: '1px solid rgba(120,160,220,0.15)' }} />
                        <div className="flex-1" />
                    </div>

                    {/* Row guides, so a stack's height is readable at a glance. */}
                    <div aria-hidden className="absolute inset-0 flex flex-col-reverse pointer-events-none">
                        <div className="h-1/4" style={{ borderTop: '1px solid rgba(120,160,220,0.13)' }} />
                        <div className="h-1/4" style={{ borderTop: '1px solid rgba(120,160,220,0.13)' }} />
                        <div className="h-1/4" style={{ borderTop: '1px solid rgba(120,160,220,0.13)' }} />
                        <div className="h-1/4" />
                    </div>

                    {grid.map((cards, i) => (
                    <Column 
                        key={i} 
                        colIndex={i} 
                        cards={cards} 
                        isActive={activeColIndex === i}
                        onCardDragStart={handleCardDragStart}
                        draggingFromThisCol={dragState?.type === 'existing' && dragState.fromCol === i && hasMoved}
                        impactKey={lastActionCol === i ? lastActionId : null}
                        dragValue={dragState?.value}
                        isDraggingActive={hasMoved}
                    />
                    ))}
                </motion.div>
                </div>
                
            </main>
        </div>
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
