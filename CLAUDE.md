# Scurry

2D side-scrolling pixel-art speedrun platformer built with Phaser 3 + TypeScript + Vite. Each playable animal has its own movement physics and its own stage; the goal of a stage is to reach the end as fast as possible. The target look is `assets/stage/mockup.png`.

## Commands
- `npm run dev`: dev server at http://localhost:5173
- `npm run build`: typecheck and production build to `dist/`
- `npm run typecheck`

## Layout
- `assets/`: all art. Vite serves it as the web root (`publicDir`), so paths in `assets/assets.json` load unchanged.
- `assets/assets.json`: asset manifest (images, tileset, decor atlas, animal spritesheets and animations). Always load assets from it and never hardcode frame sizes.
- `src/assets.ts`: typed view of the manifest.
- `src/config.ts`: tunable constants. Native resolution is 320x192, scaled up with `pixelArt: true`.
- `src/scenes/`: `BootScene` (loading, creating animations), `GameScene` (level, input, camera).
- `src/entities/Player.ts`: the fox's movement and animation state.
- `docs/design/`: game design docs (see Game design below).

## Controls
A/D move, W or Space jump, hold Shift to run.

## Notes
- BG1 (sky) doesn't tile seamlessly, so it stays static. BG2 and BG3 use the manifest's scroll factors.
- The player is the fox. Animals have separate left and right sheets, so turn the sprite by switching sheets, not by `flipX`.
- `fox_run_left.png` and `fox_run_right.png` are swapped in the art pack. `ANIMATION_KEY_FIXES` in `src/config.ts` corrects this; check new animals' sheets the same way.
- Jumps come from key `down` events, not `isDown`/`JustDown`, so taps that start and end within one frame aren't lost.
- The camera scrolls after `update()`, so parallax updates on the camera's `FOLLOW_UPDATE` event.

## Build plan
1. Parallax background layers (done)
2. Flat ground from the tileset: grass tile 1, dirt tile 9, at y=144 (done)
3. Fox with idle/walk/run animations, movement, jump and camera follow (done)
4. Next: shape the level like the mockup (raised ledges, a pit, trees, bushes, stones, stone ruins)
5. Later, from the design pillars below: fox dash + cooldown, Scurry air dodge, momentum-based movement, then the Bramble Hollow stage

## Game design (target, mostly not implemented yet)

The prototype is currently a plain walk/run/jump fox. Everything in this section is where the game is heading. Don't assume it exists in code.

### Pillars
1. **Same inputs, different physics.** Inspired by Smash Bros character differentiation. Animals share the same buttons but differ in stats: walk speed, dash speed, ground traction, air acceleration, max air speed, fall speed, jump height.
2. **Universal Scurry.** Scurry is a directional air dodge with identical frame data for every animal. Only the animation and effects are reskinned per animal.
3. **One action button per animal**, with a cooldown (the fox's is dash).
4. **Each stage tests its animal's kit:** teach, then pressure, then combine.
5. **One continuous level per animal.** No checkpoints, no separate rooms. Early mistakes cost time, late mistakes cost the run. Progress is measured 0-100% for leaderboard splits.

### Roster
Bunny, Fox, Boar, Chicken/Pheasant, Deer. In the asset pack these are `hare`, `fox`, `boar`, `black_grouse`, `deer`. Confirmed traits so far: bunnies jump higher, chickens fall and land slowly.

### Fox
- Dash on a cooldown; low ground traction
- Low max air speed, high air acceleration (steers through the air, can't rocket across gaps)
- Universal Scurry
- **No wall-kick, wall-slide, or climbing tech** (deliberately removed)
- Identity: **redirection under commitment**

Fox stage is **Bramble Hollow**: @docs/design/fox-bramble-hollow.md

### Implementation notes for the design target
- `Player.update()` currently sets `velocityX` directly every frame (`dir * speed`), so there is no traction or air acceleration. The fox's identity needs acceleration-based movement (ground traction, air acceleration, max air speed), so expect to rework this.
- `PLAYER` in `src/config.ts` is a single fox-only object. When a second animal is added, make movement stats a per-animal record keyed by animal so tuning one animal never touches shared logic.
- There is no jump, dash, or Scurry animation in the pack. Jumping reuses run frame 3 (`PLAYER.airFrame`). Dash and Scurry need placeholder or custom art.
- Ask before inventing numbers for anything the design docs mark TBD.

## Art and licensing rules
- Animal sprites are a CraftPix pack (`assets/animals/LICENSE.txt` links to the CraftPix license). Do NOT add any feature that lets players export or extract the art, do NOT redistribute the raw source files, and do NOT use the art as AI/ML training data. Normal in-game rendering and animation is fine.
- `assets/animals/*/source/` (PSD/Aseprite) is not loaded by the game; the manifest excludes it. Never reference it from code.
- The origin of the stage art (`assets/stage/`) and its license are not recorded yet: TODO.
- Hazard look: thorns and brambles, not generic spikes. Soft hazards slow the player; hard hazards reset the run and are reserved for the end of a stage.
- Route-reading matters more than detail: safe path, hazard, and dead-end branch must be distinguishable by color and silhouette.

## Working rules
- Treat the design pillars as constraints. If a request conflicts with one (checkpoints, fox wall-kick, per-animal Scurry timing), flag it before implementing.
- Load assets through `assets/assets.json` and `src/assets.ts`, never by hardcoded paths or frame sizes.
