import Phaser from 'phaser';
import { backgroundLayers, tileset } from '../assets';
import { Player } from '../entities/Player';
import {
  GAME_HEIGHT,
  GRAVITY_Y,
  GAME_WIDTH,
  GROUND_FILL_TILE,
  GROUND_TOP_TILE,
  GROUND_Y,
  SCROLL_FACTOR_OVERRIDES,
  WORLD_WIDTH,
} from '../config';

interface ParallaxLayer {
  sprite: Phaser.GameObjects.TileSprite;
  factor: number;
}

export class GameScene extends Phaser.Scene {
  private layers: ParallaxLayer[] = [];
  private ground!: Phaser.Tilemaps.TilemapLayer;
  private player!: Player;
  private keys!: Record<'left' | 'right' | 'jump' | 'jumpAlt' | 'run', Phaser.Input.Keyboard.Key>;
  private jumpQueued = false;

  constructor() {
    super('GameScene');
  }

  create() {
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, GAME_HEIGHT);

    // Each layer is pinned to the camera and scrolls its texture at its own rate.
    this.layers = backgroundLayers.map((image) => ({
      sprite: this.add
        .tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, image.key)
        .setOrigin(0)
        .setScrollFactor(0),
      factor: SCROLL_FACTOR_OVERRIDES[image.key] ?? image.suggestedScrollFactor,
    }));

    this.ground = this.createGround();

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, GAME_HEIGHT);
    this.physics.world.gravity.y = GRAVITY_Y;

    this.player = new Player(this, GAME_WIDTH / 2, GROUND_Y - 32);
    this.physics.add.collider(this.player, this.ground);
    this.cameras.main.startFollow(this.player, true);
    // The camera scrolls after update(), so sync parallax once its final position is known.
    this.cameras.main.on(Phaser.Cameras.Scene2D.Events.FOLLOW_UPDATE, this.updateParallax, this);

    const { KeyCodes } = Phaser.Input.Keyboard;
    this.keys = this.input.keyboard!.addKeys({
      left: KeyCodes.A,
      right: KeyCodes.D,
      jump: KeyCodes.W,
      jumpAlt: KeyCodes.SPACE,
      run: KeyCodes.SHIFT,
    }) as typeof this.keys;

    // Queue jumps from the keydown event: a tap that goes down and up within one frame
    // never shows up in isDown, and Phaser's onUp clears the JustDown flag.
    const queueJump = () => (this.jumpQueued = true);
    this.keys.jump.on('down', queueJump);
    this.keys.jumpAlt.on('down', queueJump);
  }

  private createGround() {
    const { tileWidth, tileHeight } = tileset;
    const cols = Math.ceil(WORLD_WIDTH / tileWidth);
    const rows = Math.ceil(GAME_HEIGHT / tileHeight);
    const topRow = GROUND_Y / tileHeight;

    const data = Array.from({ length: rows }, (_, row) => {
      const tile = row < topRow ? -1 : row === topRow ? GROUND_TOP_TILE : GROUND_FILL_TILE;
      return new Array<number>(cols).fill(tile);
    });

    const map = this.make.tilemap({ data, tileWidth, tileHeight });
    const tiles = map.addTilesetImage(tileset.key, tileset.key, tileWidth, tileHeight, tileset.margin, tileset.spacing)!;
    const layer = map.createLayer(0, tiles, 0, 0)!;
    layer.setCollision([GROUND_TOP_TILE, GROUND_FILL_TILE]);
    return layer;
  }

  update() {
    const { left, right, run } = this.keys;
    this.player.update({
      left: left.isDown,
      right: right.isDown,
      run: run.isDown,
      jump: this.jumpQueued,
    });
    this.jumpQueued = false;
  }

  private updateParallax(cam: Phaser.Cameras.Scene2D.Camera) {
    for (const layer of this.layers) {
      layer.sprite.tilePositionX = cam.scrollX * layer.factor;
    }
  }
}
