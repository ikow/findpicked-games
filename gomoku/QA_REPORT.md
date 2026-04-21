# QA Report

GAME: gomoku
SCORE: 5/10

## Criteria Results

1. **Loads without errors** — PASS. Code is wrapped in an IIFE with `'use strict'`. No syntax errors, all DOM IDs referenced in JS exist in HTML, no undefined globals.
2. **Controls work (keyboard + touch)** — PARTIAL. Mouse `click` and `mousemove` are wired (`index.html:1365-1367`). Keyboard `R`/`Z`/`M` work (`index.html:1374-1378`). Touch works *implicitly* (taps fire `click`), but no native `touchstart`/`pointerdown` handlers — hover preview is mouse-only (acceptable on touch).
3. **UI clean and consistent** — PASS. Cyber/neon theme is coherent: cyan/magenta accents, scanline overlay, glitch title, beveled `clip-path` frames. Status bar, board, and controls are aligned.
4. **Mobile viewport (375px)** — PASS. Board uses `min(92vw, 600px)`, `@media (max-width: 520px)` shrinks padding/fonts (`index.html:566-576`). Status bar fits within 375px (≈319px content width).
5. **Back link to portal (../)** — **FAIL.** No `<a href="../">` anywhere in the document. Player has no in-page way back to the games hub.
6. **localStorage high score** — **FAIL.** Zero use of `localStorage`/`sessionStorage`. `state.score` is in-memory only and resets on every page load. No high-score persistence.
7. **Visual bugs / layout issues** — Mostly clean. One minor logic bug: the score is incremented when a player wins (`index.html:874`), but `undo()` after a win does NOT decrement it — score gets inflated if a user undoes a winning move. Also, dead-code stub inside `undo()` (`index.html:964-967`) computes `winnerColor` and discards it.
8. **All text in English** — **FAIL.** `<html lang="zh-CN">` and the entire UI is Simplified Chinese: title (`五子棋`), turn text (`黑棋回合`), buttons (`模式菜单`, `重新开始`, `悔棋`), menu (`对战模式`, `双人对战`, `人机对战`, `AI 难度`, `入门`/`初级`/`中级`/`高级`/`大师`, `执棋方`, `黑棋 (先手)`, `白棋 (后手)`, `启 动`), winner toast (`黑 棋 获 胜`, `白 棋 获 胜`, `平 局`), AI indicator (`AI 思考中`), footer (`五子连珠者胜`).
9. **Performance (no janky animations)** — PASS. Glitch animation is `steps(1, end)` with 88%/92% idle frames (cheap). Drop animation is 0.28s scale only. Win-glow is limited to 5 winning stones. Minimax is deferred via nested `setTimeout` so the "AI 思考中" indicator paints before compute (`index.html:1295-1314`).
10. **Game over + restart flow** — PASS. Win triggers `showWinner()` → toast overlay with "再来一局" / "模式菜单". Both buttons wired (`index.html:1371-1372`). `resetGame()` clears the board, history, gameOver, winningLine, and re-schedules AI when applicable. Draw path also works.

## BUGS

1. **No portal back link.** Player is trapped on the page; only the browser back button works.
2. **No localStorage persistence.** Score (and difficulty/mode preferences) are lost on reload — fails the "high score" requirement entirely.
3. **All UI text is Chinese**, not English. `lang="zh-CN"` declared. This is the most visible regression vs the portal's English-only standard.
4. **Undo after win does not decrement score.** `placeStone()` increments `state.score` on win (`index.html:874`); `undo()` resets `gameOver` and `winningLine` but never reverses the score bump. Repeatable score inflation.
5. **Dead code in `undo()`** (`index.html:964-967`) — computes `winnerColor` then discards via comment "winning line is stale after undo". Cosmetic.
6. **`maximum-scale=1.0, user-scalable=no`** in viewport meta (`index.html:5`) — prevents pinch-zoom; an accessibility ding (acceptable for a game, but worth flagging).

## FIXES

1. **Add portal back link.** In `<header>` (around `index.html:581`), add:
   ```html
   <a href="../" class="back-link" aria-label="Back to games">← Games</a>
   ```
   Plus a small CSS rule to position/style it (top-left of `.app`, cyan with neon glow to match theme).

2. **Persist score (and settings) to localStorage.** Add at the bottom of the IIFE init:
   ```js
   const LS_KEY = 'gomoku.state.v1';
   function saveLS() {
     try { localStorage.setItem(LS_KEY, JSON.stringify({
       score: state.score, mode: state.mode,
       difficulty: state.difficulty, playerSide: state.playerSide
     })); } catch {}
   }
   function loadLS() {
     try {
       const raw = localStorage.getItem(LS_KEY);
       if (!raw) return;
       const v = JSON.parse(raw);
       if (v.score) state.score = v.score;
       if (v.mode) state.mode = v.mode;
       if (typeof v.difficulty === 'number') state.difficulty = v.difficulty;
       if (v.playerSide) state.playerSide = v.playerSide;
     } catch {}
   }
   ```
   Call `loadLS()` before `updateStatus()` in init, and `saveLS()` after every score change (in `placeStone()` win branch) and after `startBtn` click.

3. **Translate all strings to English** (and set `<html lang="en">`):
   - Title: `Cyber Gomoku`
   - h1 + `data-text`: `GOMOKU`
   - Subtitle: `CYBER · GOMOKU · NEON GRID` (already English)
   - Status: `黑棋回合` → `BLACK'S TURN`, `白棋` → `WHITE`, `黑` → `B`, `白` → `W`, `手数` → `MOVES`
   - Buttons: `模式菜单` → `MENU`, `重新开始` → `RESET`, `悔棋` → `UNDO`
   - Menu: `对战模式` → `GAME MODE`, `模式` → `MODE`, `双人对战` → `2 PLAYER`, `人机对战` → `VS AI`, `AI 难度` → `AI LEVEL`, `入门`/`初级`/`中级`/`高级`/`大师` → `NOVICE`/`EASY`/`MEDIUM`/`HARD`/`MASTER`, `执棋方` → `PLAY AS`, `黑棋 (先手)` → `BLACK (1st)`, `白棋 (后手)` → `WHITE (2nd)`, `启 动` → `START`
   - Winner: `黑 棋 获 胜` → `BLACK WINS`, `白 棋 获 胜` → `WHITE WINS`, `平 局` → `DRAW`, `胜利` (status) → `WINS`
   - AI indicator `AI 思考中` → `AI THINKING`
   - Footer `五子连珠者胜` → `five in a row wins`
   - Toast buttons: `再来一局` → `PLAY AGAIN`, `模式菜单` → `MENU`
   - Update `updateStatus()` strings (`index.html:795,802,806,808`) to match.

4. **Fix score-inflation on undo-after-win.** In `undo()` (`index.html:952`), before popping, snapshot the win state and reverse the score bump:
   ```js
   if (state.gameOver && state.winningLine) {
     const winColor = state.board[state.winningLine[0][0]][state.winningLine[0][1]];
     if (winColor === BLACK) state.score.black = Math.max(0, state.score.black - 1);
     else if (winColor === WHITE) state.score.white = Math.max(0, state.score.white - 1);
   }
   ```
   Then `saveLS()` after.

5. **Remove dead code** at `index.html:964-967` (the `winnerColor` computation that is then discarded).

6. **Optional**: drop `maximum-scale=1.0, user-scalable=no` from the viewport meta to allow pinch-zoom (accessibility), or keep it since the board already auto-fits.

## VERDICT: FAIL

The game itself is high-quality — solid minimax AI, smooth animations, clean cyber aesthetic, working PvP/PvE/undo/restart flows. But it fails three explicit portal requirements (no back link, no localStorage, not in English) plus a real score-inflation bug on undo-after-win. These are all small, mechanical fixes — once applied, this would comfortably score 9/10.
