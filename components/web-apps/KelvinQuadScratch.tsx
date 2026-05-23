'use client'

import { KelvinAfterWireframe } from '@/components/KelvinAfterWireframe'
import {
  COIN_BRUSH_PX,
  COIN_CURSOR_PX,
  createCoinBrushDataUrl,
  createQuadBeforeCoverDataUrl,
  KELVIN_COIN_FLAT_SRC,
  KELVIN_COIN_TILTED_SRC,
  loadKelvinCoinImages,
  loadScratchFrontImage,
  SCRATCH_CARD_PX,
  SCRATCH_QUAD_PX,
} from '@/lib/webAppsScratchAssets'
import { useCallback, useEffect, useRef, useState } from 'react'
import ScratchCard, { Brushes, Covers } from 'react-scratchcard-v2'
import '@/styles/web-apps-scratch-reveal.css'

const PRODUCT_LABELS = [
  'Sensi MTM',
  'Verdant TM',
  'Connect+',
  'TempTrak 6',
] as const

const QUAD_LAYOUT = [
  { col: 0, row: 0 },
  { col: 1, row: 0 },
  { col: 0, row: 1 },
  { col: 1, row: 1 },
] as const

function KelvinQuadAfter({ quadIndex }: { quadIndex: number }) {
  const { col, row } = QUAD_LAYOUT[quadIndex]
  return (
    <div
      className="kelvin-quad-scratch__after"
      style={{ width: SCRATCH_QUAD_PX, height: SCRATCH_QUAD_PX }}
    >
      <div
        className="kelvin-quad-scratch__after-inner"
        style={{
          width: SCRATCH_CARD_PX,
          height: SCRATCH_CARD_PX,
          transform: `translate(${-col * SCRATCH_QUAD_PX}px, ${-row * SCRATCH_QUAD_PX}px)`,
        }}
      >
        <KelvinAfterWireframe
          width={SCRATCH_CARD_PX}
          height={SCRATCH_CARD_PX}
        />
      </div>
    </div>
  )
}

export function KelvinQuadScratch() {
  const gridWrapRef = useRef<HTMLDivElement>(null)
  const [covers, setCovers] = useState<string[] | null>(null)
  const [coinBrush, setCoinBrush] = useState<string | null>(null)
  const [coinInTray, setCoinInTray] = useState(true)
  const [scratchEngaged, setScratchEngaged] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [coinPos, setCoinPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    let cancelled = false
    Promise.all([loadScratchFrontImage(), loadKelvinCoinImages()])
      .then(([scratchFront, coins]) => {
        if (cancelled) return
        setCovers(
          [0, 1, 2, 3].map((i) =>
            createQuadBeforeCoverDataUrl(i, scratchFront),
          ),
        )
        setCoinBrush(createCoinBrushDataUrl(coins.tilted))
      })
      .catch(() => {
        if (cancelled) return
        setCovers([0, 1, 2, 3].map((i) => createQuadBeforeCoverDataUrl(i, null)))
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

  const updateCoinPos = useCallback((clientX: number, clientY: number) => {
    const wrap = gridWrapRef.current
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

  const ready = Boolean(covers && coinBrush)
  const coinActive = ready && !coinInTray
  const showFollowCoin = coinActive && hovering

  return (
    <div
      className="kelvin-quad-scratch web-apps-scratch"
      role="application"
      aria-label="Scratch each product panel with the Kelvin coin to reveal the unified design system underneath."
      style={{
        ['--scratch-coin-size' as string]: `${COIN_CURSOR_PX}px`,
      }}
    >
      <div className="kelvin-quad-scratch__stage web-apps-scratch__stage">
        <div
          ref={gridWrapRef}
          className={[
            'kelvin-quad-scratch__grid-wrap',
            coinActive && hovering ? 'kelvin-quad-scratch__grid-wrap--hover' : '',
            coinActive ? 'kelvin-quad-scratch__grid-wrap--active' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onPointerEnter={() => {
            if (coinActive) setHovering(true)
          }}
          onPointerLeave={() => setHovering(false)}
          onPointerMove={(e) => {
            if (coinActive) updateCoinPos(e.clientX, e.clientY)
          }}
        >
          {showFollowCoin ? (
            <img
              className="web-apps-scratch__coin-cursor"
              src={KELVIN_COIN_TILTED_SRC}
              alt=""
              draggable={false}
              style={{ left: coinPos.x, top: coinPos.y }}
              aria-hidden
            />
          ) : null}

          <div className="kelvin-quad-scratch__grid">
            {PRODUCT_LABELS.map((label, i) => (
              <div key={label} className="kelvin-quad-scratch__cell">
                <span className="kelvin-quad-scratch__label">{label}</span>
                <div className="kelvin-quad-scratch__card">
                  {ready && covers && coinBrush && scratchEngaged ? (
                    <ScratchCard
                      width={SCRATCH_QUAD_PX}
                      height={SCRATCH_QUAD_PX}
                      cover={Covers.image(covers[i])}
                      brush={Brushes.image(
                        coinBrush,
                        COIN_BRUSH_PX,
                        COIN_BRUSH_PX,
                      )}
                      finishPercent={100}
                      lockOnComplete={false}
                      onScratch={trackCoin}
                      onScratchStart={() => setHovering(true)}
                      scratchInterval={16}
                      ariaLabel={`Scratch ${label} panel`}
                      canvasProps={{
                        className: 'web-apps-scratch__scratch-canvas',
                        style: {
                          display: 'block',
                          cursor: 'none',
                        },
                      }}
                    >
                      <KelvinQuadAfter quadIndex={i} />
                    </ScratchCard>
                  ) : ready && covers ? (
                    <div className="kelvin-quad-scratch__idle">
                      <KelvinQuadAfter quadIndex={i} />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        className="kelvin-quad-scratch__idle-cover"
                        src={covers[i]}
                        alt=""
                        draggable={false}
                      />
                    </div>
                  ) : (
                    <div
                      className="kelvin-quad-scratch__placeholder"
                      style={{
                        width: SCRATCH_QUAD_PX,
                        height: SCRATCH_QUAD_PX,
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          {ready && coinInTray ? (
            <p className="kelvin-quad-scratch__hint">
              Take the coin from the tray to scratch
            </p>
          ) : null}
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
                ? 'Take the Kelvin coin to scratch the panels'
                : 'Leave the Kelvin coin in the tray'
            }
          >
            {coinInTray ? (
              // eslint-disable-next-line @next/next/no-img-element
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
    </div>
  )
}
