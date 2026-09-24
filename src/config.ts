// Native resolution matches the 320x192 background art; the canvas scales up to fit the window.
export const GAME_WIDTH = 320;
export const GAME_HEIGHT = 192;

// Overrides for the manifest's suggestedScrollFactor. BG1's edges don't match, so it
// shows a seam when it wraps; keep the sky static instead.
export const SCROLL_FACTOR_OVERRIDES: Record<string, number> = { bg1: 0 };

// Player
export const PLAYER_ANIMAL = 'fox';

// Fox movement stats. Placeholder values (approved for prototyping, see
// docs/design/fox-bramble-hollow.md); retune after playtesting. Speeds px/s, accels px/s².
export const PLAYER = {
  walkSpeed: 60,
  runSpeed: 110, // while sprinting
  // Sprint comes from the direction keys, Smash-style: a fresh press walks, holding it
  // builds into a sprint, and a double-tap sprints immediately.
  sprint: {
    holdTime: 0.3, // hold a direction this long to break into a sprint
    doubleTapWindow: 0.2, // release-to-press gap that counts as a double-tap
  },
  groundAccel: 600, // ~0.2s to run speed
  groundTraction: 250, // low: slows when releasing or turning, slides ~24px from a run
  airAccel: 700, // high: steers hard mid-air
  maxAirSpeed: 90, // low: can't rocket across gaps
  airDrag: 300, // bleeds speed above maxAirSpeed (e.g. a running jump) back down to it
  maxFallSpeed: 300,
  jumpVelocity: -230, // ~44px apex with GRAVITY_Y, while jump is held
  // Letting go of jump while rising caps the upward speed at this: a tap is a short hop
  // (~14px, clears a one-tile hedge), holding gives the full jump.
  jumpCutVelocity: -130,
  dash: {
    speed: 250,
    duration: 0.16, // ~40px
    exitSpeed: 110, // velocity kept in the dash direction when it ends
    cooldown: 1.0, // from the start of the dash
  },
  // Hitbox inside the 32x32 frame: body without the tail, bottom on the feet (row 26).
  body: { width: 16, height: 14, offsetX: 8, offsetY: 13 },
  // Frame of the run cycle used as the airborne pose (legs stretched out).
  airFrame: 3,
};
export const GRAVITY_Y = 600;

// Scurry: the universal air dodge. Identical for every animal by design; only the look
// changes per animal, so never move these numbers into per-animal stats.
export const SCURRY = {
  speed: 180,
  duration: 0.2, // ~36px, gravity off
  exitVelocityFactor: 0.5,
};

// Soft hazard (bramble): multiplies max speed while touching it. Dash ignores it.
export const BRAMBLE_SPEED_FACTOR = 0.5;

// Darkness overlay alpha at the start and end of a stage (bright woodland to dark thicket).
export const LIGHTING = { color: 0x10081c, startAlpha: 0, endAlpha: 0.4 };

// The fox's run sheets are mislabeled in the art pack: fox_run_right.png faces left and
// vice versa. Map the manifest's animation key to the one that actually faces that way.
export const ANIMATION_KEY_FIXES: Record<string, string> = {
  fox_run_left: 'fox_run_right',
  fox_run_right: 'fox_run_left',
};
