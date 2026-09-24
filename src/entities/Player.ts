import Phaser from 'phaser';
import { type Direction, manifest } from '../assets';
import { ANIMATION_KEY_FIXES, PLAYER, PLAYER_ANIMAL } from '../config';

export interface PlayerInput {
  left: boolean;
  right: boolean;
  run: boolean;
  jump: boolean; // pressed this frame
}

const character = manifest.characters[PLAYER_ANIMAL];

function animKey(action: string, facing: Direction) {
  const key = character.actions[action][facing];
  return ANIMATION_KEY_FIXES[key] ?? key;
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  private facing: Direction = 'right';

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, animKey('idle', 'right'));
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const { width, height, offsetX, offsetY } = PLAYER.body;
    this.body.setSize(width, height).setOffset(offsetX, offsetY);
    this.setCollideWorldBounds(true);
    this.play(animKey('idle', this.facing));
  }

  update(input: PlayerInput) {
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const onGround = this.body.blocked.down;
    const speed = input.run ? PLAYER.runSpeed : PLAYER.walkSpeed;

    this.setVelocityX(dir * speed);
    if (dir !== 0) this.facing = dir > 0 ? 'right' : 'left';

    if (input.jump && onGround) {
      this.setVelocityY(PLAYER.jumpVelocity);
    }

    if (!onGround) {
      // No jump animation in the pack: hold the stretched-out run frame while airborne.
      this.anims.stop();
      this.setTexture(animKey('run', this.facing), PLAYER.airFrame);
    } else if (dir === 0) {
      this.play(animKey('idle', this.facing), true);
    } else {
      this.play(animKey(input.run ? 'run' : 'walk', this.facing), true);
    }
  }
}
