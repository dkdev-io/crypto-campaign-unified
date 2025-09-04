import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react({
    // DISABLE ALL AUTO-FORMATTING IN VITE
    babel: {
      compact: false,
      minified: false,
      parserOpts: {
        strictMode: false,
      },
      generatorOpts: {
        retainLines: true,
        compact: false,
        minified: false,
      }
    }
  })],
  base: '/',
  server: {
    port: 5173,
    // DISABLE HMR FORMATTING
    hmr: {
      overlay: false
    },
    watch: {
      // Don't watch for formatting changes
      ignored: ['**/.prettierrc*', '**/.eslintrc*']
    }
  },
  build: {
    outDir: 'dist',
    // DISABLE MINIFICATION TO PRESERVE FORMATTING
    minify: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
});
