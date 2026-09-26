import Phaser from 'phaser';
import type { ParsedLevel } from '../levels/level';
import { hedgeCells, hedgePainter } from './hedgeArt';

// Placeholder art drawn in code until real hazard/den art exists (walls: hedgeArt.ts). Colour language
// for route reading: walls are mossy grey-green cobblestone (darker where they close in), soft
// brambles are purple tangles, hard thorns are red spikes, the true route is yellow flowers
// (daffodils from the flora art, see GameScene).

export const THICKET_TEXTURE = 'thicket';
// Frame index in the thicket tileset for the hazard characters. Hedges follow, one frame per
// hedge cell (see createThicketTexture).
export const THICKET_TILES: Record<string, number> = { '~': 0, X: 1 };
export const HEDGE_FIRST_FRAME = Object.keys(THICKET_TILES).length;
const THICKET_COLUMNS = 64;
export const DEN_TEXTURE = 'den';

const T = 16;

// Deterministic noise so the art is the same every load.
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

function px(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w = 1, h = 1) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function drawBramble(ctx: CanvasRenderingContext2D, ox: number) {
  const rand = rng(7);
  // Low tangle rooted on the bottom of the tile; stems cross the edges so neighbours join up.
  const stems = [
    [15, 7],
    [13, 11],
    [11, 14],
    [14, 9],
  ];
  for (const [base, top] of stems) {
    for (let x = 0; x < T; x++) {
      const y = Math.round(base - ((base - top) * (1 + Math.sin(x * 0.8 + base))) / 2);
      px(ctx, '#6b2a5a', ox + x, y);
      if (rand() < 0.35) px(ctx, '#e070b8', ox + x, y - 1); // thorn
    }
  }
  px(ctx, '#4a1a40', ox, 15, T, 1);
  for (let i = 0; i < 4; i++) px(ctx, '#3f6a36', ox + Math.floor(rand() * 15), 8 + Math.floor(rand() * 6), 2, 1);
}

function drawThorns(ctx: CanvasRenderingContext2D, ox: number) {
  // Sharp upward spikes, brighter and more regular than brambles so they read as lethal.
  px(ctx, '#4a0a14', ox, 12, T, 4);
  for (let s = 0; s < 4; s++) {
    const cx = ox + s * 4 + 2;
    for (let h = 0; h < 10; h++) {
      const half = Math.floor((10 - h) / 4);
      px(ctx, h > 6 ? '#ff5a4a' : '#b0182c', cx - half, 12 - h, half * 2 + 1, 1);
    }
    px(ctx, '#ffe0c0', cx, 2);
  }
}

function drawDen(scene: Phaser.Scene) {
  // Burrow mound with a dark entrance, 32x20.
  const tex = scene.textures.createCanvas(DEN_TEXTURE, 32, 20)!;
  const ctx = tex.getContext();
  const rows = [
    [10, 12],
    [6, 20],
    [4, 24],
    [2, 28],
    [1, 30],
    [0, 32],
  ];
  rows.forEach(([x, w], i) => px(ctx, '#6a4028', x, i * 2 + 8, w, 2));
  px(ctx, '#8a5a36', 10, 8, 12, 1);
  px(ctx, '#140c10', 11, 12, 10, 8);
  px(ctx, '#140c10', 13, 11, 6, 1);
  px(ctx, '#7cc15a', 3, 13, 3, 1);
  px(ctx, '#7cc15a', 26, 13, 3, 1);
  tex.refresh();
}

export function createPlaceholderArt(scene: Phaser.Scene) {
  drawDen(scene);
}

// Thicket tileset for a level: the hazard frames, then a unique frame per hedge cell.
// Returns each hedge cell's frame index, keyed "col,row".
export function createThicketTexture(scene: Phaser.Scene, level: ParsedLevel) {
  const cells = hedgeCells(level);
  const frames = new Map(cells.map(({ col, row }, i) => [`${col},${row}`, HEDGE_FIRST_FRAME + i]));
  // Same level every restart, so the texture is only painted once.
  if (scene.textures.exists(THICKET_TEXTURE)) return frames;

  const count = HEDGE_FIRST_FRAME + cells.length;
  const tex = scene.textures.createCanvas(
    THICKET_TEXTURE,
    T * THICKET_COLUMNS,
    T * Math.ceil(count / THICKET_COLUMNS),
  )!;
  const ctx = tex.getContext();
  const origin = (frame: number) => [(frame % THICKET_COLUMNS) * T, Math.floor(frame / THICKET_COLUMNS) * T];
  drawBramble(ctx, THICKET_TILES['~'] * T); // hazard frames sit in the first row
  drawThorns(ctx, THICKET_TILES.X * T);

  const painter = hedgePainter(level);
  cells.forEach(({ col, row }, i) => {
    const [ox, oy] = origin(HEDGE_FIRST_FRAME + i);
    for (let y = 0; y < T; y++) {
      for (let x = 0; x < T; x++) {
        const color = painter.pixel(col, row, x, y);
        if (color) px(ctx, color, ox + x, oy + y);
      }
    }
  });
  tex.refresh();
  return frames;
}
