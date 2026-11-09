import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StrictMode } from 'react';
import { renderHook, act } from '@testing-library/react';
import { useGameLogic } from './useGameLogic';
import { STORAGE_KEY, MAX_ROWS } from '../constants';
import type { CardData, Grid, GameState } from '../types';

// The hook fires sound + haptics as side effects; neither is under test and
// both need a real AudioContext, so the whole singleton is stubbed out.
vi.mock('../utils/sound', () => ({
  soundManager: {
    playDrop: vi.fn(),
    playMerge: vi.fn(),
    playGameOver: vi.fn(),
    playClick: vi.fn(),
    playPop: vi.fn(),
    toggleMusic: vi.fn(),
    fadeOutMusic: vi.fn(),
    setOnBeatCallback: vi.fn(),
    toggleVibration: vi.fn(),
    isVibrationEnabled: vi.fn(() => false),
    vibrate: vi.fn(),
    init: vi.fn(),
  },
}));

/**
 * generateNextValue() computes `floor(random() * cap) + 1` with cap === 3 for a
 * fresh game, so pinning Math.random to a constant pins every generated card to
 * one value. generateId() draws from the same source, which makes ids collide —
 * harmless here, because the merge logic addresses cards by index, never by id.
 */
const R_FOR_VALUE: Record<number, number> = { 1: 0.1, 2: 0.45, 3: 0.8 };
let randValue = R_FOR_VALUE[1];

const card = (value: number, id = `seed-${Math.random()}`): CardData => ({ id, value });

const seedSave = (grid: Grid, overrides: Partial<GameState> = {}) => {
  const state: GameState = {
    grid,
    score: 0,
    highScore: 0,
    nextCardValue: 1,
    secondNextCardValue: 1,
    isGameOver: false,
    isGameStarted: true,
    maxValReached: 3,
    ...overrides,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

/** Drives one drop to completion through the hook's hardcoded animation waits. */
const drop = async (result: { current: ReturnType<typeof useGameLogic> }, col: number) => {
  await act(async () => {
    const done = result.current.dropCard(col);
    await vi.advanceTimersByTimeAsync(5000);
    await done;
  });
};

const move = async (
  result: { current: ReturnType<typeof useGameLogic> },
  from: number,
  to: number,
) => {
  await act(async () => {
    const done = result.current.moveCard(from, to);
    await vi.advanceTimersByTimeAsync(5000);
    await done;
  });
};

const start = async (result: { current: ReturnType<typeof useGameLogic> }) => {
  await act(async () => {
    result.current.startGame();
  });
};

const values = (col: CardData[]) => col.map((c) => c.value);

beforeEach(() => {
  localStorage.clear();
  randValue = R_FOR_VALUE[1];
  vi.spyOn(Math, 'random').mockImplementation(() => randValue);
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('useGameLogic — initial state', () => {
  it('starts with one empty stack per column', () => {
    const { result } = renderHook(() => useGameLogic());
    expect(result.current.grid).toHaveLength(4);
    expect(result.current.grid.every((col) => col.length === 0)).toBe(true);
    expect(result.current.score).toBe(0);
    expect(result.current.isGameOver).toBe(false);
    expect(result.current.isGameStarted).toBe(false);
  });

  it('restores a saved game from localStorage', () => {
    seedSave([[card(2), card(1)], [], [card(3)], []], { score: 120, highScore: 300 });
    const { result } = renderHook(() => useGameLogic());
    expect(values(result.current.grid[0])).toEqual([2, 1]);
    expect(values(result.current.grid[2])).toEqual([3]);
    expect(result.current.score).toBe(120);
    expect(result.current.highScore).toBe(300);
    expect(result.current.isGameStarted).toBe(true);
  });
});

describe('useGameLogic — dropping', () => {
  it('ignores drops before the game has started', async () => {
    const { result } = renderHook(() => useGameLogic());
    await drop(result, 0);
    expect(result.current.grid[0]).toHaveLength(0);
  });

  it('places the queued card on top of the chosen column', async () => {
    const { result } = renderHook(() => useGameLogic());
    await start(result);
    const queued = result.current.nextCardValue;

    await drop(result, 2);

    expect(values(result.current.grid[2])).toEqual([queued]);
    expect(result.current.grid[0]).toHaveLength(0);
  });

  it('advances the preview queue: next becomes what was second-next', async () => {
    const { result } = renderHook(() => useGameLogic());
    await start(result);
    const secondNext = result.current.secondNextCardValue;

    await drop(result, 0);

    expect(result.current.nextCardValue).toBe(secondNext);
  });

  it('refuses to overfill a column', async () => {
    // Non-adjacent-equal values so nothing collapses and the stack stays full.
    seedSave([[card(2), card(3), card(2), card(3)], [], [], []]);
    const { result } = renderHook(() => useGameLogic());

    await drop(result, 0);

    expect(result.current.grid[0]).toHaveLength(MAX_ROWS);
    expect(values(result.current.grid[0])).toEqual([2, 3, 2, 3]);
  });
});

describe('useGameLogic — merging', () => {
  it('collapses two equal top cards into value + 1', async () => {
    const { result } = renderHook(() => useGameLogic());
    await start(result);

    await drop(result, 0);
    await drop(result, 0);

    expect(values(result.current.grid[0])).toEqual([2]);
  });

  it('scores a single merge as 2^newValue', async () => {
    const { result } = renderHook(() => useGameLogic());
    await start(result);

    await drop(result, 0);
    expect(result.current.score).toBe(0);

    await drop(result, 0); // 1 + 1 -> 2
    expect(result.current.score).toBe(Math.pow(2, 2)); // 4
  });

  it('cascades a chain and multiplies each step by the combo counter', async () => {
    const { result } = renderHook(() => useGameLogic());
    await start(result);

    await drop(result, 0);
    await drop(result, 0); // -> [2], score 4
    await drop(result, 0); // -> [2, 1]
    await drop(result, 0); // -> [2,1,1] -> [2,2] -> [3]

    // Chain: 1+1 -> 2 at combo 1 (2^2 * 1 = 4), then 2+2 -> 3 at combo 2 (2^3 * 2 = 16).
    expect(values(result.current.grid[0])).toEqual([3]);
    expect(result.current.score).toBe(4 + 4 + 16); // 24
  });

  it('tracks the high score as the score climbs', async () => {
    const { result } = renderHook(() => useGameLogic());
    await start(result);

    await drop(result, 0);
    await drop(result, 0);

    expect(result.current.highScore).toBe(result.current.score);
    expect(result.current.highScore).toBeGreaterThan(0);
  });
});

describe('useGameLogic — moving cards between columns', () => {
  it('lifts the top card of one column onto another', async () => {
    seedSave([[card(2), card(3)], [], [], []]);
    const { result } = renderHook(() => useGameLogic());

    await move(result, 0, 1);

    expect(values(result.current.grid[0])).toEqual([2]);
    expect(values(result.current.grid[1])).toEqual([3]);
  });

  it('merges on arrival when the destination top matches', async () => {
    seedSave([[card(2), card(3)], [card(3)], [], []]);
    const { result } = renderHook(() => useGameLogic());

    await move(result, 0, 1);

    expect(values(result.current.grid[0])).toEqual([2]);
    expect(values(result.current.grid[1])).toEqual([4]);
  });

  it('does nothing when the source column is empty', async () => {
    seedSave([[], [card(1)], [], []]);
    const { result } = renderHook(() => useGameLogic());

    await move(result, 0, 1);

    expect(values(result.current.grid[1])).toEqual([1]);
  });
});

describe('useGameLogic — input lock', () => {
  // dropCard takes a lock so a second move cannot interleave with the merge
  // cascade. If that lock is not released on the failure path, the board stops
  // accepting input for the rest of the session and only a reload recovers it.
  it('releases the move lock even when a side effect throws mid-drop', async () => {
    const { soundManager } = await import('../utils/sound');
    const playDrop = vi.mocked(soundManager.playDrop);
    playDrop.mockImplementationOnce(() => {
      throw new Error('audio device disappeared');
    });

    const { result } = renderHook(() => useGameLogic());
    await start(result);

    await act(async () => {
      // The throw propagates out of dropCard; that is fine, as long as the
      // lock does not survive it.
      await result.current.dropCard(0).catch(() => {});
      await vi.advanceTimersByTimeAsync(5000);
    });

    playDrop.mockImplementation(() => undefined);

    await drop(result, 1);

    expect(result.current.grid[1]).toHaveLength(1);
  });
});

describe('useGameLogic — game over', () => {
  it('ends the game when the final slot fills with no merge available', async () => {
    const full = () => [card(2), card(3), card(2), card(3)];
    seedSave([full(), full(), full(), [card(2), card(3), card(2)]]);
    const { result } = renderHook(() => useGameLogic());

    expect(result.current.isGameOver).toBe(false);

    await drop(result, 3); // drops a 1 onto a 2 — no merge, board is now full

    expect(result.current.grid.every((col) => col.length === MAX_ROWS)).toBe(true);
    expect(result.current.isGameOver).toBe(true);
  });
});

describe('useGameLogic — persistence', () => {
  // index.tsx mounts the app inside React.StrictMode. These two lock in the
  // "mounting must not destroy a save" invariant.
  //
  // CAVEAT, measured not assumed: neither test reproduces the dev-server bug
  // where a reload wiped the board. Both pass with the load latch and the save
  // guard in useGameLogic removed, because renderHook here does not replay
  // effects the way the browser does in dev. That regression was verified by
  // hand against the running dev server, and these tests would NOT catch it
  // coming back. Reproduce it in a browser, not here.
  it('does not overwrite an existing save while mounting under StrictMode', () => {
    seedSave([[card(2), card(3)], [card(1)], [], []], { score: 999, highScore: 1500 });

    const { result } = renderHook(() => useGameLogic(), { wrapper: StrictMode });

    expect(values(result.current.grid[0])).toEqual([2, 3]);
    expect(result.current.score).toBe(999);

    const persisted: GameState = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(persisted.grid.map(values)).toEqual([[2, 3], [1], [], []]);
    expect(persisted.score).toBe(999);
    expect(persisted.highScore).toBe(1500);
  });

  it('does not persist the empty initial grid over a save', () => {
    seedSave([[card(4)], [], [], []], { score: 42 });

    renderHook(() => useGameLogic(), { wrapper: StrictMode });

    const persisted: GameState = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(persisted.grid[0]).not.toHaveLength(0);
    expect(persisted.score).toBe(42);
  });

  it('writes the full game state back to localStorage after a drop', async () => {
    const { result } = renderHook(() => useGameLogic());
    await start(result);
    await drop(result, 1);

    const saved: GameState = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(values(saved.grid[1])).toEqual(values(result.current.grid[1]));
    expect(saved.score).toBe(result.current.score);
    expect(saved.isGameStarted).toBe(true);
  });
});

describe('useGameLogic — reset', () => {
  it('clears the board and the score', async () => {
    const { result } = renderHook(() => useGameLogic());
    await start(result);
    await drop(result, 0);
    await drop(result, 0);
    expect(result.current.score).toBeGreaterThan(0);

    await act(async () => {
      result.current.resetGame();
    });

    expect(result.current.grid.every((col) => col.length === 0)).toBe(true);
    expect(result.current.score).toBe(0);
    expect(result.current.isGameOver).toBe(false);
    expect(result.current.isGameStarted).toBe(true);
  });

  it('regenerates the second-next preview instead of leaking it across games', async () => {
    // Seed a second-next that cannot be produced by the pinned RNG (which only
    // ever yields 1), so a leaked value is unambiguous.
    seedSave([[]], { secondNextCardValue: 3, nextCardValue: 3 });
    const { result } = renderHook(() => useGameLogic());
    expect(result.current.secondNextCardValue).toBe(3);

    await act(async () => {
      result.current.resetGame();
    });

    expect(result.current.secondNextCardValue).toBe(1);
  });
});
