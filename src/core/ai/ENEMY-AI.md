# Enemy AI — Dual Fire

Prompts for three intelligence levels. **Level 1 grunts, Level 2 tactical, and one Level 3 boss are in the live squad** (`src/maps/freeholdLane.js`). The original Level 3 personality prompt was incomplete; the boss uses cover, peek, reposition, and closer-range aggression instead of huge damage.

Soldiers are driven by `src/core/ai/` plus `src/core/patrol.js` (body, mesh, shots). Orbs stay dummy targets.

---

## Dual Fire fit (change these from the raw prompts)

| Prompt idea | What this demo actually has |
| --- | --- |
| Vehicles, crates, concrete barriers as cover | Houses and wall **blockers** on Freehold Lane. Cover = stand next to a house footprint so `blocked()` breaks LOS. |
| Navmesh / pathfinding | None. Movement is waypoint walk + `blocked(x,z)`. Chase/cover must stay on walkable ground or soldiers stick in walls. |
| Perfect 15-state Level 2 machine | Too many named states for one upgrade. Level 2 should **add decisions** on top of Level 1 states, not replace them with 15 labels. |
| Dead forever | Soldiers **stay down**. `Dead` hides the body. A new match / restart restores them. |
| New enemy types | Keep the **three Kenney soldiers**. Level 1 = all three. Level 2 = personality on those three. Level 3 = one of them (or a fourth) as boss when the prompt is complete. |
| Hear footsteps / 360 detect | Keep **front cone + distance + LOS**. Hearing can wait. |
| “Being shot at” | Player hits already go through `applyDamage`. AI does not get an **under fire** flag yet — that must be added for cover/strafe. |

Configurable numbers belong in `src/core/ai/config.js` later (range, FOV, burst gap, search time, personalities). Do not hard-code a second copy in `main.js`.

---

## Current soldiers (gap vs Level 1)

**Already there**

- Idle motion along a few fixed patrol points
- Detect: distance + forward cone + LOS through `blocked()`
- Stop briefly, face player, shoot with delay and miss chance
- Do not shoot through houses or while facing away

**Missing (must change `patrol.js` into a small state machine)**

- Named states: Idle, Patrol, Alert, Chase, Attack, Search, Dead
- Last known player position
- Walk to last seen point and search, then **return to patrol**
- Sidestep / step back when taking fire (simple)
- Move to a combat stance instead of only freezing in place
- Player-shot → “under fire” so they can react
- Modular brain so Level 2 can swap the **decision** function without rewriting mesh, health, or hitscan

Until that lands, they still feel like “patrol until in cone, then stand and shoot.”

---

## Level 1 architecture (before code)

One brain per soldier. Shared senses. Map supplies patrol routes and `blocked`.

```text
senses     lastSeen, hasLos, inCone, dist, underFire
body       mesh, health, weapon delay  (keep today’s Kenney clone)
brain      state + one update() per frame
```

### States

| State | Does | Leaves when |
| --- | --- | --- |
| Idle | Short pause on a waypoint | Timer → Patrol |
| Patrol | Walk route | Sees player → Alert |
| Alert | Stop, face player | Timer / LOS → Attack or Chase |
| Chase | Walk toward last seen / closer fight range | In range + LOS → Attack; lost → Search |
| Attack | Face, burst fire, small strafe if under fire | Out of range → Chase; lost LOS → Search; hp 0 → Dead |
| Search | Walk last seen, look around | See player → Alert; timeout → Patrol |
| Dead | Die clip | Stay dead until match reset |

### Transitions

```text
Idle ⇄ Patrol
Patrol → Alert          (cone + LOS + range)
Alert → Attack          (already in weapon range)
Alert → Chase           (too far)
Attack → Chase          (player leaves weapon range)
Attack → Search         (LOS broken)
Chase → Attack          (range + LOS)
Chase → Search          (LOS broken)
Search → Alert          (see player again)
Search → Patrol         (search timer)
any combat → Dead       (hp 0)
Dead                    (stay dead until reset)
```

Level 2 later **only** replaces how Alert/Attack pick a goal (cover vs push). Same states, smarter `evaluate()`.

---

## Prompt — Level 1: Basic Combat Enemy AI

Create a basic enemy AI for my shooting game.

The enemy should have simple but believable combat behaviour. Do not make it overly intelligent.

**Core behaviour**

Idle / Patrol — The enemy starts in an idle or patrol state. It should move between a small number of predefined patrol points. The enemy should not constantly move randomly.

Detect Player — Detect the player when the player enters the enemy's detection range. Use a combination of distance and line-of-sight. The enemy should not detect the player through solid obstacles.

Alert — When the enemy sees the player, stop patrolling. Face the player. Move toward a suitable combat position.

Attack — When within weapon range and the enemy has line-of-sight to the player, shoot. Do not shoot continuously. Add a short delay between shots or bursts. Include basic accuracy variation so every shot is not perfectly accurate.

Take Cover — If the player is shooting at the enemy, the enemy may move sideways or backward to avoid being an easy target. Keep this behaviour simple. The enemy does not need advanced tactical decision-making at this level.

Lose Player — If the player disappears behind an obstacle, the enemy should move toward the player's last known position. Search for a short period. If the player is not found, return to patrol.

**States** — Idle, Patrol, Alert, Chase, Attack, Search, Dead.

**Important** — The enemy should feel like a normal armed opponent, not a perfect AI. Keep the implementation modular so I can later upgrade this enemy into a smarter enemy without rewriting everything.

---

## Prompt — Level 2: Smart Tactical Enemy AI

Upgrade the enemy AI into a smarter tactical combat enemy.

The enemy should behave as if it understands basic battlefield situations.

The key goal is: Detect player → evaluate situation → choose an action → execute action.

The enemy should NOT always run directly toward the player.

**Detection** — Distance and line-of-sight. Never see through solid walls. Remember last known position. Limited range. Lose visual contact behind obstacles.

**Tactical decision making** — When the enemy detects the player, evaluate: distance, LOS, whether being shot at, nearby cover, distance to cover, health, time to reach cover. Choose: Attack, Move toward player, Take cover, Retreat, Search, Reposition.

**Cover** — Valid cover blocks the player's LOS, is reachable, reasonably close, useful to shoot from. Not every object is cover. Freehold Lane: house walls / blockers.

**Example** — Far player: move to cover, hide, wait, peek, shoot, return to cover. Heavily attacked: stop standing in the open, find cover, wait, re-engage. No cover: strafe, keep shooting. Player gone: last known position, search, then patrol.

**Personality (configurable)** — Aggression, accuracy, reaction time, courage, preferred distance, cover preference. Example: A aggressive / B defensive / C balanced — map onto the three existing soldiers.

**States (Layer on Level 1; do not explode into 15 separate files)** — Idle, Patrol, Detect/Alert, Evaluate (function), Attack, FindCover / MoveToCover / TakeCover / Peek / Shoot as **Attack substeps**, Retreat, Search, Reposition, Dead.

---

## Prompt — Level 3: Tough Tactical Boss AI

INCOMPLETE — the message ended at “Boss personality”.

Known intent: do not make the boss hard only with HP / damage / accuracy. Difficulty from decisions, positioning, adapting to the player. Paste the rest of the prompt here when you have it.

---

## Planned files (when implementing)

| File | Role |
| --- | --- |
| `src/core/ai/config.js` | Ranges, FOV, timers, three personalities |
| `src/core/ai/senses.js` | Cone, LOS, last seen, under fire |
| `src/core/ai/brain.js` | State machine (Level 1) |
| `src/core/ai/cover.js` | Level 2 — cover slots from map blockers |
| `src/core/patrol.js` | Keep as body: mesh, anim, hits, `step` calls brain |

`main.js` should pass player pose and “player just shot / hit this agent” into the brain. Do not put state logic in `main.js`.
