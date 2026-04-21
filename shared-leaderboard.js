// Shared leaderboard module for all games
// Usage: include this script, then call:
//   Leaderboard.submitScore(score) — shows modal to enter name & submit
//   Leaderboard.showBest() — returns { personal, global } best

(function() {
  const API = 'https://leaderboard.findpicked.com/api/scores';
  const GAME = location.pathname.split('/').filter(Boolean).pop() || 'unknown';
  const LS_KEY = `${GAME}-leaderboard`;
  const LS_NAME = 'findpicked-player-name';
  const LS_PERSONAL = `${GAME}-personal-best`;

  function getPersonalBest() {
    try { return JSON.parse(localStorage.getItem(LS_PERSONAL)) || null; } catch { return null; }
  }

  function setPersonalBest(score) {
    try { localStorage.setItem(LS_PERSONAL, JSON.stringify(score)); } catch {}
  }

  function getSavedName() {
    try { return localStorage.getItem(LS_NAME) || ''; } catch { return ''; }
  }

  function saveName(name) {
    try { localStorage.setItem(LS_NAME, name); } catch {}
  }

  // Inject modal styles
  const style = document.createElement('style');
  style.textContent = `
    .lb-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.4);
      display: flex; align-items: center; justify-content: center;
      z-index: 10000; opacity: 0; transition: opacity 0.3s;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
    }
    .lb-overlay.show { opacity: 1; }
    .lb-modal {
      background: white; border-radius: 20px; padding: 32px;
      max-width: 360px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
      text-align: center; transform: scale(0.9); transition: transform 0.3s;
    }
    .lb-overlay.show .lb-modal { transform: scale(1); }
    .lb-title { font-size: 22px; font-weight: 700; margin-bottom: 4px; color: #1d1d1f; }
    .lb-score { font-size: 48px; font-weight: 700; color: #0071e3; margin: 12px 0; font-variant-numeric: tabular-nums; }
    .lb-subtitle { font-size: 14px; color: #6e6e73; margin-bottom: 20px; }
    .lb-input {
      width: 100%; padding: 12px 16px; border: 2px solid #e5e5ea; border-radius: 12px;
      font-size: 16px; font-family: inherit; outline: none; text-align: center;
      transition: border-color 0.2s;
    }
    .lb-input:focus { border-color: #0071e3; }
    .lb-btn {
      display: block; width: 100%; padding: 14px; border: none; border-radius: 12px;
      font-size: 16px; font-weight: 600; cursor: pointer; font-family: inherit;
      margin-top: 12px; transition: opacity 0.2s;
    }
    .lb-btn:hover { opacity: 0.85; }
    .lb-btn.primary { background: #0071e3; color: white; }
    .lb-btn.secondary { background: #f5f5f7; color: #1d1d1f; }
    .lb-rank { font-size: 15px; color: #6e6e73; margin-top: 16px; }
    .lb-rank strong { color: #1d1d1f; }
    .lb-personal { font-size: 13px; color: #86868b; margin-top: 8px; }
    .lb-link { display: inline-block; margin-top: 12px; font-size: 13px; color: #0071e3; text-decoration: none; }
    .lb-link:hover { text-decoration: underline; }
    .lb-new-best { color: #34c759; font-weight: 600; font-size: 14px; margin-top: 4px; }
  `;
  document.head.appendChild(style);

  function createModal(score, isLowerBetter) {
    const overlay = document.createElement('div');
    overlay.className = 'lb-overlay';

    const personal = getPersonalBest();
    const isNewBest = !personal || (isLowerBetter ? score < personal : score > personal);
    if (isNewBest) setPersonalBest(score);

    const displayScore = isLowerBetter ? `${score}s` : score.toLocaleString();

    overlay.innerHTML = `
      <div class="lb-modal">
        <div class="lb-title">${isNewBest ? 'New Personal Best!' : 'Game Over'}</div>
        <div class="lb-score">${displayScore}</div>
        ${isNewBest ? '<div class="lb-new-best">★ Personal Record</div>' : ''}
        <div class="lb-subtitle">Submit your score to the leaderboard</div>
        <input class="lb-input" type="text" placeholder="Your name" maxlength="20" value="${escAttr(getSavedName())}">
        <button class="lb-btn primary" id="lb-submit">Submit Score</button>
        <button class="lb-btn secondary" id="lb-skip">Skip</button>
        <div class="lb-rank" id="lb-rank" style="display:none"></div>
        <a class="lb-link" href="../leaderboard/#${GAME}">View Full Leaderboard →</a>
      </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));

    const input = overlay.querySelector('.lb-input');
    const submitBtn = overlay.querySelector('#lb-submit');
    const skipBtn = overlay.querySelector('#lb-skip');
    const rankEl = overlay.querySelector('#lb-rank');

    input.focus();
    input.select();

    function close() {
      overlay.classList.remove('show');
      setTimeout(() => overlay.remove(), 300);
    }

    submitBtn.addEventListener('click', async () => {
      const name = input.value.trim();
      if (!name) { input.style.borderColor = '#ff3b30'; return; }
      saveName(name);
      submitBtn.textContent = 'Submitting...';
      submitBtn.disabled = true;

      try {
        const res = await fetch(`${API}/${GAME}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, score }),
        });
        const data = await res.json();
        if (data.rank) {
          rankEl.innerHTML = `You ranked <strong>#${data.rank}</strong> out of ${data.total} players`;
          rankEl.style.display = 'block';
          submitBtn.textContent = 'Done!';
          setTimeout(close, 2000);
        }
      } catch (e) {
        // Fallback: save locally
        try {
          const local = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
          local.push({ name, score, date: new Date().toISOString().slice(0, 10) });
          local.sort((a, b) => isLowerBetter ? a.score - b.score : b.score - a.score);
          localStorage.setItem(LS_KEY, JSON.stringify(local.slice(0, 50)));
        } catch {}
        rankEl.innerHTML = 'Saved locally (offline mode)';
        rankEl.style.display = 'block';
        submitBtn.textContent = 'Saved';
        setTimeout(close, 1500);
      }
    });

    input.addEventListener('keydown', e => { if (e.key === 'Enter') submitBtn.click(); });
    skipBtn.addEventListener('click', close);
  }

  function escAttr(s) { return s.replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

  window.Leaderboard = {
    submitScore(score, opts = {}) {
      const isLowerBetter = opts.lowerIsBetter || false;
      createModal(score, isLowerBetter);
    },
    getPersonalBest,
    getGameId() { return GAME; },
  };
})();
