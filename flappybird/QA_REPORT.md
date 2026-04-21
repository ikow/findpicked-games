GAME: flappybird
SCORE: 9/10

## Checklist

1. **Loads without errors** — ✅ Clean vanilla JS in IIFE. All `getElementById` targets exist in markup. Canvas 2D context + `ResizeObserver` used correctly.
2. **Controls (keyboard + touch)** — ✅ `Space`, `ArrowUp`, and `' '` key all trigger `flap()` (line 396). `pointerdown` on stage + button click wired separately. `touch-action: manipulation` disables double-tap zoom.
3. **UI clean/consistent** — ✅ Matches portal design system (`#fafafa` bg, `#0071e3` accent, SF Pro stack, 12/20px radii, soft shadows). Scorebar + stage + overlay layout is tidy.
4. **Mobile viewport (375px)** — ✅ `max-width: 420px`, `aspect-ratio: 3/4`, viewport meta with `user-scalable=no`, `overscroll-behavior: none`. Header margin reduced at ≤480px.
5. **Back link to portal** — ✅ `<a class="back" href="../" aria-label="Back">` at line 228, fixed top-left.
6. **localStorage high score** — ✅ Key `flappybird.best`, loaded on init (line 273), saved on new high (lines 384–388), shown in scorebar + game-over overlay.
7. **Visual bugs / layout** — ✅ DPR-aware canvas with world-coordinate transform; crash-flash timer properly decremented each frame (line 648). Pipe gradients, lips, ground seam all render correctly.
8. **All text English** — ✅ "Flappy Bird", "Tap, click, or press space to fly.", "Ready?", "Game Over", "Nice try. One more go?", "Space to restart", "Start" / "Play Again". No stray non-English strings.
9. **Performance / jank** — ✅ `requestAnimationFrame` loop, `dt` capped at 0.033. Per-frame allocations limited (linear gradients rebuilt per pipe — negligible at ~4 pipes). Idle "ready" state animates bird + ground at reduced cost.
10. **Game over + restart** — ✅ `die()` sets mode=dead, persists best, delays overlay 320ms so the crash is visible. Overlay "Play Again" button + Space + tap all restart via `flap()` dispatching to `start()`.

## BUGS

- **Minor — Enter key mid-game can restart via focused button.** After pressing Start, focus remains on `#startBtn`. The keydown handler only calls `preventDefault` for Space/ArrowUp (line 396), so pressing `Enter` mid-game falls through → browser's native button activation → `start()` fires, wiping the run. Edge case (most players won't hit Enter), but worth a one-liner guard.
- No other bugs found. Input dispatch, collision math (`circleRect`), scoring gate, pipe recycling, DPR resize, and overlay state transitions all look correct.

## FIXES

1. Guard the Start button against keyboard activation while a run is live. In the keydown handler around line 396, also swallow Enter when `state.mode === 'playing'`, or blur the button when `start()` runs:

   ```js
   // In start(), after overlay.classList.add('hidden'):
   startBtn.blur();
   ```

   That removes the edge case without touching input logic.

2. (Optional polish, not a bug.) The "ready" overlay's hint says "Space or ↑ to flap" but the subtitle above the stage already says "Tap, click, or press space to fly." — consider aligning the two strings so returning players see one consistent instruction.

VERDICT: PASS
