import Phaser from 'phaser';
import { type Direction, manifest } from '../assets';
import { ANIMATION_KEY_FIXES, PLAYER, PLAYER_ANIMAL } from '../config';
import { createMoveState, type MoveInput, stepMovement } from './movement';

const character = manifest.characters[PLAYER_ANIMAL];

function animKey(action: string, facing: Direction) {
  const key = character.actions[action][facing];
  return ANIMATION_KEY_FIXES[key] ?? key;
}

// Placeholder effects until there's dash and Scurry art: fading afterimages.
const DASH_TRAIL_TINT = 0xffb060;
const SCURRY_TRAIL_TINT = 0x9fe070;

export class Player extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  readonly move = createMoveState();
  private trailTimer = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, animKey('idle', 'right'));
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const { width, height, offsetX, offsetY } = PLAYER.body;
    this.body.setSize(width, height).setOffset(offsetX, offsetY);
    this.body.setMaxVelocity(1000, PLAYER.maxFallSpeed);
    this.setCollideWorldBounds(true);
    this.play(animKey('idle', 'right'));
  }

  get facing(): Direction {
    return this.move.facing > 0 ? 'right' : 'left';
  }

  get dashing() {
    return this.move.dashTime > 0;
  }

  update(input: MoveInput, slowed: boolean, dt: number) {
    const onGround = this.body.blocked.down;
    const s = this.move;
    s.vx = this.body.velocity.x;
    s.vy = this.body.velocity.y;
    const gravity = stepMovement(s, input, { onGround, slowed }, dt);
    this.body.setAllowGravity(gravity);
    this.setVelocity(s.vx, s.vy);

    const scurrying = s.scurryTime > 0;
    if (this.dashing || scurrying) this.spawnTrail(scurrying ? SCURRY_TRAIL_TINT : DASH_TRAIL_TINT, dt);

    if (!onGround || this.dashing) {
      // No jump or dash animation in the pack: hold the stretched-out run frame.
      this.anims.stop();
      this.setTexture(animKey('run', this.facing), PLAYER.airFrame);
    } else if (input.dir === 0 && Math.abs(s.vx) < 1) {
      this.play(animKey('idle', this.facing), true);
    } else {
      this.play(animKey(Math.abs(s.vx) > PLAYER.walkSpeed ? 'run' : 'walk', this.facing), true);
    }
  }

  private spawnTrail(tint: number, dt: number) {
    this.trailTimer -= dt;
    if (this.trailTimer > 0) return;
    this.trailTimer = 0.03;
    const ghost = this.scene.add
      .image(this.x, this.y, this.texture.key, this.frame.name)
      .setTintFill(tint)
      .setAlpha(0.6)
      .setDepth(this.depth - 1);
    this.scene.tweens.add({ targets: ghost, alpha: 0, duration: 180, onComplete: () => ghost.destroy() });
  }
}
