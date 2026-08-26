# Dual Fire

A dark tactical **1v1** landing page for **Dual Fire** (working title; **Last Trigger** is a backup name). Tagline: *Kill to survive.*

This repo is a **website demo**, not the game yet. There is no Three.js, Vite, or playable FPS here.

**GitHub:** [MohammadRefayetHossainMina/demo-multiplayer-games](https://github.com/MohammadRefayetHossainMina/demo-multiplayer-games)

---

## What’s on the page

- Hero with **Play Demo** (opens an ops briefing — it does **not** start a match)
- Default loadout inspector (rifle, pistol, CQC)
- Intel / story files
- Inactive tournament (modest prize, **no dollar amount**)
- Operator views form (saved in this browser only)

---

## Run locally

From this folder:

```bash
python -m http.server 8765 --bind 127.0.0.1
```

Then open [http://127.0.0.1:8765/](http://127.0.0.1:8765/).

Or open `index.html` in a browser. A local server is better so images and scripts load reliably.

---

## Project files

| File | Role |
|---|---|
| `index.html` | Page structure |
| `styles.css` | Visual design (tactical HUD) |
| `script.js` | Briefing, loadout swap, intel, views |
| `images/` | Hero and weapon art (AI-generated, demo only) |
| `ATTENTION.md` | Image / commercial / legal notes |
| `PRE-GAME-CHECK.md` | Bugs and gaps — **read before building the game** |

---

## Planned game (not started)

Target later: browser tactical shooter with **Vite + Three.js**, Rapier, Pointer Lock, warehouse map, rifle, and orb targets. Development is meant to go **phase by phase**. Phase 1 has not started.

See `PRE-GAME-CHECK.md` before you begin.

---

## License / art

Landing-page code is yours to use in this project. Hero and weapon images were generated in Cursor for the demo. Replace them before a commercial launch. Details: `ATTENTION.md`.
