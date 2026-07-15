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

/* Going live from the snapshot is otherwise a hard cut — on phones the fresh
 * render replaces the baked DOM outright, and on desktop the post-hydration
 * settle (reveal choreography initializing, effect-driven stage swaps) snaps
 * in place. Hold a frozen copy of the snapshot in an overlay and fade/blur it
 * out over the live tree instead. Desktop clones the nodes (hydration adopts
 * the originals); phones move them (createRoot clears the container anyway).
 * Only at the top of the page, where the two renders line up. */
function snapshotGhost(container: HTMLElement, mode: 'clone' | 'move') {
  if (!container.hasChildNodes() || window.scrollY > 0) return null
  const ghost = document.createElement('div')
  ghost.className = 'prerender-ghost'
  ghost.setAttribute('aria-hidden', 'true')
  if (mode === 'clone') {
    const copy = container.cloneNode(true) as HTMLElement
    copy.removeAttribute('id')
    ghost.appendChild(copy)
  } else {
    while (container.firstChild) ghost.appendChild(container.firstChild)
  }
  document.body.appendChild(ghost)
  return ghost
}

/* ?fadeTune=1 panel overrides — applied before the ghost mounts so a reload
 * tests the dialed values end to end. Visitor-local (localStorage) only. */
function applyFadeTuneOverrides(): { holdMs: number; totalMs: number } {
  let holdMs = 0
  let durationMs = 320
  try {
    const raw = window.localStorage.getItem('fade-tune')
    if (raw) {
      const t = JSON.parse(raw) as Record<string, unknown>
      const s = document.documentElement.style
      if (typeof t.ghostMs === 'number') {
        s.setProperty('--ghost-fade-duration', `${t.ghostMs}ms`)
        durationMs = t.ghostMs
      }
      if (typeof t.ghostBlur === 'number')
        s.setProperty('--ghost-fade-blur', `${t.ghostBlur}px`)
      if (typeof t.ghostHold === 'number') holdMs = t.ghostHold
      if (typeof t.stickerMs === 'number')
        s.setProperty('--sticker-exit-duration', `${t.stickerMs}ms`)
      if (typeof t.stickerBlur === 'number')
        s.setProperty('--sticker-exit-blur', `${t.stickerBlur}px`)
    }
  } catch {
    /* corrupted overrides are ignored */
  }
  return { holdMs, totalMs: holdMs + durationMs + 150 }
}

const fadeTune = applyFadeTuneOverrides()

function releaseGhost(ghost: HTMLElement | null): void {
  if (!ghost) return
  // Two frames so the live tree has painted underneath before the fade.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.setTimeout(() => {
        ghost.classList.add('prerender-ghost--out')
      }, fadeTune.holdMs)
    })
  })
  window.setTimeout(() => ghost.remove(), fadeTune.totalMs)
}

if (root.hasChildNodes() && snapshotMatchesViewport) {
  const ghost = snapshotGhost(root, 'clone')
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
    releaseGhost(ghost)
  })
} else {
  const ghost = snapshotGhost(root, 'move')
  createRoot(root).render(app)
  releaseGhost(ghost)
}

inject()
