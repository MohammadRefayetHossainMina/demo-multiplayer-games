# Dual Fire — notes that need your attention

This file records the image/commercial-use advice and a full-file review of the current landing page. It is not legal advice.

## AI-generated pictures (keep for demo, replace before commercial launch)

These images were generated in Cursor for this Dual Fire demo. They were **not** copied from Critical Ops.

Files:

- `images/hero-ops.png`
- `images/weapon-rifle.png`
- `images/weapon-pistol.png`
- `images/weapon-smg.png`

**Okay to use now:** demo website, GitHub, playtests, “coming soon.”

**Do not treat them as “no harm, keep forever” for a commercial game launch.**

- They are AI-generated. Under current U.S. copyright practice, prompt-only images often cannot be copyrighted, so you may not be able to stop someone else from using a very similar picture.
- Cursor’s terms assign you whatever rights Cursor has in the output, but similar images can also be generated for other users. You do not get exclusive rights against that.
- Steam and similar stores often expect you to disclose AI art.
- Photoreal operators and guns are usually fine as fictional concept art, but they are **not your game**. A commercial launch looks stronger with your own screenshots, characters, and weapons.

**Before commercial launch:** replace these with original in-game art or commissioned art, and talk to a lawyer if real money is involved.

## 3D demo maps and houses (replace before commercial launch)

These 3D files are for the **demo map picker only**. They are not Dual Fire’s final art. Full checklist: `ASSETS-DEMO.md`.

### Sketchfab FPS map (not downloaded)

Reference: [FPS Map by hanitaieberrahmani](https://sketchfab.com/3d-models/fps-map-0088cd0d30184cbc87edf9b7fce88f6c) (CC Attribution). Sketchfab requires a logged-in account to download, so the GLB is not in this repo yet. After you download it, put it at `src/assets/sketchfab/fps-map.glb`. Even with CC-BY credit, **replace it before commercial launch**.

### Sketchfab weapons (viewmodel)

The walker loads [Adaptive Combat Rifle by doomsentinel](https://sketchfab.com/3d-models/adaptive-combat-rifle-a18a8008a299430caa5f1fe05563c949) (CC BY) from `src/assets/sketchfab/weapons/acr.glb` when that file is present. Official Sketchfab Download only. Drop-in list: `src/assets/sketchfab/PUT-MODELS-HERE.txt`. **Replace before commercial launch**.

### Houses currently in the demo

Kenney City Kit Suburban 2.0 and City Kit Roads (CC0) in `src/assets/kenney/`, used by **Freehold Lane**. Legal for the demo. **Replace before commercial launch** so Dual Fire does not ship a public asset kit as its city.

## Review of the current files

Read: `index.html`, `styles.css`, `script.js`, and the four images. Nothing is secretly broken, but these items need your decision.

### Must know before you show this to players

1. **Play Demo opens an ops briefing, then Enter Freehold Lane loads the match.** Locally that is `http://127.0.0.1:5173/` (Vite). After `npm run build`, the game is at `/play/`. Commercial flags stay off.
2. **Player comments stay on that person’s computer only.** Views are saved in browser `localStorage` (`dual-fire-views`). You will **not** see comments from other players. They are not sent to GitHub or any server. If you want real feedback for a 99% build, you need a backend or a form service later.
3. **The tournament is advertised but inactive, with no dollar amount.** The page says the event is not live and there is no registration. Prize copy is a modest winner’s purse only — confirm you are still comfortable promoting a prize before the game and tournament exist.
4. **The GitHub repo is public.** Anyone can clone the page. That is fine for a demo. Do not put keys, accounts, or private player data in this repo.

### Smaller items (not blocking)

- Images are large PNGs (about 2 MB each). The homepage will load slowly on phones. Compress or convert to WebP before a real launch.
- Fonts load from Google. The page needs internet for Rajdhani and IBM Plex Sans.
- Empty leftover target: `<section id="demo">` exists only so old `#demo` links do not fail. Harmless.
- Briefing overlay does not close on the Escape key (click Close or the dim background).
- Public play URL is GitHub Pages: https://mohammadrefayethossainmina.github.io/demo-multiplayer-games/

### What looks solid

- Semantic layout, nav, and IDs match the architecture plan.
- Three interactions work: Play Demo briefing, weapon swap, intel open/close.
- Comments use `textContent` (not raw HTML), so posted text is not injected as code.
- Tournament countdown was removed as requested.
- No secrets, API keys, or `.env` files in the project.
