'use client'

import type { FortuneColor, FortuneTellerStep } from '@/lib/everything-in-between/fortuneTeller'
import {
  FORTUNE_NUMBERS,
  pickFortuneAnswer,
  pinchDurationMs,
} from '@/lib/everything-in-between/fortuneTeller'
import { useChapterActive } from '@/lib/chapterActiveContext'
import { Canvas } from '@react-three/fiber'
import dynamic from 'next/dynamic'
import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

const ConceptFortuneTellerCanvas = dynamic(
  () =>
    import('@/components/everything-in-between/ConceptFortuneTellerCanvas').then(
      (m) => ({ default: m.ConceptFortuneTellerCanvas }),
    ),
  { ssr: false },
)

type Props = {
  answers: readonly string[]
  colors: readonly FortuneColor[]
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return reduced
}

export function ConceptFortuneTeller({ answers, colors }: Props) {
  const chapterActive = useChapterActive()
  const reducedMotion = usePrefersReducedMotion()
  const [step, setStep] = useState<FortuneTellerStep>('pick-color')
  const [colorIndex, setColorIndex] = useState(0)
  const [pinchTick, setPinchTick] = useState(0)
  const [answer, setAnswer] = useState<string | null>(null)
  const lastAnswer = useRef<string | null>(null)
  const pinchTimer = useRef<number | null>(null)

  const clearPinchTimer = useCallback(() => {
    if (pinchTimer.current != null) {
      window.clearTimeout(pinchTimer.current)
      pinchTimer.current = null
    }
  }, [])

  useEffect(() => clearPinchTimer, [clearPinchTimer])

  const reset = useCallback(() => {
    clearPinchTimer()
    setStep('pick-color')
    setAnswer(null)
    setPinchTick(0)
  }, [clearPinchTimer])

  const runPinch = useCallback(
    (index: number, color: FortuneColor) => {
      setColorIndex(index)
      setStep('pinching')
      setPinchTick(0)
      setAnswer(null)

      const totalMs = pinchDurationMs(color.spellCount, reducedMotion)
      if (totalMs <= 0) {
        setStep('pick-number')
        return
      }

      const interval = totalMs / color.spellCount
      let count = 0

      const pulse = () => {
        count += 1
        setPinchTick(count)
        if (count >= color.spellCount) {
          pinchTimer.current = window.setTimeout(() => {
            setStep('pick-number')
            pinchTimer.current = null
          }, interval * 0.35)
          return
        }
        pinchTimer.current = window.setTimeout(pulse, interval)
      }

      pinchTimer.current = window.setTimeout(pulse, interval * 0.2)
    },
    [reducedMotion],
  )

  const onPickColor = useCallback(
    (index: number) => {
      if (step !== 'pick-color') return
      runPinch(index, colors[index])
    },
    [colors, runPinch, step],
  )

  const onPickNumber = useCallback(
    (num: number) => {
      if (step !== 'pick-number') return
      const next = pickFortuneAnswer(
        answers,
        lastAnswer.current,
        colorIndex,
        num,
      )
      lastAnswer.current = next
      setAnswer(next)
      setStep('revealed')
    },
    [answers, colorIndex, step],
  )

  const animating =
    step === 'pinching' ||
    step === 'pick-number' ||
    (step === 'pick-color' && !reducedMotion)
  const shouldRenderCanvas = chapterActive
  const frameloop =
    chapterActive && (animating || step !== 'revealed') ? 'always' : 'demand'

  return (
    <div className="fortune-teller">
      <div className="fortune-teller__stage" aria-hidden={step === 'revealed'}>
        {shouldRenderCanvas ? (
          <Canvas
            className="fortune-teller__canvas"
            camera={{ position: [0, 2.35, 3.15], fov: 38, near: 0.05, far: 40 }}
            gl={{
              alpha: true,
              antialias: true,
              powerPreference: 'high-performance',
            }}
            dpr={[1, 2]}
            frameloop={frameloop}
            onCreated={({ gl }) => {
              gl.setClearColor(0x000000, 0)
            }}
          >
            <Suspense fallback={null}>
              <ConceptFortuneTellerCanvas
                colors={colors}
                step={step}
                pinchTick={pinchTick}
                colorIndex={colorIndex}
                reducedMotion={reducedMotion}
                onPickColor={onPickColor}
              />
            </Suspense>
          </Canvas>
        ) : (
          <div className="fortune-teller__canvas fortune-teller__canvas--placeholder" />
        )}
      </div>

      <div className="fortune-teller__controls">
        {step === 'pick-color' ? (
          <p className="fortune-teller__prompt" id="fortune-teller-prompt">
            Pick a color
          </p>
        ) : null}

        {step === 'pinching' ? (
          <p className="fortune-teller__prompt" aria-live="polite">
            {colors[colorIndex]?.label}…
          </p>
        ) : null}

        {step === 'pick-number' ? (
          <>
            <p className="fortune-teller__prompt" id="fortune-teller-prompt">
              Pick a number
            </p>
            <div
              className="fortune-teller__numbers"
              role="group"
              aria-labelledby="fortune-teller-prompt"
            >
              {FORTUNE_NUMBERS.map((num) => (
                <button
                  key={num}
                  type="button"
                  className="fortune-teller__number"
                  onClick={() => onPickNumber(num)}
                >
                  {num}
                </button>
              ))}
            </div>
          </>
        ) : null}

        {step === 'revealed' && answer ? (
          <>
            <div className="fortune-teller__slip-wrap">
              <div className="fortune-teller__slip" role="status">
                <p className="fortune-teller__quote">{answer}</p>
              </div>
            </div>
            <button
              type="button"
              className="fortune-teller__reset"
              onClick={reset}
            >
              Fold again
            </button>
          </>
        ) : null}
      </div>
    </div>
  )
}
