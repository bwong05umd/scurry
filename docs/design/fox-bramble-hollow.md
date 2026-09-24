# Fox Stage: Bramble Hollow

**Theme:** Dense, maze-like forest thicket. Narrow gaps, crisscrossing trails, hedges. It should feel like threading a needle at speed.

**Structure:** One continuous level, no checkpoints. Progress is measured 0-100% for leaderboard splits. Early zones are forgiving (a bad turn costs speed, not the run). Only the finale is genuinely unforgiving.

**Core tension:** Repeated decision moments, such as "spend my dash now to clear this gap, or save it for the tighter section ahead?"

## Fox kit (target)

- Dash on a cooldown; low ground traction
- Low max air speed, high air acceleration
- Universal Scurry air dodge
- No wall-kick, no vertical climbing tech

## Prototype numbers (current, pre-dash)

Derived from `src/config.ts` so gap sizes can be sanity-checked. The screen is 320x192 px, which is 20x12 tiles at 16 px per tile.

| Value | Prototype | In tiles |
|-------|-----------|----------|
| Walk speed | 60 px/s | n/a |
| Run speed (hold Shift) | 110 px/s | n/a |
| Jump apex | ~44 px | ~2.75 |
| Flat-ground airtime | ~0.77 s | n/a |
| Max gap, walking jump | ~46 px | ~2.9 |
| Max gap, running jump | ~84 px | ~5.3 |

These are placeholders. The fox's real values (dash distance, cooldown, air acceleration, max air speed) are TBD and will change the gap sizing below.

## Zones

| # | Zone | Range | What it teaches |
|---|------|-------|-----------------|
| 1 | Opening snap-turn stretch (earlier working name: The Warren Split) | 0-20% | Dash is for redirecting, not just speed. Diverging hedge-gaps too tight to run through at top speed force a dash into a snap-turn. No cooldown pressure yet. |
| 2 | Thorn Corridor | 20-40% | Air-acceleration curving. Gaps that can't be cleared by a straight jump; the player must bend the arc around a hedge corner. Low max air speed means steering, not rocketing. |
| 3 | The Split | 40-60% | Route choice. Low path is flat, safe, slow, no dash needed. High path is a chain of tight curved-air gaps (2-3 steered jumps plus one well-timed dash), no vertical climbing. Paths rejoin, so a botched high route drops the player to the low path instead of failing the run. |
| 4 | False Trails | 60-80% | Route knowledge. Visually similar branch points with one true route; wrong branches loop back a few seconds behind rather than dead-ending. No movement tech, a breather between demanding sections. |
| 5 | The Gauntlet | 80-100% | Finale combining everything: dash, then a cooldown gap (forces a Scurry or an air-accel curve), then dash again. Hedges visually close in. The only truly unforgiving section. |

**Length note:** `WORLD_WIDTH` is currently 960 px (3 screens). A five-zone stage needs a much longer world, so this will need to grow, probably built from a Tiled/tilemap file instead of the procedural flat ground in `GameScene.createGround()`.

## Asset coverage

What the repo already has versus what still needs to be made.

**Already in the repo**
- Ground and structure: 16x16 tileset (`stage/Tileset.png`, 48 tiles): grass-topped dirt, dark soil, blue stone brick
- Decor: tree, bush, stone (only these three frames in `stage/Decors.png`)
- Backgrounds: three parallax layers (BG1 sky is static, BG2 and BG3 scroll)
- Fox animations: idle, walk, run, hurt, death, each in left/right/front, plus shadow variants

**Still to make or source**

| Need | Zone | Notes |
|------|------|-------|
| Bramble patch (soft hazard, slows player) | 1-4 | New art; the pack has no hazards |
| Thorn wall (hard hazard, resets run) | 5 only | New art |
| Hedge wall tiles + "closing in" variant | 1, 5 | New art; could start by tinting bush/tree decor |
| Log / branch platforms | 3 | Could reuse grass-top ledge tiles as a stand-in |
| Route-reading set (true-route markers, decoy branch tiles) | 4 | Consistent silhouette and color language |
| Overhead canopy layer | 3 | Sells the high route |
| Lighting shift, bright to dark across the stage | all | Cheap option: camera tint or overlay, no new art |
| Dash trail, Scurry effect (dust puff / leaf swirl) | all | New art or particles |
| Fox jump, dash, and Scurry animations | all | Not in the pack; jump currently reuses run frame 3 |
| Dash cooldown indicator | all | New UI |
| Start and finish markers (burrow/den), split markers | all | New art |
| Optional hunter hazards: snare, bear trap, tripwire | any | Supports the hunted theme, adds art work |

**Art direction gap:** the mockup (`assets/stage/mockup.png`) is a bright, open woodland with stone ruins, while Bramble Hollow is meant to be a tight thicket. The lighting shift and hedge tiles are what close that gap, so they are worth doing early.

**Priority if art time is limited:** ground tiles, thorn hazards, and route-reading assets first.

## Open items

- Concrete gap distances and curve angles for Zone 2 (the air-accel curving gaps). This is the most novel tech and worth nailing down numerically before building.
- Dash cooldown length, dash distance, and the fox's real stat values (all TBD)
- How the level is authored (Tiled map vs. code) once it outgrows the flat-ground prototype
