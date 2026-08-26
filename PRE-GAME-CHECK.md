# Read this before starting the game

Do **not** start Phase 1 (Vite / Three.js) until you have read this file.

This is a landing-page review only. There is **no playable game** in this repo yet.

---

## Real bugs (fix or accept before calling the site done)

1. **Sticky header covers section titles**  
   Jumping to Loadout, Intel, Tournament, or Views scrolls the heading under the nav. Needs `scroll-margin-top` (or extra top padding on those sections).

2. **Views / comments can break**  
   Comments are stored in `localStorage` (`dual-fire-views`). If storage is blocked (some private windows) or the saved value is not an array, loading or posting a view can fail and stop other script from running.

3. **GitHub is behind this computer**  
   Last push was `ATTENTION.md`. Later work (tactical HUD, prize copy with no dollar amount, briefing / loadout / intel / views JS) may not be on GitHub yet. Confirm `git status` and push if you want the remote to match.

---

## Player-facing concerns (not crashes, but confusing)

4. **Play Demo does not play a game**  
   It only opens an ops briefing overlay. The spec wants a WebGL demo and Pointer Lock. Do not advertise this as a live match until Phase 1+ exists.

5. **“Demo live” is misleading**  
   The red pill means the *page* is up, not that a match server or FPS demo is running.

6. **You cannot see other players’ comments**  
   Views stay in that browser only. They are not sent to GitHub, email, or a server. They will not help you gather real 99% feedback from the public.

7. **Briefing overlay does not trap keyboard focus**  
   Escape and Close work. Tab can still move to the page behind the overlay.

---

## Spec vs what exists (do not treat as done)

From `PROJECT SPEC` (Dual Fire / Last Trigger, Three.js, Vite):

| Spec item | Status |
|---|---|
| Dual Fire landing page, Kill to Survive tone | Done (page only) |
| Play Demo → fullscreen Pointer Lock / WebGL | **Not done** |
| Flaming / Cyber / Water Orbs showcase | **Not done** |
| Tournament countdown, A$ prize pool, registration | **Not done** (section exists, inactive, no amount) |
| Vite, Three.js, Rapier, `/src` engine | **Not done** |
| `Commercial.js` feature flags | **Not done** |
| Phases 1–17 | **Not started** |

---

## Legal / commercial (also in ATTENTION.md)

- AI images in `images/` are fine for this **demo**. Replace them before a **commercial** launch.
- Name **Dual Fire** may overlap other games (e.g. Dual Fire Walled City on Steam). Clear the name before selling.
- Do not copy Critical Ops art, logo, or name.
- Do not promise a live cash tournament until rules and a lawyer are in place.
- This file is **not** legal advice.

---

## Safe to ignore for now

- Empty leftover `#demo` target in HTML
- Large PNG files (slow load, not broken)
- Google Fonts need internet (page still works without them)

---

## Next action

When you are ready, say so and we can either:

1. Fix items 1–3 on the landing page, **or**
2. Begin **Phase 1: Vite + Three.js** (game foundation).

Do not start both in the same sprint.
