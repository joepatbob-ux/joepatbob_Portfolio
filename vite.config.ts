import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      'next/font/google': path.resolve(__dirname, 'vite/shims/next-font-google.ts'),
      'next/link': path.resolve(__dirname, 'vite/shims/next-link.tsx'),
      'next/dynamic': path.resolve(__dirname, 'vite/shims/next-dynamic.tsx'),
    },
  },
  // No manualChunks: under rolldown the old grouping fused three+drei+react-dom
  // into one eager chunk. Default splitting keeps the 3D stack behind the lazy
  // section/stage boundaries; the entry must not import it.
  server: {
    port: 3000,
    strictPort: true,
  },
  preview: {
    port: 3000,
    strictPort: true,
  },
})
