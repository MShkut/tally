import path from 'path';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      components: path.resolve(__dirname, 'src/components'),
      hooks: path.resolve(__dirname, 'src/hooks'),
      utils: path.resolve(__dirname, 'src/utils'),
      pages: path.resolve(__dirname, 'src/pages'),
      contexts: path.resolve(__dirname, 'src/contexts'),
      constants: path.resolve(__dirname, 'src/constants'),
      // add more as needed
    }
  },
  build: {
    // Code splitting and optimization
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'charts': ['recharts'],
          'icons': ['lucide-react']
        }
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Disable sourcemaps in production for smaller bundle
    sourcemap: false,
    // Enable minification with esbuild (default, faster than terser)
    minify: 'esbuild'
  },
  server: {
    proxy: {
      // Proxy API requests to backend in development
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});

