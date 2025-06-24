// vite.widget.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // We are still building a library
    lib: {
      entry: 'src/widget.jsx',
      name: 'ReactChatWidget',
      formats: ['umd'],
    },
    rollupOptions: {
      // --- THIS IS THE BULLETPROOF FIX ---
      // We are directly telling Rollup what to name the output files.
      output: {
        // This is for the main entry file.
        entryFileNames: 'widget.js',
        
        // This is for any code-split chunks (we don't have any, but it's good practice).
        chunkFileNames: 'widget-chunk.js',

        // This is for assets like CSS or images (our CSS is inlined, but good practice).
        assetFileNames: 'widget-asset.[ext]',
      },
    },
    // Keep this to ensure CSS is bundled into the JS
    cssCodeSplit: false,
    outDir: 'dist',
  },
})