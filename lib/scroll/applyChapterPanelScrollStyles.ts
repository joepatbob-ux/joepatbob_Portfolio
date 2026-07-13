import { isFixedSlideshowFlowChapter, isFlowChapterId } from '@/lib/chapterFlow'
import { isContinuousChapters } from '@/lib/scroll/continuousChapters'
import { CHAPTER_STICKER_SCROLL_VISIBILITY } from '@/lib/scroll/chapterVisibility'
import { CHAPTER_SLOT_SELECTOR } from '@/lib/scroll/chapterSlideshow'
import { isLayoutMobileViewport } from '@/lib/layout/isLayoutMobileViewport'
import { isTopBarNavViewport } from '@/lib/layout/isTopBarNavViewport'
import { panelZFromScrollReveal } from '@/lib/layout/stacking'
import { SCROLL_BLUR_PX, blurOutFromRevealForContinuous } from '@/lib/scroll/scrollBlur'

const PANEL_SELECTOR = `${CHAPTER_SLOT_SELECTOR} .portfolio-chapter-panel`

/** Instant hide before mount/scroll — legacy fixed-slideshow nav. */
export function hideAllChapterPanelsForNav(): void {
  document.querySelectorAll<HTMLElement>(PANEL_SELECTOR).forEach((panel) => {
    panel.style.opacity = '0'
    panel.style.visibility = 'hidden'
    panel.style.pointerEvents = 'none'
    panel.style.transition = 'none'
    panel.style.setProperty('--chapter-copy-opacity', '0')
    panel.style.setProperty('--chapter-copy-filter', 'none')
    panel.setAttribute('aria-hidden', 'true')
  })
}

/** Strip nav transition inline styles before scroll-driven opacity resumes. */
export function resetNavChapterPanelStyles(): void {
  document.querySelectorAll<HTMLElement>(PANEL_SELECTOR).forEach((panel) => {
    panel.style.removeProperty('opacity')
    panel.style.removeProperty('filter')
    panel.style.removeProperty('transition')
    panel.style.removeProperty('visibility')
    panel.style.removeProperty('z-index')
    panel.style.removeProperty('pointer-events')
  })
}

/** Top-bar nav: panels scroll in-flow — strip scroll-linked inline styles. */
export function resetInFlowChapterPanels(): void {
  document.querySelectorAll<HTMLElement>(PANEL_SELECTOR).forEach((panel) => {
    panel.style.removeProperty('opacity')
    panel.style.removeProperty('z-index')
    panel.style.removeProperty('pointer-events')
    panel.style.removeProperty('filter')
    panel.style.removeProperty('transition')
    panel.style.removeProperty('visibility')
    panel.style.removeProperty('--chapter-copy-opacity')
    panel.style.removeProperty('--chapter-copy-filter')
    panel.removeAttribute('aria-hidden')
  })
}

/** Strip continuous copy fade vars when leaving cinema scroll mode. */
export function resetContinuousCopyFade(): void {
  document.querySelectorAll<HTMLElement>(PANEL_SELECTOR).forEach((panel) => {
    panel.style.removeProperty('--chapter-copy-opacity')
    panel.style.removeProperty('--chapter-copy-filter')
  })
}

/** Imperative copy opacity each rAF — avoids React reveal stepping. */
export function applyContinuousCopyFade(
  copyRevealMap: Record<string, number>,
): void {
  if (!isContinuousChapters() || isTopBarNavViewport()) return

  document.querySelectorAll<HTMLElement>(CHAPTER_SLOT_SELECTOR).forEach((slot) => {
    const id = slot.dataset.chapterId
    if (!id) return
    const panel = slot.querySelector<HTMLElement>('.portfolio-chapter-panel')
    if (!panel) return

    const reveal = copyRevealMap[id] ?? 0
    const { opacity, filter } = blurOutFromRevealForContinuous(
      reveal,
      SCROLL_BLUR_PX,
    )
    const opacityKey = opacity.toFixed(3)
    const filterKey = filter
    if (panel.dataset.copyFadeOpacity === opacityKey && panel.dataset.copyFadeFilter === filterKey) {
      return
    }
    panel.dataset.copyFadeOpacity = opacityKey
    panel.dataset.copyFadeFilter = filterKey
    panel.style.setProperty('--chapter-copy-opacity', opacityKey)
    panel.style.setProperty('--chapter-copy-filter', filter)
  })
}

/** Imperative panel opacity/z-index during scroll — desktop fixed slideshow only. */
export function applyChapterPanelScrollStyles(
  revealMap: Record<string, number>,
  _activeSlideId: string | null,
): void {
  if (isTopBarNavViewport() || isContinuousChapters()) return

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
        const reveal = scrollReveal
        const isActive = scrollReveal > 0.5
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
      const isActive = scrollReveal > 0.5
      opacity = reveal
      zIndex = panelZFromScrollReveal(reveal, layoutMobile)
      pointerEvents = isActive ? 'auto' : 'none'
    }

    panel.style.opacity = String(opacity)
    panel.style.zIndex = String(zIndex)
    panel.style.pointerEvents = pointerEvents
    panel.style.filter = 'none'
    panel.style.transition = 'none'
    panel.style.visibility = opacity <= 0.02 ? 'hidden' : 'visible'
    panel.setAttribute('aria-hidden', opacity < 0.08 ? 'true' : 'false')
  })
}

/** Sticker visibility from scroll — selected stickers stay managed in React. */
export function applyPlacedStickerScrollVisibility(
  revealMap: Record<string, number>,
  activeSlideId: string | null,
  inHero = false,
): void {
  const topBarNav = isTopBarNavViewport() || isContinuousChapters()

  document.querySelectorAll<HTMLElement>('.sticker-placed').forEach((root) => {
    if (root.classList.contains('sticker-placed--selected')) return
    if (root.classList.contains('sticker-placed--ghost')) return

    const chapterId = root.dataset.stickerChapterId
    if (!chapterId) return

    let visible: boolean
    if (topBarNav) {
      visible = !inHero && activeSlideId === chapterId
    } else {
      const reveal = revealMap[chapterId] ?? 0
      visible = reveal > CHAPTER_STICKER_SCROLL_VISIBILITY
    }

    const next = visible ? 'true' : 'false'
    if (root.dataset.stickerScrollVisible === next) return

    root.dataset.stickerScrollVisible = next
    root.style.opacity = visible ? '1' : '0'
    root.style.visibility = visible ? 'visible' : 'hidden'
  })
}
