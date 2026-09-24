import { charAt, isSolid, type ParsedLevel, TILE_SIZE } from '../levels/level';

// Hedge walls drawn per level rather than as one repeated tile: every hedge cell gets its
// own 16x16 frame, painted from a world-space leaf pattern so clumps flow across cell edges.
// Open edges are scalloped and outlined, lit from the top-left, and hedges darken the
// deeper you go into a mass so big walls read as volume instead of wallpaper.
// No Phaser here, so the art can be rendered and checked outside the game.

const T = TILE_SIZE;
const HEDGE_CHARS = new Set(['H', 'K']);

// Light to dark, then the outline. H uses the art pack's foliage greens (Decors/Tileset);
// K ("closing in") is the same ramp pushed dark and desaturated.
const RAMPS: Record<string, string[]> = {
  H: ['#cced4b', '#69c71d', '#1d864f', '#154645', '#0f2c33'],
  K: ['#4f8a4a', '#2e6444', '#1d4a3c', '#133434', '#0b2026'],
};
const OUTLINE = '#201932';

const CLUMP = 8; // leaf clump spacing in px

function hash(x: number, y: number, seed = 0) {
  let h = (x * 374761393 + y * 668265263 + seed * 2246822519) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 2 ** 32;
}

// Nearest and second-nearest leaf-clump centres around a world pixel (jittered grid).
function clumpAt(wx: number, wy: number) {
  const gx = Math.floor(wx / CLUMP);
  const gy = Math.floor(wy / CLUMP);
  let d1 = Infinity;
  let d2 = Infinity;
  let dx = 0;
  let dy = 0;
  for (let j = -1; j <= 1; j++) {
    for (let i = -1; i <= 1; i++) {
      const cx = (gx + i) * CLUMP + hash(gx + i, gy + j, 1) * CLUMP;
      const cy = (gy + j) * CLUMP + hash(gx + i, gy + j, 2) * CLUMP;
      const d = Math.hypot(wx + 0.5 - cx, wy + 0.5 - cy);
      if (d < d1) {
        d2 = d1;
        d1 = d;
        dx = wx + 0.5 - cx;
        dy = wy + 0.5 - cy;
      } else if (d < d2) d2 = d;
    }
  }
  return { d1, d2, dx, dy };
}

// Scallop depth along an open edge: bumps of CLUMP px, 0 at the crown, `depth` in the notch.
function scallop(t: number, depth: number, seed: number) {
  const seg = Math.floor(t / CLUMP);
  const u = (t - seg * CLUMP + 0.5) / CLUMP; // 0..1 across the bump
  const bump = Math.abs(u - 0.5) * 2; // 1 at the notches, 0 at the crown
  const jitter = hash(seg, seed, 3) < 0.25 ? 1 : 0;
  return Math.round(bump * bump * depth) + jitter;
}

export interface HedgePainter {
  // Colour of a world pixel inside hedge cell (col,row), or null where it is carved away.
  pixel(col: number, row: number, lx: number, ly: number): string | null;
}

export function hedgePainter(level: ParsedLevel): HedgePainter {
  const isHedge = (col: number, row: number) => HEDGE_CHARS.has(charAt(level, col, row));
  // Edges against air, brambles, decor etc. are open; ground, stone and the level bounds are
  // closed so hedges sit flush on them.
  const isOpen = (col: number, row: number) =>
    !isHedge(col, row) && !isSolid(level, col, row) && row >= 0 && col >= 0 && col < level.cols;

  // Distance in cells from each hedge cell to open space, for depth shading.
  const depth: number[][] = level.grid.map((line, row) => line.map((_, col) => (isHedge(col, row) ? 99 : 0)));
  for (let pass = 0; pass < 4; pass++) {
    for (let row = 0; row < level.rows; row++) {
      for (let col = 0; col < level.cols; col++) {
        if (!isHedge(col, row)) continue;
        let best = depth[row][col];
        for (const [c, r] of [
          [col - 1, row],
          [col + 1, row],
          [col, row - 1],
          [col, row + 1],
        ]) {
          const d = isOpen(c, r) ? 0 : isHedge(c, r) ? depth[r][c] : 99;
          best = Math.min(best, d + 1);
        }
        depth[row][col] = best;
      }
    }
  }
  const depthAt = (col: number, row: number) =>
    isHedge(col, row) ? Math.min(depth[row][col], 4) : isOpen(col, row) ? 0 : 1;

  // Is world pixel (wx,wy) part of the hedge silhouette?
  const inside = (wx: number, wy: number): boolean => {
    const col = Math.floor(wx / T);
    const row = Math.floor(wy / T);
    if (!isHedge(col, row)) return !isOpen(col, row);
    const lx = wx - col * T;
    const ly = wy - row * T;
    const top = isOpen(col, row - 1) ? ly - scallop(wx, 3, 1) : 99;
    const bottom = isOpen(col, row + 1) ? T - 1 - ly - scallop(wx, 2, 2) : 99;
    const left = isOpen(col - 1, row) ? lx - scallop(wy, 3, 3) : 99;
    const right = isOpen(col + 1, row) ? T - 1 - lx - scallop(wy, 3, 4) : 99;
    if (Math.min(top, bottom, left, right) < 0) return false;
    // Round off outer corners.
    const v = Math.min(top, bottom);
    const h = Math.min(left, right);
    return v + h >= 3;
  };

  return {
    pixel(col, row, lx, ly) {
      const wx = col * T + lx;
      const wy = row * T + ly;
      if (!inside(wx, wy)) return null;
      const ramp = RAMPS[charAt(level, col, row)];
      if (!inside(wx - 1, wy) || !inside(wx + 1, wy) || !inside(wx, wy + 1) || !inside(wx, wy - 1)) {
        return OUTLINE;
      }
      // Lime rim just under a top outline, like the grass tops in the tileset.
      if (!inside(wx, wy - 2)) return hash(wx, wy, 5) < 0.6 ? ramp[0] : ramp[1];

      // Smooth cell depth (bilinear between cell centres) plus a little dither.
      const fx = (wx + 0.5) / T - 0.5;
      const fy = (wy + 0.5) / T - 0.5;
      const c0 = Math.floor(fx);
      const r0 = Math.floor(fy);
      const tx = fx - c0;
      const ty = fy - r0;
      const d =
        depthAt(c0, r0) * (1 - tx) * (1 - ty) +
        depthAt(c0 + 1, r0) * tx * (1 - ty) +
        depthAt(c0, r0 + 1) * (1 - tx) * ty +
        depthAt(c0 + 1, r0 + 1) * tx * ty;
      const shift = Math.max(0, Math.min(2, Math.floor((d - 1) * 0.8 + hash(wx, wy, 6) * 0.6)));

      const { d1, d2, dx, dy } = clumpAt(wx, wy);
      if (d2 - d1 < 1) return ramp[Math.min(4, 3 + (shift > 0 ? 1 : 0))]; // crevice between clumps
      const s = (dy * 0.8 + dx * 0.4) / (CLUMP * 0.55); // -1 lit top-left .. +1 shaded bottom-right
      let tone = s < -0.55 ? 0 : s < 0.05 ? 1 : s < 0.6 ? 2 : 3;
      if (tone === 0 && hash(wx, wy, 7) < 0.5) tone = 1; // keep the brightest green to specks
      return ramp[Math.min(4, tone + shift)];
    },
  };
}

// Every hedge cell in the level, in frame order.
export function hedgeCells(level: ParsedLevel) {
  const cells: { col: number; row: number }[] = [];
  level.grid.forEach((line, row) => line.forEach((ch, col) => HEDGE_CHARS.has(ch) && cells.push({ col, row })));
  return cells;
}
