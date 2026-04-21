GAME: blockdrop
SCORE: 9/10

## Summary

A polished, single-file Block Drop (Tetris-style) game. Code quality is high: clean IIFE scope, no globals leaked, consistent design tokens, proper localStorage error handling, requestAnimationFrame loop with state guards, and a thorough input layer (keyboard, touchpad, swipe). Game logic is correct: 7-bag randomizer, simple wall kicks, ghost piece, line-clear scoring with level scaling, hard/soft drop scoring, and a working game-over → restart flow.

## 1–10 checklist

1. **Loads without errors** — Pass. All DOM IDs match, IIFE runs after DOM is parsed (script at end of body), `loadBest()` swallows storage errors.
2. **Controls (keyboard + touch)** — Pass. Keyboard: ←/→/↓ move, ↑/X rotate CW, Z rotate CCW, Space hard drop, P pause, Enter/Space to start. Touch: 5-button pad (left/rotate/right/soft/hard) with hold-to-repeat for left/right/soft. Board swipe: horizontal drag → move, vertical drag → soft drop, tap → rotate, fast swipe down → hard drop.
3. **UI clean and consistent** — Pass. iOS-like palette, consistent radii, tabular-nums for score, subtle shadows, refined piece colors.
4. **Mobile (375px)** — Mostly pass. `fitCanvas()` reserves 40px horiz / 300px vert on mobile; at 375×667 cellSize ≈ 18px → 180×360 board, fits with room. Touchpad shows below 720px. **Minor issue:** the keyboard-only `.hint` text is still rendered on mobile (no keyboard exists), so it's visual noise.
5. **Back link to portal** — Pass. `<a class="back" href="../">` at line 309.
6. **localStorage high score** — Pass. Key `findpicked-blockdrop-best`, parsed with fallback, saved on game over only when `score > best`. Try/catch guards storage exceptions.
7. **Visual bugs / layout issues** — Mostly clean. **Minor:** on mobile, `.side` becomes a flex-row container holding panels + button-row + hint; the button-row and hint sit alongside the small stat panels and can look slightly crowded above the board. Not broken, but less tidy than it could be.
8. **All text in English** — Pass. Title, hints, overlays, buttons, and aria-labels are all English.
9. **Performance** — Pass. Single rAF loop, no layout thrash, redraws only on input or per-frame, no costly transitions. Canvas redraw is full but trivial for 10×20 grid.
10. **Game over + restart** — Pass. `gameOver()` sets state, updates Best, shows overlay with score/lines and "Play Again". `newGame()` resets grid/bag/score/level/dropInterval and resumes loop. Restart button works mid-game and during pause/over.

## Bugs

- **(minor)** Mobile shows the keyboard-only hint string (`← → move · ↑ rotate · ↓ soft drop · Space hard drop · P pause`) even when only the touchpad is usable. Misleading on phones.
- **(minor)** On the idle/start screen, tapping the board canvas does nothing — only the "Start" button works. A first-time mobile user might tap the play area expecting a response.
- **(minor)** Touch buttons left/right/rotate/soft do not start a new game from idle/over state — only the hard-drop button does. Inconsistent with keyboard, where Enter or Space starts.
- **(nit)** Mobile layout: `.btn-row` and `.hint` are direct flex children of `.side` alongside the stat panels, which can make the row above the board feel busy at 375px width.
- **(nit)** Pause overlay text mentions "Press Resume or P to continue" — `P` doesn't apply on mobile.
- **(nit)** No visible focus ring on `.back` link, `.btn`, or `.tbtn` (likely fine on touch, but reduced keyboard accessibility on desktop).

## Fixes

1. Hide the keyboard hint on touch viewports — wrap it in the existing mobile media query:
   ```css
   @media (max-width: 720px) {
     .hint { display: none; }
   }
   ```
   Or replace with a touch-appropriate hint like "Tap to rotate · Swipe to move · Swipe down to drop".

2. Let any tap on the idle/over board start a new game. In the swipe IIFE near line 942, before the `if (state !== 'running') return;` guard:
   ```js
   if (state === 'idle' || state === 'over') { newGame(); return; }
   ```

3. Make all touchpad buttons start a new game from idle/over (line 890):
   ```js
   if (state !== 'running') {
     if (state === 'idle' || state === 'over') newGame();
     return;
   }
   ```

4. Tighten mobile `.side` so only stat panels share the row; move `.btn-row` and `.hint` to their own row by giving them `flex-basis: 100%`:
   ```css
   @media (max-width: 720px) {
     .side .btn-row, .side .hint { flex-basis: 100%; }
   }
   ```

5. Make pause overlay copy device-aware, e.g. drop the "or P" suffix on touch:
   ```js
   overlayText.textContent = 'Take a breath. Press Resume to continue.';
   ```

6. (Optional) Add a visible focus style for keyboard users:
   ```css
   .btn:focus-visible, .back:focus-visible, .tbtn:focus-visible {
     outline: 2px solid var(--accent); outline-offset: 2px;
   }
   ```

VERDICT: PASS
