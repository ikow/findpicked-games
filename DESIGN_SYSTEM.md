# FindPicked Games — Design System

## Color Palette
### Primary
- `--neon-cyan: #00d4ff` — Primary accent
- `--neon-magenta: #ff2d95` — Secondary accent, hot tags
- `--neon-purple: #7b2ff7` — Gradients

### Background
- `--bg-deep: #0a0a0f` — Page bg
- `--bg-card: #12121a` — Card bg
- `--bg-surface: #1a1a2e` — Elevated surfaces

### Text
- `--text-primary: #e0e0e0`
- `--text-secondary: #888`
- `--text-accent: #00d4ff`

## Typography
- Primary: system fonts (-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)
- Monospace for scores: 'Courier New', monospace
- Title: 2.5em portal, 1.8em in-game

## Effects
- Neon glow: `text-shadow: 0 0 10px #00d4ff, 0 0 40px #00d4ff`
- Scanlines overlay (optional)
- Glitch text animation (titles)
- Card hover: translateY(-4px) + cyan glow

## Layout
- Portal: card grid, auto-fill minmax(280px, 1fr), max-width 1400px
- In-game: centered, max-width 600px, mobile-first
- Back button top-left → portal

## Standard Components
- Game header: back btn + title + controls
- Score bar: current + high score (localStorage)
- Game over overlay: score + restart button
- Neon button style

## Rules
1. Single index.html per game, no external deps
2. Chinese UI
3. Mobile + touch support
4. "返回" link to portal
5. localStorage for scores/settings
6. Cyberpunk aesthetic
7. 60fps animations
8. Keyboard accessible
