import { CHAPTER_SLOT_SELECTOR } from '@/lib/chapterSlideshow'
import {
  CHAPTER_INTERACTIVE_VISIBILITY,
  CHAPTER_STAGE_PAINT_VISIBILITY,
} from '@/lib/chapterVisibility'
import { isContinuousChapters } from '@/lib/continuousChapters'
import { isTopBarNavViewport } from '@/lib/layout/isTopBarNavViewport'

const STAGE_SELECTOR = `${CHAPTER_SLOT_SELECTOR} .chapter-slide__stage:not(:has(.flow-chapter-slide__stage--empty))`
const ALIGN_SELECTOR = '[data-chapter-stage-align]'
const STAGE_PIN_REVEAL = CHAPTER_STAGE_PAINT_VISIBILITY
const PIN_HYSTERESIS = 0.12
const STAGE_INTERACTIVE_OPACITY = 0.38
const STAGE_CLEAR_THRESHOLD = 0.004
const CENTER_ENTER_BLEND_VH = 0.22
const CENTER_ENTER_BLEND_MIN_PX = 120
const STAGE_EXIT_TRAVEL_PX = 140
const ALIGN_HEIGHT_MIN_PX = 48

type AlignPhase = 'idle' | 'enter' | 'center' | 'exit'

let committedPinId: string | null = null
let exitingPinId: string | null = null
const stageVisibleLatch = new Set<string>()

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function easeOutQuart(t: number): number {
  const x = Math.max(0, Math.min(1, t))
  return 1 - Math.pow(1 - x, 4)
}

function stageAlignTarget(stage: HTMLElement): HTMLElement | null {
  return (
    stage.querySelector<HTMLElement>(ALIGN_SELECTOR) ??
    (stage.firstElementChild as HTMLElement | null)
  )
}

function copyContentTop(copy: HTMLElement): number {
  const anchor =
    copy.querySelector<HTMLElement>('.chapter-copy__headline') ??
    copy.querySelector<HTMLElement>('.case-study-section-header__headline') ??
    copy.querySelector<HTMLElement>('.case-study-section-header') ??
    copy
  return Math.round(anchor.getBoundingClientRect().top)
}

/** Layout top of align target — rect minus active transform (stable through sticky pin). */
function layoutArtifactTop(align: HTMLElement): number {
  const appliedY = Number(align.dataset.stageAlignY ?? 0)
  return Math.round(align.getBoundingClientRect().top - appliedY)
}

function viewportCenterTop(vh: number, artifactH: number): number {
  const root = document.documentElement
  const safeTop =
    parseFloat(getComputedStyle(root).getPropertyValue('--safe-area-top')) || 0
  const safeBottom =
    parseFloat(getComputedStyle(root).getPropertyValue('--safe-area-bottom')) || 0
  const visibleH = vh - safeTop - safeBottom
  return Math.round(safeTop + visibleH / 2 - artifactH / 2)
}

/** Closed-loop: nudge translate so artifact top lands on stickTop (stable once centered). */
function translateToStickTop(align: HTMLElement, stickTop: number): number {
  const appliedY = Number(align.dataset.stageAlignY ?? 0)
  const visualTop = Math.round(align.getBoundingClientRect().top)
  return Math.round(appliedY + (stickTop - visualTop))
}

function artifactHeight(align: HTMLElement): number {
  let best = Math.max(
    align.offsetHeight,
    Math.round(align.getBoundingClientRect().height),
  )

  align.querySelectorAll<HTMLElement>('*').forEach((el) => {
    const h = Math.max(el.offsetHeight, Math.round(el.getBoundingClientRect().height))
    if (h > best) best = h
  })

  return best
}

function enterBlendTranslateY(
  align: HTMLElement,
  stickTop: number,
  layoutTop: number,
  contentTop: number,
  enterBlendPx: number,
): number {
  const centerY = translateToStickTop(align, stickTop)
  const centerPullLine = stickTop + enterBlendPx

  if (contentTop <= centerPullLine) {
    return centerY
  }

  const copyTrackLine = centerPullLine + enterBlendPx
  const copyTrackY = contentTop - layoutTop
  if (contentTop >= copyTrackLine) {
    return Math.round(copyTrackY)
  }

  const t = (contentTop - centerPullLine) / enterBlendPx
  return Math.round(centerY + t * (copyTrackY - centerY))
}

function shouldHoldCenter(contentTop: number, stickTop: number, enterBlendPx: number): boolean {
  return contentTop <= stickTop + enterBlendPx
}

/** Short interactive stages (Formation LEGO) pair with copy headline, not viewport center. */
function prefersHeadlinePairAlign(align: HTMLElement): boolean {
  return align.querySelector('.formation-lego') != null
}

function headlinePairTranslateY(align: HTMLElement, contentTop: number): number {
  return translateToStickTop(align, contentTop)
}

function setPhase(
  stage: HTMLElement,
  align: HTMLElement,
  phase: AlignPhase,
): void {
  if (stage.dataset.stagePhase === phase) return
  stage.dataset.stagePhase = phase
  align.dataset.stagePhase = phase
}

function clearPhase(stage: HTMLElement, align: HTMLElement | null): void {
  delete stage.dataset.stagePhase
  if (align) delete align.dataset.stagePhase
}

/** Opacity tracks reveal linearly — pow curves linger then snap on fast exit. */
export function stageOpacityFromReveal(reveal: number): number {
  const t = Math.max(0, Math.min(1, reveal))
  if (t <= STAGE_CLEAR_THRESHOLD) return 0
  return t
}

function exitTranslateY(stageReveal: number): number {
  if (stageReveal >= 0.995) return 0
  const t = 1 - stageReveal
  return -Math.round(easeOutQuart(t) * STAGE_EXIT_TRAVEL_PX)
}

function applyArtifactTransform(align: HTMLElement, translateY: number): void {
  const key = String(translateY)
  if (align.dataset.stageAlignY === key) return
  align.dataset.stageAlignY = key
  align.style.transform =
    translateY === 0 ? '' : `translate3d(0, ${translateY}px, 0)`
}

function clearArtifactTransform(align: HTMLElement): void {
  align.style.removeProperty('transform')
  delete align.dataset.stageAlignY
  delete align.dataset.stageAlignLatchY
}

function clearStagePin(
  stage: HTMLElement,
  align: HTMLElement | null,
  chapterId?: string,
): void {
  if (chapterId) {
    stageVisibleLatch.delete(chapterId)
  }
  delete stage.dataset.stagePinned
  delete stage.dataset.stageExiting
  delete stage.dataset.stageOpacity
  delete stage.dataset.stageCenterHeld
  delete stage.dataset.stageCentered
  stage.style.removeProperty('--stage-artifact-half')
  stage.style.opacity = '0'
  stage.style.visibility = 'hidden'
  stage.style.removeProperty('pointer-events')
  stage.style.removeProperty('z-index')
  clearPhase(stage, align)
  if (!align) return
  clearArtifactTransform(align)
}

function applyCssViewportCenter(
  stage: HTMLElement,
  align: HTMLElement,
  artifactH: number,
): void {
  stage.dataset.stageCentered = 'true'
  stage.style.setProperty('--stage-artifact-half', `${Math.round(artifactH / 2)}px`)
  clearArtifactTransform(align)
}

function clearCssViewportCenter(stage: HTMLElement, align: HTMLElement): void {
  delete stage.dataset.stageCentered
  stage.style.removeProperty('--stage-artifact-half')
}

function stageChapterIds(stageRevealMap: Record<string, number>): Array<{
  id: string
  reveal: number
}> {
  const chapters: Array<{ id: string; reveal: number }> = []
  document.querySelectorAll<HTMLElement>(STAGE_SELECTOR).forEach((stage) => {
    const chapterId = stage.closest<HTMLElement>('[data-chapter-id]')?.dataset.chapterId
    if (!chapterId) return
    chapters.push({ id: chapterId, reveal: stageRevealMap[chapterId] ?? 0 })
  })
  return chapters
}

function pickStagePinId(stageRevealMap: Record<string, number>): string | null {
  let bestId: string | null = null
  let bestReveal = 0

  for (const { id, reveal } of stageChapterIds(stageRevealMap)) {
    if (reveal >= STAGE_PIN_REVEAL && reveal > bestReveal) {
      bestReveal = reveal
      bestId = id
    }
  }

  if (!bestId) {
    committedPinId = null
    return null
  }

  if (!committedPinId || committedPinId === bestId) {
    committedPinId = bestId
    return bestId
  }

  const currentReveal = stageRevealMap[committedPinId] ?? 0
  if (currentReveal < 0.04) {
    committedPinId = bestId
    return bestId
  }
  if (bestReveal - currentReveal < PIN_HYSTERESIS) {
    return committedPinId
  }

  committedPinId = bestId
  return bestId
}

export function resetContinuousStageAlign(): void {
  committedPinId = null
  exitingPinId = null
  stageVisibleLatch.clear()
  document.querySelectorAll<HTMLElement>(STAGE_SELECTOR).forEach((stage) => {
    const chapterId = stage.closest<HTMLElement>('[data-chapter-id]')?.dataset.chapterId
    clearStagePin(stage, stageAlignTarget(stage), chapterId)
  })
}

/**
 * Continuous desktop: idle → enter → center (latched) → exit.
 * Center Y is captured once and held until scroll-out — copy scroll must not drag the artifact.
 */
export function applyContinuousStageAlign(
  stageRevealMap: Record<string, number>,
  copyRevealMap: Record<string, number>,
  _activeSlideId: string | null,
): void {
  if (!isContinuousChapters() || isTopBarNavViewport()) {
    resetContinuousStageAlign()
    return
  }

  const vh = window.innerHeight
  if (vh <= 0) return

  const reducedMotion = prefersReducedMotion()
  const enterBlendPx = Math.max(
    CENTER_ENTER_BLEND_MIN_PX,
    Math.round(vh * CENTER_ENTER_BLEND_VH),
  )
  const previousPinId = committedPinId
  const pinId = pickStagePinId(stageRevealMap)

  if (
    exitingPinId &&
    (stageRevealMap[exitingPinId] ?? 0) <= STAGE_CLEAR_THRESHOLD
  ) {
    exitingPinId = null
  }

  if (
    previousPinId &&
    previousPinId !== pinId &&
    (stageRevealMap[previousPinId] ?? 0) > STAGE_CLEAR_THRESHOLD
  ) {
    exitingPinId = previousPinId
  }

  document.querySelectorAll<HTMLElement>(STAGE_SELECTOR).forEach((stage) => {
    const slot = stage.closest<HTMLElement>('[data-chapter-id]')
    const chapterId = slot?.dataset.chapterId
    const copy = slot?.querySelector<HTMLElement>('.chapter-slide__copy')
    const align = stageAlignTarget(stage)
    if (!chapterId || !copy || !align) return

    const stageReveal = stageRevealMap[chapterId] ?? 0
    const copyReveal = copyRevealMap[chapterId] ?? 0
    const stageOpacity = stageOpacityFromReveal(stageReveal)
    const isPin = chapterId === pinId
    const painted =
      stageReveal >= STAGE_PIN_REVEAL &&
      stageOpacity > 0 &&
      copyReveal >= CHAPTER_INTERACTIVE_VISIBILITY

    if (stageReveal >= STAGE_PIN_REVEAL) {
      stageVisibleLatch.add(chapterId)
    }

    if (!painted) {
      if (!stageVisibleLatch.has(chapterId) && stageReveal < STAGE_PIN_REVEAL) {
        clearStagePin(stage, align, chapterId)
        return
      }
      if (
        stageReveal <= STAGE_CLEAR_THRESHOLD ||
        stageOpacity <= 0 ||
        copyReveal < CHAPTER_INTERACTIVE_VISIBILITY
      ) {
        clearStagePin(stage, align, chapterId)
        stageVisibleLatch.delete(chapterId)
        if (chapterId === exitingPinId) {
          exitingPinId = null
        }
        return
      }
    }

    const opacityKey = stageOpacity.toFixed(3)
    if (stage.dataset.stageOpacity !== opacityKey) {
      stage.dataset.stageOpacity = opacityKey
      stage.style.opacity = opacityKey
      stage.style.visibility = 'visible'
      stage.style.pointerEvents =
        stageOpacity >= STAGE_INTERACTIVE_OPACITY ? 'auto' : 'none'
    }

    stage.dataset.stagePinned = 'true'
    stage.style.zIndex = isPin ? '2' : '1'

    const artifactH = artifactHeight(align)
    const latchedY = align.dataset.stageAlignLatchY

    if (artifactH < ALIGN_HEIGHT_MIN_PX) {
      setPhase(stage, align, 'enter')
      if (latchedY != null) {
        applyArtifactTransform(align, Number(latchedY))
      }
      return
    }

    const stickTop = viewportCenterTop(vh, artifactH)
    const layoutTop = layoutArtifactTop(align)
    const contentTop = copyContentTop(copy)
    const exitY = exitTranslateY(stageReveal)
    const stickyEngaged =
      Math.round(stage.getBoundingClientRect().top) <=
      (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-top')) || 0) + 4
    const centerHeld = stage.dataset.stageCenterHeld === 'true'
    const exitActive = exitY !== 0

    let phase: AlignPhase
    let translateY: number

    if (exitActive) {
      phase = 'exit'
      delete stage.dataset.stageCenterHeld
      delete align.dataset.stageAlignLatchY
      clearCssViewportCenter(stage, align)
      translateY = translateToStickTop(align, stickTop) + exitY
    } else if (
      reducedMotion ||
      centerHeld ||
      stickyEngaged ||
      shouldHoldCenter(contentTop, stickTop, enterBlendPx)
    ) {
      phase = 'center'
      stage.dataset.stageCenterHeld = 'true'

      if (prefersHeadlinePairAlign(align)) {
        clearCssViewportCenter(stage, align)
        if (latchedY != null) {
          translateY = Number(latchedY)
        } else {
          translateY = headlinePairTranslateY(align, contentTop)
          align.dataset.stageAlignLatchY = String(translateY)
        }
      } else {
        applyCssViewportCenter(stage, align, artifactH)
        translateY = 0
      }
    } else {
      phase = 'enter'
      delete stage.dataset.stageCenterHeld
      delete align.dataset.stageAlignLatchY
      clearCssViewportCenter(stage, align)
      translateY = prefersHeadlinePairAlign(align)
        ? headlinePairTranslateY(align, contentTop)
        : enterBlendTranslateY(
            align,
            stickTop,
            layoutTop,
            contentTop,
            enterBlendPx,
          )
    }

    if (exitY < 0) {
      stage.dataset.stageExiting = 'true'
    } else {
      delete stage.dataset.stageExiting
    }

    setPhase(stage, align, phase)
    if (phase === 'center' && stage.dataset.stageCentered === 'true') {
      clearArtifactTransform(align)
    } else {
      applyArtifactTransform(align, translateY)
    }
  })
}
