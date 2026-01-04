# NSFW RPG Game

## Quick Start

1. Open terminal in this folder
2. Run: `npm install`
3. Run: `npm run dev`
4. Browser opens to http://localhost:3000

## Build for Distribution

```bash
npm run build
```

Creates a `dist/` folder you can upload to Netlify, itch.io, etc.

## Project Structure

```
nsfw-rpg-game/
├── src/
│   ├── main.jsx      # Entry point
│   ├── App.jsx       # Age gate + error boundary
│   └── Game.jsx      # Main game (6000+ lines)
├── engine/           # Game systems
├── public/
│   └── content/      # JSON game data
├── package.json
├── vite.config.js
└── index.html
```

## Adding Content

Edit JSON files in `public/content/`:
- `scenes/` - Dialogue & narrative
- `items/` - Weapons, armor, clothing
- `enemies/` - Enemy definitions
- `locations/` - World areas
- `effects/` - Status effects
- `substances/` - Drugs & addiction
