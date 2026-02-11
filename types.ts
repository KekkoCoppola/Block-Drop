
export interface CardData {
  id: string;
  value: number;
  isMerging?: boolean;
  isNew?: boolean;
}

export type Grid = CardData[][];

export interface GameState {
  grid: Grid;
  score: number;
  highScore: number;
  nextCardValue: number;
  isGameOver: boolean;
  isGameStarted: boolean; // New state for Start Menu
  maxValReached: number;
}

export interface SoundManager {
  playDrop: () => void;
  playMerge: (comboLevel: number) => void;
  playGameOver: () => void;
  toggleMusic: (shouldPlay: boolean) => void;
  init: () => void; // Initialize context
}

export interface ComboEvent {
  count: number;
  id: string; // Unique ID to trigger animations
  text: string;
}
