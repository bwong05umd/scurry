import { defineConfig } from 'vite';

// Bundles scripts/check-level.ts for Node (npm run check-level). No public dir: it only
// needs the level data and movement code, not the art.
export default defineConfig({
  publicDir: false,
  logLevel: 'warn',
  build: { ssr: 'scripts/check-level.ts', outDir: 'node_modules/.check-level', emptyOutDir: true },
});
