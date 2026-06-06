import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function vendorChunk(id: string): string | undefined {
  if (!id.includes('node_modules')) return undefined
  if (id.includes('three') || id.includes('@react-three')) {
    if (id.includes('@react-three/drei')) return 'vendor-drei'
    if (id.includes('@react-three/fiber')) return 'vendor-r3f'
    if (id.includes('@react-three/rapier')) return 'vendor-rapier'
    return 'vendor-three'
  }
  if (id.includes('react-dom') || id.includes('/react/')) return 'vendor-react'
  return undefined
}

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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          return vendorChunk(id)
        },
      },
    },
  },
  server: {
    port: 3000,
    strictPort: true,
  },
  preview: {
    port: 3000,
    strictPort: true,
  },
})
