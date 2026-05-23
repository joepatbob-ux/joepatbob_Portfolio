'use client'

import { KelvinAfterWireframe } from '@/components/KelvinAfterWireframe'
import {
  COIN_BRUSH_PX,
  createCoinBrushDataUrl,
  createUnifiedBeforeCoverDataUrl,
  loadScratchFrontImage,
  SCRATCH_CARD_PX,
} from '@/lib/webAppsScratchAssets'
import { useCallback, useEffect, useRef, useState } from 'react'
import ScratchCard, {
  Brushes,
  Covers,
  type ScratchCardRef,
} from 'react-scratchcard-v2'
import '@/styles/web-apps-scratch-reveal.css'

const FINISH_PERCENT = 55

export function WebAppsScratchReveal() {
  const scratchRef = useRef<ScratchCardRef | null>(null)
  const cardWrapRef = useRef<HTMLDivElement>(null)
  const [cover, setCover] = useState<string | null>(null)
  const [coinBrush, setCoinBrush] = useState<string | null>(null)
  const [scratchPercent, setScratchPercent] = useState(0)
  const [complete, setComplete] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [coinPos, setCoinPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    let cancelled = false

    loadScratchFrontImage()
      .then((scratchFront) => {
        if (cancelled) return
        setCover(createUnifiedBeforeCoverDataUrl(scratchFront))
        setCoinBrush(createCoinBrushDataUrl())
      })
      .catch(() => {
        if (cancelled) return
        setCover(createUnifiedBeforeCoverDataUrl(null))
        setCoinBrush(createCoinBrushDataUrl())
      })

    return () => {
      cancelled = true
    }
  }, [])

  const markComplete = useCallback(() => {
    scratchRef.current?.revealAll()
    setComplete(true)
    setScratchPercent(100)
  }, [])

  const resetAll = useCallback(() => {
    scratchRef.current?.reset()
    setComplete(false)
    setScratchPercent(0)
  }, [])

  /** Card-local coords — `position:fixed` breaks under chapter panel `filter`. */
  const updateCoinPos = useCallback((clientX: number, clientY: number) => {
    const wrap = cardWrapRef.current
    if (!wrap) return
    const rect = wrap.getBoundingClientRect()
    setCoinPos({ x: clientX - rect.left, y: clientY - rect.top })
  }, [])

  const trackCoin = useCallback(
    (percent: number, _pos: unknown, global: { x: number; y: number }) => {
      updateCoinPos(global.x, global.y)
      if (!complete) setScratchPercent(Math.round(percent))
    },
    [complete, updateCoinPos],
  )

  const ready = Boolean(cover && coinBrush)

  return (
    <div
      className="web-apps-scratch"
      role="application"
      aria-label="Scratch card revealing four legacy product UIs and the unified Kelvin design system underneath."
      style={{
        ['--scratch-card' as string]: `${SCRATCH_CARD_PX}px`,
        ['--scratch-coin-size' as string]: `${COIN_BRUSH_PX}px`,
      }}
    >
      <div
        ref={cardWrapRef}
        className={`web-apps-scratch__card-wrap${hovering ? ' web-apps-scratch__card-wrap--hover' : ''}`}
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

        <div className="web-apps-scratch__card">
          {ready && cover && coinBrush ? (
            <ScratchCard
              ref={scratchRef}
              width={SCRATCH_CARD_PX}
              height={SCRATCH_CARD_PX}
              cover={Covers.image(cover)}
              brush={Brushes.image(coinBrush, COIN_BRUSH_PX, COIN_BRUSH_PX)}
              finishPercent={FINISH_PERCENT}
              lockOnComplete
              onComplete={markComplete}
              onScratch={trackCoin}
              onScratchStart={() => setHovering(true)}
              scratchInterval={16}
              ariaLabel="Scratch to reveal the unified Kelvin design system"
              canvasProps={{
                className: 'web-apps-scratch__scratch-canvas',
                style: { display: 'block', cursor: 'none' },
              }}
            >
              <KelvinAfterWireframe
                width={SCRATCH_CARD_PX}
                height={SCRATCH_CARD_PX}
              />
            </ScratchCard>
          ) : (
            <div className="web-apps-scratch__placeholder" aria-hidden />
          )}
        </div>
      </div>

      <div className="web-apps-scratch__footer">
        <p className="web-apps-scratch__count">
          {complete ? 'Fully revealed' : `${scratchPercent}% revealed`}
        </p>
        {complete && (
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
