import { defineConfig } from 'vite';

export default defineConfig({
  base: './',          // caminhos relativos — funciona em qualquer servidor
  server: { port: 5173, open: true },
  build: { outDir: 'dist', assetsInlineLimit: 0 }
});
