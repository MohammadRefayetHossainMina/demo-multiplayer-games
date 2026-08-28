# Dual Fire — AI prompts

Use this file when asking an AI to plan or change Dual Fire.  
Read **Standing orders** first. Then open only the section that matches the task.

There was no prompts-only file before this. Enemy draft prompts still live in `src/core/ai/ENEMY-AI.md`. Spec facts live in `PROJECT_SPEC.md`. This file is the prompt pack.

---

## 0. Standing orders (always on)

These override every section below. Apply them on every message.

### Priorities

1. **Truth over invention.** If it is not in this repo, this file, or a file you just read, say you do not know. Do not invent systems, guns, maps, multiplayer, prizes, or “the game already has X.”
2. **This demo is solo vs AI.** One human. No second player. The repo name `demo-multiplayer-games` is leftover. Do not add netcode, 1v1, or Last Trigger lore.
3. **Win condition:** kill the **boss**. Nobody respawns mid-match. Restart / Start match restores the squad.
4. **Commercial stays off.** `src/config/Commercial.js` flags stay `false`. No ads, shop, tournament signup, or prize dollar amount.
5. **Smallest change that works.** Touch only the module for the task. Do not rewrite the engine, landing page, and AI in one pass.
6. **Kenney / AI art is temporary.** Do not treat demo houses, soldiers, or landing PNGs as final commercial art.

### No hallucination

- Do not claim a feature exists unless you verified it in code.
- Do not “fix” 1v1, flaming/cyber/water orbs as the main fight, or a live tournament.
- Dummy orbs may still exist as leftover targets. Soldiers and the boss are the live fight.
- If copy, HUD, README, and code disagree, **code wins**. Then update the copy.

### Plan vs execute

| Mode | Do | Do not |
| --- | --- | --- |
| **Plan** | Read, list files, name the approach, list risks, wait | Edit files, run builds, commit, push |
| **Execute** | Implement the agreed plan, smallest diff, verify | Re-plan from scratch, expand scope, “while I’m here” refactors |

If the user did not say “implement / do it / change the code,” stay in **Plan**.  
If the user said “plan,” do not execute.

### Speed

- **Think 10× faster:** skip recap, skip extra options, pick one path that matches the spec, name the files, stop.
- **Execute 20× faster:** edit the target files only, no drive-by cleanup, no new docs unless asked, no extra abstractions.

---

## 1. Game identity

**Title:** Dual Fire  
**Tagline:** Kill to survive.  
**What it is:** Dark tactical **browser FPS** demo. Three.js + Vite. GitHub Pages.  
**What it is not:** Multiplayer, ranked 1v1, a commercial launch, a prize event.

**Play loop**

1. Landing page → **Play Demo** → briefing → **Enter Freehold Lane**
2. **Start match** → click canvas to lock mouse
3. Hunt AI on Freehold Lane. Kill the boss to win. 100 HP. You lose if HP hits 0.

**Live site:** https://mohammadrefayethossainmina.github.io/demo-multiplayer-games/  
**Repo:** https://github.com/MohammadRefayetHossainMina/demo-multiplayer-games

---

## 2. Game rules

Use this block when changing win/lose, HUD, match state, or briefing copy.

```text
RULES — Dual Fire demo (do not invent extras)

- One player vs AI. No second human.
- Win: kill the boss. Lose: player HP reaches 0.
- Nobody respawns during a match (grunts, tacticals, boss, dummy orbs).
- Start match / Restart restores the full squad and loadout.
- Free roam: walk the map, no win/loss.
- Player HP 100. Ammo is finite. Reserve can be restocked from gold crates on the roads.
- Default guns only: ACR, CQC, pistol. No unlocks, no paid skins.
- Tournament section exists but is inactive. No countdown. No prize amount.
- Commercial flags stay false.
- Pointer lock: click the game to look. Esc unlocks / pauses a live match.
```

---

## 3. Player

Use this block when changing movement, guns, HUD, or pickups.

```text
PLAYER — Dual Fire (verify in src/core/Input.js, src/entities/Weapon.js)

Controls
- WASD move · mouse look · LMB fire · mouse wheel cycle guns
- R reload · 1 ACR · 2 CQC · 3 Pistol · Space jump · Shift sprint · Esc pause

Combat
- Hitscan. Mag empties. R pulls from reserve. Empty mag + no reserve = dry.
- Ammo crates (gold boxes on the main roads): walk over to add reserve
  (+30 ACR, +25 CQC, +12 pistol). Crates restock after ~26s. Gold squares on minimap.
- Shooting an enemy alerts allies within hear range of that target.

Do not
- Add ADS / RMB aim unless asked (RMB is not in the live build).
- Add sprint-to-walk confusion. Shift is sprint.
- Let the player walk through the outer compound wall.
```

---

## 4. Enemy AI

Use this block when changing soldiers, boss, cover, or awareness.  
Code: `src/core/ai/` + `src/core/patrol.js`. Numbers: `src/core/ai/config.js`. Squad: `src/maps/freeholdLane.js`.

### Always true for enemies

```text
ENEMY — Dual Fire (do not hallucinate types)

Roster
- Grunts (level 1), tacticals (level 2, personalities), one boss (level 3).
- Kenney soldier mesh only. Do not add new enemy species.
- Dummy orbs are leftover targets, not the live fight.

Movement
- No navmesh. Waypoints + blocked(x,z). Buildings are solid for AI (full footprints).
- If a soldier is in a wall, push them to open ground. Do not slide them through houses.

Death
- Stay down until match reset. No mid-match respawn.

Awareness
- See: distance + front cone + LOS (not through houses).
- Hit on a soldier: that soldier and allies within hearRange (~14–20 m) become aware.
- Aware soldiers: know player position for a few seconds, sprint to cover, peek, shoot.
- Do not detect through walls. Do not be perfect aim. Burst gaps + miss chance stay.
```

### Prompt — Level 1 grunt

```text
Keep Level 1 simple. Idle/Patrol on a short route. Detect with range + cone + LOS.
Alert, face player, chase or attack. Shots have delay and miss chance.
If shot, or if an ally very close is shot: run to cover, hide, peek, return fire.
If the player is lost: last known point, short search, then patrol.
States: Idle, Patrol, Alert, Chase, Attack, Cover, Peek, Search, Dead.
Modular. Do not rewrite mesh, health, or hitscan.
```

### Prompt — Level 2 tactical

```text
Upgrade decisions, not HP. Evaluate: distance, LOS, under fire, nearby cover, health.
Prefer: cover → hide → peek → shoot → return to cover. Do not always rush the player.
Personalities: aggressive / defensive / balanced (already on tacticals).
Same states as Level 1. Smarter choose-action. No 15-file state explosion.
```

### Prompt — Level 3 boss

```text
One boss. Hard because of positioning and adapting, not because of huge damage only.
Cover, peek, reposition, closer-range aggression. Does not respawn.
Do not spawn a second boss. Do not make the boss a second human.
```

---

## 5. Map and world

```text
MAP — Freehold Lane

- Night compound: Kenney suburban houses, roads, malls. Replace before commercial launch.
- Player spawn: north road (~0, 42). Outer walls contain the walk area.
- AI must not path through house interiors. Player may use door gaps in wall shells.
- Cover = stand beside a house footprint so LOS breaks.
- Ammo crates sit on the open roads (N/E/W/S and near the cross), not inside houses.
```

---

## 6. Landing page and copy

```text
LANDING — index.html, styles.css, script.js

- Interactive briefing site, then the match. Keep Play Demo → toggleDemoBriefing → Enter Freehold Lane.
- sectorUrl(): local ports 8765/8080 → Vite 5173; GitHub Pages → play/.
- Views feedback is localStorage only. Not a server. Do not pretend other players see it.
- Do not advertise a live prize. Tournament stays “not open yet.”
- Controls copy must match the game (Shift = sprint, no RMB aim).
```

---

## 7. Files to open (do not guess paths)

| Task | Start here |
| --- | --- |
| Match win/lose/HP | `src/core/match.js`, `src/ui/hud.js` |
| Player move / lock | `src/core/Input.js` |
| Guns / ammo | `src/entities/Weapon.js`, `src/entities/ammoPacks.js` |
| Enemy body | `src/core/patrol.js` |
| Enemy brain | `src/core/ai/brain.js`, `config.js`, `senses.js`, `cover.js` |
| Squad / crates / map | `src/maps/freeholdLane.js` |
| Landing | `index.html`, `script.js`, `styles.css` |
| Spec | `PROJECT_SPEC.md` |
| This prompt pack | `PROMPTS.md` |
| Older enemy drafts | `src/core/ai/ENEMY-AI.md` |

---

## 8. How to paste a request

Copy this header, then add one sentence for the task.

```text
Follow Dual Fire PROMPTS.md standing orders.
Solo vs AI. Kill the boss. No mid-match respawn. No hallucination. Commercial flags off.
Mode: PLAN only (no file edits)  —or—  Mode: EXECUTE (smallest diff, named files only).
Think 10×: one approach, files, stop.
Exec 20×: those files only.

Task:
[one sentence]
```
