# PROJECT SPECIFICATION: Dual Fire

**Game title:** Dual Fire  
**Genre:** Dark tactical browser FPS demo (solo vs AI)  
**Target engine:** Three.js (WebGL) via Vite  
**Physics:** Lightweight raycasting  
**Language:** JavaScript  
**Monetization target:** Later commercial launch (ads, cosmetics, tournaments). Flags stay off in this demo.

The live site does **not** show a prize dollar amount. Tournament copy stays inactive until commercial launch.

---

## 1. Project brief and vision

**Website topic:** Dual Fire — a dark tactical browser FPS. Tagline: Kill to survive.

**Core purpose:** Let a visitor play the demo immediately, learn the sector story, inspect the default loadout, and leave feedback before a later commercial launch.

**Target audience:** Players who like fast tactical shooters (CS:GO, Krunker, Cryzen) and want a short solo fight in the browser.

**Primary visitor outcome:** Play Freehold Lane (one player versus AI soldiers and a boss), read the Kill to Survive briefing, and post a view.

**Key call to action:** The **Play Demo** button. It opens the ops briefing, then **Enter Freehold Lane** starts the match.

This demo is **solo vs AI**. There is no second human player.

---

## 2. Core web portal architecture

### Play Demo (hero)

- Dark night-ops hero with **Play Demo** as the main button.
- Play Demo opens a briefing (default guns, hunt the boss, no second player).
- **Enter Freehold Lane** loads the playable match. Click the game to lock the mouse.

### Kill to Survive (story and loadout)

- You drop in alone. Win by killing the **boss**. Nobody respawns.
- Default kit only: rifle, CQC, pistol. No unlocks and no paid skins in this demo.
- Intel cards cover the lane, equal loadout, and why the tournament is still inactive.

### Monthly tournament (inactive hub)

- The section exists so visitors know a later competitive event is planned.
- It stays inactive. No countdown and no prize dollar amount.
- Ranked 1v1 is later, not this demo.

### Feedback

- Views section: operators keep playing and say what would make Dual Fire closer to 99%.

---

## 3. Cursor AI development rules

- **Isolated sprints:** Work strictly module-by-module (e.g. camera control, physics, shooting logic). Never rewrite the whole codebase in one prompt.
- **Feature-flag protection:** Keep all commercial systems (ads, store, analytics) behind boolean flags in `/src/config/Commercial.js`. Default state is `false`.
- **Asset constraints:** Use optimized `.glb` assets (warehouse environment, assault rifle, orbs) and Web Audio API spatial sounds (`.mp3` / `.ogg`).
- **Demo 3D is temporary:** Kenney suburban houses on Freehold Lane, and any later Sketchfab GLBs, **must be replaced before commercial launch**. See `ASSETS-DEMO.md` and `ATTENTION.md`.
- **Performance target:** Maintain 60 FPS on integrated laptop GPUs (< 100k scene triangles).

---

## 4. Directory and code structure

```text
/src
  ├── /assets
  │     ├── /models       # Warehouse.glb, Rifle.glb, Orbs.glb
  │     └── /audio        # Gunshot.mp3, Impact.mp3, Ambient.ogg
  ├── /config
  │     ├── Assets.js     # Path manifests and geometry fallbacks
  │     └── Commercial.js # Feature flags (Ads, Shop, Tournaments)
  ├── /core
  │     ├── Engine.js     # Three.js Scene, Renderer, Render Loop
  │     ├── Physics.js    # Rapier/Raycast Collision systems
  │     └── Input.js      # PointerLock & Keyboard event listeners
  ├── /entities
  │     ├── Player.js     # FPS Movement, Camera, Capsule Collider
  │     ├── Weapon.js     # Rifle model, Sway, Recoil, Raycast Shooting
  │     └── Targets.js    # Flaming, Cyber, & Water Orb AI logic
  ├── /ui
  │     ├── LandingPage.js# Hero, Story, & Tournament DOM overlays
  │     └── HUD.js        # Crosshair, Ammo counter, Health, Score
  └── main.js             # State Manager & Game Loop Initialization
```

---

## 5. Commercial configuration (`/src/config/Commercial.js`)

```javascript
export const COMMERCIAL_CONFIG = {
  // Master switch (keep FALSE during asset evaluation)
  COMMERCIAL_MODE_ENABLED: false,

  // Feature flags
  ENABLE_ADS: false,
  ENABLE_SKIN_SHOP: false,
  ENABLE_TOURNAMENTS: false,

  // Fallbacks
  AD_PROVIDER: "MockProvider",
};
```

---

## 6. 17-phase development plan

1. Vite + Three.js engine setup and canvas initialization  
2. Pointer lock and first-person camera controls (WASD + mouse)  
3. Player collision and arena bounds setup  
4. Warehouse level geometry assembly  
5. Assault rifle camera rigging and weapon sway  
6. Hitscan shooting, ammo logic, and raycasting  
7. Juicing and VFX (muzzle flashes, bullet tracers, recoil)  
8. Target orbs (Flaming, Cyber, Water HP and respawn systems)  
9. Web Audio API spatial sound FX (guns, hits, ambience)  
10. Landing page overlay and HUD integration  
11. Main game loop (menu → play → win/loss → restart)  
12. Weapon switching system  
13. Asset optimization and draw-call compression  
14. Multiplayer foundation (anonymous WebSockets)  
15. Monetization hooks (ads and store behind feature flags)  
16. Local tournament and XP progression (localStorage)  
17. Security audit and web deployment (Vercel / Netlify)  

---

## Status

The playable demo is **Freehold Lane**: one player versus AI grunts, tacticals, and one boss. Kill the boss to win. Dummy orbs may still exist as leftover targets; soldiers and the boss are the live fight. Commercial flags in `src/config/Commercial.js` stay `false`. Kenney demo 3D must be replaced before a paid launch (`ASSETS-DEMO.md`).
