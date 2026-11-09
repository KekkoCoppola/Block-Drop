# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Vite dev server on http://localhost:3000 (host 0.0.0.0)
npm run build      # Production build to dist/
npm run lint       # Typecheck only: tsc --noEmit. There is no ESLint config.
npm run test       # Vitest, single run
npm run test:watch # Vitest, watch mode
npm run preview    # Serve the production build
```

Run one file or one case:

```bash
npx vitest run hooks/useGameLogic.test.ts
npx vitest run -t "cascades a chain"
```

Android (Capacitor):

```bash
npm run cap:sync   # npm run build && npx cap sync  -- required after ANY web change
npm run cap:open   # Open ./android in Android Studio
npm run build:apk  # cap:sync, then ./gradlew assembleDebug
```

## Testing

Vitest + jsdom, configured inline in `vite.config.ts` (`test` block) — there is no
separate `vitest.config.ts`. The only suite today is `hooks/useGameLogic.test.ts`,
covering the merge/score/cascade/game-over rules. Components are untested.

Three things make that suite work, and any new test needs the same handling:

- **`utils/sound` is mocked wholesale.** The real singleton needs an AudioContext
  jsdom does not provide.
- **Fake timers are mandatory.** The hook `await`s real `setTimeout`s, so a drop is
  driven with `vi.advanceTimersByTimeAsync()` inside `act()`; see the `drop` helper.
- **`Math.random` is pinned to a constant** to fix which card values get generated.
  `generateId` draws from the same source, so ids collide under test — harmless,
  because merge logic addresses cards by index, never by id.

To set up a specific board, seed `localStorage` before `renderHook` (the `seedSave`
helper) rather than trying to reach the position through drops.

`constants.test.ts` covers the palette contrast rule and combo copy — no DOM, no
timers, so it is the cheap place to add pure-logic assertions.

## Architecture

React 19 + Vite 6 + TypeScript, Tailwind 4 (via `@tailwindcss/vite`, not a
PostCSS config), Framer Motion for animation, Capacitor 8 for Android. State
lives entirely in one hook — there is no store, router, or backend.

### The grid is column-major

`Grid = CardData[][]` is indexed **`grid[column][row]`**, not `[row][col]`.
There are `COLUMNS` (4) inner arrays; each is a stack that grows upward and is
capped at `MAX_ROWS` (4). `push`/`pop` operate on the **top** of a column.
This is the single most important thing to internalize before touching game code.

### Merge model

Merges only ever compare the **top two cards of one column** (`checkMerge` in
`hooks/useGameLogic.ts`). Equal values collapse into a single card of
`value + 1`. `processGravityAndMerges` loops on that check so one drop can
cascade into a combo chain; `comboCountRef` counts the chain and multiplies
score via `Math.pow(2, newValue) * (combo + 1)`. Card *value* is an exponent-like
integer (1, 2, 3…), not the displayed score.

Colors cycle every 12 values: `getCardStyle` in `constants.ts` maps
`((value - 1) % 12) + 1` into `CARD_COLORS`, so value 13 looks like value 1.

### Animation timings are load-bearing in the logic layer

`useGameLogic.ts` `await`s hardcoded delays that must stay in sync with the
component animations:

- `450ms` after inserting a card — the drop animation
- `400ms` after each merge — the merge animation
- `100ms` extra hit-stop when `comboCount >= 3`

If you change a Framer Motion duration in `components/`, change the matching
`setTimeout` in the hook or the game will visibly desync. `isProcessingRef`
locks input for the whole sequence, so lengthening these also lengthens the
window where taps are ignored.

### Persistence

The entire `GameState` is serialized to `localStorage` under `STORAGE_KEY`
(`constants.ts`) on **every** state change, and read once on mount. If you
change the shape of `GameState`, bump `STORAGE_KEY` — old saves are `JSON.parse`d
straight into state with no migration or schema validation, so a shape change
against an existing key corrupts live sessions.

Two guards in the hook keep mounting from eating the save, and both matter:

- `hasLoadedRef` latches the load effect to one run. `index.tsx` mounts inside
  `React.StrictMode`, which replays effects in dev; without the latch the replayed
  load re-read the value the save effect had just overwritten, and **every dev-server
  reload wiped the player's board.**
- `isLoaded` gates the save effect so it cannot persist the empty initial grid
  before the restored state lands.

Production was never affected (StrictMode only replays in dev), so this reproduces
only against `npm run dev` — and, as noted in the test file, not under Vitest either.
Verify persistence changes in a real browser.

### Sound is fully synthesized — there are no audio assets

`utils/sound.ts` is a singleton (`soundManager`) implementing the `SoundManager`
interface from `types.ts`. Everything is generated with the Web Audio API:
oscillators for SFX, a noise buffer for percussion, and a lookahead scheduler
(`scheduler`/`advanceNote`/`scheduleNote`) running a 140 BPM procedural track
with a 4-bar progression. Do not look for `.mp3`/`.wav` files.

Two coupling points:
- Browsers block audio until user gesture, so `App.tsx` defers `soundManager.init()`
  to the first `click`/`touchstart`.
- `setOnBeatCallback` pushes beat/phase back into `App.tsx` state, which drives
  beat-synced visuals. Audio is therefore an input to rendering, not just output.

Haptics go through the same manager (`vibrate`, patterns in `VIBRATION_PATTERNS`).

### The visual system

Tokens live in the `@theme` block of `index.css` (Tailwind 4), which generates
the `bg-*`/`text-*`/`border-*` utilities: surfaces `void → deep → base → surface
→ raised`, ink `ink / ink-muted / ink-faint`, accents `brand / brand-deep / gold
/ danger`. Prefer these over re-introducing raw hexes or `slate-*`.

**Everything is lit from above.** Blocks, buttons, panels and the board well all
use the same shadow recipe: a bright inset top edge, a darker inset bottom edge,
an extruded face below (`0 Npx 0 <darker own colour>`), then a soft contact
shadow. The extruded face is always a darker version of *that element's own*
colour — a yellow button does not get a blue base. The board is the inverse: an
inset well the blocks sit down inside.

**Block numerals are computed, not chosen.** `getCardStyle` in `constants.ts`
measures WCAG contrast for a dark and a light numeral against the face and keeps
the stronger one, so bright faces get engraved dark type and dark faces (indigo,
blue, purple) get embossed light type. A single fixed ink cannot clear 3:1 across
all twelve colours. `constants.test.ts` enforces this for every entry, so a new
palette colour stays legible by construction.

Numbers that change in place use the `.tnum` class (tabular figures) so digits
do not shift as they tick.

### Motion

One easing vocabulary, in `index.css`: `--ease-arrive` for things landing,
`--ease-exit` (faster) for things leaving. Celebration reads through keyframe
values, never an elastic or bounce curve.

The authored moment is **the merge** — a coloured shockwave, debris, and a bloom
that all scale with `comboLevel`. Everything else is deliberately quiet so it can
land; `BackgroundEffects` is down to one ambient loop (the live soundtrack's
downbeat) plus state-driven washes. Do not add ambient loops back.

Every animated component branches on framer-motion's `useReducedMotion()`, and
`index.css` carries a global `prefers-reduced-motion` block. Reduced motion drops
travel and loops but keeps state feedback visible.

### Dialogs

`components/Modal.tsx` is the only dialog shell: `role="dialog"`, `aria-modal`,
focus moved in on open and restored on close, Tab cycling inside the panel, and
Escape to dismiss. Game over passes no `onClose` because it is deliberately
non-dismissable. Do not hand-roll another overlay.

### Web vs native

`App.tsx` guards native calls with `Capacitor.isNativePlatform()` before touching
`SplashScreen` / `StatusBar`, so the same build runs in a plain browser.
`capacitor.config.ts` sets `webDir: 'dist'`; `cap sync` copies the Vite build into
`android/app/src/main/assets/public/`, which is generated output and is gitignored.
Run `npm run cap:sync` after any web change before building or opening the native
project, or Android will run a stale bundle.

CI (`.github/workflows/build-apk.yml`) builds a debug APK on push to `main`,
regenerating the Gradle wrapper at 8.14.3 and uploading `app-debug.apk` as an artifact.

## Conventions

UI copy is **Italian** (`getComboText` returns `DOPPIO!`, `TRIPLO!`, …); code,
identifiers, and comments are English. Keep that split.

No path alias is used in practice — imports are relative — though `@` is mapped
to the project root in `vite.config.ts` and `tsconfig.json`.
