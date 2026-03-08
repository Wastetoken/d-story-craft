import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
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
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'three',
      'zustand',
      '@react-three/fiber',
      '@react-three/drei',
      '@react-three/postprocessing',
      'gsap',
      'gsap/ScrollTrigger',
      'jszip',
    ],
  },
  build: {
    outDir: 'dist',
  }
});
