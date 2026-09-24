// Checks that Bramble Hollow can be completed, using the game's real movement code.
//
// Searches over standing positions from the spawn. From each one it simulates a set of
// scripted moves (run-up, jump or walk off, air steering, optional dash or Scurry) at 60fps
// against the tile grid, and records where the fox lands and comes to a stop. It runs three
// times: plain movement only, plus dash, plus dash and Scurry, and reports how far each
// gets. It's conservative: dash cooldown is ignored, and the fox must stop between moves.
//
// Run: npm run check-level            (all three kits)
//      npm run check-level -- plain   (just one: plain, dash or full)

import { PLAYER } from '../src/config';
import { applyGravity, createMoveState, type Dir, type MoveInput, stepMovement } from '../src/entities/movement';
import { charAt, isSolid, parseStage, TILE_SIZE } from '../src/levels/level';
import { brambleHollow } from '../src/levels/brambleHollow';

const DT = 1 / 60;
const W = PLAYER.body.width;
const H = PLAYER.body.height;
const level = parseStage(brambleHollow);
const worldW = level.cols * TILE_SIZE;

interface Body {
  x: number; // left
  y: number; // top
}

// Precomputed lookups; the search calls these millions of times.
const solidGrid = new Uint8Array((level.cols + 2) * (level.rows + 2));
const cellIndex = (c: number, r: number) => (r + 1) * (level.cols + 2) + (c + 1);
for (let r = -1; r <= level.rows; r++) {
  for (let c = -1; c <= level.cols; c++) solidGrid[cellIndex(c, r)] = isSolid(level, c, r) ? 1 : 0;
}
function solidCell(c: number, r: number) {
  if (r < -1) return false;
  if (c < -1 || c > level.cols || r > level.rows) return true;
  return solidGrid[cellIndex(c, r)] === 1;
}

function solidAt(px: number, py: number) {
  return solidCell(Math.floor(px / TILE_SIZE), Math.floor(py / TILE_SIZE));
}

function overlapsSolid(b: Body) {
  const c0 = Math.floor(b.x / TILE_SIZE);
  const c1 = Math.floor((b.x + W - 0.001) / TILE_SIZE);
  const r0 = Math.floor(b.y / TILE_SIZE);
  const r1 = Math.floor((b.y + H - 0.001) / TILE_SIZE);
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (solidCell(c, r)) return true;
  return false;
}

function touches(b: Body, ch: string) {
  const c0 = Math.floor(b.x / TILE_SIZE);
  const c1 = Math.floor((b.x + W - 0.001) / TILE_SIZE);
  const r0 = Math.floor(b.y / TILE_SIZE);
  const r1 = Math.floor((b.y + H - 0.001) / TILE_SIZE);
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (charAt(level, c, r) === ch) return true;
  return false;
}

function onGround(b: Body) {
  return solidAt(b.x + 0.5, b.y + H + 0.5) || solidAt(b.x + W - 0.5, b.y + H + 0.5);
}

// Moves one axis in 1px steps so thin one-tile platforms and walls can't be tunneled through.
function moveAxis(b: Body, axis: 'x' | 'y', delta: number): boolean {
  const step = Math.sign(delta);
  let remaining = Math.abs(delta);
  while (remaining > 0) {
    const d = Math.min(1, remaining) * step;
    b[axis] += d;
    if (overlapsSolid(b) || b.x < 0 || b.x + W > worldW) {
      b[axis] -= d;
      return true;
    }
    remaining -= 1;
  }
  return false;
}

interface Move {
  runFrames: number; // hold dir on the ground before jumping
  dir: Dir;
  jump: boolean; // false = walk off an edge
  airDir: (frame: number) => Dir; // frame counts from takeoff
  dashAt: number; // frame after takeoff, -1 for none
  dashDir: Dir;
  scurryAt: number;
  scurryInput: { dir: Dir; up: boolean; down: boolean };
}

type Kit = 'plain' | 'dash' | 'full';

function buildMoves(kit: Kit): Move[] {
  const moves: Move[] = [];
  for (const dir of [-1, 1] as Dir[]) {
    for (const runFrames of [0, 6, 14, 30]) {
      for (const jump of [true, false]) {
        const airDirs: ((f: number) => Dir)[] = [
          () => dir,
          (f) => (f < 14 ? dir : 0),
          (f) => (f < 12 ? dir : (-dir as Dir)),
          (f) => (f < 24 ? dir : (-dir as Dir)),
          () => 0,
        ];
        for (const airDir of airDirs) {
          const base: Move = {
            runFrames,
            dir,
            jump,
            airDir,
            dashAt: -1,
            dashDir: dir,
            scurryAt: -1,
            scurryInput: { dir: 0, up: false, down: false },
          };
          moves.push(base);
          if (kit === 'plain') continue;
          for (const dashAt of [0, 12, 22]) {
            moves.push({ ...base, dashAt, dashDir: dir });
            moves.push({ ...base, dashAt, dashDir: -dir as Dir });
          }
          if (kit !== 'full') continue;
          const scurryDirs = [
            { dir, up: false, down: false },
            { dir: -dir as Dir, up: false, down: false },
            { dir: 0 as Dir, up: true, down: false },
            { dir, up: true, down: false },
            { dir: -dir as Dir, up: true, down: false },
            { dir, up: false, down: true },
          ];
          for (const scurryAt of [10, 22]) {
            for (const scurryInput of scurryDirs) {
              moves.push({ ...base, scurryAt, scurryInput });
              moves.push({ ...base, scurryAt, scurryInput, dashAt: 36, dashDir: dir });
            }
          }
        }
      }
    }
  }
  return moves;
}

// Jump is always held, so every simulated jump is a full-height one.
const idle: MoveInput = { dir: 0, up: false, down: false, jump: false, jumpHeld: true, dash: false, scurry: false };

// Simulates one move from a standing spot. Returns the spot where the fox comes to rest,
// or null if it dies, times out, or never leaves the ground.
function simulate(startX: number, startY: number, move: Move): Body | null {
  const b: Body = { x: startX, y: startY };
  const s = createMoveState();
  // Start as if the run-up direction was double-tapped, so it sprints from the first frame.
  s.tapDir = move.dir;
  s.tapAge = 0;
  let takeoff = -1;
  let tookOff = false;
  for (let frame = 0; frame < 60 * 4; frame++) {
    const grounded = onGround(b);
    if (!grounded && !tookOff) {
      tookOff = true;
      takeoff = frame;
    }
    const f = tookOff ? frame - takeoff : -1;
    const input: MoveInput = { ...idle };
    if (!tookOff) {
      input.dir = move.dir;
      if (frame >= move.runFrames && move.jump) input.jump = true;
      if (move.dashAt === 0 && frame === move.runFrames) {
        input.dash = true;
        input.dir = move.dashDir;
      }
    } else if (grounded) {
      // Landed: brake to a stop.
      if (Math.abs(s.vx) < 0.01 && s.dashTime === 0) return b;
      input.dir = s.vx > 0 ? -1 : 1;
    } else {
      input.dir = move.airDir(f);
      if (move.dashAt > 0 && f === move.dashAt) {
        input.dash = true;
        input.dir = move.dashDir;
      }
      if (f === move.scurryAt) {
        input.scurry = true;
        input.dir = move.scurryInput.dir;
        input.up = move.scurryInput.up;
        input.down = move.scurryInput.down;
      }
    }
    if (!tookOff && frame > move.runFrames + 90) return null; // walked into a wall forever

    const gravity = stepMovement(s, input, { onGround: grounded, slowed: touches(b, '~') }, DT);
    applyGravity(s, gravity, DT);
    if (moveAxis(b, 'x', s.vx * DT)) s.vx = 0;
    if (moveAxis(b, 'y', s.vy * DT)) s.vy = 0;
    if (touches(b, 'X')) return null;
  }
  return null;
}

// Standing spots are quantized to 4px so the search stays small.
const key = (b: Body) => `${Math.round(b.x / 4)},${Math.round(b.y)}`;

function search(kit: Kit) {
  const moves = buildMoves(kit);
  const spawnX = level.spawn.col * TILE_SIZE;
  let spawnY = level.spawn.row * TILE_SIZE + TILE_SIZE - H;
  while (!onGround({ x: spawnX, y: spawnY })) spawnY += 1;
  const start: Body = { x: spawnX, y: spawnY };
  const seen = new Map<string, Body>([[key(start), start]]);
  const queue = [start];
  let maxX = start.x;
  const finish = level.finish.col * TILE_SIZE;
  let finished = false;
  while (queue.length) {
    const from = queue.shift()!;
    for (const move of moves) {
      const to = simulate(from.x, from.y, move);
      if (!to) continue;
      const k = key(to);
      if (seen.has(k)) continue;
      seen.set(k, to);
      queue.push(to);
      maxX = Math.max(maxX, to.x);
      if (to.x + W > finish && to.x < finish + TILE_SIZE) finished = true;
    }
    if (finished) break;
  }
  return { finished, maxX, spots: seen.size };
}

function zoneAt(x: number) {
  const col = Math.floor(x / TILE_SIZE);
  const zone = level.zones.find((z) => col >= z.startCol && col < z.endCol);
  const pct = Math.round((x / (level.finish.col * TILE_SIZE)) * 100);
  return `${zone?.name ?? '?'} (col ${col}, ${pct}%)`;
}

console.log(`${level.name}: ${level.cols} cols (${level.cols * TILE_SIZE}px), ${level.zones.length} zones`);
const kits: Kit[] = ['plain', 'dash', 'full'];
const only = process.argv[2] as Kit | undefined;
if (only && !kits.includes(only)) throw new Error(`Unknown kit '${only}', expected one of ${kits.join(', ')}`);
let ok = true;
for (const kit of only ? [only] : kits) {
  const t = Date.now();
  const r = search(kit);
  const where = r.finished ? 'reaches the FINISH' : `stuck, furthest ${zoneAt(r.maxX)}`;
  console.log(`  ${kit.padEnd(5)} ${where}  [${r.spots} spots, ${((Date.now() - t) / 1000).toFixed(1)}s]`);
  if (kit === 'full' || only) ok = r.finished;
}
process.exit(ok ? 0 : 1);
