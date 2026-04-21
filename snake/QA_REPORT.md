# QA Report

GAME: snake
SCORE: 9/10

## Checklist

1. **Loads without errors** — PASS. Single-file IIFE, all DOM IDs match, no obvious runtime errors.
2. **Controls** — PASS. Arrow keys, WASD, Space (pause), on-screen D-pad (click + touchstart), and swipe gestures on the board all wired up.
3. **UI clean & consistent** — PASS. Apple-style tokens (system font, rounded score cards, soft shadows), tabular-numeric scores, blurred glass overlay.
4. **Mobile 375px viewport** — PASS. `max-width: 520px`, `100dvh` height, square board sized via `Math.min(rect.width, rect.height, 480)`. D-pad 200px fits comfortably. `meta viewport` disables zoom.
5. **Back link to portal** — PASS. `<a class="back" href="../">` at index.html:267.
6. **localStorage high score** — PASS. Reads/writes `snake.best`; bestEl updated on new best (index.html:332, 379).
7. **Visual bugs / layout** — Mostly clean. Minor: pause icon never swaps to a play glyph when paused; user has to read the overlay.
8. **All text in English** — PASS. Title, labels, overlay copy, hint, and aria-labels all English.
9. **Performance** — PASS. `setInterval` 70–140ms tick, simple canvas redraw (400 cells max), DPR-aware sizing. No animation jank expected.
10. **Game over + restart flow** — PASS. Overlay shows "Game over" + score + "A new best" if applicable; "Play again" button calls `startGame()` → `reset()` (index.html:406–423).

## BUGS

- **B1 (minor UX):** D-pad LEFT or RIGHT tapped from the idle/over screen is a no-op. `startGame()` resets `dir` to `{x:1,y:0}` (right), then the immediate `changeDir` is rejected as "opposite" (left) or "same" (right). Only Up/Down successfully start *and* steer in one tap. (index.html:559–567 + 527–532)
- **B2 (minor UX):** Swipe on the board does not auto-start the game from idle/over. `changeDir` returns early when `state !== 'running'`, so swipes are ignored until the user taps the Start/Play again button or the D-pad. Inconsistent with D-pad behavior. (index.html:528, 579–591)
- **B3 (minor a11y/visual):** Pause button icon and `aria-label="Pause"` never change. When the game is paused or idle, the same pause-bars icon is shown — should toggle to a play triangle when not running. (index.html:270–272)
- **B4 (edge case):** `placeFood()` is a `while(true)` loop with no escape if the snake fills all 400 cells. Not reachable in normal play but technically an infinite loop. (index.html:361–372)
- **B5 (very minor):** Score card `flex: 1` with no `min-width: 0` could overflow if score grew to absurd digits, but tabular-nums + small grid (max ~399) makes this practically impossible.

## FIXES

- **F1 (B2 — swipe should start game):** In the `board` `touchend` handler, mirror the D-pad logic before calling `changeDir`:
  ```js
  if (state === 'idle' || state === 'over') startGame();
  else if (state === 'paused') resumeGame();
  ```
  Insert at index.html:585 (after the deadzone check, before `changeDir`).
- **F2 (B3 — pause icon toggle):** Replace the pause button's inner SVG when state changes. Add a `setPauseIcon(running)` helper called from `startGame`, `pauseGame`, `resumeGame`, `gameOver`, and update `aria-label` to "Pause"/"Play" accordingly.
- **F3 (B1 — first-tap responsiveness):** When starting from idle/over via the D-pad, set initial `dir`/`nextDir` to the tapped direction instead of the default right, e.g. pass the direction into `startGame(initialDir)` and use it in `reset()`.
- **F4 (B4 — placeFood guard):** Cap the loop or detect a full board:
  ```js
  if (snake.length >= GRID * GRID) return; // win condition or stop
  ```
  Or pick from a list of free cells.

## VERDICT

**PASS** — Ship-ready. Polished, accessible, mobile-friendly, and idiomatic. The listed issues are all minor UX/polish items, not blockers.
