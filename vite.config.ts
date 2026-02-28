import { defineConfig } from 'vite';

export default defineConfig({
  root: 'source',
  base: '/terp-track/',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    open: true,
  },
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
  },
});
