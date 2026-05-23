'use client'

import { KelvinAfterWireframe } from '@/components/KelvinAfterWireframe'
import {
  COIN_BRUSH_PX,
  COIN_CURSOR_PX,
  createCoinBrushDataUrl,
  createUnifiedBeforeCoverDataUrl,
  KELVIN_COIN_FLAT_SRC,
  KELVIN_COIN_TILTED_SRC,
  loadKelvinCoinImages,
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
  /** Flat coin in tray until user picks it up for scratching. */
  const [coinInTray, setCoinInTray] = useState(true)
  /** Scratch card stays mounted after first pick-up until full reset. */
  const [scratchEngaged, setScratchEngaged] = useState(false)

  useEffect(() => {
    let cancelled = false

    Promise.all([loadScratchFrontImage(), loadKelvinCoinImages()])
      .then(([scratchFront, coins]) => {
        if (cancelled) return
        setCover(createUnifiedBeforeCoverDataUrl(scratchFront))
        setCoinBrush(createCoinBrushDataUrl(coins.tilted))
      })
      .catch(() => {
        if (cancelled) return
        setCover(createUnifiedBeforeCoverDataUrl(null))
        setCoinBrush(null)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const pickUpCoin = useCallback(() => {
    setCoinInTray(false)
    setScratchEngaged(true)
  }, [])

  const leaveCoin = useCallback(() => {
    setCoinInTray(true)
    setHovering(false)
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
    setCoinInTray(true)
    setScratchEngaged(false)
    setHovering(false)
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
  const coinActive = ready && !coinInTray
  const showFollowCoin = coinActive && hovering

  return (
    <div
      className="web-apps-scratch"
      role="application"
      aria-label="Scratch card revealing four legacy product UIs and the unified Kelvin design system underneath."
      style={{
        ['--scratch-card' as string]: `${SCRATCH_CARD_PX}px`,
        ['--scratch-coin-size' as string]: `${COIN_CURSOR_PX}px`,
      }}
    >
      <div className="web-apps-scratch__stage">
        <div
          ref={cardWrapRef}
          className={[
            'web-apps-scratch__card-wrap',
            coinActive && hovering ? ' web-apps-scratch__card-wrap--hover' : '',
            coinActive ? ' web-apps-scratch__card-wrap--active' : '',
          ].join('')}
          onPointerEnter={() => {
            if (coinActive) setHovering(true)
          }}
          onPointerLeave={() => setHovering(false)}
          onPointerMove={(e) => {
            if (coinActive) updateCoinPos(e.clientX, e.clientY)
          }}
        >
          {showFollowCoin && (
            <img
              className="web-apps-scratch__coin-cursor"
              src={KELVIN_COIN_TILTED_SRC}
              alt=""
              draggable={false}
              style={{ left: coinPos.x, top: coinPos.y }}
              aria-hidden
            />
          )}

          <div className="web-apps-scratch__card">
            {ready && cover && coinBrush && scratchEngaged ? (
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
                onScratchStart={() => {
                  if (!coinInTray) setHovering(true)
                }}
                scratchInterval={16}
                ariaLabel="Scratch to reveal the unified Kelvin design system"
                canvasProps={{
                  className: [
                    'web-apps-scratch__scratch-canvas',
                    coinInTray ? 'web-apps-scratch__scratch-canvas--parked' : '',
                  ]
                    .filter(Boolean)
                    .join(' '),
                  style: {
                    display: 'block',
                    cursor: coinInTray ? 'default' : 'none',
                    pointerEvents: coinInTray ? 'none' : 'auto',
                  },
                }}
              >
                <KelvinAfterWireframe
                  width={SCRATCH_CARD_PX}
                  height={SCRATCH_CARD_PX}
                />
              </ScratchCard>
            ) : ready && cover ? (
              <div className="web-apps-scratch__card-idle">
                <KelvinAfterWireframe
                  width={SCRATCH_CARD_PX}
                  height={SCRATCH_CARD_PX}
                />
                <img
                  className="web-apps-scratch__card-cover"
                  src={cover}
                  alt=""
                  draggable={false}
                />
                {coinInTray && (
                  <p className="web-apps-scratch__card-hint">
                    Take the coin from the tray to scratch
                  </p>
                )}
              </div>
            ) : (
              <div className="web-apps-scratch__placeholder" aria-hidden />
            )}
          </div>
        </div>

        <div className="web-apps-scratch__tray" aria-label="Coin tray">
          <p className="web-apps-scratch__tray-label">
            Take a penny,
            <br />
            leave a penny
          </p>
          <button
            type="button"
            className={[
              'web-apps-scratch__tray-well',
              coinInTray ? '' : 'web-apps-scratch__tray-well--leave',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={coinInTray ? pickUpCoin : leaveCoin}
            aria-label={
              coinInTray
                ? 'Take the Kelvin coin to scratch the card'
                : 'Leave the Kelvin coin in the tray'
            }
          >
            {coinInTray ? (
              <img
                className="web-apps-scratch__tray-coin-img"
                src={KELVIN_COIN_FLAT_SRC}
                alt=""
                width={56}
                height={56}
                draggable={false}
              />
            ) : (
              <span className="web-apps-scratch__tray-empty" aria-hidden />
            )}
          </button>
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
