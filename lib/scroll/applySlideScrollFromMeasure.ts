import {
  applyChapterPanelScrollStyles,
  applyContinuousCopyFade,
  applyPlacedStickerScrollVisibility,
  resetContinuousCopyFade,
} from '@/lib/scroll/applyChapterPanelScrollStyles'
import {
  applyContinuousStageAlign,
  resetContinuousStageAlign,
} from '@/lib/scroll/applyContinuousStageAlign'
import { isContinuousChapters } from '@/lib/scroll/continuousChapters'
import { isTopBarNavViewport } from '@/lib/layout/isTopBarNavViewport'
import {
  measureSlideScrollState,
  publishSlideScrollState,
  type SlideNavPhase,
  type SlideScrollState,
} from '@/lib/scroll/scrollOrchestration'

export type SlideNavGuard = { chapterId: string; until: number } | null

function applyNavGuard(
  state: SlideScrollState,
  lockedSlideId: string | null,
  navGuard: SlideNavGuard,
): SlideScrollState {
  if (lockedSlideId) return state
  if (!navGuard || performance.now() >= navGuard.until) return state
  if (state.inHero) return state

  // Keep destination visible after programmatic nav — snap may still be settling.
  return {
    ...state,
    activeSlideId: navGuard.chapterId,
    revealMap: { [navGuard.chapterId]: 1 },
    stageRevealMap: { [navGuard.chapterId]: 1 },
    inHero: false,
  }
}

/** Measure scroll + publish + paint panel opacity in one pass (no rAF gap). */
export function applySlideScrollFromMeasure(
  phase: SlideNavPhase,
  lockedSlideId: string | null,
  navGuard: SlideNavGuard,
): SlideScrollState {
  let state = measureSlideScrollState(phase, lockedSlideId)
  state = applyNavGuard(state, lockedSlideId, navGuard)

  publishSlideScrollState(state)

  if (isContinuousChapters() && !isTopBarNavViewport()) {
    if (phase === 'idle') {
      applyContinuousCopyFade(state.revealMap)
      applyContinuousStageAlign(
        state.stageRevealMap,
        state.revealMap,
        state.activeSlideId,
      )
    } else {
      resetContinuousCopyFade()
      resetContinuousStageAlign()
    }
  } else {
    resetContinuousCopyFade()
    resetContinuousStageAlign()
  }

  if (
    !isTopBarNavViewport() &&
    !isContinuousChapters() &&
    (phase === 'idle' || lockedSlideId != null)
  ) {
    applyChapterPanelScrollStyles(state.revealMap, state.activeSlideId)
  }
  applyPlacedStickerScrollVisibility(state.revealMap, state.activeSlideId, state.inHero)

  return state
}
