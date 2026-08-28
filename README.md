# Dual Fire

Tactical **solo vs AI** browser demo. Kill to survive.

**Repository:** https://github.com/MohammadRefayetHossainMina/demo-multiplayer-games

**Play:** https://mohammadrefayethossainmina.github.io/demo-multiplayer-games/

This demo is **one player versus AI soldiers and a boss** — not a second human. Local setup: [How to start playing](HOW-TO-START-PLAYING.md).

---

## Status

| Area | State |
| --- | --- |
| Landing page | Preview (GitHub Pages) |
| Playable FPS demo | Freehold Lane — solo vs AI + boss |
| Tournament registration | Inactive (flagged off) |
| Commercial systems (ads, shop) | Off |

---

## Run locally

Landing page:

```bash
python -m http.server 8765 --bind 127.0.0.1
```

Open http://127.0.0.1:8765/ — **Play Demo** → **Enter Freehold Lane**.

Game (Vite):

```bash
npm install
npm run dev
```

Open http://127.0.0.1:5173/

The demo does not need a second player. `npm run net` is unused leftover for later.

---

## Controls

| Input | Action |
| --- | --- |
| `W` `A` `S` `D` | Move |
| Mouse | Look |
| Left mouse | Fire |
| Mouse wheel | Next / previous weapon |
| `R` | Reload |
| `1` `2` `3` | ACR / CQC / Pistol |
| `Space` | Jump |
| `Shift` | Sprint |
| `Esc` | Unlock mouse / pause |

Kill the **boss** to win. Grunts and tacticals respawn; the boss does not. Demo 3D is Kenney art — replace before commercial launch.

---

## Deploy

GitHub Pages publishes from `.github/workflows/pages.yml` on every push to `main`.

```bash
npm run build
```

That writes the landing page and the game into `dist/` (`dist/play` is the match). Keep `src/config/Commercial.js` flags `false` until launch.

---

## Contents

| Path | Description |
| --- | --- |
| `HOW-TO-START-PLAYING.md` | How to run the landing page and match |
| `index.html` | Preview landing page |
| `src/` | Three.js match, HUD, Freehold Lane |
| `server/ws.mjs` | Unused leftover pose relay (demo is solo) |
| `ASSETS-DEMO.md` | Demo 3D that must be replaced |
| `ATTENTION.md` | Image and commercial notes |
