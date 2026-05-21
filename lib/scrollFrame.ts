/** One rAF per scroll/resize — shared by nav choreography and chapter reveals. */

type FrameCallback = () => void

const callbacks = new Set<FrameCallback>()
const syncCallbacks = new Set<FrameCallback>()
let rafId = 0
let listening = false

function runFrame() {
  rafId = 0
  callbacks.forEach((cb) => {
    cb()
  })
}

function onScrollOrResize() {
  syncCallbacks.forEach((cb) => {
    cb()
  })
  if (rafId) return
  rafId = requestAnimationFrame(runFrame)
}

function ensureListening() {
  if (listening || typeof window === 'undefined') return
  listening = true
  window.addEventListener('scroll', onScrollOrResize, { passive: true })
  window.addEventListener('resize', onScrollOrResize, { passive: true })
  onScrollOrResize()
}

/** Register a scroll-linked update; runs at most once per animation frame. */
export function scheduleScrollFrame(callback: FrameCallback): () => void {
  callbacks.add(callback)
  ensureListening()
  return () => {
    callbacks.delete(callback)
  }
}

/** Runs synchronously on each scroll/resize (before rAF) — for hero bg/transform sync. */
export function scheduleScrollFrameSync(callback: FrameCallback): () => void {
  syncCallbacks.add(callback)
  ensureListening()
  return () => {
    syncCallbacks.delete(callback)
  }
}

/** Force one coalesced frame (e.g. after programmatic scroll). */
export function flushScrollFrame() {
  onScrollOrResize()
}
