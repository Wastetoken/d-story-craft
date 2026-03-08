import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'ScrollStudio3D-main',
  server: {
    port: 3000,
    host: '0.0.0.0',
    hmr: {
      clientPort: 443
    }
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'ScrollStudio3D-main'),
    }
  },
  build: {
    outDir: path.resolve(__dirname, 'dist'),
  }
});
