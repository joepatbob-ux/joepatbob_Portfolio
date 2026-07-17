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

/** Events that describe the session rather than a visitor action. */
const PASSIVE_EVENTS = new Set([
  'chapter-view',
  'chapter-complete',
  'session-state',
  'session-end',
  'client-error',
])

let interactionCount = 0

export function trackEvent(name: string, props?: EventProps): void {
  if (isPrerenderSnapshot()) return
  if (!PASSIVE_EVENTS.has(name)) interactionCount += 1
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
 * Dashboard-friendly duration: the Events panel groups by property value, so
 * raw seconds would fragment into one-off rows. Raw seconds ride along too.
 */
function durationBucket(seconds: number): string {
  if (seconds < 10) return '<10s'
  if (seconds < 30) return '10-30s'
  if (seconds < 60) return '30-60s'
  if (seconds < 180) return '1-3m'
  if (seconds < 600) return '3-10m'
  return '10m+'
}

function chaptersViewedCount(): number {
  let count = 0
  for (const key of firedOnce) if (key.startsWith('chapter:')) count += 1
  return count
}

/** How engaged this visit is right now — shared by contact and session-end. */
export function engagementProps(): EventProps {
  const seconds = Math.round(performance.now() / 1000)
  return {
    seconds,
    duration: durationBucket(seconds),
    chaptersViewed: chaptersViewedCount(),
  }
}

/** Vercel populates these from the visitor's IP on real deployments. */
type GeoResponse = {
  country?: string | null
  region?: string | null
  city?: string | null
}

async function fetchGeo(): Promise<GeoResponse | null> {
  try {
    const signal =
      typeof AbortSignal.timeout === 'function'
        ? AbortSignal.timeout(3000)
        : undefined
    const res = await fetch('/api/geo', { signal })
    if (!res.ok) return null
    return (await res.json()) as GeoResponse
  } catch {
    // Local dev / preview has no function — the event just goes out without geo.
    return null
  }
}

const RETURNING_KEY = 'has-visited'

/**
 * One `session-state` event per load describing who's visiting and in what
 * state they experience the site — geography down to state/city (the Vercel
 * dashboard only shows country on its own), resolved theme, layout band,
 * pointer, motion, deck, timezone/language, and first-time vs returning.
 * Deferred to idle so it never competes with boot/hydration work; the theme is
 * read from `html[data-theme]`, which ThemeProvider has set by then.
 */
export function initSessionStateTracking(): void {
  if (isPrerenderSnapshot()) return
  const fire = async () => {
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

    // Stored value is the last visit's epoch-ms (legacy '1' from the first
    // rollout still counts as returning, just without a gap).
    let returning = false
    let daysSinceLast: number | null = null
    try {
      const raw = window.localStorage.getItem(RETURNING_KEY)
      returning = raw != null
      const last = Number(raw)
      if (Number.isFinite(last) && last > 1e12) {
        daysSinceLast = Math.max(0, Math.round((Date.now() - last) / 86_400_000))
      }
      window.localStorage.setItem(RETURNING_KEY, String(Date.now()))
    } catch {
      // Storage unavailable — counts as a first visit.
    }

    const props: EventProps = {
      theme,
      layout,
      pointer: mq('(pointer: coarse)') ? 'coarse' : 'fine',
      reducedMotion: mq('(prefers-reduced-motion: reduce)'),
      deck: document.documentElement.classList.contains(DECK_MODE_CLASS),
      returning,
      lang: navigator.language,
    }
    if (daysSinceLast != null) props.daysSinceLast = daysSinceLast
    try {
      props.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    } catch {
      // Timezone stays unset.
    }

    const geo = await fetchGeo()
    if (geo?.country) props.country = geo.country
    if (geo?.region) props.region = geo.region
    if (geo?.city) props.city = geo.city

    trackEventOnce('session-state', 'session-state', props)
  }
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(() => void fire(), { timeout: 4000 })
  } else {
    window.setTimeout(() => void fire(), 2000)
  }
}

/** A chapter counts as viewed once its copy reveal crosses this fraction. */
const CHAPTER_VIEWED_REVEAL = 0.5
/** …and complete once the copy has (nearly) fully revealed — view vs complete
 * is the per-chapter drop-off funnel. */
const CHAPTER_COMPLETE_REVEAL = 0.95

/**
 * Fire `chapter-view` / `chapter-complete` once per chapter per load, driven
 * by the scroll system's published reveal map (works on continuous desktop
 * and top-bar mobile alike). Subscribe-only and Set-guarded — nothing
 * measurable on the scroll hot path.
 */
export function initChapterViewTracking(): void {
  if (isPrerenderSnapshot()) return
  let ids: string[] | null = null
  subscribeChapterScrollState(() => {
    ids ??= Array.from(
      document.querySelectorAll<HTMLElement>(CHAPTER_SLOT_SELECTOR),
    ).map((slot) => slot.dataset.chapterId ?? '')
    for (const id of ids) {
      if (!id || firedOnce.has(`chapter-done:${id}`)) continue
      const reveal = chapterRevealForId(id)
      if (reveal >= CHAPTER_VIEWED_REVEAL) {
        trackEventOnce(`chapter:${id}`, 'chapter-view', { chapter: id })
      }
      if (reveal >= CHAPTER_COMPLETE_REVEAL) {
        trackEventOnce(`chapter-done:${id}`, 'chapter-complete', { chapter: id })
      }
    }
  })
}

/**
 * One `session-end` snapshot per load: time engaged, chapters viewed, and
 * whether/how much they interacted. Fired on the first tab-hide
 * (visibilitychange → hidden is the only leave signal mobile reliably
 * delivers), with pagehide as a fallback — so a visit that tabs away and
 * returns reports its state as of the first leave.
 */
export function initSessionEndTracking(): void {
  if (isPrerenderSnapshot()) return
  const fire = () => {
    trackEventOnce('session-end', 'session-end', {
      ...engagementProps(),
      interacted: interactionCount > 0,
      interactions: interactionCount,
    })
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') fire()
  })
  window.addEventListener('pagehide', fire)
}

/**
 * One `client-error` per load if anything throws uncaught — insurance so a
 * browser-specific breakage shows up in the dashboard instead of never being
 * known. Message only (truncated); Vercel's built-in dimensions carry the
 * browser/OS.
 */
export function initClientErrorTracking(): void {
  if (isPrerenderSnapshot()) return
  const report = (kind: 'error' | 'rejection', message: unknown) => {
    trackEventOnce('client-error', 'client-error', {
      kind,
      message: String(message ?? 'unknown').slice(0, 120),
    })
  }
  window.addEventListener('error', (event) => report('error', event.message))
  window.addEventListener('unhandledrejection', (event) =>
    report(
      'rejection',
      event.reason instanceof Error ? event.reason.message : event.reason,
    ),
  )
}
