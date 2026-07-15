import { inject } from '@vercel/analytics'
import { initContinuousChaptersClass } from '@/lib/scroll/continuousChapters'
import { initDeckModeClass } from '@/lib/deck/deckMode'
import { LAYOUT_BP } from '@/lib/layout/breakpoints'
import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { preloadDynamicsForHydration } from '@/lib/dynamic'
import Root from './Root'

initContinuousChaptersClass()
initDeckModeClass()

const root = document.getElementById('root')
if (!root) {
  throw new Error('Root element #root not found')
}

const app = (
  <StrictMode>
    <Root />
  </StrictMode>
)

/* The prerender snapshot is captured at a desktop viewport. Phone/tablet
 * visitors render a structurally different tree (top-bar nav, compact chapter
 * views), so hydration could never match — render fresh instead of paying for
 * a doomed hydration pass. The static snapshot stays visible either way. */
const snapshotMatchesViewport = window.matchMedia(
  `(min-width: ${LAYOUT_BP.desktopMin}px)`,
).matches

if (root.hasChildNodes() && snapshotMatchesViewport) {
  // The snapshot bakes the lazy chapters' HTML; resolve their chunks first so
  // every boundary hydrates against real content instead of a fallback (the
  // static prerendered page stays visible while they load).
  void preloadDynamicsForHydration().then(() => {
    hydrateRoot(root, app, {
      onRecoverableError(error, errorInfo) {
        console.error(
          '[hydration]',
          error instanceof Error ? error.message : String(error),
          errorInfo?.componentStack ?? '',
        )
      },
    })
  })
} else {
  createRoot(root).render(app)
}

inject()
