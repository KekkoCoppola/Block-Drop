import { useState, useEffect, useCallback, useRef } from 'react';
import { Grid, CardData, GameState, ComboEvent } from '../types';
import { COLUMNS, MAX_ROWS, STORAGE_KEY, getComboText } from '../constants';
import { soundManager } from '../utils/sound';

// Simple ID generator to avoid external dependencies like uuid
const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

const createInitialGrid = (): Grid => Array.from({ length: COLUMNS }, () => []);

export const useGameLogic = () => {
  const [grid, setGrid] = useState<Grid>(createInitialGrid());
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [nextCardValue, setNextCardValue] = useState(1);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [maxValReached, setMaxValReached] = useState(3);
  const [comboEvent, setComboEvent] = useState<ComboEvent | null>(null);
  
  const isProcessingRef = useRef(false);
  const comboCountRef = useRef(0);

  // Load state
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed: GameState = JSON.parse(saved);
        setGrid(parsed.grid);
        setScore(parsed.score);
        setHighScore(parsed.highScore);
        setNextCardValue(parsed.nextCardValue);
        setIsGameOver(parsed.isGameOver);
        setMaxValReached(parsed.maxValReached);
      } catch (e) {
        console.error("Failed to load save", e);
      }
    } else {
      setNextCardValue(generateNextValue(3));
    }
  }, []);

  // Save state
  useEffect(() => {
    const state: GameState = {
      grid,
      score,
      highScore,
      nextCardValue,
      isGameOver,
      isGameStarted,
      maxValReached,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [grid, score, highScore, nextCardValue, isGameOver, isGameStarted, maxValReached]);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
    }
  }, [score, highScore]);

  const startGame = () => {
    setIsGameStarted(true);
  };
  
  const pauseGame = () => {
    setIsGameStarted(false);
  };

  const generateNextValue = (currentMax: number) => {
    const cap = Math.max(3, currentMax - 2);
    return Math.floor(Math.random() * cap) + 1;
  };

  const checkMerge = useCallback(async (currentGrid: Grid, colIndex: number, addedCardIndex: number): Promise<{ grid: Grid; merged: boolean; scoreDelta: number }> => {
    const column = [...currentGrid[colIndex]];
    
    if (addedCardIndex <= 0) return { grid: currentGrid, merged: false, scoreDelta: 0 };

    const topCard = column[addedCardIndex];
    const belowCard = column[addedCardIndex - 1];

    if (topCard.value === belowCard.value) {
      const newValue = topCard.value + 1;
      const points = Math.pow(2, newValue) * (comboCountRef.current + 1);

      const newCard: CardData = {
        id: generateId(),
        value: newValue,
        isMerging: true,
      };

      const newColumn = [...column];
      newColumn.splice(addedCardIndex - 1, 2, newCard); 

      const newGrid = [...currentGrid];
      newGrid[colIndex] = newColumn;

      comboCountRef.current += 1;
      soundManager.playMerge(comboCountRef.current);

      if (comboCountRef.current > 1) {
          setComboEvent({
              count: comboCountRef.current,
              id: generateId(),
              text: getComboText(comboCountRef.current)
          });
      }

      return { grid: newGrid, merged: true, scoreDelta: points };
    }

    return { grid: currentGrid, merged: false, scoreDelta: 0 };
  }, []);

  const processGravityAndMerges = useCallback(async (startGrid: Grid, colIndex: number) => {
    let currentGrid = startGrid;
    let keepChecking = true;
    
    while (keepChecking) {
      const column = currentGrid[colIndex];
      const topIndex = column.length - 1;
      if (topIndex < 0) {
        keepChecking = false;
        break;
      }
      
      const { grid: nextGrid, merged, scoreDelta } = await checkMerge(currentGrid, colIndex, topIndex);
      
      if (merged) {
        currentGrid = nextGrid;
        
        const newVal = currentGrid[colIndex][currentGrid[colIndex].length - 1].value;
        if (newVal > maxValReached) {
          setMaxValReached(newVal);
        }

        setGrid(currentGrid);
        setScore(prev => prev + scoreDelta);
        
        await new Promise(r => setTimeout(r, 250)); // Slightly faster merge
      } else {
        keepChecking = false;
      }
    }
    
    return currentGrid;
  }, [checkMerge, maxValReached]);

  const dropCard = useCallback(async (colIndex: number) => {
    if (isGameOver || isProcessingRef.current || !isGameStarted) return;
    
    if (grid[colIndex].length >= MAX_ROWS) {
        return;
    }

    isProcessingRef.current = true;
    comboCountRef.current = 0;
    setComboEvent(null); 

    const newCard: CardData = { id: generateId(), value: nextCardValue, isNew: true };
    const tempGrid = [...grid];
    tempGrid[colIndex] = [...tempGrid[colIndex], newCard];
    
    setGrid(tempGrid);
    soundManager.playDrop();

    const nextVal = generateNextValue(maxValReached);
    setNextCardValue(nextVal);

    await processGravityAndMerges(tempGrid, colIndex);
    
    setGrid(prevGrid => {
        if (prevGrid.every(c => c.length >= MAX_ROWS)) {
            setIsGameOver(true);
            soundManager.playGameOver();
        }
        return prevGrid;
    });

    isProcessingRef.current = false;
  }, [grid, isGameOver, isGameStarted, nextCardValue, maxValReached, processGravityAndMerges]);

  const moveCard = useCallback(async (fromCol: number, toCol: number) => {
    if (isGameOver || isProcessingRef.current || !isGameStarted) return;
    if (fromCol === toCol) return; 

    if (grid[fromCol].length === 0) return;
    if (grid[toCol].length >= MAX_ROWS) return;

    isProcessingRef.current = true;
    comboCountRef.current = 0;
    setComboEvent(null);

    const tempGrid = [...grid];
    const sourceColCards = [...tempGrid[fromCol]];
    const cardToMove = sourceColCards.pop(); 

    if (!cardToMove) {
        isProcessingRef.current = false;
        return;
    }

    tempGrid[fromCol] = sourceColCards;
    tempGrid[toCol] = [...tempGrid[toCol], cardToMove]; 

    setGrid(tempGrid);
    soundManager.playDrop();

    await processGravityAndMerges(tempGrid, toCol);
    
    setGrid(prevGrid => {
        if (prevGrid.every(c => c.length >= MAX_ROWS)) {
            setIsGameOver(true);
            soundManager.playGameOver();
        }
        return prevGrid;
    });

    isProcessingRef.current = false;
  }, [grid, isGameOver, isGameStarted, processGravityAndMerges]);

  const resetGame = () => {
    setGrid(createInitialGrid());
    setScore(0);
    setNextCardValue(generateNextValue(3));
    setIsGameOver(false);
    setMaxValReached(3);
    setComboEvent(null);
    setIsGameStarted(true);
  };

  return {
    grid,
    score,
    highScore,
    nextCardValue,
    isGameOver,
    isGameStarted,
    comboEvent,
    startGame,
    pauseGame,
    dropCard,
    moveCard,
    resetGame
  };
};