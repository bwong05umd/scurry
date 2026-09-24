# Scurry

A 2D pixel-art speedrun platformer about hunted animals racing to the end of their stage. Each animal (fox, hare, boar, black grouse, deer) has its own movement physics and its own level. Built with Phaser 3, TypeScript, and Vite.

**Status:** early prototype. The fox can walk, run, and jump on flat ground with a parallax forest background. Dash, the Scurry air dodge, and the first real stage (Bramble Hollow) are still to come.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

Other scripts: `npm run typecheck`, `npm run build`, `npm run preview`.

## Controls

| Key | Action |
|-----|--------|
| A / D | Move |
| W or Space | Jump |
| Shift (hold) | Run |

## Project structure

```
assets/            Art, served as the web root. assets/assets.json indexes it
src/scenes/        BootScene (loading) and GameScene (level, input, camera)
src/entities/      Player.ts (fox movement and animation)
src/config.ts      Tunable constants
docs/design/       Game design docs
CLAUDE.md          Project context for Claude Code
```

## Design

The design pillars and the fox stage plan live in [`CLAUDE.md`](CLAUDE.md) and [`docs/design/fox-bramble-hollow.md`](docs/design/fox-bramble-hollow.md).

## Assets and licensing

- Animal sprites: CraftPix pack, used under the [CraftPix license](https://craftpix.net/file-licenses/). The art is not licensed for redistribution or reuse outside this game.
- Stage art: TODO, credit the source and license.
- Code license: TODO.
