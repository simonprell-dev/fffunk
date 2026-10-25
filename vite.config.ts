import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  // cactus-needle lädt Worker und WASM über import.meta.url → nicht vorbündeln.
  optimizeDeps: {
    exclude: ['cactus-needle'],
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
