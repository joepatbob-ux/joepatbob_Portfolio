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
const VERDANT_INTERACTIVE_SELECTOR = '.verdant-interactive'

function stagePointerEvents(
  stage: HTMLElement,
  stageOpacity: number,
): 'auto' | 'none' {
  if (stage.querySelector(VERDANT_INTERACTIVE_SELECTOR)) {
    return stageOpacity > STAGE_CLEAR_THRESHOLD ? 'auto' : 'none'
  }
  return stageOpacity >= STAGE_INTERACTIVE_OPACITY ? 'auto' : 'none'
}
const STAGE_EXIT_TRAVEL_PX = 140
const ALIGN_HEIGHT_MIN_PX = 48

type AlignPhase = 'idle' | 'enter' | 'center' | 'exit'

let committedPinId: string | null = null
let exitingPinId: string | null = null
const stageVisibleLatch = new Set<string>()

/** Transforms land on quarter-pixel steps — smooth, but still dedupable. */
function quant(value: number): number {
  return Math.round(value * 4) / 4
}

/* ---------------------------------------------------------------------------
 * Cached environment reads — safe-area insets and artifact heights are layout
 * queries that must not run per scroll frame. Both invalidate on resize; the
 * artifact height also invalidates when its subtree resizes (ResizeObserver).
 * ------------------------------------------------------------------------- */

let safeAreaCache: { top: number; bottom: number } | null = null
let heightGeneration = 0
const artifactHeightCache = new WeakMap<
  HTMLElement,
  { generation: number; height: number }
>()
const observedAligns = new WeakSet<HTMLElement>()
let artifactObserver: ResizeObserver | null = null
let invalidationBound = false

function bindCacheInvalidation(): void {
  if (invalidationBound || typeof window === 'undefined') return
  invalidationBound = true
  const invalidate = () => {
    safeAreaCache = null
    heightGeneration += 1
  }
  window.addEventListener('resize', invalidate, { passive: true })
  window.addEventListener('orientationchange', invalidate, { passive: true })
}

function safeAreaInsets(): { top: number; bottom: number } {
  bindCacheInvalidation()
  if (!safeAreaCache) {
    const style = getComputedStyle(document.documentElement)
    safeAreaCache = {
      top: parseFloat(style.getPropertyValue('--safe-area-top')) || 0,
      bottom: parseFloat(style.getPropertyValue('--safe-area-bottom')) || 0,
    }
  }
  return safeAreaCache
}

function measureArtifactHeight(align: HTMLElement): number {
  let best = Math.max(align.offsetHeight, align.getBoundingClientRect().height)

  align.querySelectorAll<HTMLElement>('*').forEach((el) => {
    const h = Math.max(el.offsetHeight, el.getBoundingClientRect().height)
    if (h > best) best = h
  })

  return best
}

function observeArtifact(align: HTMLElement): void {
  if (observedAligns.has(align)) return
  observedAligns.add(align)
  if (!artifactObserver) {
    artifactObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const target = entry.target as HTMLElement
        const align = target.closest<HTMLElement>(ALIGN_SELECTOR) ?? target
        artifactHeightCache.delete(align)
      }
    })
  }
  artifactObserver.observe(align)
  // Direct children too — absolutely positioned content can grow without
  // changing the align box itself.
  for (const child of Array.from(align.children)) {
    artifactObserver.observe(child)
  }
}

function artifactHeight(align: HTMLElement): number {
  bindCacheInvalidation()
  observeArtifact(align)
  const cached = artifactHeightCache.get(align)
  // A below-minimum height means the stage content hasn't laid out yet, and
  // deep-descendant growth won't fire the ResizeObserver when the align box
  // itself stays collapsed — keep re-measuring until real content appears.
  if (
    cached &&
    cached.generation === heightGeneration &&
    cached.height >= ALIGN_HEIGHT_MIN_PX
  ) {
    return cached.height
  }
  const height = measureArtifactHeight(align)
  artifactHeightCache.set(align, { generation: heightGeneration, height })
  return height
}

/* ---------------------------------------------------------------------------
 * Pure geometry helpers — operate on measured numbers, never touch the DOM.
 * ------------------------------------------------------------------------- */

function easeOutQuart(t: number): number {
  const x = Math.max(0, Math.min(1, t))
  return 1 - Math.pow(1 - x, 4)
}

function viewportCenterTop(vh: number, artifactH: number): number {
  const { top: safeTop, bottom: safeBottom } = safeAreaInsets()
  const visibleH = vh - safeTop - safeBottom
  return safeTop + visibleH / 2 - artifactH / 2
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
  return -easeOutQuart(t) * STAGE_EXIT_TRAVEL_PX
}

/* ---------------------------------------------------------------------------
 * DOM lookups (no layout) and guarded style writes.
 * ------------------------------------------------------------------------- */

function stageAlignTarget(stage: HTMLElement): HTMLElement | null {
  return (
    stage.querySelector<HTMLElement>(ALIGN_SELECTOR) ??
    (stage.firstElementChild as HTMLElement | null)
  )
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

function applyArtifactTransform(align: HTMLElement, translateY: number): void {
  const quantized = quant(translateY)
  const key = String(quantized)
  if (align.dataset.stageAlignY === key) return
  align.dataset.stageAlignY = key
  align.style.transform =
    quantized === 0 ? '' : `translate3d(0, ${quantized}px, 0)`
}

function clearArtifactTransform(align: HTMLElement): void {
  if (
    align.dataset.stageAlignY == null &&
    align.dataset.stageAlignLatchY == null
  ) {
    return
  }
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
  if (stage.dataset.stagePinned == null && stage.dataset.stageOpacity == null) {
    // Already cleared — keep the frame free of redundant style writes.
    if (align) clearArtifactTransform(align)
    return
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
  const halfKey = `${quant(artifactH / 2)}px`
  if (
    stage.dataset.stageCentered !== 'true' ||
    stage.style.getPropertyValue('--stage-artifact-half') !== halfKey
  ) {
    stage.dataset.stageCentered = 'true'
    stage.style.setProperty('--stage-artifact-half', halfKey)
  }
  clearArtifactTransform(align)
}

function clearCssViewportCenter(stage: HTMLElement): void {
  if (stage.dataset.stageCentered == null) return
  delete stage.dataset.stageCentered
  stage.style.removeProperty('--stage-artifact-half')
}

/* ---------------------------------------------------------------------------
 * Per-frame pipeline: one measure pass (all layout reads), one write pass
 * (all style writes). Interleaving the two forces a reflow per stage.
 * ------------------------------------------------------------------------- */

type StageEntry = {
  stage: HTMLElement
  align: HTMLElement | null
  copy: HTMLElement | null
  chapterId: string | null
  stageReveal: number
  copyReveal: number
}

type StageMeasure = {
  entry: StageEntry
  action: 'clear-if-unlatched' | 'clear' | 'apply'
  stageOpacity: number
  isPin: boolean
  artifactH: number
  stickTop: number
  visualTop: number
}

function collectStageEntries(
  stageRevealMap: Record<string, number>,
  copyRevealMap: Record<string, number>,
): StageEntry[] {
  const entries: StageEntry[] = []
  document.querySelectorAll<HTMLElement>(STAGE_SELECTOR).forEach((stage) => {
    const slot = stage.closest<HTMLElement>('[data-chapter-id]')
    const chapterId = slot?.dataset.chapterId ?? null
    entries.push({
      stage,
      align: stageAlignTarget(stage),
      copy: slot?.querySelector<HTMLElement>('.chapter-slide__copy') ?? null,
      chapterId,
      stageReveal: chapterId ? (stageRevealMap[chapterId] ?? 0) : 0,
      copyReveal: chapterId ? (copyRevealMap[chapterId] ?? 0) : 0,
    })
  })
  return entries
}

function pickStagePinId(
  entries: StageEntry[],
  stageRevealMap: Record<string, number>,
): string | null {
  let bestId: string | null = null
  let bestReveal = 0

  for (const { chapterId, stageReveal } of entries) {
    if (!chapterId) continue
    if (stageReveal >= STAGE_PIN_REVEAL && stageReveal > bestReveal) {
      bestReveal = stageReveal
      bestId = chapterId
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

function measureStage(
  entry: StageEntry,
  pinId: string | null,
  vh: number,
): StageMeasure | null {
  const { stage, align, copy, chapterId, stageReveal, copyReveal } = entry
  if (!chapterId || !copy || !align) return null

  const stageOpacity = stageOpacityFromReveal(stageReveal)
  const isPin = chapterId === pinId
  const painted =
    stageReveal >= STAGE_PIN_REVEAL &&
    stageOpacity > 0 &&
    copyReveal >= CHAPTER_INTERACTIVE_VISIBILITY

  if (stageReveal >= STAGE_PIN_REVEAL) {
    stageVisibleLatch.add(chapterId)
  }

  const cleared: Omit<StageMeasure, 'action'> = {
    entry,
    stageOpacity,
    isPin,
    artifactH: 0,
    stickTop: 0,
    visualTop: 0,
  }

  if (!painted) {
    if (!stageVisibleLatch.has(chapterId) && stageReveal < STAGE_PIN_REVEAL) {
      return { ...cleared, action: 'clear-if-unlatched' }
    }
    if (
      stageReveal <= STAGE_CLEAR_THRESHOLD ||
      stageOpacity <= 0 ||
      copyReveal < CHAPTER_INTERACTIVE_VISIBILITY
    ) {
      return { ...cleared, action: 'clear' }
    }
  }

  // Layout reads — grouped here so the write pass never forces a reflow.
  const artifactH = artifactHeight(align)
  const visualTop = align.getBoundingClientRect().top

  return {
    entry,
    stageOpacity,
    isPin,
    action: 'apply',
    artifactH,
    stickTop: viewportCenterTop(vh, artifactH),
    visualTop,
  }
}

function writeStage(m: StageMeasure): void {
  const { stage, align, chapterId, stageReveal } = m.entry
  if (!chapterId || !align) return

  if (m.action === 'clear-if-unlatched') {
    clearStagePin(stage, align, chapterId)
    return
  }

  if (m.action === 'clear') {
    clearStagePin(stage, align, chapterId)
    stageVisibleLatch.delete(chapterId)
    if (chapterId === exitingPinId) {
      exitingPinId = null
    }
    return
  }

  const opacityKey = m.stageOpacity.toFixed(3)
  if (stage.dataset.stageOpacity !== opacityKey) {
    stage.dataset.stageOpacity = opacityKey
    stage.style.opacity = opacityKey
    stage.style.visibility = 'visible'
    const pointerEvents = stagePointerEvents(stage, m.stageOpacity)
    if (stage.style.pointerEvents !== pointerEvents) {
      stage.style.pointerEvents = pointerEvents
    }
  }

  if (stage.dataset.stagePinned !== 'true') {
    stage.dataset.stagePinned = 'true'
  }
  const zIndex = m.isPin ? '2' : '1'
  if (stage.style.zIndex !== zIndex) {
    stage.style.zIndex = zIndex
  }

  if (m.artifactH < ALIGN_HEIGHT_MIN_PX) {
    setPhase(stage, align, 'enter')
    return
  }

  const exitY = exitTranslateY(stageReveal)
  const exitActive = exitY !== 0

  let phase: AlignPhase
  let translateY: number | null

  // Sticky is the only centering mechanism: the artifact rides in flow at
  // scroll speed and position:sticky catches it at the viewport center.
  // No JS position interpolation — interpolating between copy-track and
  // center moved the artifact faster than the scroll and snapped at the
  // handoff (the "jump on scroll-in").
  applyCssViewportCenter(stage, align, m.artifactH)
  if (exitActive) {
    phase = 'exit'
    translateY = exitY
  } else {
    // Stuck once the flow position reaches the center line.
    phase = m.visualTop <= m.stickTop + 1 ? 'center' : 'enter'
    translateY = null
  }

  if (exitY < 0) {
    if (stage.dataset.stageExiting !== 'true') {
      stage.dataset.stageExiting = 'true'
    }
  } else {
    delete stage.dataset.stageExiting
  }

  setPhase(stage, align, phase)
  if (translateY == null) {
    clearArtifactTransform(align)
  } else {
    applyArtifactTransform(align, translateY)
  }
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

  const entries = collectStageEntries(stageRevealMap, copyRevealMap)
  const previousPinId = committedPinId
  const pinId = pickStagePinId(entries, stageRevealMap)

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

  // Measure pass — every layout read for every stage happens here.
  const measures: StageMeasure[] = []
  for (const entry of entries) {
    const measure = measureStage(entry, pinId, vh)
    if (measure) measures.push(measure)
  }

  // Write pass — style/dataset writes only; no reads that force layout.
  for (const measure of measures) {
    writeStage(measure)
  }
}
