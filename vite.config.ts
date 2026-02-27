import { defineConfig } from 'vite';

export default defineConfig({
  root: 'source',
  build: {
    outDir: '../docs',
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
