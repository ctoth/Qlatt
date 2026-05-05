import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/Qlatt/' : '/',
  server: {
    port: 8000,
    open: '/',
    fs: {
      allow: [
        path.resolve(__dirname),
        path.resolve(__dirname, '..', 'cel2js'),
        path.resolve(__dirname, '..', 'cel2js', 'dist'),
      ],
    },
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
