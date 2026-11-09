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

/* --- Legibility -----------------------------------------------------------
   The block face is a saturated color, and the numeral sits directly on it.
   A fixed ink color cannot clear 3:1 across a set this wide: the same value
   that reads on yellow disappears on indigo. So the numeral is chosen per
   color by measuring both candidates and keeping the stronger one, which also
   keeps future palette entries safe by construction. */

const srgbToLinear = (channel: number) => {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};

const hexToRgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** WCAG relative luminance, 0 (black) to 1 (white). */
export const luminance = (hex: string): number => {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
};

const contrast = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/** Flatten a translucent black/white overlay onto an opaque base. */
const composite = (hex: string, overlay: 0 | 255, alpha: number) => {
  const [r, g, b] = hexToRgb(hex);
  const mix = (c: number) => c * (1 - alpha) + overlay * alpha;
  return 0.2126 * srgbToLinear(mix(r)) + 0.7152 * srgbToLinear(mix(g)) + 0.0722 * srgbToLinear(mix(b));
};

const DARK_INK_ALPHA = 0.68;
const LIGHT_INK_ALPHA = 0.94;

/**
 * Picks the numeral treatment for a face color. Bright faces get an engraved
 * dark numeral with a lit edge below it; dark faces get an embossed light one
 * with a cast shadow. Both read as stamped into the plastic — the light source
 * stays overhead either way.
 */
const pickInk = (bg: string) => {
  const face = luminance(bg);
  const darkInk = contrast(face, composite(bg, 0, DARK_INK_ALPHA));
  const lightInk = contrast(face, composite(bg, 255, LIGHT_INK_ALPHA));

  return darkInk >= lightInk
    ? {
        ink: `rgba(0, 0, 0, ${DARK_INK_ALPHA})`,
        inkShadow: '0 1px 0 rgba(255, 255, 255, 0.34)',
        inkContrast: darkInk,
      }
    : {
        ink: `rgba(255, 255, 255, ${LIGHT_INK_ALPHA})`,
        inkShadow: '0 1px 1px rgba(0, 0, 0, 0.45)',
        inkContrast: lightInk,
      };
};

export const getCardStyle = (value: number) => {
  const colorKey = ((value - 1) % 12) + 1;
  const colors = CARD_COLORS[colorKey];
  const { ink, inkShadow, inkContrast } = pickInk(colors.bg);

  /* Injection-moulded plastic lit from above. Read top to bottom:
     the lit top bevel, a softer left cheek, the shaded underside of the
     bevel, ambient occlusion pooling at the base, then the extruded bottom
     face that gives the block its height, and finally a contact shadow that
     sits it on the board instead of floating it. */
  const boxShadow = [
    'inset 0 2px 0 rgba(255, 255, 255, 0.46)',
    'inset 2px 0 0 rgba(255, 255, 255, 0.13)',
    'inset -2px 0 0 rgba(0, 0, 0, 0.12)',
    'inset 0 -3px 0 rgba(0, 0, 0, 0.24)',
    'inset 0 -14px 16px -10px rgba(0, 0, 0, 0.38)',
    `0 4px 0 ${colors.shadow}`,
    '0 7px 10px -5px rgba(0, 0, 0, 0.55)',
  ].join(', ');

  return {
    backgroundColor: colors.bg,
    color: '#fff',
    boxShadow,
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '14px',
    accent: colors.accent,
    shadowColor: colors.shadow,

    // Added by the material pass.
    ink,
    inkShadow,
    inkContrast,
    /* A vertical falloff across the face. Subtle on purpose: the bevel does the
       depth work, this only stops the plastic reading as flat fill. */
    faceGradient:
      'linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.02) 42%, rgba(0,0,0,0.10) 100%)',
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

export const VIBRATION_PATTERNS = {
  DROP: 15,
  MERGE: 30,
  COMBO: [20, 40, 20],
  GAME_OVER: [100, 150, 100, 150, 100],
};
