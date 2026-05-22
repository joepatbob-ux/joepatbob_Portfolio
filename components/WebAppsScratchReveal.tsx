'use client'

import { KelvinAfterWireframe } from '@/components/KelvinAfterWireframe'
import {
  COIN_BRUSH_PX,
  createBeforeCoverDataUrls,
  createCoinBrushDataUrl,
  loadScratchFrontImage,
  SCRATCH_CARD_PX,
  SCRATCH_QUAD_PX,
} from '@/lib/webAppsScratchAssets'
import { useCallback, useEffect, useRef, useState } from 'react'
import ScratchCard, {
  Brushes,
  Covers,
  type ScratchCardRef,
} from 'react-scratchcard-v2'
import '@/styles/web-apps-scratch-reveal.css'

const FINISH_PERCENT = 65
const QUAD_COUNT = 4

const QUAD_META = [
  { col: 0, row: 0, label: 'SENSI MTM' },
  { col: 1, row: 0, label: 'VERDANT MGR' },
  { col: 0, row: 1, label: 'CONNECT+' },
  { col: 1, row: 1, label: 'TEMPTRAK 6' },
] as const

function QuadrantReveal({
  col,
  row,
  children,
}: {
  col: number
  row: number
  children: React.ReactNode
}) {
  return (
    <div className="web-apps-scratch__reveal-window">
      <div
        className="web-apps-scratch__reveal-pan"
        style={{
          left: -col * SCRATCH_QUAD_PX,
          top: -row * SCRATCH_QUAD_PX,
        }}
      >
        {children}
      </div>
    </div>
  )
}

export function WebAppsScratchReveal() {
  const scratchRefs = useRef<(ScratchCardRef | null)[]>([])
  const cardWrapRef = useRef<HTMLDivElement>(null)
  const [covers, setCovers] = useState<string[] | null>(null)
  const [coinBrush, setCoinBrush] = useState<string | null>(null)
  const [completed, setCompleted] = useState<boolean[]>(
    Array<boolean>(QUAD_COUNT).fill(false),
  )
  const [showReset, setShowReset] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [coinPos, setCoinPos] = useState({ x: 0, y: 0 })

  const revealedCount = completed.filter(Boolean).length

  useEffect(() => {
    let cancelled = false

    loadScratchFrontImage()
      .then((scratchFront) => {
        if (cancelled) return
        setCovers(createBeforeCoverDataUrls(scratchFront))
        setCoinBrush(createCoinBrushDataUrl())
      })
      .catch(() => {
        if (cancelled) return
        setCovers(createBeforeCoverDataUrls(null))
        setCoinBrush(createCoinBrushDataUrl())
      })

    return () => {
      cancelled = true
    }
  }, [])

  const markComplete = useCallback((index: number) => {
    scratchRefs.current[index]?.revealAll()
    setCompleted((prev) => {
      if (prev[index]) return prev
      const next = [...prev]
      next[index] = true
      if (next.every(Boolean)) setShowReset(true)
      return next
    })
  }, [])

  const resetAll = useCallback(() => {
    scratchRefs.current.forEach((ref) => ref?.reset())
    setCompleted(Array<boolean>(QUAD_COUNT).fill(false))
    setShowReset(false)
  }, [])

  /** Card-local coords — `position:fixed` breaks under chapter panel `filter`. */
  const updateCoinPos = useCallback((clientX: number, clientY: number) => {
    const wrap = cardWrapRef.current
    if (!wrap) return
    const rect = wrap.getBoundingClientRect()
    setCoinPos({ x: clientX - rect.left, y: clientY - rect.top })
  }, [])

  const trackCoin = useCallback(
    (_percent: number, _pos: unknown, global: { x: number; y: number }) => {
      updateCoinPos(global.x, global.y)
    },
    [updateCoinPos],
  )

  const ready = Boolean(covers?.length === QUAD_COUNT && coinBrush)

  return (
    <div
      className="web-apps-scratch"
      role="application"
      aria-label="Scratch card with four product panels. Scratch each to reveal the unified Kelvin design system."
    >
      <div
        ref={cardWrapRef}
        className={`web-apps-scratch__card-wrap${hovering ? ' web-apps-scratch__card-wrap--hover' : ''}`}
        style={{ ['--scratch-coin-size' as string]: `${COIN_BRUSH_PX}px` }}
        onPointerEnter={() => setHovering(true)}
        onPointerLeave={() => setHovering(false)}
        onPointerMove={(e) => updateCoinPos(e.clientX, e.clientY)}
      >
        {hovering && (
          <div
            className="web-apps-scratch__coin-cursor"
            style={{ left: coinPos.x, top: coinPos.y }}
            aria-hidden
          />
        )}

        <div
          className="web-apps-scratch__card"
          style={{
            width: SCRATCH_CARD_PX,
            height: SCRATCH_CARD_PX,
          }}
        >
          <div className="web-apps-scratch__grid">
            {QUAD_META.map((quad, index) => (
              <div key={quad.label} className="web-apps-scratch__quad">
                {ready && covers && coinBrush ? (
                  <ScratchCard
                    ref={(el) => {
                      scratchRefs.current[index] = el
                    }}
                    width={SCRATCH_QUAD_PX}
                    height={SCRATCH_QUAD_PX}
                    cover={Covers.image(covers[index])}
                    brush={Brushes.image(coinBrush, COIN_BRUSH_PX, COIN_BRUSH_PX)}
                    finishPercent={FINISH_PERCENT}
                    lockOnComplete
                    onComplete={() => markComplete(index)}
                    onScratch={trackCoin}
                    onScratchStart={() => setHovering(true)}
                    scratchInterval={16}
                    ariaLabel={`Scratch to reveal ${quad.label}`}
                    canvasProps={{
                      className: 'web-apps-scratch__scratch-canvas',
                      style: { display: 'block', cursor: 'none' },
                    }}
                  >
                    <QuadrantReveal col={quad.col} row={quad.row}>
                      <KelvinAfterWireframe
                        width={SCRATCH_CARD_PX}
                        height={SCRATCH_CARD_PX}
                      />
                    </QuadrantReveal>
                  </ScratchCard>
                ) : (
                  <div
                    className="web-apps-scratch__quad-placeholder"
                    style={{
                      width: SCRATCH_QUAD_PX,
                      height: SCRATCH_QUAD_PX,
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="web-apps-scratch__footer">
        <div className="web-apps-scratch__dots" aria-hidden>
          {completed.map((done, i) => (
            <span
              key={QUAD_META[i].label}
              className={`web-apps-scratch__dot${done ? ' web-apps-scratch__dot--filled' : ''}`}
            />
          ))}
        </div>
        <p className="web-apps-scratch__count">{revealedCount} of 4 revealed</p>
        {showReset && (
          <button
            type="button"
            className="web-apps-scratch__reset"
            onClick={resetAll}
          >
            Scratch again
          </button>
        )}
      </div>
    </div>
  )
}
