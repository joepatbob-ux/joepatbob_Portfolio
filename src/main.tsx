import { inject } from '@vercel/analytics'
import { injectSpeedInsights } from '@vercel/speed-insights'
import { initContinuousChaptersClass } from '@/lib/scroll/continuousChapters'
import { initDeckModeClass } from '@/lib/deck/deckMode'
import { LAYOUT_BP } from '@/lib/layout/breakpoints'
import { EMAIL_BOTTOM_PX } from '@/components/sidebar/constants'
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
    fixGhostNavRest(container, copy)
    ghost.appendChild(copy)
  } else {
    while (container.firstChild) ghost.appendChild(container.firstChild)
  }
  document.body.appendChild(ghost)
  return ghost
}

/* The snapshot bakes the sidebar nav sentence with an inline `top` computed
 * for the 900px-tall capture viewport. On any other viewport height the
 * ghost paints it mid-screen and the dissolve visibly morphs it down to the
 * live hero rest position. Recompute that rest position for THIS viewport —
 * same formula as useSidebarNavState's measureLayout, measured against the
 * already-laid-out baked DOM. */
function fixGhostNavRest(container: HTMLElement, copy: HTMLElement): void {
  const navWrap = container.querySelector<HTMLElement>('[data-sidebar-main-nav]')
  const contact = container.querySelector<HTMLElement>('.sidebar-contact')
  const cloneNav = copy.querySelector<HTMLElement>('[data-sidebar-main-nav]')
  if (!navWrap || !contact || !cloneNav) return
  const safeBottom =
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(
        '--safe-area-bottom',
      ),
    ) || 0
  const rest =
    window.innerHeight -
    EMAIL_BOTTOM_PX -
    safeBottom -
    contact.clientHeight -
    12 -
    navWrap.clientHeight
  if (rest > 0) cloneNav.style.top = `${rest}px`
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
      if (typeof t.copyScrollBlur === 'number')
        document.documentElement.dataset.copyScrollBlur = String(t.copyScrollBlur)
      if (typeof t.stageMs === 'number')
        s.setProperty('--stage-exit-duration', `${t.stageMs}ms`)
      if (typeof t.stageBlur === 'number')
        s.setProperty('--stage-exit-blur', `${t.stageBlur}px`)
      if (typeof t.stagePauseMs === 'number')
        document.documentElement.dataset.stagePauseMs = String(t.stagePauseMs)
    }
  } catch {
    /* corrupted overrides are ignored */
  }
  return { holdMs, totalMs: holdMs + durationMs + 150 }
}

const fadeTune = applyFadeTuneOverrides()

function releaseGhost(ghost: HTMLElement | null): void {
  if (!ghost) return
  // Two frames so the live tree has painted underneath before the fade. The
  // removal is chained off the fade start, NOT scheduled in parallel: the
  // initial render can block the main thread for hundreds of ms (phones
  // especially), during which rAF can't fire but a wall-clock timer keeps
  // counting — a parallel remove then yanks the ghost the moment the thread
  // frees, cutting the dissolve to a hard jump.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.setTimeout(() => {
        ghost.classList.add('prerender-ghost--out')
        window.setTimeout(() => ghost.remove(), fadeTune.totalMs - fadeTune.holdMs)
      }, fadeTune.holdMs)
    })
  })
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

// Own-device opt-out so testing doesn't pollute analytics: visit ?track=off
// once per browser to set a sticky flag (?track=on to undo), and beforeSend
// drops every event client-side while it's set.
const TRACK_OPT_OUT_KEY = 'va-disable'
try {
  const track = new URLSearchParams(window.location.search).get('track')
  if (track === 'off') window.localStorage.setItem(TRACK_OPT_OUT_KEY, '1')
  if (track === 'on') window.localStorage.removeItem(TRACK_OPT_OUT_KEY)
} catch {
  // Storage unavailable (private mode) — events just send normally.
}
const dropIfOptedOut = <T,>(event: T): T | null => {
  try {
    if (window.localStorage.getItem(TRACK_OPT_OUT_KEY)) return null
  } catch {
    // Storage unavailable — treat as opted in.
  }
  return event
}
inject({ beforeSend: dropIfOptedOut })
injectSpeedInsights({ beforeSend: dropIfOptedOut })
