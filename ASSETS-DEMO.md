# Demo 3D assets — must change before commercial launch

This is a working note for Dual Fire. Demo art is temporary.

## Must replace before commercial / Steam / paid tournament

| What | Where | Why |
| --- | --- | --- |
| Kenney suburban houses, trees, fences | `src/assets/kenney/suburban/` | CC0 is legal to use, but it is a public kit, not Dual Fire’s look |
| Kenney road tiles and lamps | `src/assets/kenney/roads/` | Same: public kit, not final art |
| Warehouse block-out maps | `src/maps/nightHold.js`, `coldStack.js`, `bayNine.js` | Programmer greybox, not final |
| AI landing-page images | `images/*.png` | See `ATTENTION.md` |
| Sketchfab FPS Map (if added later) | planned `src/assets/sketchfab/fps-map.glb` | CC-BY requires credit; still replace for a unique commercial game |
| Sketchfab muddy ground PBR (if dropped in) | `src/assets/sketchfab/muddy-ground/` | CC-BY **d0ggo**; download needs a Sketchfab login. Streets currently use a generated muddy fallback |
| Kenney Mini Arena soldier | `src/assets/kenney/soldiers/` | CC0 patrol stand-in. Replace before commercial launch |
| Sketchfab weapons / enemies (drop-in) | `src/assets/sketchfab/weapons/` and `enemies/` | See `src/assets/sketchfab/PUT-MODELS-HERE.txt`. Viewmodel loads `weapons/acr.glb` when present (doomsentinel, CC BY) |

## Sketchfab

The requested map is [FPS Map](https://sketchfab.com/3d-models/fps-map-0088cd0d30184cbc87edf9b7fce88f6c) by **hanitaieberrahmani**, license **CC Attribution**. Sketchfab’s download API returns 401 without a logged-in account, so the GLB is not in this repo. After you download it from the Sketchfab page, put it at `src/assets/sketchfab/fps-map.glb` and we can wire it as a walkable map.

Do **not** scrape Sketchfab’s viewer files. Use their official download button.

## Current demo substitute

**Freehold Lane** is a compact enclosed compound (houses, alleys, a road cross) built from Kenney City Kit Suburban + City Kit Roads so you can walk a real house layout now. It is inspired by the Sketchfab FPS map’s courtyard/alley layout, not a copy of that model.

Credit: [Kenney](https://kenney.nl) City Kit Suburban, City Kit Roads, and Mini Arena soldier (CC0; credit appreciated).
