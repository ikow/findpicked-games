GAME: minesweeper
SCORE: 9/10

BUGS:
1. Long-press flag can be toggled twice on some mobile browsers (notably Android Chrome/Firefox). The touchstart `setTimeout` fires `toggleFlag` at 350ms, then the browser's native long-press `contextmenu` event fires ~500–700ms later on the same element and the `contextmenu` listener calls `toggleFlag` again — net zero. `-webkit-touch-callout: none` is not set on `.cell`, and there is no guard preventing the second toggle.
2. Mouse clicks are silently ignored on touch-capable devices in browsers where `click` is dispatched as a plain `MouseEvent` (Firefox, older Safari). The guard `if ('ontouchstart' in window && e.pointerType !== 'mouse') return;` at line 544 is always true there because `MouseEvent.pointerType` is `undefined`, so `undefined !== 'mouse'` is always true. Pure-mobile touch still works via `touchend`; pure-desktop (no `ontouchstart`) still works; the break is on hybrid laptops in non-Chromium browsers.
3. Fade-in stagger is incomplete. `.app > *:nth-child(1..6)` each have `animation-delay`, but `.app` has 7 children (the Best Times block is the 7th). The 7th child inherits the default `0s` delay — no explicit rule — so the stagger pattern breaks on the final card.
4. `checkWin()` is called from `toggleFlag()` (line 649) but flagging cannot change `revealedCount`, so it can never cause a win. Dead/misleading call.
5. Empty `mousedown` handler at lines 537–540 has no side effects — dead code.
6. The onboarding message (line 382 / 462) only mentions tap + long-press. Desktop users are not told that right-click flags; discoverable but slightly unfriendly.
7. Minor: `'contextmenu'` handler fires on desktop right-click as intended, but also on some Android browsers after long-press (feeds into bug #1).

FIXES:
1. Prevent the native long-press menu and the duplicate toggle. In CSS, add:
   ```css
   .cell { -webkit-touch-callout: none; }
   ```
   In `attachCellHandlers`, gate the `contextmenu` listener so it no-ops when the touch long-press already toggled:
   ```js
   btn.addEventListener('contextmenu', e => {
     e.preventDefault();
     if (longPressed) { longPressed = false; return; }
     toggleFlag(+btn.dataset.r, +btn.dataset.c);
   });
   ```
   (Requires hoisting `longPressed` so the contextmenu handler can see the per-element flag, or using a shared `data-longpressed` attribute on the button.)
2. Replace the click guard with one that tracks whether touchend just handled this tap. Example: in `touchend` set `btn._handledByTouch = true` (and clear it after a microtask), then:
   ```js
   btn.addEventListener('click', e => {
     if (e.detail === 0) return;
     if (btn._handledByTouch) { btn._handledByTouch = false; return; }
     handleTap(btn);
   });
   ```
   This also makes the `mousedown` handler unnecessary.
3. Add the missing animation-delay rule next to lines 333–338:
   ```css
   .app > *:nth-child(7) { animation-delay: 0.3s; }
   ```
4. Remove the `checkWin();` call inside `toggleFlag()` at line 649.
5. Delete the empty `mousedown` listener block at lines 537–540.
6. Update the onboarding message to be input-agnostic, e.g. `"Tap or click to reveal. Long-press or right-click to flag."` (both in the initial `<div id="message">` and in `initBoard`'s reset string).

VERDICT: PASS

Notes: Game loads cleanly, portal link `../index.html` is correct, `localStorage` best-time persistence works with try/catch and JSON, all text is English, first-click safety is implemented (mines placed after first reveal with a 3×3 safe zone), chord-on-revealed-number works, mobile viewport is usable via horizontal scroll on Intermediate/Expert. The bugs above are minor — no crashes, no data loss, no broken core flow. Recommend shipping after fixes 1–3; 4–6 are polish.
