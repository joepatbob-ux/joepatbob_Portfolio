'use client'

import type { ConceptEightBallPhase } from '@/components/everything-in-between/ConceptEightBallCanvas'
import { Canvas } from '@react-three/fiber'
import dynamic from 'next/dynamic'
import { Suspense, useCallback, useRef, useState } from 'react'

const ConceptEightBallCanvas = dynamic(
  () =>
    import('@/components/everything-in-between/ConceptEightBallCanvas').then(
      (m) => ({ default: m.ConceptEightBallCanvas }),
    ),
  { ssr: false },
)

const SHAKE_MS = 960

function pickAnswer(answers: readonly string[], previous: string | null): string {
  if (answers.length === 0) return 'Ask again.'
  if (answers.length === 1) return answers[0]

  let next = answers[Math.floor(Math.random() * answers.length)]
  let guard = 0
  while (next === previous && guard++ < 16) {
    next = answers[Math.floor(Math.random() * answers.length)]
  }
  return next
}

interface Props {
  answers: readonly string[]
  prompt?: string
}

export function ConceptEightBall({
  answers,
  prompt = 'Tap to shake',
}: Props) {
  const [phase, setPhase] = useState<ConceptEightBallPhase>('idle')
  const [answer, setAnswer] = useState<string | null>(null)
  const lastAnswer = useRef<string | null>(null)
  const busy = phase === 'shaking'

  const shake = useCallback(() => {
    if (busy) return

    setPhase('shaking')
    setAnswer(null)

    window.setTimeout(() => {
      const next = pickAnswer(answers, lastAnswer.current)
      lastAnswer.current = next
      setAnswer(next)
      setPhase('revealed')
    }, SHAKE_MS)
  }, [answers, busy])

  return (
    <div className="concept-eight-ball-wrap">
      <button
        type="button"
        className={[
          'concept-eight-ball',
          phase !== 'idle' ? `concept-eight-ball--${phase}` : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={shake}
        disabled={busy}
        aria-live="polite"
        aria-label={
          phase === 'revealed' && answer
            ? `Concept: ${answer}. Tap to shake again.`
            : 'Shake the concept eight ball'
        }
      >
        <div className="concept-eight-ball__stage">
          <Canvas
            className="concept-eight-ball__canvas"
            camera={{ position: [0, 0.12, 4.1], fov: 36, near: 0.05, far: 40 }}
            gl={{
              alpha: true,
              antialias: true,
              powerPreference: 'high-performance',
            }}
            dpr={[1, 2]}
            frameloop="always"
            onCreated={({ gl }) => {
              gl.setClearColor(0x000000, 0)
            }}
          >
            <Suspense fallback={null}>
              <ConceptEightBallCanvas phase={phase} answer={answer} />
            </Suspense>
          </Canvas>
        </div>
      </button>

      {phase === 'revealed' && answer ? (
        <p className="concept-eight-ball__answer">{answer}</p>
      ) : (
        <p className="concept-eight-ball__prompt">
          {phase === 'revealed' ? 'Tap to shake again' : prompt}
        </p>
      )}
    </div>
  )
}
