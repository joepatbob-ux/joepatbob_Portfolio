import { CHAPTER_SLOT_SELECTOR } from '@/lib/scroll/chapterSlideshow'
import {
  CHAPTER_INTERACTIVE_VISIBILITY,
  CHAPTER_STAGE_PAINT_VISIBILITY,
} from '@/lib/scroll/chapterVisibility'
import { isContinuousChapters } from '@/lib/scroll/continuousChapters'
import { flushScrollFrame } from '@/lib/scroll/scrollFrame'
import { publishChapterStageFx } from '@/lib/scroll/stageFxBus'
import { isTopBarNavViewport } from '@/lib/layout/isTopBarNavViewport'

const STAGE_SELECTOR = `${CHAPTER_SLOT_SELECTOR} .chapter-slide__stage:not(:has(.flow-chapter-slide__stage--empty))`
const ALIGN_SELECTOR = '[data-chapter-stage-align]'
const STAGE_PIN_REVEAL = CHAPTER_STAGE_PAINT_VISIBILITY
const PIN_HYSTERESIS = 0.12
const STAGE_INTERACTIVE_OPACITY = 0.38
const STAGE_CLEAR_THRESHOLD = 0.004
const VERDANT_INTERACTIVE_SELECTOR = '.verdant-interactive'

/* Exit hysteresis: a visible stage only dissolves out once its reveal drops
 * this far below the show threshold, so reveal noise at the boundary can't
 * strobe the (visible, 320ms) transition on and off. */
const STAGE_EXIT_MARGIN = 0.08

/* Dissolve out as soon as slot containment forces the artifact off its center
 * lock — waiting for the reveal threshold lets it visibly crawl upward first. */
const STAGE_PUSH_OFF_PX = 24

/* After a dissolve-out, the scroll must move this far from where the exit
 * fired before the same stage may re-enter. The reveal curve is a cliff near
 * a slot's end, so reveal-space hysteresis alone is only a few px of scroll
 * there — this makes boundary dwell breathe at worst, never strobe. */
const STAGE_REENTRY_SCROLL_PX = 100

/* Arrivals may materialize this close below the center lock, not only exactly
 * on it — the 320ms dissolve-in covers the last few px of ride, and a scroll
 * that stops just shy of the line (or crosses it during the handoff gate and
 * settles back) still gets its artifact. */
const STAGE_ENTRY_NEAR_PX = 56

/* Reverse scroll releases the sticky clamp and the artifact starts riding
 * down with the copy — dissolve out once it has ridden this far below the
 * lock instead of traveling away with the text. Must exceed
 * STAGE_ENTRY_NEAR_PX, or a near-line arrival would dissolve straight back
 * out of its own entry position. */
const STAGE_RIDE_AWAY_PX = STAGE_ENTRY_NEAR_PX + 40

function stagePointerEvents(
  stage: HTMLElement,
  stageOpacity: number,
): 'auto' | 'none' {
  if (stage.querySelector(VERDANT_INTERACTIVE_SELECTOR)) {
    return stageOpacity > STAGE_CLEAR_THRESHOLD ? 'auto' : 'none'
  }
  return stageOpacity >= STAGE_INTERACTIVE_OPACITY ? 'auto' : 'none'
}
const ALIGN_HEIGHT_MIN_PX = 48

type AlignPhase = 'idle' | 'enter' | 'center' | 'exit'

let committedPinId: string | null = null

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
    // Centering vars are captured from measured heights — stale after resize.
    // Tear visible stages down; the next frame re-places and dissolves in.
    document
      .querySelectorAll<HTMLElement>(`${STAGE_SELECTOR}[data-stage-fx]`)
      .forEach((stage) => {
        cancelStageFadeOut(stage)
        finalizeStageClear(stage, stageAlignTarget(stage))
      })
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

/* ---------------------------------------------------------------------------
 * Stage FX state machine — the artifact's whole visible life happens at the
 * viewport center. It dissolves IN once the sticky hold has caught it on the
 * center line (it is invisible while riding there), holds sharp, then
 * dissolves OUT in place, with a handoff pause before the next artifact so
 * the copy transition owns the gap. States (dataset.stageFx):
 *   (absent) hidden → 'visible' → 'out' → hidden
 * Opacity is binary; the CSS transition on .chapter-slide__stage animates
 * every flip, and hysteresis on the thresholds keeps flips rare.
 * ------------------------------------------------------------------------- */

const stageFadeTimers = new WeakMap<HTMLElement, number>()

/* Handoff pause: an arriving stage waits until the outgoing dissolve finishes
 * plus a beat. Dialable via ?fadeTune=1 (documentElement.dataset.stagePauseMs). */
const STAGE_HANDOFF_PAUSE_MS = 240
let stageEntryGateUntil = 0
let gateFlushTimer: number | null = null

function handoffPauseMs(): number {
  const raw = document.documentElement.dataset.stagePauseMs
  const parsed = raw ? parseFloat(raw) : NaN
  return Number.isFinite(parsed) ? Math.max(0, parsed) : STAGE_HANDOFF_PAUSE_MS
}

/* Scroll frames only run while scrolling — if the visitor stops mid-gap, this
 * one-shot re-runs the pipeline at release time so the entry isn't stranded. */
function scheduleGateFlush(): void {
  if (gateFlushTimer != null) return
  const delay = Math.max(0, stageEntryGateUntil - performance.now()) + 30
  gateFlushTimer = window.setTimeout(() => {
    gateFlushTimer = null
    flushScrollFrame()
  }, delay)
}

/* Dissolve out in place: the stage keeps its sticky center hold while
 * opacity/blur transition to zero (chapter-slide-base.css supplies the
 * transition), then the positional teardown runs once it's invisible —
 * tearing down immediately snapped the artifact out of center mid-fade. */
function stageChapterId(stage: HTMLElement): string | null {
  return (
    stage.closest<HTMLElement>('[data-chapter-id]')?.dataset.chapterId ?? null
  )
}

function beginStageFadeOut(stage: HTMLElement): void {
  stage.dataset.stageFx = 'out'
  stage.dataset.stageOutY = String(Math.round(window.scrollY))
  // Companions (placed stickers, the pile) fade out on the same beat.
  const chapterId = stageChapterId(stage)
  if (chapterId) publishChapterStageFx(chapterId, false)
  stage.style.opacity = '0'
  stage.style.filter = 'blur(var(--stage-exit-blur, 0px))'
  // Behind whatever shows next.
  stage.style.zIndex = '1'
  stage.style.pointerEvents = 'none'

  const durationMs =
    parseFloat(getComputedStyle(stage).transitionDuration) * 1000 || 0
  const timer = window.setTimeout(() => {
    finalizeStageClear(stage, stageAlignTarget(stage))
  }, durationMs + 60)
  stageFadeTimers.set(stage, timer)
  stageEntryGateUntil = Math.max(
    stageEntryGateUntil,
    performance.now() + durationMs + handoffPauseMs(),
  )
}

function cancelStageFadeOut(stage: HTMLElement): void {
  const timer = stageFadeTimers.get(stage)
  if (timer != null) {
    window.clearTimeout(timer)
    stageFadeTimers.delete(stage)
  }
}

function finalizeStageClear(stage: HTMLElement, align: HTMLElement | null): void {
  stageFadeTimers.delete(stage)
  delete stage.dataset.stageFx
  // Idempotent with beginStageFadeOut; covers direct teardowns (resize, reset).
  const chapterId = stageChapterId(stage)
  if (chapterId) publishChapterStageFx(chapterId, false)
  delete stage.dataset.stagePinned
  delete stage.dataset.stageCentered
  stage.style.removeProperty('--stage-artifact-half')
  stage.style.opacity = '0'
  stage.style.visibility = 'hidden'
  // The resting blur comes from CSS (chapter-continuous-scroll) so the next
  // entry dissolves in — drop the fade-out's inline value.
  stage.style.removeProperty('filter')
  stage.style.removeProperty('pointer-events')
  stage.style.removeProperty('z-index')
  clearPhase(stage, align)
  if (align) align.style.removeProperty('transform')
}

/* ---------------------------------------------------------------------------
 * Per-frame pipeline: one measure pass (all layout reads), one write pass
 * (all style writes). Interleaving the two forces a reflow per stage.
 * ------------------------------------------------------------------------- */

type StageEntry = {
  stage: HTMLElement
  align: HTMLElement | null
  copy: HTMLElement | null
  slot: HTMLElement | null
  chapterId: string | null
  stageReveal: number
  copyReveal: number
}

type StageMeasure = {
  entry: StageEntry
  /** Should the artifact be showing this frame (thresholds + pin)? */
  want: boolean
  /** Set on a hidden→visible transition: half the artifact height, for the
   * sticky centering var. null = not ready to show yet. */
  centerHalf: number | null
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
      slot: slot ?? null,
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

/** Strip continuous-align inline styles without hiding stages (mobile/tablet in-flow). */
export function releaseContinuousStageAlignForInFlowNav(): void {
  committedPinId = null
  document.querySelectorAll<HTMLElement>(STAGE_SELECTOR).forEach((stage) => {
    const align = stageAlignTarget(stage)
    cancelStageFadeOut(stage)
    delete stage.dataset.stageFx
    const chapterId = stageChapterId(stage)
    if (chapterId) publishChapterStageFx(chapterId, false)
    delete stage.dataset.stageOutY
    delete stage.dataset.stagePinned
    delete stage.dataset.stageCentered
    delete stage.dataset.stagePhase
    stage.style.removeProperty('--stage-artifact-half')
    stage.style.removeProperty('opacity')
    stage.style.removeProperty('filter')
    stage.style.removeProperty('visibility')
    stage.style.removeProperty('pointer-events')
    stage.style.removeProperty('z-index')
    if (align) {
      delete align.dataset.stagePhase
      align.style.removeProperty('transform')
    }
  })
}

export function resetContinuousStageAlign(): void {
  committedPinId = null
  document.querySelectorAll<HTMLElement>(STAGE_SELECTOR).forEach((stage) => {
    // Mode switches tear down immediately — no lingering fade timers, and the
    // re-entry latch is meaningless across a layout change.
    cancelStageFadeOut(stage)
    delete stage.dataset.stageOutY
    finalizeStageClear(stage, stageAlignTarget(stage))
  })
}

function measureStage(
  entry: StageEntry,
  pinId: string | null,
  vh: number,
): StageMeasure | null {
  const { stage, align, copy, slot, chapterId, stageReveal, copyReveal } = entry
  if (!chapterId || !copy || !align) return null

  const fx = stage.dataset.stageFx
  const isPin = chapterId === pinId

  const shouldShow =
    isPin &&
    stageReveal >= STAGE_PIN_REVEAL &&
    copyReveal >= CHAPTER_INTERACTIVE_VISIBILITY
  const shouldKeep =
    isPin &&
    stageReveal >= STAGE_PIN_REVEAL - STAGE_EXIT_MARGIN &&
    copyReveal >= CHAPTER_INTERACTIVE_VISIBILITY - STAGE_EXIT_MARGIN

  let want = fx != null ? shouldKeep : shouldShow

  if (want && fx === 'visible') {
    // The artifact has left its center lock — dissolve out near the lock, in
    // place, rather than letting it travel with the text until the reveal
    // threshold catches up. Upward: slot containment forcing it off at the
    // chapter's end. Downward: reverse scroll releasing the sticky clamp.
    const artifactH = artifactHeight(align)
    const centerTop = viewportCenterTop(vh, artifactH)
    const alignTop = align.getBoundingClientRect().top
    const pushedOff = alignTop < centerTop - STAGE_PUSH_OFF_PX
    const rodeAway = alignTop > centerTop + STAGE_RIDE_AWAY_PX
    if (pushedOff || rodeAway) want = false
  }

  let centerHalf: number | null = null
  if (want && fx == null) {
    const artifactH = artifactHeight(align)
    const outY = parseFloat(stage.dataset.stageOutY ?? '')
    if (artifactH < ALIGN_HEIGHT_MIN_PX) {
      // Content hasn't laid out yet — try again next frame.
      want = false
    } else if (
      Number.isFinite(outY) &&
      Math.abs(window.scrollY - outY) < STAGE_REENTRY_SCROLL_PX
    ) {
      // Still within re-entry distance of the last dissolve-out.
      want = false
    } else {
      // Materialize AT the center line: wait until the (still invisible)
      // artifact's ride has reached it, and until the slot still has room to
      // clamp the full artifact there (near a slot's end the sticky hold
      // would immediately push it off again). Visibility is a pure function
      // of the scroll position, so a stopped scroll can't strand anything —
      // the artifact simply dissolves in when scrolling resumes past this
      // line. Approached from below (scrolling up), the align sticky-clamps
      // at the line the moment it pins, so re-entries appear centered too.
      const centerTop = viewportCenterTop(vh, artifactH)
      const engaged =
        align.getBoundingClientRect().top <= centerTop + STAGE_ENTRY_NEAR_PX
      const roomToClamp = slot
        ? slot.getBoundingClientRect().bottom >=
          centerTop + artifactH + STAGE_PUSH_OFF_PX
        : true
      if (engaged && roomToClamp) {
        centerHalf = artifactH / 2
      } else {
        want = false
      }
    }
  }

  return { entry, want, centerHalf }
}

function writeStage(m: StageMeasure): void {
  const { stage, align, chapterId } = m.entry
  if (!chapterId || !align) return

  const fx = stage.dataset.stageFx

  if (m.want) {
    if (fx === 'visible') return
    // A dissolve-out always completes — flipping it back mid-fade is the
    // strobe. The stage re-enters through the fresh-arrival path below once
    // finalized (and past the re-entry latch).
    if (fx === 'out') return
    if (m.centerHalf == null) return

    // Handoff pause — checked at write time, after this frame's fade-outs
    // (first write sub-pass) have extended the gate.
    if (performance.now() < stageEntryGateUntil) {
      scheduleGateFlush()
      return
    }

    delete stage.dataset.stageOutY
    // Sticky centering (compositor-native, jitter-free): the CSS keys off
    // data-stage-pinned/centered plus the artifact-half var.
    stage.style.setProperty('--stage-artifact-half', `${m.centerHalf}px`)
    stage.dataset.stageCentered = 'true'
    stage.dataset.stageFx = 'visible'
    stage.dataset.stagePinned = 'true'
    stage.style.opacity = '1'
    stage.style.filter = ''
    stage.style.visibility = 'visible'
    stage.style.zIndex = '2'
    stage.style.pointerEvents = stagePointerEvents(stage, 1)
    setPhase(stage, align, 'center')
    // Companions (placed stickers, the pile) dissolve in on the same beat.
    publishChapterStageFx(chapterId, true)
    return
  }

  if (fx === 'visible') {
    beginStageFadeOut(stage)
  }
  // fx === 'out': teardown timer is already running. fx == null: at rest.
}

/**
 * Continuous desktop: the artifact dissolves in at the viewport center, holds
 * via position:sticky, and dissolves out in place — the copy scrolls past
 * with its own fade, and a handoff pause separates consecutive artifacts.
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
  const pinId = pickStagePinId(entries, stageRevealMap)

  // Measure pass — every layout read for every stage happens here.
  const measures: StageMeasure[] = []
  for (const entry of entries) {
    const measure = measureStage(entry, pinId, vh)
    if (measure) measures.push(measure)
  }

  // Write pass — style/dataset writes only; no reads that force layout.
  // Fade-outs first: they extend the handoff gate that arrivals check.
  for (const measure of measures) {
    if (!measure.want) writeStage(measure)
  }
  for (const measure of measures) {
    if (measure.want) writeStage(measure)
  }
}
