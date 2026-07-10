import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  // Mirror the tsconfig `@/*` -> `./*` alias so tests import like app code.
  resolve: { alias: { '@': root } },
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
  },
})
