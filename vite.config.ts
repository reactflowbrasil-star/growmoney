import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Para cPanel em https://canal360.run.place/grow use:
//   VITE_BASE=/grow/ npm run build
// Para raiz (Netlify etc.):
//   npm run build  (padrão /)
const base = process.env.VITE_BASE || '/';

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
          query: ['@tanstack/react-query'],
          charts: ['recharts'],
          ui: ['lucide-react', 'class-variance-authority', 'clsx'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
