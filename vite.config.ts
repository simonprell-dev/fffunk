import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    // Das Messe-Funkgerät (Android 9) hat Chrome 72: Syntax herunterübersetzen und fehlende APIs nachrüsten.
    legacy({ modernTargets: ['chrome >= 70', 'safari >= 13', 'firefox >= 78'], modernPolyfills: true, renderLegacyChunks: false }),
  ],
  // cactus-needle lädt Worker und WASM über import.meta.url → nicht vorbündeln.
  optimizeDeps: {
    exclude: ['cactus-needle'],
  },
  build: {
    outDir: 'dist',
    target: ['chrome70', 'safari13', 'firefox78'],
    cssTarget: 'chrome70', // z. B. inset → top/right/bottom/left
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
