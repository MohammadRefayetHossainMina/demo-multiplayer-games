# PROJECT SPECIFICATION: Dual Fire / Last Trigger

**Game title:** Dual Fire / Last Trigger  
**Genre:** Fast-paced browser tactical shooter  
**Target engine:** Three.js (WebGL) via Vite  
**Physics:** Rapier.js (WASM) / lightweight raycasting  
**Language:** JavaScript / TypeScript  
**Monetization target:** A$10,000 / month (ads, cosmetics, tournaments)

The live preview site currently does **not** show a prize dollar amount. Tournament copy on the page stays inactive until commercial launch.

---

## 1. Project brief and vision

**Website topic:** Dual Fire / Last Trigger — a high-octane tactical browser shooter.

**Core purpose:** Launch a high-converting web portal that lets players instantly test the demo, immerse in the game lore, and register for competitive events.

**Target audience:** Gamers who enjoy fast tactical shooters (CS:GO, Krunker, Cryzen) and competitive ladder play.

**Primary visitor outcome:** Play the game demo, learn the “Kill to Survive” story, and register for the monthly tournament.

**Key call to action:** The **Play Demo** button (immediate entry into gameplay).

---

## 2. Core web portal architecture (3 main sections)

### Play Demo (hero)

- Prominent interactive WebGL canvas area with zero-friction guest access.
- Prominent **Play Demo** button launching fullscreen Pointer Lock mode.

### Kill to Survive (story and world lore)

- Narrative blurb introducing the dystopian, high-stakes tactical lore of Dual Fire / Last Trigger.
- Showcase area highlighting target types (Flaming, Cyber, and Water Orbs) and weapon loadouts (assault rifle).

### Monthly tournament (competitive hub)

- Live countdown timer, entry rules, and cash prize pool breakdown (e.g. A$500 pool).
- Registration form marked with “Coming After Full Launch” state.

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

Phases **1–17** are implemented on **Freehold Lane** (Kenney demo art). Commercial flags in `src/config/Commercial.js` stay `false`. Replace demo 3D before a paid launch (`ASSETS-DEMO.md`).
