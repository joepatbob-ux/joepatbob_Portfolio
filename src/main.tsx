import { inject } from '@vercel/analytics'
import { initContinuousChaptersClass } from '@/lib/scroll/continuousChapters'
import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import Root from './Root'

initContinuousChaptersClass()

const root = document.getElementById('root')
if (!root) {
  throw new Error('Root element #root not found')
}

const app = (
  <StrictMode>
    <Root />
  </StrictMode>
)

if (root.hasChildNodes()) {
  hydrateRoot(root, app, {
    onRecoverableError(error, errorInfo) {
      console.error(
        '[hydration]',
        error instanceof Error ? error.message : String(error),
        errorInfo?.componentStack ?? '',
      )
    },
  })
} else {
  createRoot(root).render(app)
}

inject()
