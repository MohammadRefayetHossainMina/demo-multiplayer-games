# Dual Fire

Tactical **1v1** browser shooter. Kill to survive.

**Repository:** https://github.com/MohammadRefayetHossainMina/demo-multiplayer-games

---

## Status

| Area | State |
| --- | --- |
| Landing page | Preview |
| Playable FPS demo | Freehold Lane (phases 1–17) |
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

Optional anonymous multiplayer ghosts:

```bash
npm run net
```

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

Frag **5** targets to win. Soldiers return fire. Demo 3D is Kenney art — replace before commercial launch.

---

## Deploy

```bash
npm run build
```

That writes the landing page and the game (`dist/play`) for **Vercel** or **Netlify**. Config: `vercel.json`, `netlify.toml`. Keep `src/config/Commercial.js` flags `false` until launch.

---

## Contents

| Path | Description |
| --- | --- |
| `index.html` | Preview landing page |
| `src/` | Three.js match, HUD, Freehold Lane |
| `server/ws.mjs` | Anonymous WebSocket pose relay |
| `ASSETS-DEMO.md` | Demo 3D that must be replaced |
| `ATTENTION.md` | Image and commercial notes |
