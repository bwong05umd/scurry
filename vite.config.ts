import { defineConfig } from 'vite';

// assets/ is served as the web root, so paths in assets/assets.json load as-is
// (e.g. "stage/BG1.png") in both dev and build.
export default defineConfig({
  publicDir: 'assets',
  server: { port: 5173 },
});
