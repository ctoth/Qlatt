import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 8000,
    open: '/test/test-harness.html'
  },
  worker: {
    format: 'es'
  }
});
