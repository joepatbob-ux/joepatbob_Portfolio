'use client'

import { QuoteBowlControls } from '@/components/everything-in-between/quote-bowl/QuoteBowlControls'
import { StageLoadingOverlay } from '@/components/stage/StageLoadingOverlay'
import { StageSceneReady } from '@/components/stage/StageSceneReady'
import { useTheme } from '@/components/ThemeProvider'
import { QUOTE_BOWL } from '@/lib/everything-in-between/quoteBowl/constants'
import { useQuoteBowlFlow } from '@/lib/everything-in-between/quoteBowl/useQuoteBowlFlow'
import { useQuoteBowlGlassTune } from '@/lib/everything-in-between/quoteBowl/useQuoteBowlGlassTune'
import { useCanvasDpr } from '@/lib/hooks/useCanvasDpr'
import { useHydrated } from '@/lib/hooks/useHydrated'
import { useChapterStageMount } from '@/lib/hooks/useChapterStageMount'
import { useChapterStageReady } from '@/lib/chapterStageMountContext'
import { usePrefersReducedMotion } from '@/lib/hooks/usePrefersReducedMotion'
import { useStagePreload } from '@/lib/hooks/useStagePreload'
import { isPrerenderSnapshot } from '@/lib/isPrerenderSnapshot'
import { preloadQuoteBowlStage } from '@/lib/stagePreload/quoteBowl'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Canvas } from '@react-three/fiber'
import dynamic from 'next/dynamic'
import { Suspense, useCallback, useRef, useState } from 'react'

const ConceptQuoteBowlCanvas = dynamic(
  () =>
    import('@/components/everything-in-between/ConceptQuoteBowlCanvas').then(
      (m) => ({ default: m.ConceptQuoteBowlCanvas }),
    ),
  { ssr: false },
)

type Props = {
  answers: readonly string[]
  chapterId: string
}

function bowlActionLabel(
  step: ReturnType<typeof useQuoteBowlFlow>['step'],
  canRepick: boolean,
) {
  if (step === 'pick') return 'Reach into the bowl'
  if (step === 'revealed' && canRepick) return 'Reach into the bowl again'
  return 'Quote bowl'
}

export function ConceptQuoteBowl({ answers, chapterId }: Props) {
  const hydrated = useHydrated()
  const stageReady = useChapterStageReady()
  const { active: chapterActive } = useChapterStageMount(chapterId)
  const [sceneReady, setSceneReady] = useState(false)
  useStagePreload(chapterId, preloadQuoteBowlStage)
  const { resolvedTheme } = useTheme()
  const darkSurface = resolvedTheme === 'dark'
  const canvasDpr = useCanvasDpr(QUOTE_BOWL.canvas.maxDpr)
  const reducedMotion = usePrefersReducedMotion()
  const {
    step,
    selectedSlipId,
    answer,
    pullStartedAt,
    resetStartedAt,
    showSlip,
    slipExiting,
    showReset,
    hasPickedOnce,
    pendingPick,
    pileSeed,
    lastQuote,
    reset,
    onPickSlip,
    onTypewriterComplete,
    clearPendingPick,
    isPickTarget,
  } = useQuoteBowlFlow(reducedMotion)
  const { glassTune } = useQuoteBowlGlassTune()
  const stackRef = useRef<HTMLDivElement>(null)
  const pickActionRef = useRef<(() => void) | null>(null)

  const handlePickAction = useCallback(() => {
    pickActionRef.current?.()
  }, [])
  const handleSceneReady = useCallback(() => {
    setSceneReady(true)
  }, [])
  const { camera } = QUOTE_BOWL
  const showCanvas = stageReady && hydrated && !isPrerenderSnapshot()
  const showLoading = showCanvas && !sceneReady

  return (
    <div className="quote-bowl">
      <div className="quote-bowl__stack" ref={stackRef}>
        <QuoteBowlControls
          showSlip={showSlip && answer != null}
          slipExiting={slipExiting}
          quote={answer ?? ''}
          reducedMotion={reducedMotion}
          onTypewriterComplete={onTypewriterComplete}
        />

        {step === 'revealed' && showReset ? (
          <p className="quote-bowl__coach-hint quote-bowl__coach-hint--repick" aria-hidden>
            Reach in again
          </p>
        ) : !hasPickedOnce && step === 'pick' ? (
          <p className="quote-bowl__coach-hint" aria-hidden>
            Reach in
          </p>
        ) : null}

        <div
          className={[
            'quote-bowl__stage',
            isPickTarget ? 'quote-bowl__stage--pick-target' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <button
            type="button"
            className="quote-bowl__a11y-trigger"
            onClick={handlePickAction}
            aria-label={bowlActionLabel(step, showReset)}
          />

          <ErrorBoundary label="Bowl" onError={() => setSceneReady(true)}>
            {showLoading ? (
              <StageLoadingOverlay label="Loading bowl…" size="lg" />
            ) : null}

            {showCanvas ? (
              <Canvas
                className="quote-bowl__canvas"
                shadows
                style={{ width: '100%', height: '100%' }}
                camera={{
                  position: [...camera.position],
                  fov: camera.fov,
                  near: camera.near,
                  far: camera.far,
                }}
                gl={{
                  alpha: true,
                  antialias: true,
                  powerPreference: 'high-performance',
                }}
                dpr={canvasDpr}
                frameloop={chapterActive ? 'always' : 'never'}
                resize={{ scroll: false, debounce: { scroll: 0, resize: 0 } }}
                onCreated={({ gl }) => {
                  gl.setClearColor(0x000000, 0)
                  gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, QUOTE_BOWL.canvas.maxDpr))
                  gl.toneMappingExposure = darkSurface
                    ? QUOTE_BOWL.darkSurface.toneMappingExposure
                    : QUOTE_BOWL.lightSurface.toneMappingExposure
                }}
              >
                <Suspense fallback={null}>
                  <StageSceneReady onReady={handleSceneReady}>
                    <ConceptQuoteBowlCanvas
                      answers={answers}
                      step={step}
                      selectedSlipId={selectedSlipId}
                      pullStartedAt={pullStartedAt}
                      resetStartedAt={resetStartedAt}
                      showSlip={showSlip}
                      pileSeed={pileSeed}
                      pendingPick={pendingPick}
                      lastQuote={lastQuote}
                      reducedMotion={reducedMotion}
                      darkSurface={darkSurface}
                      glassTune={glassTune}
                      onPickSlip={onPickSlip}
                      onReset={reset}
                      onClearPendingPick={clearPendingPick}
                      canRepick={showReset}
                      pickActionRef={pickActionRef}
                      stackRef={stackRef}
                    />
                  </StageSceneReady>
                </Suspense>
              </Canvas>
            ) : (
              <div className="quote-bowl__canvas quote-bowl__canvas--placeholder" />
            )}
          </ErrorBoundary>
        </div>
      </div>
    </div>
  )
}
