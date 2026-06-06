'use client'

import { BowlGlassTunePanel } from '@/components/everything-in-between/BowlGlassTunePanel'
import { QuoteBowlControls } from '@/components/everything-in-between/quote-bowl/QuoteBowlControls'
import { useTheme } from '@/components/ThemeProvider'
import { QUOTE_BOWL } from '@/lib/everything-in-between/quoteBowl/constants'
import { useQuoteBowlFlow } from '@/lib/everything-in-between/quoteBowl/useQuoteBowlFlow'
import { useQuoteBowlGlassTune } from '@/lib/everything-in-between/quoteBowl/useQuoteBowlGlassTune'
import { useQuoteTypewriter } from '@/lib/everything-in-between/useQuoteTypewriter'
import { useChapterActive } from '@/lib/chapterActiveContext'
import { useCanvasDpr } from '@/lib/hooks/useCanvasDpr'
import { usePrefersReducedMotion } from '@/lib/hooks/usePrefersReducedMotion'
import { Canvas } from '@react-three/fiber'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const ConceptQuoteBowlCanvas = dynamic(
  () =>
    import('@/components/everything-in-between/ConceptQuoteBowlCanvas').then(
      (m) => ({ default: m.ConceptQuoteBowlCanvas }),
    ),
  { ssr: false },
)

type Props = {
  answers: readonly string[]
}

function stageAriaLabel(step: ReturnType<typeof useQuoteBowlFlow>['step']) {
  if (step === 'pick') return 'Pick a quote from the bowl'
  if (step === 'revealed') {
    return 'Quote revealed — click the bowl to pick again'
  }
  return undefined
}

export function ConceptQuoteBowl({ answers }: Props) {
  const chapterActive = useChapterActive()
  const { resolvedTheme } = useTheme()
  const darkSurface = resolvedTheme === 'dark'
  const canvasDpr = useCanvasDpr(QUOTE_BOWL.canvas.maxDpr)
  const reducedMotion = usePrefersReducedMotion()
  const {
    step,
    selectedSlipId,
    answer,
    reset,
    onPickSlip,
    showTypedQuote,
    isPickTarget,
  } = useQuoteBowlFlow(reducedMotion)
  const {
    tuneOpen,
    tuneDev,
    glassTune,
    openTune,
    closeTune,
    onGlassTuneChange,
  } = useQuoteBowlGlassTune()

  const typedQuote = useQuoteTypewriter(answer, showTypedQuote, reducedMotion)
  const { camera } = QUOTE_BOWL

  return (
    <div className="quote-bowl">
      <div
        className={[
          'quote-bowl__stage',
          isPickTarget ? 'quote-bowl__stage--pick-target' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-label={stageAriaLabel(step)}
        onContextMenu={openTune}
      >
        {tuneDev ? (
          <button
            type="button"
            className="quote-bowl__tune-btn"
            onClick={openTune}
            aria-label="Open bowl glass tune panel"
          >
            Glass
          </button>
        ) : null}

        {chapterActive ? (
          <Canvas
            className="quote-bowl__canvas"
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
              if (darkSurface) {
                gl.toneMappingExposure = 1.08
              }
            }}
          >
            <Suspense fallback={null}>
              <ConceptQuoteBowlCanvas
                answers={answers}
                step={step}
                selectedSlipId={selectedSlipId}
                reducedMotion={reducedMotion}
                darkSurface={darkSurface}
                glassTune={glassTune}
                onPickSlip={onPickSlip}
                onReset={reset}
              />
            </Suspense>
          </Canvas>
        ) : (
          <div className="quote-bowl__canvas quote-bowl__canvas--placeholder" />
        )}
      </div>

      {tuneOpen ? (
        <BowlGlassTunePanel
          tune={glassTune}
          onChange={onGlassTuneChange}
          onClose={closeTune}
        />
      ) : null}

      <QuoteBowlControls
        showSlip={showTypedQuote && answer != null}
        typedQuote={typedQuote}
      />
    </div>
  )
}
