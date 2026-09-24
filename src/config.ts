// Native resolution matches the 320x192 background art; the canvas scales up to fit the window.
export const GAME_WIDTH = 320;
export const GAME_HEIGHT = 192;

// Level is several screens wide so parallax is visible while the camera moves.
export const WORLD_WIDTH = GAME_WIDTH * 3;

// Ground: grass-topped row at GROUND_Y with dirt below, down to the bottom of the screen.
// Tile indices are row*8 + col in stage/Tileset.png.
export const GROUND_Y = 144;
export const GROUND_TOP_TILE = 1;
export const GROUND_FILL_TILE = 9;

// Overrides for the manifest's suggestedScrollFactor. BG1's edges don't match, so it
// shows a seam when it wraps; keep the sky static instead.
export const SCROLL_FACTOR_OVERRIDES: Record<string, number> = { bg1: 0 };

// Player
export const PLAYER_ANIMAL = 'fox';
export const PLAYER = {
  walkSpeed: 60, // px/s
  runSpeed: 110, // px/s, while holding Shift
  jumpVelocity: -230, // px/s; ~44px apex with GRAVITY_Y
  // Hitbox inside the 32x32 frame: body without the tail, bottom on the feet (row 26).
  body: { width: 16, height: 14, offsetX: 8, offsetY: 13 },
  // Frame of the run cycle used as the airborne pose (legs stretched out).
  airFrame: 3,
};
export const GRAVITY_Y = 600;

// The fox's run sheets are mislabeled in the art pack: fox_run_right.png faces left and
// vice versa. Map the manifest's animation key to the one that actually faces that way.
export const ANIMATION_KEY_FIXES: Record<string, string> = {
  fox_run_left: 'fox_run_right',
  fox_run_right: 'fox_run_left',
};
