import Phaser from 'phaser';
import { floraAtlas } from '../assets';
import { charAt, DECOR_CHARS, type ParsedLevel, TILE_SIZE } from '../levels/level';

// Wildflowers scattered over each zone's open ground, from the zone's flora palette.
// Purely decorative: they sit behind the player (in front of trees) and never collide.

// Cells a plant stands on: terrain and the tops of stone walls.
const GROUND = new Set(['#', '=', 'H', 'K']);
// Plants keep a cell clear of these so hazards, route markers and dens stay readable.
const KEEP_CLEAR = new Set(['~', 'X', '*', '@', 'F', ...Object.keys(DECOR_CHARS)]);
const MIN_GAP = 2; // columns between plants on the same row
const ROOT_DEPTH = 1; // px a plant sinks behind the grass edge so it looks rooted
// Plants are background dressing: most are half size, tinted toward the backdrop's
// blue-green and partly transparent so they blend in rather than compete with the route
// markers. A few accents are larger and brighter so the ground doesn't look flat, but still
// smaller than the full-size daffodil markers.
const TIERS = [
  { chance: 0.7, scale: 0.5, tint: 0x9fb4b0, alpha: 0.75 },
  { chance: 0.3, scale: 0.75, tint: 0xd4e0d8, alpha: 0.95 },
];

// Deterministic noise so the stage looks the same every run.
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

function isFreeGround(level: ParsedLevel, col: number, row: number) {
  if (charAt(level, col, row) !== '.' || row + 1 >= level.rows || !GROUND.has(charAt(level, col, row + 1))) {
    return false;
  }
  for (let r = row; r <= row + 1; r++) {
    for (let c = col - 1; c <= col + 1; c++) if (KEEP_CLEAR.has(charAt(level, c, r))) return false;
  }
  return true;
}

export function createFlora(scene: Phaser.Scene, level: ParsedLevel) {
  level.zones.forEach((zone, i) => {
    if (!zone.flora) return;
    const { plants, density } = zone.flora;
    for (const plant of plants) {
      if (!floraAtlas.has(plant)) throw new Error(`${zone.name}: unknown flora frame '${plant}'`);
    }
    const rand = rng(i + 1);
    const lastCol = new Map<number, number>(); // row -> column of the last plant
    for (let col = zone.startCol; col < zone.endCol; col++) {
      for (let row = 0; row < level.rows; row++) {
        if (!isFreeGround(level, col, row) || col - (lastCol.get(row) ?? -Infinity) < MIN_GAP) continue;
        if (rand() >= density) continue;
        const frame = plants[Math.floor(rand() * plants.length)];
        const x = col * TILE_SIZE + TILE_SIZE / 2 + Math.round((rand() - 0.5) * 6);
        const tier = rand() < TIERS[0].chance ? TIERS[0] : TIERS[1];
        scene.add
          .image(x, (row + 1) * TILE_SIZE + ROOT_DEPTH, floraAtlas.get(frame)!, frame)
          .setOrigin(0.5, 1)
          .setFlipX(rand() < 0.5)
          .setScale(tier.scale)
          .setTint(tier.tint)
          .setAlpha(tier.alpha)
          .setDepth(-1);
        lastCol.set(row, col);
      }
    }
  });
}
