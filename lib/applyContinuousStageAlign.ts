import { CHAPTER_SLOT_SELECTOR } from '@/lib/chapterSlideshow'
import { isContinuousChapters } from '@/lib/continuousChapters'
import { isTopBarNavViewport } from '@/lib/layout/isTopBarNavViewport'

const STAGE_SELECTOR = `${CHAPTER_SLOT_SELECTOR} .chapter-slide__stage:not(:has(.flow-chapter-slide__stage--empty))`
const STAGE_PIN_REVEAL = 0.28

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function copyContentTop(copy: HTMLElement): number {
  const anchor =
    copy.querySelector<HTMLElement>(
      '.chapter-copy-scroller, .chapter-copy__headline, .case-study-section-header',
    ) ?? copy
  return anchor.getBoundingClientRect().top
}

function clearStagePin(stage: HTMLElement, artifact: HTMLElement | null): void {
  delete stage.dataset.stagePinned
  stage.style.removeProperty('visibility')
  stage.style.removeProperty('opacity')
  stage.style.removeProperty('pointer-events')
  stage.style.removeProperty('z-index')
  if (!artifact) return
  artifact.style.removeProperty('transform')
  delete artifact.dataset.stageAlignY
}

/** Chapter with highest reveal that has a stage column (ignores copy-only overviews). */
function pickStagePinId(revealMap: Record<string, number>): string | null {
  let bestId: string | null = null
  let bestReveal = 0

  document.querySelectorAll<HTMLElement>(STAGE_SELECTOR).forEach((stage) => {
    const chapterId = stage.closest<HTMLElement>('[data-chapter-id]')?.dataset.chapterId
    if (!chapterId) return
    const reveal = revealMap[chapterId] ?? 0
    if (reveal >= STAGE_PIN_REVEAL && reveal > bestReveal) {
      bestReveal = reveal
      bestId = chapterId
    }
  })

  return bestId
}

/** Clear scroll-driven stage offsets (legacy slideshow / top-bar nav). */
export function resetContinuousStageAlign(): void {
  document.querySelectorAll<HTMLElement>(STAGE_SELECTOR).forEach((stage) => {
    clearStagePin(stage, stage.firstElementChild as HTMLElement | null)
  })
}

/**
 * Continuous desktop: one pinned stage at a time; tracks content top → viewport center.
 */
export function applyContinuousStageAlign(
  revealMap: Record<string, number>,
  _activeSlideId: string | null,
): void {
  if (!isContinuousChapters() || isTopBarNavViewport()) {
    resetContinuousStageAlign()
    return
  }

  const vh = window.innerHeight
  if (vh <= 0) return

  const viewportCenterY = vh / 2
  const reducedMotion = prefersReducedMotion()
  const pinId = pickStagePinId(revealMap)

  document.querySelectorAll<HTMLElement>(STAGE_SELECTOR).forEach((stage) => {
    const slot = stage.closest<HTMLElement>('[data-chapter-id]')
    const chapterId = slot?.dataset.chapterId
    const copy = slot?.querySelector<HTMLElement>('.chapter-slide__copy')
    const artifact = stage.firstElementChild as HTMLElement | null
    if (!chapterId || !copy || !artifact) return

    const pinned = chapterId === pinId

    if (!pinned) {
      clearStagePin(stage, artifact)
      return
    }

    stage.dataset.stagePinned = 'true'
    stage.style.visibility = 'visible'
    stage.style.opacity = '1'
    stage.style.pointerEvents = 'auto'
    stage.style.zIndex = '2'

    const contentTop = copyContentTop(copy)
    const artifactH = artifact.offsetHeight
    if (artifactH <= 0) return

    const stickTop = viewportCenterY - artifactH / 2
    const targetTop = reducedMotion ? stickTop : contentTop > stickTop ? contentTop : stickTop
    const naturalTop = stage.getBoundingClientRect().top + artifact.offsetTop
    const translateY = Math.round((targetTop - naturalTop) * 100) / 100
    const key = String(translateY)

    if (artifact.dataset.stageAlignY === key) return
    artifact.dataset.stageAlignY = key
    artifact.style.transform = translateY === 0 ? '' : `translate3d(0, ${translateY}px, 0)`
  })
}
