import { track } from '@vercel/analytics'

import { isPrerenderSnapshot } from '@/lib/isPrerenderSnapshot'
import { DECK_MODE_CLASS } from '@/lib/deck/deckMode'
import { LAYOUT_MQ } from '@/lib/layout/breakpoints'
import {
  chapterRevealForId,
  subscribeChapterScrollState,
  CHAPTER_SLOT_SELECTOR,
} from '@/lib/scroll/chapterSlideshow'

/**
 * Custom-event names, kept few and stable so the Vercel dashboard stays
 * scannable — variation goes in properties, not names. The ?track=off
 * device opt-out (src/main.tsx beforeSend) covers these automatically.
 */
type EventProps = Record<string, string | number | boolean>

export function trackEvent(name: string, props?: EventProps): void {
  if (isPrerenderSnapshot()) return
  try {
    track(name, props)
  } catch {
    // Analytics must never break the site.
  }
}

const firedOnce = new Set<string>()

/** Fire at most once per page load per key (e.g. one view per chapter). */
export function trackEventOnce(key: string, name: string, props?: EventProps): void {
  if (firedOnce.has(key)) return
  firedOnce.add(key)
  trackEvent(name, props)
}

/**
 * One `session-state` event per load describing the state the visitor actually
 * experiences the site in — resolved theme, layout band, pointer, motion, deck.
 * Vercel's built-in dimensions (device, OS, geo) don't cover any of these.
 * Deferred to idle so it never competes with boot/hydration work; the theme is
 * read from `html[data-theme]`, which ThemeProvider has set by then.
 */
export function initSessionStateTracking(): void {
  if (isPrerenderSnapshot()) return
  const fire = () => {
    const mq = (q: string) => window.matchMedia(q).matches
    const layout = mq(LAYOUT_MQ.cinema)
      ? 'cinema'
      : mq(LAYOUT_MQ.desktop)
        ? 'desktop'
        : mq(LAYOUT_MQ.tablet)
          ? 'tablet'
          : 'mobile'
    const theme =
      document.documentElement.dataset.theme ??
      (mq('(prefers-color-scheme: dark)') ? 'dark' : 'light')
    trackEventOnce('session-state', 'session-state', {
      theme,
      layout,
      pointer: mq('(pointer: coarse)') ? 'coarse' : 'fine',
      reducedMotion: mq('(prefers-reduced-motion: reduce)'),
      deck: document.documentElement.classList.contains(DECK_MODE_CLASS),
    })
  }
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(fire, { timeout: 4000 })
  } else {
    window.setTimeout(fire, 2000)
  }
}

/** A chapter counts as viewed once its copy reveal crosses this fraction. */
const CHAPTER_VIEWED_REVEAL = 0.5

/**
 * Fire `chapter-view` once per chapter per load, driven by the scroll
 * system's published reveal map (works on continuous desktop and top-bar
 * mobile alike). Subscribe-only and Set-guarded — nothing measurable on the
 * scroll hot path.
 */
export function initChapterViewTracking(): void {
  if (isPrerenderSnapshot()) return
  let ids: string[] | null = null
  subscribeChapterScrollState(() => {
    ids ??= Array.from(
      document.querySelectorAll<HTMLElement>(CHAPTER_SLOT_SELECTOR),
    ).map((slot) => slot.dataset.chapterId ?? '')
    for (const id of ids) {
      if (!id || firedOnce.has(`chapter:${id}`)) continue
      if (chapterRevealForId(id) >= CHAPTER_VIEWED_REVEAL) {
        trackEventOnce(`chapter:${id}`, 'chapter-view', { chapter: id })
      }
    }
  })
}
