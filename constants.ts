import React from 'react';

export const COLUMNS = 4;
export const MAX_ROWS = 4;
export const STORAGE_KEY = 'card-drop-save-v2'; // Bumped version for new style

// VIVID, HIGH SATURATION COLORS - OPTIMIZED FOR SOLID BLOCKS
export const CARD_COLORS: Record<number, { bg: string; accent: string; shadow: string }> = {
  1: { bg: '#FF3B30', accent: '#FF99AA', shadow: '#9E1C15' }, // Red
  2: { bg: '#007AFF', accent: '#CCF2FF', shadow: '#004085' }, // Blue
  3: { bg: '#FFCC00', accent: '#FFF5CC', shadow: '#997A00' }, // Yellow
  4: { bg: '#AF52DE', accent: '#E5CCFF', shadow: '#6A238F' }, // Purple
  5: { bg: '#34C759', accent: '#CCFFE0', shadow: '#19662B' }, // Green
  6: { bg: '#FF9500', accent: '#FFCC99', shadow: '#995900' }, // Orange
  7: { bg: '#FF2D55', accent: '#FFCCF2', shadow: '#990F29' }, // Pink
  8: { bg: '#5856D6', accent: '#CCCCFF', shadow: '#302E80' }, // Indigo
  9: { bg: '#5AC8FA', accent: '#F2FFCC', shadow: '#287A9E' }, // Teal
  10: { bg: '#4CD964', accent: '#CCFFF5', shadow: '#248F3F' }, // Mint
  11: { bg: '#FF5E3A', accent: '#D9CCFF', shadow: '#9E2C15' }, // Coral
  12: { bg: '#8E8E93', accent: '#FFCCCC', shadow: '#4A4A4D' }, // Grey
};

export const getCardStyle = (value: number) => {
  const colorKey = ((value - 1) % 12) + 1;
  const colors = CARD_COLORS[colorKey];
  
  // "Tetris" / Solid Plastic Style
  // We use inset shadows to create a high-contrast bevel effect
  const bevelHighlight = 'inset 4px 4px 0px rgba(255, 255, 255, 0.4)';
  const bevelShadow = 'inset -4px -4px 0px rgba(0, 0, 0, 0.2)';
  const deepShadow = `0 6px 0 ${colors.shadow}`; // The "3D" part below the block

  return { 
    background: colors.bg,
    color: '#fff', 
    boxShadow: `${bevelHighlight}, ${bevelShadow}, ${deepShadow}, 0 10px 10px rgba(0,0,0,0.3)`,
    border: 'none', // Removed outline border for cleaner block look
    borderRadius: '12px', // Slightly squarer than before
    accent: colors.accent,
    shadowColor: colors.shadow
  };
};

export const getComboText = (combo: number): string => {
  if (combo <= 1) return "";
  if (combo === 2) return "DOPPIO!";
  if (combo === 3) return "TRIPLO!";
  if (combo === 4) return "QUADRUPLO!";
  if (combo === 5) return "MEGA!";
  if (combo === 6) return "ULTRA!";
  return "INARRESTABILE!";
};