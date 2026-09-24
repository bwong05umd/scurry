# Fox Stage: Bramble Hollow

**Theme:** Dense, maze-like forest thicket. Narrow gaps, crisscrossing trails, hedges. It should feel like threading a needle at speed.

**Structure:** One continuous level, no checkpoints. Progress is measured 0-100% for leaderboard splits. Early zones are forgiving (a bad turn costs speed, not the run). Only the finale is genuinely unforgiving.

**Core tension:** Repeated decision moments, such as "spend my dash now to clear this gap, or save it for the tighter section ahead?"

## Fox kit (target)

- Dash on a cooldown; low ground traction
- Low max air speed, high air acceleration
- Universal Scurry air dodge
- No wall-kick, no vertical climbing tech

## Prototype numbers (current, placeholder)

From `src/config.ts`, so gap sizes can be sanity-checked. The screen is 320x192 px, which is 20x12 tiles at 16 px per tile. These were approved as placeholders for the greybox; retune after playtesting.

| Value | Prototype | Notes |
|-------|-----------|-------|
| Walk / run max speed | 60 / 110 px/s | Smash-style: a fresh press walks, holding a direction 0.3 s breaks into a sprint, double-tapping it (within 0.2 s) sprints at once |
| Ground acceleration | 600 px/s² | ~0.2 s to run speed |
| Ground traction | 250 px/s² | Low: slides ~24 px stopping from a run; slow to turn around |
| Air acceleration | 700 px/s² | High: can fully reverse in ~0.26 s |
| Max air speed | 90 px/s | Low; faster takeoffs bleed down at 300 px/s² (`airDrag`) |
| Jump velocity / gravity | -230 / 600 | ~44 px (2.75 tiles) apex |
| Max fall speed | 300 px/s | |
| Dash | 250 px/s for 0.16 s (~40 px) | Snaps to the held direction, gravity paused, exits at 110 px/s, usable in the air |
| Dash cooldown | 1.0 s | From the start of the dash |
| Scurry (all animals) | 180 px/s for 0.2 s (~36 px) | Air only, once per jump, 8-way (neutral = hover), exits at half speed |
| Bramble slow | 0.5x max speed | Dash ignores it |

Rough reach on flat ground: running jump ~4.3 tiles, jump + dash ~7 tiles, jump + Scurry ~6 tiles.

## Zones

| # | Zone | Range | What it teaches |
|---|------|-------|-----------------|
| 1 | Opening snap-turn stretch (earlier working name: The Warren Split) | 0-20% | Dash is for redirecting, not just speed. Diverging hedge-gaps too tight to run through at top speed force a dash into a snap-turn. No cooldown pressure yet. |
| 2 | Thorn Corridor | 20-40% | Air-acceleration curving. Gaps that can't be cleared by a straight jump; the player must bend the arc around a hedge corner. Low max air speed means steering, not rocketing. |
| 3 | The Split | 40-60% | Route choice. Low path is flat, safe, slow, no dash needed. High path is a chain of tight curved-air gaps (2-3 steered jumps plus one well-timed dash), no vertical climbing. Paths rejoin, so a botched high route drops the player to the low path instead of failing the run. |
| 4 | False Trails | 60-80% | Route knowledge. Visually similar branch points with one true route; wrong branches loop back a few seconds behind rather than dead-ending. No movement tech, a breather between demanding sections. |
| 5 | The Gauntlet | 80-100% | Finale combining everything: dash, then a cooldown gap (forces a Scurry or an air-accel curve), then dash again. Hedges visually close in. The only truly unforgiving section. |

**Build (greybox):** `src/levels/brambleHollow.ts`, authored as ASCII (legend in `src/levels/level.ts`). Five zones of 80x12 tiles, 6400 px total (20 screens), aiming for a ~60 s clean run. `npm run check-level` confirms plain movement clears zones 1-4 (early zones never need the kit), dash alone stalls at the Gauntlet's thorn clump, and the full kit reaches the finish.

| # | How the greybox builds it |
|---|---------------------------|
| 1 | Start on a hill, then a three-tier zigzag: drop holes land you moving the wrong way, with a bramble dead-end pocket to punish overshoot. Dash (or an air reversal) snaps you back. Then an open run-out that introduces bramble pits. |
| 2 | Hooks: arc over a low hedge and pull back into a pocket behind it, with a hanging hedge over the overshoot. A slalom of posts over a bramble pit. |
| 3 | Low path: flat, under a canopy, three bramble patches. High path: platforms at row 5 (too high to reach from below) with a 6-tile gap for the dash and hedge clumps to arc over. Falling from the high path lands on the low path. |
| 4 | Three twin-lane branch modules. The true lane is marked with yellow flowers; the wrong lane is a bramble crawl that rejoins at the end of the module. |
| 5 | Dark hedges (`K`) lower from the top. Thorn pits (hard hazard, restart run): 6 wide (dash), 5 wide right after (dash cooling: Scurry), 6 wide (dash again), a thorn clump over a gap, then the finish den. |

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
- ~~How the level is authored~~: decided, ASCII maps in TypeScript
- Variable jump height (release early for a short hop). Not in the kit; without it, hanging-hedge "duck under" puzzles aren't possible, so Zone 2 uses over-and-back hooks instead
- Cooldown pressure isn't verified by `check-level` (it ignores the cooldown), so the Gauntlet's dash, Scurry, dash rhythm needs a hand playtest
