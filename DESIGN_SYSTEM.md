# FindPicked Games — Design System

## Philosophy
Less, but better. Every pixel earns its place.

## Color Palette
- `--bg: #fafafa` — Page background
- `--bg-card: #ffffff` — Card background
- `--bg-hover: #f5f5f7` — Hover state
- `--text-primary: #1d1d1f` — Headlines
- `--text-secondary: #6e6e73` — Body text
- `--text-tertiary: #86868b` — Captions
- `--accent: #0071e3` — Links, CTAs
- `--accent-hover: #0077ed`
- `--border: rgba(0,0,0,0.08)` — Subtle dividers
- `--shadow: 0 2px 12px rgba(0,0,0,0.08)` — Card shadow
- `--shadow-hover: 0 8px 30px rgba(0,0,0,0.12)` — Hover shadow

### Dark Mode (in-game optional)
- `--bg: #000000`
- `--bg-card: #1c1c1e`
- `--text-primary: #f5f5f7`
- `--text-secondary: #86868b`

## Typography
- **Primary:** -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif
- **Weight hierarchy:** 700 (titles), 600 (subtitles), 400 (body)
- **Sizes:** 48px hero, 28px section, 20px card title, 15px body, 13px caption
- **Letter-spacing:** -0.02em on headlines
- **Line-height:** 1.2 headlines, 1.5 body

## Spacing
- Base unit: 8px
- Section padding: 80px vertical
- Card padding: 24px
- Grid gap: 24px
- Max content width: 1080px

## Components

### Card
- White bg, 12px radius, subtle shadow
- Hover: lift 2px, deeper shadow, smooth 0.3s
- No borders (shadow defines edges)

### Button
- Rounded pill: 44px height, 20px horizontal padding, 22px radius
- Primary: filled accent, white text
- Secondary: transparent, accent text, accent border

### Tags
- 12px font, 500 weight, 6px 12px padding, 100px radius
- Muted bg (#f5f5f7), dark text

## Animation
- Duration: 0.3s ease
- Hover lift: translateY(-2px)
- Page transitions: fade-in 0.5s
- No bouncing, no glitch, no glow — just smooth and precise

## Layout
- Centered, max-width 1080px
- Generous whitespace between sections
- Card grid: auto-fill minmax(300px, 1fr)
- Mobile: single column, 16px padding

## Rules
1. Single index.html per game, no external deps
2. Chinese UI
3. Mobile + touch first
4. "返回" link to portal (top-left, minimal)
5. localStorage for scores
6. Clean, neutral aesthetic — no neon, no glow
7. 60fps animations
8. Keyboard accessible
9. Every element must have a reason to exist
