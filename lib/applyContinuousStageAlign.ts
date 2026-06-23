import { CHAPTER_SLOT_SELECTOR } from '@/lib/chapterSlideshow'
import { isContinuousChapters } from '@/lib/continuousChapters'
import { isTopBarNavViewport } from '@/lib/layout/isTopBarNavViewport'

const STAGE_SELECTOR = `${CHAPTER_SLOT_SELECTOR} .chapter-slide__stage:not(:has(.flow-chapter-slide__stage--empty))`
const STAGE_PIN_REVEAL = 0.22
const PIN_HYSTERESIS = 0.1
const STAGE_INTERACTIVE_OPACITY = 0.38
/** Ignore sub-pixel churn once centered and sticky. */
const LOCKED_TRANSLATE_DEADBAND_PX = 1
/** Scroll band where artifact eases from content-top alignment into viewport center. */
const CENTER_BLEND_VH = 0.14
const CENTER_BLEND_MIN_PX = 96
/** When copy geometry jumps (scroll snap / layout), cap visual motion per frame. */
const CONTENT_JUMP_THRESHOLD_PX = 72
const VISUAL_STEP_ON_JUMP_PX = 40

let committedPinId: string | null = null
/** Chapters that have reached viewport center — hold through scroll-out. */
const centerLocked = new Set<string>()

const alignPrevFrame = new Map<
  string,
  {
    translateY: number
    visualTop: number
    stageTop: number
    contentTop: number
    isStuck: boolean
    locked: boolean
  }
>()

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function readSafeAreaTop(): number {
  if (typeof document === 'undefined') return 0
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--safe-area-top')
  const px = parseFloat(raw)
  return Number.isFinite(px) ? Math.round(px) : 0
}

function smoothstep(t: number): number {
  const x = Math.max(0, Math.min(1, t))
  return x * x * (3 - 2 * x)
}

/**
 * Scroll-in: track copy top, then ease into viewport center before lock.
 * Scroll-out (locked): hold viewport center until chapter unpins.
 */
function targetArtifactTop(
  contentTop: number,
  stickTop: number,
  locked: boolean,
  blendPx: number,
): number {
  if (locked) return stickTop

  const blendEnd = stickTop + blendPx
  if (contentTop >= blendEnd) return contentTop
  if (contentTop <= stickTop) return stickTop

  const t = (contentTop - stickTop) / blendPx
  return Math.round(stickTop + smoothstep(t) * (contentTop - stickTop))
}

/**
 * Prevent a one-frame snap when scroll-snap or sticky layout shifts copy geometry.
 */
function clampTargetForContinuity(
  ideal: number,
  prev: { visualTop: number; contentTop: number } | undefined,
  contentTop: number,
  locked: boolean,
): number {
  if (!prev || locked) return ideal

  const visualDelta = ideal - prev.visualTop
  const contentStep = Math.abs(contentTop - prev.contentTop)

  if (
    contentStep > CONTENT_JUMP_THRESHOLD_PX &&
    Math.abs(visualDelta) > VISUAL_STEP_ON_JUMP_PX
  ) {
    return Math.round(
      prev.visualTop + Math.sign(visualDelta) * VISUAL_STEP_ON_JUMP_PX,
    )
  }

  if (visualDelta < -8 && Math.abs(visualDelta) > contentStep * 1.35 + 4) {
    const step = Math.max(8, Math.min(VISUAL_STEP_ON_JUMP_PX, Math.round(contentStep * 1.15)))
    return Math.round(prev.visualTop - step)
  }

  return ideal
}

function copyContentTop(copy: HTMLElement): number {
  const anchor =
    copy.querySelector<HTMLElement>(
      '.chapter-copy-scroller, .chapter-copy__headline, .case-study-section-header',
    ) ?? copy
  return Math.round(anchor.getBoundingClientRect().top)
}

/** Opacity tied to copy reveal — lingers slightly on exit to avoid a hard blink. */
export function stageOpacityFromReveal(reveal: number): number {
  const t = Math.max(0, Math.min(1, reveal))
  if (t <= 0.06) return 0
  return Math.pow(t, 0.68)
}

function applyArtifactTransform(artifact: HTMLElement, translateY: number): void {
  const key = String(translateY)
  if (artifact.dataset.stageAlignY === key) return
  artifact.dataset.stageAlignY = key
  artifact.style.transform = `translate3d(0, ${translateY}px, 0)`
}

function clearStagePin(
  stage: HTMLElement,
  artifact: HTMLElement | null,
  chapterId?: string,
): void {
  if (chapterId) centerLocked.delete(chapterId)
  delete stage.dataset.stagePinned
  delete stage.dataset.stageOpacity
  stage.style.removeProperty('visibility')
  stage.style.removeProperty('opacity')
  stage.style.removeProperty('pointer-events')
  stage.style.removeProperty('z-index')
  if (!artifact) return
  artifact.style.removeProperty('transform')
  delete artifact.dataset.stageAlignY
}

function stageChapterIds(revealMap: Record<string, number>): Array<{
  id: string
  reveal: number
}> {
  const chapters: Array<{ id: string; reveal: number }> = []
  document.querySelectorAll<HTMLElement>(STAGE_SELECTOR).forEach((stage) => {
    const chapterId = stage.closest<HTMLElement>('[data-chapter-id]')?.dataset.chapterId
    if (!chapterId) return
    chapters.push({ id: chapterId, reveal: revealMap[chapterId] ?? 0 })
  })
  return chapters
}

/** Highest-reveal stage chapter, with hysteresis so pin does not flicker at boundaries. */
function pickStagePinId(revealMap: Record<string, number>): string | null {
  let bestId: string | null = null
  let bestReveal = 0

  for (const { id, reveal } of stageChapterIds(revealMap)) {
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

  const currentReveal = revealMap[committedPinId] ?? 0
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

/** Clear scroll-driven stage offsets (legacy slideshow / top-bar nav). */
export function resetContinuousStageAlign(): void {
  committedPinId = null
  centerLocked.clear()
  document.querySelectorAll<HTMLElement>(STAGE_SELECTOR).forEach((stage) => {
    const chapterId = stage.closest<HTMLElement>('[data-chapter-id]')?.dataset.chapterId
    clearStagePin(stage, stage.firstElementChild as HTMLElement | null, chapterId)
  })
}

/**
 * Continuous desktop: one pinned stage; opacity follows copy reveal, position tracks content → center.
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

  const viewportCenterY = Math.round(vh / 2)
  const safeTop = readSafeAreaTop()
  const reducedMotion = prefersReducedMotion()
  const pinId = pickStagePinId(revealMap)

  document.querySelectorAll<HTMLElement>(STAGE_SELECTOR).forEach((stage) => {
    const slot = stage.closest<HTMLElement>('[data-chapter-id]')
    const chapterId = slot?.dataset.chapterId
    const copy = slot?.querySelector<HTMLElement>('.chapter-slide__copy')
    const artifact = stage.firstElementChild as HTMLElement | null
    if (!chapterId || !copy || !artifact) return

    const reveal = revealMap[chapterId] ?? 0
    const pinned = chapterId === pinId
    const stageOpacity = stageOpacityFromReveal(reveal)

    if (!pinned || stageOpacity <= 0.01) {
      clearStagePin(stage, artifact, chapterId)
      return
    }

    // Measure layout before mutating styles (avoids rect/layout feedback jitter).
    const stageTop = Math.round(stage.getBoundingClientRect().top)
    const artifactOffset = artifact.offsetTop
    const artifactH = artifact.offsetHeight
    const contentTop = copyContentTop(copy)
    const isStuck = stageTop <= safeTop + 2

    const opacityKey = stageOpacity.toFixed(3)
    if (stage.dataset.stageOpacity !== opacityKey) {
      stage.dataset.stageOpacity = opacityKey
      stage.style.opacity = opacityKey
      stage.style.visibility = stageOpacity > 0.02 ? 'visible' : 'hidden'
      stage.style.pointerEvents =
        stageOpacity >= STAGE_INTERACTIVE_OPACITY ? 'auto' : 'none'
    }

    stage.dataset.stagePinned = 'true'
    stage.style.zIndex = '2'

    if (artifactH <= 0) return

    const stickTop = Math.round(viewportCenterY - artifactH / 2)
    const locked = centerLocked.has(chapterId)
    const blendPx = Math.max(CENTER_BLEND_MIN_PX, Math.round(vh * CENTER_BLEND_VH))

    if (!reducedMotion && !locked && contentTop <= stickTop && isStuck) {
      centerLocked.add(chapterId)
    }

    const nowLocked = centerLocked.has(chapterId)

    const idealTarget = reducedMotion
      ? stickTop
      : targetArtifactTop(contentTop, stickTop, nowLocked, blendPx)

    const prevFrame = alignPrevFrame.get(chapterId)
    const targetTop = reducedMotion
      ? stickTop
      : clampTargetForContinuity(idealTarget, prevFrame, contentTop, nowLocked)

    // Recompute each frame — sticky top shifts from in-flow to viewport-fixed.
    let translateY = Math.round(targetTop - stageTop - artifactOffset)

    const prevY = Number(artifact.dataset.stageAlignY ?? NaN)
    const deadbandApplied =
      nowLocked &&
      isStuck &&
      Number.isFinite(prevY) &&
      Math.abs(translateY - prevY) < LOCKED_TRANSLATE_DEADBAND_PX
    if (deadbandApplied) {
      translateY = prevY
    }

    const visualTop = stageTop + artifactOffset + translateY

    alignPrevFrame.set(chapterId, {
      translateY,
      visualTop,
      stageTop,
      contentTop,
      isStuck,
      locked: nowLocked,
    })

    applyArtifactTransform(artifact, translateY)
  })
}
