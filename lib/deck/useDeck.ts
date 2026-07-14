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
  // fully covering the viewport = the deck owns the wheel
  return r.top <= 2 && r.bottom >= vh - 2
}

/**
 * Desktop deck driver: maps a momentum-gated wheel to chapter steps and keeps
 * the URL hash in sync so any chapter is a shareable link. Only engages when the
 * deck stage fills the viewport; at the first/last chapter it releases the wheel
 * so the page scrolls back to the interlude (up) or footer (down).
 */
export function useDeck() {
  const { activeSlideId, navigateToChapter } = useChapterNav()
  const activeRef = useRef<string | null>(activeSlideId)
  activeRef.current = activeSlideId

  // ── wheel → chapter steps ───────────────────────────────────────
  useEffect(() => {
    let armed = true
    let armIdle = 0
    let lastStepAt = 0

    const step = (dir: 1 | -1) => {
      const order = chapterOrder()
      const cur = activeRef.current
      const i = cur ? order.indexOf(cur) : -1
      if (i < 0) return false
      const next = i + dir
      if (next < 0 || next >= order.length) return false // at an end → release
      navigateToChapter(order[next])
      return true
    }

    const onWheel = (e: WheelEvent) => {
      if (!isDeckActive() || !deckStageInView()) return // let the page scroll
      const dy = e.deltaY
      const dir: 1 | -1 = dy > 0 ? 1 : -1

      // Reading zone: a scrollable copy region scrolls through before we
      // navigate. Allow a little slack at each edge — a chapter that "almost
      // fits" (a few px of overflow) then advances on the first flick instead
      // of demanding a wasted flick to nudge the copy to the exact pixel bottom.
      // That exact-bottom requirement was what made section-boundary crossings
      // (the last chapter's copy is often just-barely taller than the frame)
      // feel inconsistent — sometimes one flick, sometimes two.
      const scroller = (e.target as Element | null)?.closest?.(
        '.chapter-copy-scroller',
      ) as HTMLElement | null
      if (scroller) {
        const EDGE_SLACK = 48 // px from an edge that still counts as "at the edge"
        const remainingDown =
          scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop
        const remainingUp = scroller.scrollTop
        if ((dir > 0 && remainingDown > EDGE_SLACK) || (dir < 0 && remainingUp > EDGE_SLACK))
          return // native scroll through the copy first
      }

      // Re-arm only after a genuine pause (no wheel events for IDLE ms).
      window.clearTimeout(armIdle)
      armIdle = window.setTimeout(() => {
        armed = true
      }, IDLE)
      if (!armed || Math.abs(dy) < TRIGGER) {
        e.preventDefault()
        return
      }

      // at an end, don't preventDefault → the page scrolls out of the deck
      const order = chapterOrder()
      const i = activeRef.current ? order.indexOf(activeRef.current) : -1
      const atEnd =
        (dir > 0 && i === order.length - 1) || (dir < 0 && i === 0)
      if (atEnd) return

      e.preventDefault()
      armed = false
      // Consume the wheel but don't advance again until the cooldown clears —
      // stops a single flick's momentum tail from stepping twice.
      if (performance.now() - lastStepAt < STEP_COOLDOWN) return
      lastStepAt = performance.now()
      step(dir)
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

  // On load / hash change, land on the hash chapter (or the first one).
  useEffect(() => {
    if (!isDeckActive()) return
    const applyHash = () => {
      const order = chapterOrder()
      if (!order.length) return
      const id = decodeURIComponent(window.location.hash.slice(1))
      const target = id && order.includes(id) ? id : activeRef.current ?? order[0]
      if (target && target !== activeRef.current) navigateToChapter(target)
    }
    // let the chapters mount first
    const t = window.setTimeout(applyHash, 0)
    window.addEventListener('hashchange', applyHash)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('hashchange', applyHash)
    }
  }, [navigateToChapter])
}
