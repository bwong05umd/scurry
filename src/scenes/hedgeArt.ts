import { charAt, isSolid, type ParsedLevel, TILE_SIZE } from '../levels/level';

// Walls (H, K) drawn per level rather than as one repeated tile: every wall cell gets its
// own 16x16 frame, painted from a world-space cobblestone pattern so stones flow across cell
// edges. Colours come from the flora pack's stone_wall and mossy_stone_wall sprites: grey-green
// stones lit from the top-left, dark mortar, and a moss cap draped over open tops. Walls darken
// the deeper you go into a mass so big walls read as volume instead of wallpaper.
// No Phaser here, so the art can be rendered and checked outside the game.

const T = TILE_SIZE;
const HEDGE_CHARS = new Set(['H', 'K']);

// Stone: highlight, face, shade, deep shade, mortar. K ("closing in") is darker and mossier.
const STONE: Record<string, string[]> = {
  H: ['#6d8577', '#566b5f', '#47584e', '#3d4b43', '#232b29'],
  K: ['#4d5f55', '#3f4f46', '#34423b', '#2b3731', '#161c1b'],
};
// Moss, light to dark, plus the pale flower specks from mossy_stone_wall.
const MOSS: Record<string, string[]> = {
  H: ['#52913b', '#447731', '#365f27', '#28471d'],
  K: ['#3f7632', '#34622b', '#2a4f23', '#1f3a1a'],
};
const MOSS_SPECK = '#bcc58e';
const MOSSY_STONES: Record<string, number> = { H: 0.12, K: 0.3 }; // share of stones with a moss patch
const OUTLINE = '#1a1c24';

const CLUMP = 7; // cobblestone spacing in px

function hash(x: number, y: number, seed = 0) {
  let h = (x * 374761393 + y * 668265263 + seed * 2246822519) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 2 ** 32;
}

// Nearest and second-nearest stone centres around a world pixel (jittered grid). `gx,gy` is
// the nearest stone's grid cell, used to give each stone its own tone.
function clumpAt(wx: number, wy: number) {
  const gx0 = Math.floor(wx / CLUMP);
  const gy0 = Math.floor(wy / CLUMP);
  let d1 = Infinity;
  let d2 = Infinity;
  let dx = 0;
  let dy = 0;
  let gx = 0;
  let gy = 0;
  for (let j = -1; j <= 1; j++) {
    for (let i = -1; i <= 1; i++) {
      const cx = (gx0 + i) * CLUMP + (0.15 + hash(gx0 + i, gy0 + j, 1) * 0.7) * CLUMP;
      const cy = (gy0 + j) * CLUMP + (0.15 + hash(gx0 + i, gy0 + j, 2) * 0.7) * CLUMP;
      // Stretch horizontally a little so stones lie flat like a laid wall.
      const d = Math.hypot((wx + 0.5 - cx) * 0.8, wy + 0.5 - cy);
      if (d < d1) {
        d2 = d1;
        d1 = d;
        dx = wx + 0.5 - cx;
        dy = wy + 0.5 - cy;
        gx = gx0 + i;
        gy = gy0 + j;
      } else if (d < d2) d2 = d;
    }
  }
  return { d1, d2, dx, dy, gx, gy };
}

// Edge bumps along an open side, one per stone: 0 at a stone's crown, `depth` at the joints.
function scallop(t: number, depth: number, seed: number) {
  const seg = Math.floor(t / CLUMP);
  const u = (t - seg * CLUMP + 0.5) / CLUMP; // 0..1 across the bump
  const bump = Math.abs(u - 0.5) * 2; // 1 at the joints, 0 at the crown
  const jitter = hash(seg, seed, 3) < 0.25 ? 1 : 0;
  return Math.round(bump * bump * bump * depth) + jitter;
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
    const top = isOpen(col, row - 1) ? ly - scallop(wx, 2, 1) : 99;
    const bottom = isOpen(col, row + 1) ? T - 1 - ly - scallop(wx, 2, 2) : 99;
    const left = isOpen(col - 1, row) ? lx - scallop(wy, 2, 3) : 99;
    const right = isOpen(col + 1, row) ? T - 1 - lx - scallop(wy, 2, 4) : 99;
    if (Math.min(top, bottom, left, right) < 0) return false;
    // Round off outer corners.
    const v = Math.min(top, bottom);
    const h = Math.min(left, right);
    return v + h >= 2;
  };

  return {
    pixel(col, row, lx, ly) {
      const wx = col * T + lx;
      const wy = row * T + ly;
      if (!inside(wx, wy)) return null;
      const ch = charAt(level, col, row);
      const stone = STONE[ch];
      const moss = MOSS[ch];
      if (!inside(wx - 1, wy) || !inside(wx + 1, wy) || !inside(wx, wy + 1) || !inside(wx, wy - 1)) {
        return OUTLINE;
      }

      // Moss cap draped over open tops, with the odd longer drip down a joint.
      let fromTop = 0;
      while (fromTop < 10 && inside(wx, wy - fromTop - 1)) fromTop++;
      // fromTop starts at 1: the outline is the top row.
      const cap = 4 + Math.floor(hash(Math.floor(wx / 3), 0, 8) * 3) + (hash(wx, 0, 9) < 0.12 ? 3 : 0);
      if (fromTop < cap) {
        if (fromTop === 1) return hash(wx, wy, 5) < 0.6 ? moss[0] : moss[1];
        if (fromTop === cap - 1) return moss[3];
        if (hash(wx, wy, 10) < 0.04) return MOSS_SPECK;
        return moss[hash(wx, wy, 11) < 0.7 ? 1 : 2];
      }

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
      const shift = Math.max(0, Math.min(2, Math.floor((d - 1) * 0.7 + hash(wx, wy, 6) * 0.6)));

      const { d1, d2, dx, dy, gx, gy } = clumpAt(wx, wy);
      if (d2 - d1 < 1.1) return stone[4]; // mortar
      const s = (dy * 0.8 + dx * 0.4) / (CLUMP * 0.5); // -1 lit top-left .. +1 shaded bottom-right
      // Mossy stones carry a patch on their upper half.
      if (hash(gx, gy, 12) < MOSSY_STONES[ch] && dy < 0.5) {
        return s < -0.4 ? moss[1] : hash(wx, wy, 13) < 0.05 ? MOSS_SPECK : moss[2];
      }
      // Each stone has its own base tone; a lit rim sits along its top-left, a shade bottom-right.
      const base = 1 + (hash(gx, gy, 14) < 0.3 ? 1 : 0);
      let tone = s < -0.55 ? base - 1 : s > 0.55 ? base + 1 : base;
      if (tone === 0 && hash(wx, wy, 7) < 0.3) tone = 1;
      if (tone === base && hash(wx, wy, 15) < 0.06) tone = Math.min(3, base + 1); // pitting
      return stone[Math.min(3, tone + shift)];
    },
  };
}

// Every wall cell in the level, in frame order.
export function hedgeCells(level: ParsedLevel) {
  const cells: { col: number; row: number }[] = [];
  level.grid.forEach((line, row) => line.forEach((ch, col) => HEDGE_CHARS.has(ch) && cells.push({ col, row })));
  return cells;
}
