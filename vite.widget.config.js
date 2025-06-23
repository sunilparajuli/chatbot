// vite.widget.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// This config is ONLY for building the widget library
export default defineConfig({
  plugins: [react()],
  build: {
    // Library mode configuration
    lib: {
      entry: 'src/widget.jsx', // The new widget entry point
      name: 'ReactChatWidget', // A global variable name for the library
      fileName: 'widget',      // The output filename will be widget.js
      formats: ['umd'],        // Universal Module Definition works everywhere
    },
    // We want all CSS bundled into the single JS file
    cssCodeSplit: false,
  },
})