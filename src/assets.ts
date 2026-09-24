import manifestJson from '../assets/assets.json';

// Typed view of assets/assets.json. Only the sections the game uses so far.
export interface ImageAsset {
  key: string;
  path: string;
  width: number;
  height: number;
  layer: number;
  role: string;
  opaque: boolean;
  suggestedScrollFactor: number;
}

export interface TilesetAsset {
  key: string;
  path: string;
  tileWidth: number;
  tileHeight: number;
  margin: number;
  spacing: number;
}

export interface AtlasFrame {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface AtlasAsset {
  key: string;
  path: string;
  frames: Record<string, AtlasFrame>;
}

export interface SpritesheetAsset {
  key: string;
  path: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  animal: string;
  action: string;
  direction: Direction | 'front';
}

export interface AnimationAsset {
  key: string;
  spritesheet: string;
  start: number;
  end: number;
  frameRate: number;
  repeat: number;
}

export type Direction = 'left' | 'right';

export interface CharacterAsset {
  // action -> direction -> animation key
  actions: Record<string, Record<Direction | 'front', string>>;
  frameWidth: number;
  frameHeight: number;
}

export interface Manifest {
  images: ImageAsset[];
  tilesets: TilesetAsset[];
  atlases: AtlasAsset[];
  spritesheets: SpritesheetAsset[];
  animations: AnimationAsset[];
  characters: Record<string, CharacterAsset>;
}

export const manifest = manifestJson as unknown as Manifest;

export const tileset = manifest.tilesets.find((t) => t.key === 'tileset')!;
export const decors = manifest.atlases.find((a) => a.key === 'decors')!;

// Background layers, far to near.
export const backgroundLayers = [...manifest.images].sort((a, b) => a.layer - b.layer);
