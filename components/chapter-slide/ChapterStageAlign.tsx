import { isPrerenderSnapshot } from '@/lib/isPrerenderSnapshot'
import { useLayoutTopBarNav } from '@/lib/hooks/useLayoutTopBarNav'
import { isContinuousChapters } from '@/lib/scroll/continuousChapters'
import {
  onScrollTick,
  stageScrubProgress,
} from '@/lib/scroll/stageScrubProgress'
import { useEffect, useRef, type ReactNode } from 'react'

/** Reveal completes over this fraction of the visible span, then holds solid —
 * front-loaded so the artifact reads solid while the copy is read, not faint. */
const REVEAL_SPAN_FRAC = 0.34

/**
 * Uniform scroll-align surface — measured and transformed by continuous stage
 * align. It also carries the artifact's *reveal*: opacity scrubs 0→1 with
 * scroll position as the stage enters (matching the EIM dash draw), so every
 * chapter artifact reveals by scroll instead of a timed dissolve and none can
 * be scrolled past un-revealed. Opacity here composes under the container's own
 * dissolve (which the choreography gate measures) and never touches the box the
 * stage machine positions.
 */
export function ChapterStageAlign({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const topBarNav = useLayoutTopBarNav()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const show = () => el.style.setProperty('--stage-reveal', '1')

    // Baked snapshot / reduced motion: no scrub, just present.
    if (isPrerenderSnapshot()) return show()
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      show()
      return
    }

    const continuousDesktop = !topBarNav && isContinuousChapters()
    // Scrub only where the scroll flow reveals artifacts (continuous desktop or
    // the top-bar-nav mobile flow); elsewhere (deck, legacy) just present.
    if (!continuousDesktop && !topBarNav) {
      show()
      return
    }

    return onScrollTick(() => {
      const p = stageScrubProgress(el, continuousDesktop)
      el.style.setProperty(
        '--stage-reveal',
        Math.min(1, p / REVEAL_SPAN_FRAC).toFixed(4),
      )
    })
  }, [topBarNav])

  return (
    <div ref={ref} className="chapter-stage-align" data-chapter-stage-align>
      {children}
    </div>
  )
}
