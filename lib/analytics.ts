import { track } from '@vercel/analytics'

import { CONTACT_EMAIL } from '@/lib/contact'
import { isPrerenderSnapshot } from '@/lib/isPrerenderSnapshot'
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
  'arrival',
  'session-geo',
  'session-context',
  'session-return',
  'session-end',
  'client-error',
  'tab-return',
])

let interactionCount = 0
/** Seconds from load to the first real interaction — session-end reports it. */
let firstInteractionSec: number | null = null

/** Sticky device opt-out flag — set via ?track=off (src/main.tsx). */
export const TRACK_OPT_OUT_KEY = 'va-disable'

function optedOut(): boolean {
  try {
    return window.localStorage.getItem(TRACK_OPT_OUT_KEY) != null
  } catch {
    return false
  }
}

/**
 * Random per-load id so the portal can stitch one visit's events into a
 * story (geo + source + duration + what they did). Not persisted anywhere —
 * it identifies a page load, not a person.
 */
let sessionId: string | null = null
function getSessionId(): string {
  if (sessionId == null) {
    try {
      sessionId = crypto.randomUUID().slice(0, 8)
    } catch {
      sessionId = Math.random().toString(36).slice(2, 10)
    }
  }
  return sessionId
}

/**
 * First-party copy of every event → /api/track, feeding the private
 * dashboard at /analytics. Independent of the Vercel Analytics plan.
 * sendBeacon so exit-time events (session-end) survive the page going away.
 */
function sendFirstParty(name: string, props?: EventProps): void {
  if (optedOut()) return
  try {
    const body = JSON.stringify({
      name,
      props: props ?? {},
      sid: getSessionId(),
      path: window.location.pathname,
      ref: document.referrer,
    })
    const blob = new Blob([body], { type: 'application/json' })
    if (navigator.sendBeacon?.('/api/track', blob)) return
    void fetch('/api/track', {
      method: 'POST',
      keepalive: true,
      headers: { 'content-type': 'application/json' },
      body,
    }).catch(() => {})
  } catch {
    // Analytics must never break the site.
  }
}

export function trackEvent(name: string, props?: EventProps): void {
  if (isPrerenderSnapshot()) return
  if (!PASSIVE_EVENTS.has(name)) {
    interactionCount += 1
    firstInteractionSec ??= Math.round(performance.now() / 1000)
  }
  sendFirstParty(name, props)
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
 * raw seconds would fragment into one-off rows.
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

/**
 * How engaged this visit is right now, packed into one value — the Pro plan
 * keeps at most 2 properties per event, so events that also carry their own
 * dimension (e.g. contact's channel) get engagement as a single prop.
 */
export function engagementSummary(): string {
  const seconds = Math.round(performance.now() / 1000)
  return `${durationBucket(seconds)} · ${chaptersViewedCount()}ch`
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

function daysBucket(days: number): string {
  if (days < 1) return 'same-day'
  if (days === 1) return '1d'
  if (days <= 7) return '2-7d'
  if (days <= 30) return '8-30d'
  return '30d+'
}

/**
 * Per-visit context, split into small events because the Pro plan keeps at
 * most 2 properties per event (one fat event would arrive with most of its
 * dimensions stripped):
 *
 * - `arrival {source}` — utm_source from the landing URL. Stands in for the
 *   plan-gated UTM dashboard panel; only fires on tagged visits.
 * - `session-geo {state, city}` — from /api/geo (country is already a
 *   built-in dashboard panel).
 * - `session-context {theme, layout}` — dark/light and viewport band.
 * - `session-return {returning, gap}` — revisit flag + bucketed gap since
 *   the last visit.
 *
 * Deferred to idle so it never competes with boot/hydration work; the theme
 * is read from `html[data-theme]`, which ThemeProvider has set by then.
 */
export function initSessionStateTracking(): void {
  if (isPrerenderSnapshot()) return
  // First-party only — Vercel counts pageviews natively; the portal needs its
  // own visit marker (and it carries the geo/device columns server-side).
  sendFirstParty('page-view')
  try {
    const source = new URLSearchParams(window.location.search).get('utm_source')
    if (source) trackEventOnce('arrival', 'arrival', { source })
  } catch {
    // Malformed query string — skip attribution.
  }
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
    // motion is a third prop — Vercel's 2-prop plan limit strips it there,
    // but the first-party portal keeps every prop.
    trackEventOnce('session-context', 'session-context', {
      theme,
      layout,
      motion: mq('(prefers-reduced-motion: reduce)') ? 'reduced' : 'full',
    })

    // Stored value is the last visit's epoch-ms (legacy '1' from the first
    // rollout still counts as returning, just without a gap).
    try {
      const raw = window.localStorage.getItem(RETURNING_KEY)
      const props: EventProps = { returning: raw != null }
      const last = Number(raw)
      if (Number.isFinite(last) && last > 1e12) {
        props.gap = daysBucket(
          Math.max(0, Math.round((Date.now() - last) / 86_400_000)),
        )
      }
      window.localStorage.setItem(RETURNING_KEY, String(Date.now()))
      trackEventOnce('session-return', 'session-return', props)
    } catch {
      // Storage unavailable — counts as a first visit.
      trackEventOnce('session-return', 'session-return', { returning: false })
    }

    const geo = await fetchGeo()
    if (geo?.region || geo?.city) {
      trackEventOnce('session-geo', 'session-geo', {
        state: geo.region ?? 'unknown',
        city: geo.city ?? 'unknown',
      })
    }
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
    const seconds = Math.round(performance.now() / 1000)
    trackEventOnce('session-end', 'session-end', {
      duration: durationBucket(seconds),
      // Chapters read and whether they touched anything, in one packed prop
      // (2-property plan limit; duration deserves its own breakdown).
      engagement: `${chaptersViewedCount()}ch · ${interactionCount}int`,
      // Third prop, portal-only (Vercel strips past two): how long until
      // they first touched something — 'never' is a pure read-only visit.
      firstInt:
        firstInteractionSec == null ? 'never' : durationBucket(firstInteractionSec),
    })
  }
  let wasHidden = false
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      wasHidden = true
      fire()
    } else if (wasHidden) {
      // They tabbed away and came back — the session continued past its
      // session-end snapshot. Passive marker for the visit story.
      trackEventOnce('tab-return', 'tab-return')
    }
  })
  window.addEventListener('pagehide', fire)
}

/**
 * High-intent signals that would otherwise be invisible:
 * - `print` — someone printing the portfolio.
 * - `contact {channel: email-copy}` — copying the email address instead of
 *   clicking the mailto link (how many people actually reach out).
 */
export function initIntentSignalTracking(): void {
  if (isPrerenderSnapshot()) return
  window.addEventListener('beforeprint', () =>
    trackEventOnce('print', 'print', { engaged: engagementSummary() }),
  )
  document.addEventListener('copy', () => {
    try {
      const text = String(window.getSelection() ?? '')
      if (text.toLowerCase().includes(CONTACT_EMAIL.toLowerCase())) {
        trackEventOnce('email-copy', 'contact', {
          channel: 'email-copy',
          engaged: engagementSummary(),
        })
      }
    } catch {
      // Analytics must never break the site.
    }
  })
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
