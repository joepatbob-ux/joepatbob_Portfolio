import { isFixedSlideshowFlowChapter, isFlowChapterId } from '@/lib/chapterFlow'
import { CHAPTER_SLOT_SELECTOR } from '@/lib/chapterSlideshow'
import { isLayoutMobileViewport } from '@/lib/layout/isLayoutMobileViewport'
import { isTopBarNavViewport } from '@/lib/layout/isTopBarNavViewport'
import { panelZFromScrollReveal } from '@/lib/layout/stacking'

const PANEL_SELECTOR = `${CHAPTER_SLOT_SELECTOR} .portfolio-chapter-panel`

/** Top-bar nav: panels scroll in-flow — strip scroll-linked inline styles. */
export function resetInFlowChapterPanels(): void {
  document.querySelectorAll<HTMLElement>(PANEL_SELECTOR).forEach((panel) => {
    panel.style.removeProperty('opacity')
    panel.style.removeProperty('z-index')
    panel.style.removeProperty('pointer-events')
    panel.style.removeProperty('filter')
    panel.style.removeProperty('transition')
    panel.style.removeProperty('visibility')
    panel.removeAttribute('aria-hidden')
  })
}

/** Imperative panel opacity/z-index during scroll — desktop fixed slideshow only. */
export function applyChapterPanelScrollStyles(
  revealMap: Record<string, number>,
  activeSlideId: string | null,
): void {
  if (isTopBarNavViewport()) return

  const layoutMobile = isLayoutMobileViewport()

  document.querySelectorAll<HTMLElement>(CHAPTER_SLOT_SELECTOR).forEach((slot) => {
    const id = slot.dataset.chapterId
    if (!id) return
    const panel = slot.querySelector<HTMLElement>('.portfolio-chapter-panel')
    if (!panel) return

    const scrollReveal = revealMap[id] ?? 0
    const flowChapter = isFlowChapterId(id)
    const fixedSlideshowStacking =
      isFixedSlideshowFlowChapter(id) && !layoutMobile

    let opacity: number
    let zIndex: number
    let pointerEvents: 'auto' | 'none'

    if (flowChapter) {
      if (fixedSlideshowStacking) {
        let reveal = scrollReveal
        let isActive = scrollReveal > 0.5
        if (activeSlideId === id) {
          reveal = Math.max(reveal, 1)
          isActive = true
        }
        opacity = reveal
        zIndex = panelZFromScrollReveal(reveal, false)
        pointerEvents = isActive ? 'auto' : 'none'
      } else {
        const onScreen = scrollReveal > 0
        opacity = onScreen ? 1 : 0
        zIndex = onScreen ? 1 : 0
        pointerEvents = onScreen ? 'auto' : 'none'
      }
    } else {
      const reveal = scrollReveal
      const isActive =
        activeSlideId === id ? scrollReveal > 0.25 : scrollReveal > 0.5
      opacity = reveal
      zIndex = panelZFromScrollReveal(reveal, layoutMobile)
      pointerEvents = isActive ? 'auto' : 'none'
    }

    panel.style.opacity = String(opacity)
    panel.style.zIndex = String(zIndex)
    panel.style.pointerEvents = pointerEvents
    panel.style.filter = 'none'
    panel.style.transition = 'none'
    panel.setAttribute('aria-hidden', opacity < 0.08 ? 'true' : 'false')
  })
}

/** Sticker visibility from scroll — selected stickers stay managed in React. */
export function applyPlacedStickerScrollVisibility(
  revealMap: Record<string, number>,
  activeSlideId: string | null,
): void {
  const topBarNav = isTopBarNavViewport()

  document.querySelectorAll<HTMLElement>('.sticker-placed').forEach((root) => {
    if (root.classList.contains('sticker-placed--selected')) return
    if (root.classList.contains('sticker-placed--ghost')) return

    const chapterId = root.dataset.stickerChapterId
    if (!chapterId) return

    let visible: boolean
    if (topBarNav) {
      visible = activeSlideId === chapterId
    } else {
      const raw = revealMap[chapterId] ?? 0
      const reveal =
        activeSlideId === chapterId ? Math.max(raw, 1) : raw
      visible = reveal > 0.08
    }

    const next = visible ? 'true' : 'false'
    if (root.dataset.stickerScrollVisible === next) return

    root.dataset.stickerScrollVisible = next
    root.style.opacity = visible ? '1' : '0'
    root.style.visibility = visible ? 'visible' : 'hidden'
  })
}
