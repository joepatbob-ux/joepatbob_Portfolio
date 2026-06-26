import { CHAPTER_SLOT_SELECTOR } from '@/lib/chapterSlideshow'
import { isContinuousChapters } from '@/lib/continuousChapters'
import { isTopBarNavViewport } from '@/lib/layout/isTopBarNavViewport'

const STAGE_SELECTOR = `${CHAPTER_SLOT_SELECTOR} .chapter-slide__stage:not(:has(.flow-chapter-slide__stage--empty))`
const STAGE_PIN_REVEAL = 0.22
const PIN_HYSTERESIS = 0.1
const STAGE_INTERACTIVE_OPACITY = 0.38
const STAGE_CLEAR_THRESHOLD = 0.005
/** Scroll band where artifact eases from content-top alignment into viewport center. */
const CENTER_BLEND_VH = 0.22
const CENTER_BLEND_MIN_PX = 120
/** When copy geometry jumps abnormally, cap visual motion per frame. */
const CONTENT_JUMP_THRESHOLD_PX = 72
const VISUAL_STEP_ON_JUMP_PX = 40
/** Ease onto viewport center over this many px (scroll-in stick). */
const STICK_LAND_PX = 80
const STICK_LAND_RATE = 0.4
/** Upward travel while stage exits after copy is gone. */
const STAGE_EXIT_TRAVEL_PX = 140

let committedPinId: string | null = null
let exitingPinId: string | null = null
/** Chapters that have reached viewport center — hold through scroll-out. */
const centerLocked = new Set<string>()

const alignPrevFrame = new Map<
  string,
  {
    visualTop: number
    contentTop: number
  }
>()

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function smoothstep(t: number): number {
  const x = Math.max(0, Math.min(1, t))
  return x * x * (3 - 2 * x)
}

/**
 * Target artifact top while approaching center (blend band only).
 * Never tracks copy below viewport center — that causes top-then-jump.
 */
function blendTargetTop(
  contentTop: number,
  stickTop: number,
  blendPx: number,
): number {
  const blendEnd = stickTop + blendPx
  if (contentTop >= blendEnd) return contentTop
  if (contentTop <= stickTop) return stickTop

  const t = (contentTop - stickTop) / blendPx
  return Math.round(stickTop + smoothstep(t) * (contentTop - stickTop))
}

function clampTargetForContinuity(
  ideal: number,
  prev: { visualTop: number; contentTop: number } | undefined,
  contentTop: number,
): number {
  if (!prev) return ideal

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

  return ideal
}

function copyContentTop(copy: HTMLElement): number {
  const anchor =
    copy.querySelector<HTMLElement>(
      '.chapter-copy-scroller, .chapter-copy__headline, .case-study-section-header',
    ) ?? copy
  return Math.round(anchor.getBoundingClientRect().top)
}

/** Artifact top with any scroll-driven translate stripped (stable across layout shifts). */
function artifactNaturalTop(artifact: HTMLElement): number {
  const appliedY = Number(artifact.dataset.stageAlignY ?? 0)
  return Math.round(artifact.getBoundingClientRect().top - appliedY)
}

function resolveAlignTargetTop(
  chapterId: string,
  contentTop: number,
  stickTop: number,
  blendPx: number,
  blendEnd: number,
  exitY: number,
  reducedMotion: boolean,
  prevFrame: { visualTop: number; contentTop: number } | undefined,
): number {
  if (reducedMotion || centerLocked.has(chapterId)) {
    return stickTop
  }

  let ideal: number
  if (contentTop >= blendEnd) {
    ideal = contentTop
  } else {
    ideal = blendTargetTop(contentTop, stickTop, blendPx)
  }

  // Ease onto viewport center — never snap the full remaining distance in one frame.
  if (exitY === 0 && ideal === stickTop && prevFrame) {
    const dist = stickTop - prevFrame.visualTop
    if (Math.abs(dist) > 1) {
      const step =
        Math.abs(dist) <= STICK_LAND_PX
          ? Math.abs(dist) * STICK_LAND_RATE
          : Math.min(56, Math.abs(dist) * STICK_LAND_RATE)
      ideal = Math.round(prevFrame.visualTop + Math.sign(dist) * step)
    }
  }

  const targetTop = clampTargetForContinuity(ideal, prevFrame, contentTop)

  if (exitY === 0 && Math.abs(targetTop - stickTop) <= 2) {
    centerLocked.add(chapterId)
    return stickTop
  }

  return targetTop
}

/** Opacity tied to stage reveal — lingers on exit to avoid a hard blink. */
export function stageOpacityFromReveal(reveal: number): number {
  const t = Math.max(0, Math.min(1, reveal))
  if (t <= STAGE_CLEAR_THRESHOLD) return 0
  return Math.pow(t, 0.68)
}

function exitTranslateY(stageReveal: number): number {
  if (stageReveal >= 0.995) return 0
  return -Math.round((1 - stageReveal) * STAGE_EXIT_TRAVEL_PX)
}

function applyArtifactTransform(artifact: HTMLElement, translateY: number): void {
  const key = String(translateY)
  if (artifact.dataset.stageAlignY === key) return
  artifact.dataset.stageAlignY = key
  artifact.style.transform =
    translateY === 0 ? '' : `translate3d(0, ${translateY}px, 0)`
}

function clearArtifactTransform(artifact: HTMLElement): void {
  artifact.style.removeProperty('transform')
  delete artifact.dataset.stageAlignY
}

function clearStagePin(
  stage: HTMLElement,
  artifact: HTMLElement | null,
  chapterId?: string,
): void {
  if (chapterId) {
    centerLocked.delete(chapterId)
    alignPrevFrame.delete(chapterId)
  }
  delete stage.dataset.stagePinned
  delete stage.dataset.stageCenterLocked
  delete stage.dataset.stageExiting
  delete stage.dataset.stageOpacity
  stage.style.removeProperty('visibility')
  stage.style.removeProperty('opacity')
  stage.style.removeProperty('pointer-events')
  stage.style.removeProperty('z-index')
  if (!artifact) return
  clearArtifactTransform(artifact)
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

/** Highest-reveal stage chapter, with hysteresis so pin does not flicker at boundaries. */
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

/** Clear scroll-driven stage offsets (legacy slideshow / top-bar nav). */
export function resetContinuousStageAlign(): void {
  committedPinId = null
  exitingPinId = null
  centerLocked.clear()
  alignPrevFrame.clear()
  document.querySelectorAll<HTMLElement>(STAGE_SELECTOR).forEach((stage) => {
    const chapterId = stage.closest<HTMLElement>('[data-chapter-id]')?.dataset.chapterId
    clearStagePin(stage, stage.firstElementChild as HTMLElement | null, chapterId)
  })
}

/**
 * Continuous desktop: one pinned stage; opacity follows stage reveal (lags copy on exit).
 */
export function applyContinuousStageAlign(
  stageRevealMap: Record<string, number>,
  _activeSlideId: string | null,
): void {
  if (!isContinuousChapters() || isTopBarNavViewport()) {
    resetContinuousStageAlign()
    return
  }

  const vh = window.innerHeight
  if (vh <= 0) return

  const viewportCenterY = Math.round(vh / 2)
  const reducedMotion = prefersReducedMotion()
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
    const artifact = stage.firstElementChild as HTMLElement | null
    if (!chapterId || !copy || !artifact) return

    const stageReveal = stageRevealMap[chapterId] ?? 0
    const pinned = chapterId === pinId || chapterId === exitingPinId
    const stageOpacity = stageOpacityFromReveal(stageReveal)

    if (!pinned || stageReveal <= STAGE_CLEAR_THRESHOLD) {
      clearStagePin(stage, artifact, chapterId)
      if (chapterId === exitingPinId) {
        exitingPinId = null
      }
      return
    }

    const artifactH = artifact.offsetHeight
    const contentTop = copyContentTop(copy)
    const exitY = exitTranslateY(stageReveal)

    const opacityKey = stageOpacity.toFixed(3)
    if (stage.dataset.stageOpacity !== opacityKey) {
      stage.dataset.stageOpacity = opacityKey
      stage.style.opacity = opacityKey
      stage.style.visibility = 'visible'
      stage.style.pointerEvents =
        stageOpacity >= STAGE_INTERACTIVE_OPACITY ? 'auto' : 'none'
    }

    stage.dataset.stagePinned = 'true'
    stage.style.zIndex = chapterId === exitingPinId ? '1' : '2'

    if (artifactH <= 0) return

    const stickTop = Math.round(viewportCenterY - artifactH / 2)
    const blendPx = Math.max(CENTER_BLEND_MIN_PX, Math.round(vh * CENTER_BLEND_VH))
    const blendEnd = stickTop + blendPx
    const prevFrame = alignPrevFrame.get(chapterId)

    const targetTop = resolveAlignTargetTop(
      chapterId,
      contentTop,
      stickTop,
      blendPx,
      blendEnd,
      exitY,
      reducedMotion,
      prevFrame,
    )

    const naturalTop = artifactNaturalTop(artifact)
    const translateY = Math.round(targetTop - naturalTop) + exitY
    const visualTop = naturalTop + translateY

    if (centerLocked.has(chapterId)) {
      stage.dataset.stageCenterLocked = 'true'
    } else {
      delete stage.dataset.stageCenterLocked
    }

    alignPrevFrame.set(chapterId, {
      visualTop: visualTop - exitY,
      contentTop,
    })
    applyArtifactTransform(artifact, translateY)
  })
}
