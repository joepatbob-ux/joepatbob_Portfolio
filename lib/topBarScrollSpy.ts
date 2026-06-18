import { CHAPTER_SLOT_SELECTOR } from '@/lib/chapterSlideshow'
import { isTopBarInHeroScrollZone } from '@/lib/heroScroll'
import {
  measureSlideScrollState,
  publishSlideScrollState,
  type SlideScrollState,
} from '@/lib/scrollOrchestration'

type TopBarScrollListener = (state: SlideScrollState) => void

/** Passive top-bar scroll spy — IntersectionObserver for chapters, light hero check on scroll. */
export function bindTopBarScrollSpy(
  getPhase: () => 'idle' | 'out' | 'in',
  getLockId: () => string | null,
  onUpdate: TopBarScrollListener,
): () => void {
  if (typeof window === 'undefined') return () => {}

  let rafId = 0
  let lastInHero: boolean | null = null
  let lastActiveId: string | null = null
  let heroPaused = isTopBarInHeroScrollZone()

  const publish = () => {
    const state = measureSlideScrollState(getPhase(), getLockId())
    publishSlideScrollState(state)
    lastInHero = state.inHero
    lastActiveId = state.activeSlideId
    onUpdate(state)
  }

  const schedulePublish = () => {
    if (rafId) return
    rafId = window.requestAnimationFrame(() => {
      rafId = 0
      publish()
    })
  }

  const slots = Array.from(
    document.querySelectorAll<HTMLElement>(CHAPTER_SLOT_SELECTOR),
  )

  const io =
    typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(() => {
          if (heroPaused) return
          schedulePublish()
        }, {
          root: null,
          threshold: [0, 0.12, 0.35, 0.55, 0.75, 1],
        })
      : null

  slots.forEach((slot) => io?.observe(slot))

  const onScroll = () => {
    if (getPhase() !== 'idle') return
    const inHero = isTopBarInHeroScrollZone()
    if (inHero !== lastInHero || inHero !== heroPaused) {
      heroPaused = inHero
      schedulePublish()
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', schedulePublish, { passive: true })

  publish()

  return () => {
    if (rafId) window.cancelAnimationFrame(rafId)
    io?.disconnect()
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', schedulePublish)
  }
}
