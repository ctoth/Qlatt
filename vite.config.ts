import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/Qlatt/' : '/',
  server: {
    port: 8000,
    open: '/'
  },
  worker: {
    format: 'es'
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    }
  }
});
