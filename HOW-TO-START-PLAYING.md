# How to start playing

Dual Fire is a **local browser demo**: **one player versus AI soldiers and a boss**. There is no second human in this build, and no public Vercel or Netlify URL yet. You run two small servers on your computer, then play in Chrome or Edge.

You need **Node.js** (for the game) and **Python 3** (for the landing page).

---

## 1. Open the project folder

```bash
cd demo-multiplayer-games
```

Install game dependencies once:

```bash
npm install
```

---

## 2. Start the game server

In one terminal:

```bash
npm run dev
```

Leave this running. The match is at [http://127.0.0.1:5173/](http://127.0.0.1:5173/).

---

## 3. Start the landing page

In a **second** terminal, from the same folder:

```bash
python -m http.server 8765 --bind 127.0.0.1
```

Leave this running. The site is at [http://127.0.0.1:8765/](http://127.0.0.1:8765/).

---

## 4. Enter the match

1. Open [http://127.0.0.1:8765/](http://127.0.0.1:8765/).
2. Click **Play Demo**.
3. Click **Enter Freehold Lane**.
4. Click **Start match**.
5. Click the game once so the mouse locks. Look with the mouse; click to shoot.

You can skip the landing page and open [http://127.0.0.1:5173/](http://127.0.0.1:5173/) directly.

**Free roam** walks the map with no win/loss. **Start match** is you versus AI and a boss: 100 HP, frag 5 to win.

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

---

## Why there is no public play link yet

`npm run build` packages the site into a `dist/` folder that Vercel or Netlify can host. That build works. **Deploying** means uploading it to one of those hosts so anyone gets a `*.vercel.app` or Netlify URL.

That upload has not been done. Until it is, only `127.0.0.1` on this machine can play.

Ads, shop, and tournaments stay off. Demo 3D is Kenney art and must be replaced before a commercial launch.
