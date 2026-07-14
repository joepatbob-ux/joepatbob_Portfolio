import { useEffect, useRef } from 'react'
import { useChapterNav } from '@/components/ChapterNavProvider'
import { isDeckActive } from '@/lib/deck/deckMode'

// Momentum gate: one flick = one chapter. The gate re-arms only after the wheel
// goes genuinely quiet (IDLE ms with no events) — NOT on an instantaneous small
// delta, because a trackpad's decay tail routinely dips low and spikes again
// inside one flick, which re-armed the gate and double-stepped ("touchy").
const TRIGGER = 18 // |deltaY| that counts as an intentional step
const IDLE = 160 //   ms of no wheel events before the gate re-arms
// Backstop hard cooldown after a step: even if the gate somehow re-arms, no
// second chapter advance until this clears. Wheel is still consumed meanwhile
// so the page can't scroll.
const STEP_COOLDOWN = 450 // ms between chapter steps
// A page snap (hero ⇄ breather ⇄ stage) animates a full viewport, longer than a
// chapter cross-fade — hold the gate until the smooth scroll has settled.
const SNAP_COOLDOWN = 620 // ms after a page snap before the next wheel acts

/** Ordered chapter ids as they appear in the document (the deck sequence). */
function chapterOrder(): string[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>(
      '.portfolio-chapter-slot[data-chapter-id]',
    ),
  )
    .map((el) => el.dataset.chapterId ?? '')
    .filter(Boolean)
}

function deckStageInView(): boolean {
  const stage = document.querySelector<HTMLElement>('.portfolio-sections')
  if (!stage) return false
  const r = stage.getBoundingClientRect()
  const vh = window.innerHeight
  // fully covering the viewport = a chapter is on screen (vs. hero / breather)
  return r.top <= 2 && r.bottom >= vh - 2
}

/** Document-Y of the three entry pages: [hero, breather, chapter stage]. */
function pageAnchors(): number[] {
  const topOf = (sel: string): number => {
    const el = document.querySelector<HTMLElement>(sel)
    return el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : 0
  }
  return [0, topOf('.portfolio-interlude'), topOf('.portfolio-sections')]
}

/** Which entry page the viewport is currently parked on. */
function nearestAnchorIndex(anchors: number[]): number {
  const y = window.scrollY
  let best = 0
  let bestDist = Infinity
  anchors.forEach((a, i) => {
    const d = Math.abs(a - y)
    if (d < bestDist) {
      bestDist = d
      best = i
    }
  })
  return best
}

/**
 * Desktop deck driver: one wheel-driven presentation. The deck owns every wheel
 * event (no free document scroll, no scrollbar). Before the chapter stage is on
 * screen the wheel snap-scrolls between the hero and breather pages; once the
 * stage fills the viewport it momentum-steps through chapters, and wheeling up
 * off the first chapter snaps back to the breather. The active chapter is
 * mirrored into the URL hash so any chapter is a shareable link.
 */
export function useDeck() {
  const { activeSlideId, navigateToChapter } = useChapterNav()
  const activeRef = useRef<string | null>(activeSlideId)
  activeRef.current = activeSlideId

  // ── wheel → hero ▸ breather ▸ chapter deck (one system) ─────────
  useEffect(() => {
    let armed = true
    let armIdle = 0
    let lockUntil = 0

    const step = (dir: 1 | -1) => {
      const order = chapterOrder()
      const cur = activeRef.current
      const i = cur ? order.indexOf(cur) : -1
      if (i < 0) return
      const next = i + dir
      if (next < 0 || next >= order.length) return
      navigateToChapter(order[next])
    }

    const snapTo = (y: number) => {
      window.scrollTo({ top: y, behavior: 'smooth' })
    }

    const onWheel = (e: WheelEvent) => {
      if (!isDeckActive()) return
      const dy = e.deltaY
      const dir: 1 | -1 = dy > 0 ? 1 : -1
      const inStage = deckStageInView()

      // Reading zone (chapters only): a scrollable copy region scrolls through
      // before we navigate. Allow a little slack at each edge — a chapter that
      // "almost fits" (a few px of overflow) advances on the first flick instead
      // of demanding a wasted flick to nudge the copy to the exact pixel bottom
      // (the cause of inconsistent section-boundary crossings).
      if (inStage) {
        const scroller = (e.target as Element | null)?.closest?.(
          '.chapter-copy-scroller',
        ) as HTMLElement | null
        if (scroller) {
          const EDGE_SLACK = 48 // px from an edge that still counts as "at the edge"
          const remainingDown =
            scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop
          const remainingUp = scroller.scrollTop
          if (
            (dir > 0 && remainingDown > EDGE_SLACK) ||
            (dir < 0 && remainingUp > EDGE_SLACK)
          ) {
            return // native scroll through the copy first
          }
        }
      }

      // The deck consumes every wheel event — the page never free-scrolls.
      e.preventDefault()

      // Re-arm only after a genuine pause (no wheel events for IDLE ms), so one
      // flick = one action even through a trackpad's decaying momentum tail.
      window.clearTimeout(armIdle)
      armIdle = window.setTimeout(() => {
        armed = true
      }, IDLE)
      if (!armed || Math.abs(dy) < TRIGGER) return
      armed = false
      if (performance.now() < lockUntil) return

      if (inStage) {
        const order = chapterOrder()
        const i = activeRef.current ? order.indexOf(activeRef.current) : -1
        if (dir < 0 && i === 0) {
          // up off the first chapter → back out to the breather page
          lockUntil = performance.now() + SNAP_COOLDOWN
          snapTo(pageAnchors()[1])
          return
        }
        if (i < 0 || (dir > 0 && i >= order.length - 1)) return // end of deck
        lockUntil = performance.now() + STEP_COOLDOWN
        step(dir)
        return
      }

      // Hero / breather pages: snap to the next page (and into the stage).
      const anchors = pageAnchors()
      const idx = nearestAnchorIndex(anchors)
      const nextIdx = Math.max(0, Math.min(anchors.length - 1, idx + dir))
      if (nextIdx === idx) return
      lockUntil = performance.now() + SNAP_COOLDOWN
      snapTo(anchors[nextIdx])
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.clearTimeout(armIdle)
    }
  }, [navigateToChapter])

  // ── mark the active slot so CSS shows only its panel ────────────
  // Covers every chapter uniformly (section overviews render their own panels
  // that the React opacity hook doesn't reach).
  const didFocusInitRef = useRef(false)
  useEffect(() => {
    if (!isDeckActive()) return
    let activeSlot: HTMLElement | null = null
    document
      .querySelectorAll<HTMLElement>('.portfolio-chapter-slot[data-chapter-id]')
      .forEach((el) => {
        const on = el.dataset.chapterId === activeSlideId
        el.toggleAttribute('data-deck-active', on)
        if (on) activeSlot = el
      })

    // Move focus to the new chapter's reading region so keyboard / AT users and
    // deep-link landings follow the swap (its outline is :focus-visible only, so
    // mouse-wheel users see nothing). Skip the first activation — landing on the
    // page shouldn't steal focus or jump-scroll.
    if (!didFocusInitRef.current) {
      didFocusInitRef.current = true
      return
    }
    if (!activeSlot) return
    const region =
      (activeSlot as HTMLElement).querySelector<HTMLElement>('.chapter-copy-scroller') ??
      (activeSlot as HTMLElement).querySelector<HTMLElement>('.portfolio-chapter-panel')
    region?.focus({ preventScroll: true })
  }, [activeSlideId])

  // ── hash deep-linking: URL ⇄ active chapter ─────────────────────
  // Reflect the active chapter into the hash so the page can be shared mid-deck.
  useEffect(() => {
    if (!isDeckActive() || !activeSlideId) return
    if (decodeURIComponent(window.location.hash.slice(1)) === activeSlideId) return
    window.history.replaceState(null, '', `#${encodeURIComponent(activeSlideId)}`)
  }, [activeSlideId])

  // On load / hash change, land on the hash chapter and bring the stage into
  // view. No hash → stay on the hero page. The target chapter may live in a
  // lazily-mounted section, so retry briefly while those chunks warm in before
  // giving up (a bogus hash simply lapses back to the hero).
  useEffect(() => {
    if (!isDeckActive()) return
    let cancelled = false
    const timers: number[] = []

    const landOnChapter = (id: string) => {
      if (id !== activeRef.current) navigateToChapter(id)
      const stageY = pageAnchors()[2]
      if (Math.abs(window.scrollY - stageY) > 2) window.scrollTo(0, stageY)
    }

    const applyHash = (attempt = 0) => {
      if (cancelled) return
      const id = decodeURIComponent(window.location.hash.slice(1))
      if (!id) return // no hash → hero
      const order = chapterOrder()
      if (order.includes(id)) {
        landOnChapter(id)
        return
      }
      if (attempt < 20) {
        timers.push(window.setTimeout(() => applyHash(attempt + 1), 80))
      }
    }

    applyHash()
    const onHashChange = () => applyHash()
    window.addEventListener('hashchange', onHashChange)
    return () => {
      cancelled = true
      timers.forEach((t) => window.clearTimeout(t))
      window.removeEventListener('hashchange', onHashChange)
    }
  }, [navigateToChapter])
}
