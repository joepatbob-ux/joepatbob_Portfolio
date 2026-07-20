/**
 * Scroll-position → 0–1 reveal amount for a chapter stage artifact, shared by
 * every scrubbed reveal (the EIM dash draw and the generic stage reveal) so
 * they track scroll identically.
 *
 * Two regimes, because a stage is only *visible* over different spans in each:
 * • Continuous desktop — the artifact dissolves in and holds pinned at the
 *   viewport center while the copy scrolls past. That pinned span is the only
 *   stretch it's on screen, so progress tracks the slot's travel through it
 *   (revealing during the still-hidden approach would never be seen).
 * • Mobile / non-pinned — the artifact travels up the viewport and is visible
 *   the whole way, so progress tracks its center rising to the middle.
 */

const clamp01 = (p: number) => (p < 0 ? 0 : p > 1 ? 1 : p)

/** Center rises from this viewport fraction (bottom-ish) to the middle. */
const DRAW_START_FRAC = 0.98
const DRAW_END_FRAC = 0.5

export function stageScrubProgress(
  host: HTMLElement,
  continuousDesktop: boolean,
): number {
  const vh = window.innerHeight || 1
  if (continuousDesktop) {
    const slot = host.closest<HTMLElement>('.portfolio-chapter-slot')
    if (slot) {
      const r = slot.getBoundingClientRect()
      return clamp01(-r.top / Math.max(1, r.height - vh))
    }
  }
  const r = host.getBoundingClientRect()
  const center = r.top + r.height / 2
  const start = DRAW_START_FRAC * vh
  const end = DRAW_END_FRAC * vh
  return clamp01((start - center) / (start - end || 1))
}

/**
 * Coalesced scroll/resize subscription: calls `tick` at most once per frame on
 * scroll or resize (plus once immediately). Returns an unsubscribe. Imperative
 * on purpose — reveal writes hit a CSS var, never React state.
 */
export function onScrollTick(tick: () => void): () => void {
  let raf = 0
  const onScroll = () => {
    if (raf) return
    raf = requestAnimationFrame(() => {
      raf = 0
      tick()
    })
  }
  tick()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  return () => {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
    if (raf) cancelAnimationFrame(raf)
  }
}
