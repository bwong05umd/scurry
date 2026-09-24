# Scurry

A 2D pixel-art speedrun platformer about hunted animals racing to the end of their stage. Each animal (fox, hare, boar, black grouse, deer) has its own movement physics and its own level. Built with Phaser 3, TypeScript, and Vite.

**Status:** early prototype. The fox has acceleration-based movement, a dash on a cooldown, and the Scurry air dodge, and its stage, Bramble Hollow, is playable end to end as a greybox with placeholder hazard art, a run timer, zone splits and a best time.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

Other scripts: `npm run typecheck`, `npm run build`, `npm run preview`, and `npm run check-level` (simulates the fox's movement to check that Bramble Hollow can still be finished after level edits; takes a few minutes).

## Controls

| Key | Action |
|-----|--------|
| A / D | Move |
| W or Space | Jump |
| A / D (hold, or double-tap) | Sprint |
| J | Dash (cooldown shown top right) |
| K | Scurry: air dodge, aimed with WASD, once per jump |
| R | Restart the run |

## Project structure

```
assets/            Art, served as the web root. assets/assets.json indexes it
src/scenes/        BootScene (loading) and GameScene (level, input, camera)
src/entities/      Player.ts (sprite, animation), movement.ts (movement, dash, Scurry; no Phaser)
src/levels/        ASCII level format (level.ts) and the Bramble Hollow stage
src/config.ts      Tunable constants
scripts/           check-level.ts: completability check for the stage
docs/design/       Game design docs
CLAUDE.md          Project context for Claude Code
```

## Design

The design pillars and the fox stage plan live in [`CLAUDE.md`](CLAUDE.md) and [`docs/design/fox-bramble-hollow.md`](docs/design/fox-bramble-hollow.md).

## Assets and licensing

- Animal sprites: CraftPix pack, used under the [CraftPix license](https://craftpix.net/file-licenses/). The art is not licensed for redistribution or reuse outside this game.
- Stage art: TODO, credit the source and license.
- Code license: TODO.
