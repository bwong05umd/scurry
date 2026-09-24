import Phaser from 'phaser';
import { decors, manifest } from '../assets';
import { PLAYER_ANIMAL } from '../config';
import { createPlaceholderArt } from './placeholderArt';

// Only the player's sheets are needed so far; other animals load when they're added.
const spritesheets = manifest.spritesheets.filter((s) => s.animal === PLAYER_ANIMAL);

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    this.load.setBaseURL(import.meta.env.BASE_URL);
    for (const image of manifest.images) {
      this.load.image(image.key, image.path);
    }
    for (const set of manifest.tilesets) {
      this.load.image(set.key, set.path);
    }
    this.load.image(decors.key, decors.path);
    for (const sheet of spritesheets) {
      this.load.spritesheet(sheet.key, sheet.path, {
        frameWidth: sheet.frameWidth,
        frameHeight: sheet.frameHeight,
      });
    }
  }

  create() {
    // Animations are global, so create them once here for every loaded sheet.
    for (const anim of manifest.animations) {
      if (!this.textures.exists(anim.spritesheet)) continue;
      this.anims.create({
        key: anim.key,
        frames: this.anims.generateFrameNumbers(anim.spritesheet, { start: anim.start, end: anim.end }),
        frameRate: anim.frameRate,
        repeat: anim.repeat,
      });
    }

    // The decor sheet has an irregular layout; register its named frames from the manifest.
    const decorTexture = this.textures.get(decors.key);
    for (const [name, f] of Object.entries(decors.frames)) {
      decorTexture.add(name, 0, f.x, f.y, f.w, f.h);
    }

    createPlaceholderArt(this);
    this.scene.start('GameScene');
  }
}
