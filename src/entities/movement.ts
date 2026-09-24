import { GRAVITY_Y, PLAYER, SCURRY, BRAMBLE_SPEED_FACTOR } from '../config';

// Acceleration-based movement, dash and Scurry, kept free of Phaser so the same step runs in
// the game (Player) and in scripts/check-level.ts. Velocities are read back from the physics
// body every frame, so collisions (which zero velocity) are respected.

export type Dir = -1 | 0 | 1;

export interface MoveInput {
  dir: Dir; // held left/right
  up: boolean;
  down: boolean;
  jump: boolean; // pressed this frame
  jumpHeld: boolean; // jump key still down; releasing it early cuts the jump short
  dash: boolean; // pressed this frame
  scurry: boolean; // pressed this frame
}

export interface MoveEnv {
  onGround: boolean;
  slowed: boolean; // touching a bramble
}

export interface MoveState {
  vx: number;
  vy: number;
  facing: -1 | 1;
  dashTime: number; // remaining active time, 0 when not dashing
  dashDir: -1 | 1;
  dashCooldown: number; // remaining, 0 when ready
  scurryTime: number;
  scurryVx: number;
  scurryVy: number;
  scurryUsed: boolean; // once per airtime
  jumping: boolean; // rising from a jump, so releasing jump can still cut it short
  // Smash-style sprint from the direction keys alone: holding a direction builds from a walk
  // into a sprint, and double-tapping it (the keyboard's stick flick) sprints at once.
  heldDir: Dir; // direction held last step
  heldTime: number; // how long heldDir has been held
  tapDir: Dir; // direction most recently released
  tapAge: number; // time since tapDir was released
  sprinting: boolean; // stays on until the direction is released or reversed
}

export function createMoveState(): MoveState {
  return {
    vx: 0,
    vy: 0,
    facing: 1,
    dashTime: 0,
    dashDir: 1,
    dashCooldown: 0,
    scurryTime: 0,
    scurryVx: 0,
    scurryVy: 0,
    scurryUsed: false,
    jumping: false,
    heldDir: 0,
    heldTime: 0,
    tapDir: 0,
    tapAge: Infinity,
    sprinting: false,
  };
}

function approach(value: number, target: number, amount: number) {
  return value < target ? Math.min(value + amount, target) : Math.max(value - amount, target);
}

function updateSprint(s: MoveState, dir: Dir, dt: number) {
  s.tapAge += dt;
  if (dir !== s.heldDir) {
    if (s.heldDir !== 0 && dir === 0) {
      s.tapDir = s.heldDir;
      s.tapAge = 0;
    }
    s.sprinting = dir !== 0 && dir === s.tapDir && s.tapAge <= PLAYER.sprint.doubleTapWindow;
    s.heldDir = dir;
    s.heldTime = 0;
  } else if (dir !== 0) {
    s.heldTime += dt;
    if (s.heldTime >= PLAYER.sprint.holdTime) s.sprinting = true;
  }
}

function endDash(s: MoveState) {
  s.dashTime = 0;
  s.vx = s.dashDir * PLAYER.dash.exitSpeed;
}

// Advances velocities by dt seconds. Returns whether gravity applies this frame.
export function stepMovement(s: MoveState, input: MoveInput, env: MoveEnv, dt: number): boolean {
  const { onGround, slowed } = env;
  const { dir } = input;
  if (onGround) s.scurryUsed = false;
  s.dashCooldown = Math.max(0, s.dashCooldown - dt);
  if (dir !== 0 && s.dashTime === 0) s.facing = dir;
  updateSprint(s, dir, dt);

  const dashing = s.dashTime > 0;
  const scurrying = s.scurryTime > 0;
  if (input.dash && s.dashCooldown === 0 && !dashing && !scurrying) {
    // Snap to full dash speed in the held direction, ignoring traction: this is the redirect.
    s.dashDir = dir || s.facing;
    s.facing = s.dashDir;
    s.dashTime = PLAYER.dash.duration;
    s.dashCooldown = PLAYER.dash.cooldown;
    s.jumping = false;
  } else if (input.scurry && !onGround && !s.scurryUsed && !dashing && !scurrying) {
    const x = dir;
    const y = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    const len = Math.hypot(x, y) || 1; // neutral Scurry is a short hover
    s.scurryVx = (x / len) * SCURRY.speed;
    s.scurryVy = (y / len) * SCURRY.speed;
    s.scurryTime = SCURRY.duration;
    s.scurryUsed = true;
    s.jumping = false;
  }

  if (input.jump && onGround && s.scurryTime === 0) {
    if (s.dashTime > 0) endDash(s);
    s.vy = PLAYER.jumpVelocity;
    s.jumping = true;
  }

  // Variable jump height: release jump while still rising and the rise is cut short.
  if (s.jumping) {
    if (s.vy >= 0) s.jumping = false;
    else if (!input.jumpHeld) {
      s.vy = Math.max(s.vy, PLAYER.jumpCutVelocity);
      s.jumping = false;
    }
  }

  if (s.dashTime > 0) {
    s.dashTime -= dt;
    if (s.dashTime <= 0) {
      endDash(s);
      return true;
    }
    s.vx = s.dashDir * PLAYER.dash.speed;
    s.vy = 0;
    return false;
  }

  if (s.scurryTime > 0) {
    s.scurryTime -= dt;
    if (s.scurryTime <= 0) {
      s.scurryTime = 0;
      s.vx = s.scurryVx * SCURRY.exitVelocityFactor;
      s.vy = s.scurryVy * SCURRY.exitVelocityFactor;
      return true;
    }
    s.vx = s.scurryVx;
    s.vy = s.scurryVy;
    return false;
  }

  const factor = slowed ? BRAMBLE_SPEED_FACTOR : 1;
  if (onGround) {
    const max = (s.sprinting ? PLAYER.runSpeed : PLAYER.walkSpeed) * factor;
    if (dir !== 0 && Math.sign(s.vx) !== -dir) {
      s.vx =
        Math.abs(s.vx) < max
          ? dir * Math.min(max, Math.abs(s.vx) + PLAYER.groundAccel * dt)
          : approach(s.vx, dir * max, PLAYER.groundTraction * dt);
    } else {
      // Released or turning around: low traction, so the fox slides.
      s.vx = approach(s.vx, 0, PLAYER.groundTraction * dt);
    }
  } else {
    const max = PLAYER.maxAirSpeed * factor;
    const over = Math.abs(s.vx) > max;
    if (dir !== 0) {
      const braking = over && Math.sign(s.vx) === dir;
      s.vx = approach(s.vx, dir * max, (braking ? PLAYER.airDrag : PLAYER.airAccel) * dt);
    } else if (over) {
      s.vx = approach(s.vx, Math.sign(s.vx) * max, PLAYER.airDrag * dt);
    }
  }
  return true;
}

// Integrates gravity the same way Arcade physics does, for the level checker.
export function applyGravity(s: MoveState, gravity: boolean, dt: number) {
  if (gravity) s.vy = Math.min(s.vy + GRAVITY_Y * dt, PLAYER.maxFallSpeed);
}
