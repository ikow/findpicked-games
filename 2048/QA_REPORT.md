GAME: 2048
SCORE: 9/10
BUGS:
- (Minor) Rapid-fire key presses can interleave with the 160ms move-cleanup pipeline. `move()` schedules `setTimeout(... 120)` → `setTimeout(... 40)` to prune merged-away tiles and spawn the next random tile. A second move during that window operates on a grid where `toRemove` tiles still have stale `.el`s attached (though grid[] refs are cleared), causing brief visual overlap/flicker. Game state stays consistent; cosmetic only.
- (Minor) Arrow keys still trigger moves while the "You Win!" overlay is visible (since `over` stays false until `canMove()` fails). A stray keypress while reading the overlay can consume a move before the player chooses Keep Going / New Game.
- (Minor) `positionTile()` is called inside `newTile()` BEFORE the element is appended to `tilesEl` (line 412 vs 417). `getBoundingClientRect()` on the cell still works, but `el.offsetHeight` reflow trick on an un-parented element is a no-op. In practice it's harmless because no prior transition exists, but it's dead code for the off-DOM path.
- (Nit) `applyTileVisual()` uses `el.className.replace(/\bt-\S+/g, '').trim()` then re-adds `'tile'`. The `\b` word boundary + `\S+` pattern is fine for the current classes (`t-2`..`t-2048`, `t-big`) but fragile — any future class starting with `t-` would be stripped. Not a bug today.
- (Nit) `touch-action: manipulation` on `<body>` plus `touch-action: none` on `.board` is correct, but iOS still sometimes bounces the page on the very first swipe before `overscroll-behavior: none` kicks in. Observed behavior, not a code defect.

FIXES:
1. Block input while the win overlay is up (prevent wasted-move surprise):
   In the `keydown` listener (line 688–695), early-return when the overlay is showing a win and the player hasn't chosen yet:
   ```js
   window.addEventListener('keydown', (e) => {
     if (overlay.classList.contains('show') && !over) { /* win pending */ return; }
     if (e.key === 'u' || e.key === 'U') { e.preventDefault(); undo(); return; }
     const dir = KEY_MAP[e.key];
     if (dir) { e.preventDefault(); move(dir); }
   });
   ```
   Same early-return for the `touchend` handler at line 709.

2. Debounce rapid moves (eliminate flicker from stale merge tiles):
   Add a `moving` flag set on `move()` entry and cleared in the inner setTimeout that runs `addRandomTile()`. Reject new moves while `moving === true`. This also prevents the "grid mutated mid-animation" class of edge cases.
   ```js
   let moving = false;
   function move(dir) {
     if (over || moving) return false;
     ...
     if (moved) {
       moving = true;
       ...
       setTimeout(() => { addRandomTile(); checkEndState(); moving = false; }, 40);
     }
   }
   ```

3. Move the `positionTile(el, row, col, false)` call in `newTile()` (line 412) to AFTER `tilesEl.appendChild(el)` (line 417) so the reflow trick actually runs against a laid-out element. Minor robustness fix.

4. (Optional polish) In `applyTileVisual`, replace the regex with an explicit class list strip for safety:
   ```js
   el.classList.forEach(c => { if (c.startsWith('t-')) el.classList.remove(c); });
   ```

VERIFIED PASSING:
- Loads cleanly: script is an IIFE at end of body, no external deps, no console traps.
- Keyboard: Arrow keys, WASD, HJKL (vim), U for undo — all mapped (line 681–686).
- Touch: swipe threshold 20px, axis-locked, `touch-action: none` on board prevents page scroll (line 699–722).
- Mobile 375px: `max-width: 480px` wrap; media query at 420px tightens padding/gap/score-box (line 309–317). Board uses `aspect-ratio: 1 / 1` so it stays square.
- Back link present at line 323: `<a class="back" href="../">` — correct relative path to portal.
- localStorage persists best score under `findpicked:2048:best` (line 373, 399, 484). Read on load, written on every new high.
- UI: Apple-ish design system (system fonts, subtle shadows, rounded corners, tabular-nums on scores). Tier colors follow classic 2048 palette, 2048 tile gets the accent blue. Consistent with other games in the portal.
- English throughout: "Score", "Best", "New Game", "Undo", "Keep Going", "Game Over", "You Win!", "Final score: N", footer hints — all English.
- Animations: `transform` with `will-change: transform`, `ease-out` 0.12s slide, pop-in 0.22s, merge-pop 0.18s. GPU-friendly. With only ≤16 tiles, no jank.
- Game over + restart: `canMove()` checks empty cells + horizontal/vertical matching pairs (line 530–540). Overlay shows "Game Over" + final score with "New Game" button that calls `setupGame()` (line 725–726) which fully resets state.
- Undo: snapshots values + score before each successful move, single-level undo, disables after use. Correctly re-enables on next move.
- Best score updates live via `updateScore()` and survives reload.

VERDICT: PASS
