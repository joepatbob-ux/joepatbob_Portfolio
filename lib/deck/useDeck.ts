import { useEffect, useRef } from 'react'
import { useChapterNav } from '@/components/ChapterNavProvider'
import { isDeckActive } from '@/lib/deck/deckMode'

// Momentum gate (ported from the locked prototype): one flick = one chapter.
const TRIGGER = 18 // |deltaY| that counts as an intentional step
const REARM = 6 //    |deltaY| at/below this = momentum ended → re-arm
const IDLE = 120 //   ms of quiet also re-arms (discrete mouse wheels)

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

      // reading zone: a scrollable copy region scrolls before we navigate
      const scroller = (e.target as Element | null)?.closest?.(
        '.chapter-copy-scroller',
      ) as HTMLElement | null
      if (scroller) {
        const atBottom =
          scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1
        const atTop = scroller.scrollTop <= 0
        if ((dir > 0 && !atBottom) || (dir < 0 && !atTop)) return // native scroll
      }

      window.clearTimeout(armIdle)
      armIdle = window.setTimeout(() => {
        armed = true
      }, IDLE)
      if (Math.abs(dy) <= REARM) armed = true
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
