import {
  applyChapterPanelScrollStyles,
  applyContinuousCopyFade,
  applyPlacedStickerScrollVisibility,
  resetContinuousCopyFade,
} from '@/lib/applyChapterPanelScrollStyles'
import {
  applyContinuousStageAlign,
  resetContinuousStageAlign,
} from '@/lib/applyContinuousStageAlign'
import { isContinuousChapters } from '@/lib/continuousChapters'
import { isTopBarNavViewport } from '@/lib/layout/isTopBarNavViewport'
import {
  measureSlideScrollState,
  publishSlideScrollState,
  type SlideNavPhase,
  type SlideScrollState,
} from '@/lib/scrollOrchestration'

export type SlideNavGuard = { chapterId: string; until: number } | null

function applyNavGuard(
  state: SlideScrollState,
  lockedSlideId: string | null,
  navGuard: SlideNavGuard,
): SlideScrollState {
  if (lockedSlideId) return state
  if (!navGuard || performance.now() >= navGuard.until) return state

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
    applyContinuousCopyFade(state.revealMap)
    applyContinuousStageAlign(state.stageRevealMap, state.activeSlideId)
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
  applyPlacedStickerScrollVisibility(state.revealMap, state.activeSlideId)

  return state
}
