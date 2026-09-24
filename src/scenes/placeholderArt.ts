import Phaser from 'phaser';

// Placeholder art drawn at boot, until real hedge/hazard/den art exists. Colour language
// for route reading: hedges are green (dark and desaturated where they close in), soft
// brambles are purple tangles, hard thorns are red spikes, the true route is yellow flowers.

export const THICKET_TEXTURE = 'thicket';
// Frame index in the thicket tileset for each level character.
export const THICKET_TILES: Record<string, number> = { H: 0, K: 1, '~': 2, X: 3 };
export const DEN_TEXTURE = 'den';
export const FLOWER_TEXTURE = 'flower';

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

function drawHedge(ctx: CanvasRenderingContext2D, ox: number, colors: string[], seed: number) {
  const [base, mid, light, dark] = colors;
  const rand = rng(seed);
  px(ctx, base, ox, 0, T, T);
  // Leaf clusters: small blobs with a lit top-left pixel.
  for (let i = 0; i < 14; i++) {
    const x = Math.floor(rand() * 14);
    const y = Math.floor(rand() * 14);
    px(ctx, mid, ox + x, y, 3, 2);
    px(ctx, mid, ox + x + 1, y + 2);
    px(ctx, light, ox + x, y);
  }
  for (let i = 0; i < 10; i++) px(ctx, dark, ox + Math.floor(rand() * T), Math.floor(rand() * T));
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

function drawFlower(scene: Phaser.Scene) {
  const tex = scene.textures.createCanvas(FLOWER_TEXTURE, 8, 6)!;
  const ctx = tex.getContext();
  px(ctx, '#3f8a3a', 1, 3, 1, 3);
  px(ctx, '#3f8a3a', 5, 2, 1, 4);
  px(ctx, '#f5d442', 0, 2, 3, 1);
  px(ctx, '#f5d442', 1, 1);
  px(ctx, '#fff3a0', 1, 2);
  px(ctx, '#f5d442', 4, 1, 3, 1);
  px(ctx, '#f5d442', 5, 0);
  px(ctx, '#fff3a0', 5, 1);
  tex.refresh();
}

export function createPlaceholderArt(scene: Phaser.Scene) {
  const tiles = Object.keys(THICKET_TILES).length;
  const tex = scene.textures.createCanvas(THICKET_TEXTURE, T * tiles, T)!;
  const ctx = tex.getContext();
  drawHedge(ctx, THICKET_TILES.H * T, ['#2c5a2c', '#3f7a38', '#7cc15a', '#1a3a1e'], 1);
  drawHedge(ctx, THICKET_TILES.K * T, ['#172a22', '#233c2c', '#3c5a3c', '#0c1812'], 2);
  drawBramble(ctx, THICKET_TILES['~'] * T);
  drawThorns(ctx, THICKET_TILES.X * T);
  tex.refresh();

  drawDen(scene);
  drawFlower(scene);
}
