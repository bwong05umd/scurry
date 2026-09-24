import Phaser from 'phaser';
import { backgroundLayers, decors, tileset } from '../assets';
import { Player } from '../entities/Player';
import type { Dir } from '../entities/movement';
import { GAME_HEIGHT, GAME_WIDTH, GRAVITY_Y, LIGHTING, PLAYER, SCROLL_FACTOR_OVERRIDES } from '../config';
import { brambleHollow } from '../levels/brambleHollow';
import { charAt, DECOR_CHARS, type ParsedLevel, parseStage, TILE_SIZE } from '../levels/level';
import {
  createThicketTexture,
  DEN_TEXTURE,
  FLOWER_TEXTURE,
  HEDGE_FIRST_FRAME,
  THICKET_TEXTURE,
  THICKET_TILES,
} from './placeholderArt';
import { PIXEL_FONT, PIXEL_FONT_LETTER_SPACING } from './pixelFont';

interface ParallaxLayer {
  sprite: Phaser.GameObjects.TileSprite;
  factor: number;
}

type KeyName = 'left' | 'right' | 'up' | 'down' | 'jumpAlt' | 'dash' | 'scurry' | 'restart';

// Tile indices in stage/Tileset.png (row*8 + col).
const GROUND_BLOCK = 0; // 3x3 grass-topped block at the top-left: corners, edges, fill
const STONE_BLOCK = 29; // 3x2 stone brick block
const BRANCH_TILE = 21; // one-tile floating grass ledge
const SOIL_TILE = 36; // dark soil, used as a backdrop

const BEST_TIME_KEY = 'scurry.bestTime.brambleHollow';

function formatTime(ms: number) {
  const s = ms / 1000;
  return `${Math.floor(s / 60)}:${(s % 60).toFixed(2).padStart(5, '0')}`;
}

export class GameScene extends Phaser.Scene {
  private level!: ParsedLevel;
  private layers: ParallaxLayer[] = [];
  private player!: Player;
  private keys!: Record<KeyName, Phaser.Input.Keyboard.Key>;
  private pressed = { jump: false, dash: false, scurry: false };

  private startX = 0;
  private finishX = 0;
  private runStarted = false;
  private runTime = 0; // ms
  private progress = 0; // furthest reached, 0-1
  private splits: number[] = [];
  private state: 'playing' | 'dead' | 'finished' = 'playing';
  private bestTime = Infinity;

  private hud!: Phaser.GameObjects.BitmapText;
  private help!: Phaser.GameObjects.BitmapText;
  private cooldownBar!: Phaser.GameObjects.Graphics;
  private darkness!: Phaser.GameObjects.Rectangle;

  constructor() {
    super('GameScene');
  }

  create() {
    this.level = parseStage(brambleHollow);
    this.runStarted = false;
    this.runTime = 0;
    this.progress = 0;
    this.splits = [];
    this.state = 'playing';
    const worldWidth = this.level.cols * TILE_SIZE;

    this.cameras.main.setBounds(0, 0, worldWidth, GAME_HEIGHT);
    // Each layer is pinned to the camera and scrolls its texture at its own rate.
    this.layers = backgroundLayers.map((image) => ({
      sprite: this.add
        .tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, image.key)
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(-10),
      factor: SCROLL_FACTOR_OVERRIDES[image.key] ?? image.suggestedScrollFactor,
    }));

    const { terrain, thicket } = this.createTilemap();
    this.createDecor();

    this.physics.world.setBounds(0, 0, worldWidth, GAME_HEIGHT);
    this.physics.world.gravity.y = GRAVITY_Y;

    const { spawn, finish } = this.level;
    this.startX = spawn.col * TILE_SIZE + TILE_SIZE / 2;
    this.finishX = finish.col * TILE_SIZE + TILE_SIZE / 2;
    // Put the body's feet on the bottom of the spawn cell.
    const feetOffset = PLAYER.body.offsetY + PLAYER.body.height - 16;
    this.player = new Player(this, this.startX, (spawn.row + 1) * TILE_SIZE - feetOffset - 1);
    this.physics.add.collider(this.player, terrain);
    this.physics.add.collider(this.player, thicket);

    this.cameras.main.startFollow(this.player, true);
    // The camera scrolls after update(), so sync parallax once its final position is known.
    this.cameras.main.on(Phaser.Cameras.Scene2D.Events.FOLLOW_UPDATE, this.updateParallax, this);

    this.createHud();
    this.bindKeys();
  }

  private createTilemap() {
    const { cols, rows } = this.level;
    const empty = () => Array.from({ length: rows }, () => new Array<number>(cols).fill(-1));
    const terrainData = empty();
    const thicketData = empty();
    const hedgeFrames = createThicketTexture(this, this.level);
    const is = (ch: string, col: number, row: number) => {
      if (row >= rows || col < 0 || col >= cols) return ch === '#'; // ground runs off the edges
      return charAt(this.level, col, row) === ch;
    };

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const ch = charAt(this.level, col, row);
        // Pick the edge/corner piece from which neighbours are the same material.
        const colPart = !is(ch, col - 1, row) ? 0 : !is(ch, col + 1, row) ? 2 : 1;
        if (ch === '#') {
          const rowPart = !is(ch, col, row - 1) ? 0 : !is(ch, col, row + 1) ? 2 : 1;
          terrainData[row][col] = GROUND_BLOCK + rowPart * 8 + colPart;
        } else if (ch === '=') {
          terrainData[row][col] = STONE_BLOCK + (is(ch, col, row - 1) ? 8 : 0) + colPart;
        } else if (ch === '_') {
          terrainData[row][col] = BRANCH_TILE;
        } else if (ch === ':') {
          terrainData[row][col] = SOIL_TILE;
        } else if (ch === 'H' || ch === 'K') {
          thicketData[row][col] = hedgeFrames.get(`${col},${row}`)!;
        } else if (ch in THICKET_TILES) {
          thicketData[row][col] = THICKET_TILES[ch];
        }
      }
    }

    const { tileWidth, tileHeight } = tileset;
    const terrainMap = this.make.tilemap({ data: terrainData, tileWidth, tileHeight });
    const terrainTiles = terrainMap.addTilesetImage(
      tileset.key,
      tileset.key,
      tileWidth,
      tileHeight,
      tileset.margin,
      tileset.spacing,
    )!;
    const terrain = terrainMap.createLayer(0, terrainTiles, 0, 0)!;
    terrain.setCollisionByExclusion([-1, SOIL_TILE]);

    const thicketMap = this.make.tilemap({ data: thicketData, tileWidth: TILE_SIZE, tileHeight: TILE_SIZE });
    const thicketTiles = thicketMap.addTilesetImage(THICKET_TEXTURE, THICKET_TEXTURE, TILE_SIZE, TILE_SIZE)!;
    const thicket = thicketMap.createLayer(0, thicketTiles, 0, 0)!;
    // Hedges are walls; brambles and thorns are overlap-only hazards (see hazardsTouching).
    thicket.setCollisionBetween(HEDGE_FIRST_FRAME, HEDGE_FIRST_FRAME + hedgeFrames.size - 1);
    return { terrain, thicket };
  }

  private createDecor() {
    const { grid, spawn, finish } = this.level;
    grid.forEach((line, row) =>
      line.forEach((ch, col) => {
        const x = col * TILE_SIZE + TILE_SIZE / 2;
        const bottom = (row + 1) * TILE_SIZE;
        const frame = DECOR_CHARS[ch];
        // Decor stands behind the player, feet on the bottom of its cell.
        if (frame) this.add.image(x, bottom, decors.key, frame).setOrigin(0.5, 1).setDepth(-1);
        if (ch === '*') this.add.image(x, bottom, FLOWER_TEXTURE).setOrigin(0.5, 1).setDepth(-1);
      }),
    );
    for (const cell of [spawn, finish]) {
      this.add
        .image(cell.col * TILE_SIZE + TILE_SIZE / 2, (cell.row + 1) * TILE_SIZE, DEN_TEXTURE)
        .setOrigin(0.5, 1)
        .setDepth(-1);
    }
  }

  private createHud() {
    // Darkens as the run goes deeper into the thicket: bright woodland to closed-in hollow.
    this.darkness = this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, LIGHTING.color, 1)
      .setOrigin(0)
      .setScrollFactor(0)
      .setAlpha(LIGHTING.startAlpha)
      .setDepth(10);
    this.hud = this.add
      .bitmapText(3, 2, PIXEL_FONT, '')
      .setLetterSpacing(PIXEL_FONT_LETTER_SPACING)
      .setScrollFactor(0)
      .setDepth(20);
    this.help = this.add
      .bitmapText(3, GAME_HEIGHT - 23, PIXEL_FONT, [
        'A/D move  W/Space jump  hold/2x-tap to sprint',
        'J dash  K Scurry (air, +WASD)  R restart',
      ])
      .setLetterSpacing(PIXEL_FONT_LETTER_SPACING)
      .setScrollFactor(0)
      .setDepth(20);
    this.cooldownBar = this.add.graphics().setScrollFactor(0).setDepth(20);
  }

  private bindKeys() {
    const { KeyCodes } = Phaser.Input.Keyboard;
    // Keys outlive a scene restart; drop the old ones so their listeners don't stack up.
    this.input.keyboard!.removeAllKeys(true);
    this.keys = this.input.keyboard!.addKeys({
      left: KeyCodes.A,
      right: KeyCodes.D,
      up: KeyCodes.W,
      down: KeyCodes.S,
      jumpAlt: KeyCodes.SPACE,
      dash: KeyCodes.J,
      scurry: KeyCodes.K,
      restart: KeyCodes.R,
    }) as typeof this.keys;

    // Queue presses from the keydown event: a tap that goes down and up within one frame
    // never shows up in isDown, and Phaser's onUp clears the JustDown flag.
    this.keys.up.on('down', () => (this.pressed.jump = true));
    this.keys.jumpAlt.on('down', () => (this.pressed.jump = true));
    this.keys.dash.on('down', () => (this.pressed.dash = true));
    this.keys.scurry.on('down', () => (this.pressed.scurry = true));
    this.keys.restart.on('down', () => this.scene.restart());
  }

  // Which hazard characters the player's body overlaps.
  private hazardsTouching() {
    const b = this.player.body;
    const found = new Set<string>();
    const c0 = Math.floor(b.left / TILE_SIZE);
    const c1 = Math.floor((b.right - 0.01) / TILE_SIZE);
    const r0 = Math.floor(b.top / TILE_SIZE);
    const r1 = Math.floor((b.bottom - 0.01) / TILE_SIZE);
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) found.add(charAt(this.level, c, r));
    return found;
  }

  update(_time: number, delta: number) {
    const dt = Math.min(delta, 50) / 1000;
    const { left, right, up, down } = this.keys;
    const dir = ((right.isDown ? 1 : 0) - (left.isDown ? 1 : 0)) as Dir;

    if (this.state === 'playing') {
      const hazards = this.hazardsTouching();
      if (hazards.has('X')) return this.die();

      if (!this.runStarted && (dir !== 0 || this.pressed.jump || this.pressed.dash)) this.runStarted = true;
      if (this.runStarted) this.runTime += delta;

      this.player.update(
        { dir, up: up.isDown, down: down.isDown, jumpHeld: up.isDown || this.keys.jumpAlt.isDown, ...this.pressed },
        hazards.has('~'),
        dt,
      );
      this.trackProgress();
    }
    this.pressed = { jump: false, dash: false, scurry: false };
    this.drawHud();
  }

  private trackProgress() {
    const p = Phaser.Math.Clamp((this.player.x - this.startX) / (this.finishX - this.startX), 0, 1);
    this.progress = Math.max(this.progress, p);
    this.darkness.setAlpha(Phaser.Math.Linear(LIGHTING.startAlpha, LIGHTING.endAlpha, this.progress));

    // Split when first entering each zone after the first.
    const col = Math.floor(this.player.x / TILE_SIZE);
    const next = this.level.zones[this.splits.length + 1];
    if (next && col >= next.startCol) this.splits.push(this.runTime);

    if (this.player.x >= this.finishX) this.finish();
  }

  private currentZone() {
    const col = Math.floor(this.player.x / TILE_SIZE);
    const i = this.level.zones.findIndex((z) => col >= z.startCol && col < z.endCol);
    return { index: Math.max(i, 0), zone: this.level.zones[Math.max(i, 0)] };
  }

  private die() {
    // Hard hazard: no checkpoints, so the whole run restarts.
    this.state = 'dead';
    this.player.setVelocity(0, 0).body.setAllowGravity(false);
    this.player.setTintFill(0xff4a4a);
    this.cameras.main.shake(150, 0.01).flash(150, 120, 20, 30);
    this.time.delayedCall(450, () => this.scene.restart());
  }

  private finish() {
    this.state = 'finished';
    this.splits.push(this.runTime);
    this.player.setVelocityX(0);
    let best = Infinity;
    try {
      best = Number(localStorage.getItem(BEST_TIME_KEY)) || Infinity;
      if (this.runTime < best) localStorage.setItem(BEST_TIME_KEY, String(this.runTime));
    } catch {
      // Storage can be unavailable (private mode); the best time is just not remembered.
    }
    this.bestTime = best;
  }

  private drawHud() {
    const { index, zone } = this.currentZone();
    const lines = [formatTime(this.runTime), `${Math.floor(this.progress * 100)}%  ${index + 1}. ${zone.name}`];
    if (this.state === 'finished') {
      const isBest = this.runTime < this.bestTime;
      lines.push('', `FINISH  ${formatTime(this.runTime)}${isBest ? '  new best!' : ''}`);
      if (!isBest) lines.push(`best    ${formatTime(this.bestTime)}`);
      this.level.zones.forEach((z, i) => {
        const prev = i === 0 ? 0 : this.splits[i - 1];
        lines.push(`${i + 1}. ${z.name.padEnd(18)} ${formatTime(this.splits[i] - prev)}`);
      });
      lines.push('', 'R to run again');
    }
    this.hud.setText(lines);
    this.help.setVisible(!this.runStarted);

    // Dash cooldown: fills up as the dash recharges, bright when ready.
    const { dashCooldown } = this.player.move;
    const ready = 1 - dashCooldown / PLAYER.dash.cooldown;
    const x = GAME_WIDTH - 36;
    this.cooldownBar.clear();
    this.cooldownBar.fillStyle(0x1b1424, 0.8).fillRect(x - 1, 3, 34, 6);
    this.cooldownBar.fillStyle(dashCooldown === 0 ? 0xffb060 : 0x8a6040, 1).fillRect(x, 4, 32 * ready, 4);
  }

  private updateParallax(cam: Phaser.Cameras.Scene2D.Camera) {
    for (const layer of this.layers) {
      layer.sprite.tilePositionX = cam.scrollX * layer.factor;
    }
  }
}
