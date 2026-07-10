import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  // No manualChunks: under rolldown the old grouping fused three+drei+react-dom
  // into one eager chunk. Default splitting keeps the 3D stack behind the lazy
  // section/stage boundaries; the entry must not import it.
  build: {
    // The three/fiber/drei chunk is ~860KB by design: lazy-loaded, never on
    // the critical path, idle-prefetched. Warn only if it grows past this.
    chunkSizeWarningLimit: 1000,
    // The default CSS minifier merges `backdrop-filter` with its -webkit-
    // twin and keeps only the prefixed form — which modern Chrome (incl.
    // Android) does not implement. esbuild preserves both declarations.
    cssMinify: 'esbuild',
  },
  server: {
    host: true,
    port: 3000,
    strictPort: true,
  },
  preview: {
    host: true,
    port: 3000,
    strictPort: true,
  },
})
