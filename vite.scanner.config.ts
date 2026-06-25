import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      external: ['electron', '@diskscope/scanner-win', /scanner-win\..+\.node$/],
    },
  },
});
