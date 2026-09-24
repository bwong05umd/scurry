# Scurry

2D side-scrolling pixel-art platformer built with Phaser 3 + TypeScript + Vite. The target look is `assets/stage/mockup.png`.

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
