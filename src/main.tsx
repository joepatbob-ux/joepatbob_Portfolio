import { inject } from '@vercel/analytics'
import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import Root from './Root'

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
  hydrateRoot(root, app)
} else {
  createRoot(root).render(app)
}

inject()
