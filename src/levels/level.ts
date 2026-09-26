// ASCII level format. Each zone is a block of equal-length rows, 12 rows tall (one screen,
// 16px tiles); zones are joined left to right into one continuous stage. No Phaser here so
// scripts/check-level.ts can parse levels too.
//
// Legend
//   .  air                      #  ground (grass/dirt, auto-tiled)
//   =  stone brick (ruins)      _  branch platform (one-tile ledge)
//   H  stone wall (mossy cobble) K  stone wall, closing in (darker, for the finale)
//   ~  bramble: soft hazard, slows the player
//   X  thorns: hard hazard, restarts the run
//   :  dark soil backdrop (not solid)
//   T  tree   b  bush   s  stone   (decor, not solid, stands on the bottom of its cell)
//   *  true-route marker (daffodils), for route reading
//   @  start (player spawns here)   F  finish den

export const LEVEL_ROWS = 12;
export const TILE_SIZE = 16;

export const SOLID_CHARS = new Set(['#', '=', 'H', 'K', '_']);
export const DECOR_CHARS: Record<string, 'tree' | 'bush' | 'stone'> = { T: 'tree', b: 'bush', s: 'stone' };

// Wildflowers scattered on the zone's open ground (see src/scenes/flora.ts). `plants` are
// frame names from the flora_* atlases in assets/assets.json.
export interface FloraDef {
  plants: string[];
  density: number; // chance each free ground cell gets a plant, 0-1
}

export interface ZoneDef {
  name: string;
  rows: string[];
  flora?: FloraDef;
}

export interface StageDef {
  name: string;
  zones: ZoneDef[];
}

export interface Cell {
  col: number;
  row: number;
}

export interface ParsedLevel {
  name: string;
  cols: number;
  rows: number;
  grid: string[][]; // grid[row][col]
  spawn: Cell;
  finish: Cell;
  zones: { name: string; startCol: number; endCol: number; flora?: FloraDef }[];
}

export function parseStage(stage: StageDef): ParsedLevel {
  const grid: string[][] = Array.from({ length: LEVEL_ROWS }, () => []);
  const zones: ParsedLevel['zones'] = [];
  for (const zone of stage.zones) {
    if (zone.rows.length !== LEVEL_ROWS) {
      throw new Error(`${zone.name}: expected ${LEVEL_ROWS} rows, got ${zone.rows.length}`);
    }
    const width = zone.rows[0].length;
    zone.rows.forEach((row, i) => {
      if (row.length !== width) throw new Error(`${zone.name}: row ${i} is ${row.length} wide, expected ${width}`);
    });
    const startCol = grid[0].length;
    zone.rows.forEach((row, i) => grid[i].push(...row));
    zones.push({ name: zone.name, startCol, endCol: grid[0].length, flora: zone.flora });
  }

  const find = (ch: string) => {
    const cells: Cell[] = [];
    grid.forEach((row, r) => row.forEach((c, col) => c === ch && cells.push({ col, row: r })));
    if (cells.length !== 1) throw new Error(`${stage.name}: expected exactly one '${ch}', found ${cells.length}`);
    return cells[0];
  };

  return { name: stage.name, cols: grid[0].length, rows: LEVEL_ROWS, grid, spawn: find('@'), finish: find('F'), zones };
}

export function isSolid(level: ParsedLevel, col: number, row: number) {
  // Out of bounds: sides and bottom count as solid so edges auto-tile as continuous ground.
  if (row < 0) return false;
  if (row >= level.rows || col < 0 || col >= level.cols) return true;
  return SOLID_CHARS.has(level.grid[row][col]);
}

export function charAt(level: ParsedLevel, col: number, row: number) {
  if (row < 0 || row >= level.rows || col < 0 || col >= level.cols) return '.';
  return level.grid[row][col];
}
