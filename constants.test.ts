import { describe, it, expect } from 'vitest';
import { CARD_COLORS, getCardStyle, getComboText, luminance } from './constants';

/** WCAG contrast between two relative luminances. */
const ratio = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/** Flatten the rgba() ink returned by getCardStyle onto its own face color. */
const inkLuminance = (ink: string, faceHex: string) => {
  const [, r, g, b, a] = ink.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/)!.map(Number);
  const face = faceHex.slice(1);
  const fr = parseInt(face.slice(0, 2), 16);
  const fg = parseInt(face.slice(2, 4), 16);
  const fb = parseInt(face.slice(4, 6), 16);

  const mix = (ic: number, fc: number) => Math.round(ic * a + fc * (1 - a));
  const hex = [mix(r, fr), mix(g, fg), mix(b, fb)]
    .map((c) => c.toString(16).padStart(2, '0'))
    .join('');
  return luminance(`#${hex}`);
};

describe('card legibility', () => {
  const values = Object.keys(CARD_COLORS).map(Number);

  // The numeral is large, bold text on a saturated field, so 3:1 is the bar it
  // must clear. A single fixed ink cannot: this is why getCardStyle measures.
  it.each(values)('numeral on colour %i clears 3:1 against its own face', (value) => {
    const style = getCardStyle(value);
    const face = luminance(CARD_COLORS[value].bg);
    expect(ratio(face, inkLuminance(style.ink, CARD_COLORS[value].bg))).toBeGreaterThanOrEqual(3);
  });

  it('reports the contrast it actually chose', () => {
    for (const value of values) {
      expect(getCardStyle(value).inkContrast).toBeGreaterThanOrEqual(3);
    }
  });

  it('flips to light ink on faces too dark for dark ink', () => {
    // #5856D6 (indigo, value 8) is the case a fixed dark ink fails.
    expect(getCardStyle(8).ink).toContain('255, 255, 255');
    // #FFCC00 (yellow, value 3) is unambiguously a dark-ink face.
    expect(getCardStyle(3).ink).toContain('0, 0, 0');
  });

  it('cycles colour every 12 values so value 13 reuses value 1', () => {
    expect(getCardStyle(13).backgroundColor).toBe(getCardStyle(1).backgroundColor);
    expect(getCardStyle(24).backgroundColor).toBe(getCardStyle(12).backgroundColor);
  });

  it('keeps the extruded bottom face and a contact shadow on every block', () => {
    for (const value of values) {
      const style = getCardStyle(value);
      expect(style.boxShadow).toContain(`0 4px 0 ${CARD_COLORS[value].shadow}`);
      expect(style.boxShadow).toContain('inset 0 2px 0');
    }
  });
});

describe('combo copy', () => {
  it('stays silent below a real combo', () => {
    expect(getComboText(0)).toBe('');
    expect(getComboText(1)).toBe('');
  });

  it('names each tier and tops out rather than running dry', () => {
    expect(getComboText(2)).toBe('DOPPIO!');
    expect(getComboText(6)).toBe('ULTRA!');
    expect(getComboText(7)).toBe('INARRESTABILE!');
    expect(getComboText(99)).toBe('INARRESTABILE!');
  });
});
