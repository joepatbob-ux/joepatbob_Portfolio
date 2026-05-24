'use client'

import { KelvinAfterWireframe } from '@/components/KelvinAfterWireframe'
import { ScratchCoinTray } from '@/components/web-apps/ScratchCoinTray'
import { useChapterActive } from '@/lib/chapterActiveContext'
import { KELVIN_SCRATCH_QUADS } from '@/lib/kelvinScratchQuads'
import { useKelvinScratchAssets } from '@/lib/useKelvinScratchAssets'
import {
  COIN_BRUSH_PX,
  COIN_CURSOR_PX,
  KELVIN_COIN_TILTED_SRC,
  SCRATCH_CARD_PX,
} from '@/lib/webAppsScratchAssets'
import { memo, useCallback, useRef, useState } from 'react'
import ScratchCard, { Brushes, Covers } from 'react-scratchcard-v2'
import '@/styles/web-apps-scratch-reveal.css'

const FINISH_PERCENT = 55

function KelvinQuadScratchInner() {
  const isActive = useChapterActive()
  const frameRef = useRef<HTMLDivElement>(null)
  const { cover, coinBrush, ready } = useKelvinScratchAssets(isActive)
  const [coinInTray, setCoinInTray] = useState(true)
  const [scratchEngaged, setScratchEngaged] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [percent, setPercent] = useState(0)
  const [coinPos, setCoinPos] = useState({ x: 0, y: 0 })

  const pickUpCoin = useCallback(() => {
    setCoinInTray(false)
    setScratchEngaged(true)
  }, [])

  const leaveCoin = useCallback(() => {
    setCoinInTray(true)
    setHovering(false)
  }, [])

  const updateCoinPos = useCallback((clientX: number, clientY: number) => {
    const frame = frameRef.current
    if (!frame) return
    const rect = frame.getBoundingClientRect()
    setCoinPos({ x: clientX - rect.left, y: clientY - rect.top })
  }, [])

  const trackCoin = useCallback(
    (value: number, _pos: unknown, global: { x: number; y: number }) => {
      setPercent(Math.round(value))
      updateCoinPos(global.x, global.y)
    },
    [updateCoinPos],
  )

  const coinActive = ready && !coinInTray
  const showFollowCoin = coinActive && hovering
  const showScratch = ready && cover && coinBrush && scratchEngaged

  return (
    <div
      className="kelvin-quad-scratch web-apps-scratch"
      role="application"
      aria-label="Scratch the foil with the Kelvin coin to reveal the unified design system underneath."
      style={{
        ['--scratch-coin-size' as string]: `${COIN_CURSOR_PX}px`,
        ['--scratch-card' as string]: `${SCRATCH_CARD_PX}px`,
      }}
    >
      <div className="kelvin-quad-scratch__stage web-apps-scratch__stage">
        <div
          ref={frameRef}
          className={[
            'kelvin-quad-scratch__frame web-apps-scratch__card-wrap',
            coinActive && hovering ? 'kelvin-quad-scratch__frame--hover' : '',
            coinActive ? 'kelvin-quad-scratch__frame--active' : '',
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
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="web-apps-scratch__coin-cursor"
              src={KELVIN_COIN_TILTED_SRC}
              alt=""
              draggable={false}
              style={{ left: coinPos.x, top: coinPos.y }}
            />
          ) : null}

          <div className="kelvin-quad-scratch__card web-apps-scratch__card">
            {showScratch ? (
              <ScratchCard
                width={SCRATCH_CARD_PX}
                height={SCRATCH_CARD_PX}
                cover={Covers.image(cover)}
                brush={Brushes.image(coinBrush, COIN_BRUSH_PX, COIN_BRUSH_PX)}
                finishPercent={FINISH_PERCENT}
                lockOnComplete={false}
                onScratch={trackCoin}
                onScratchStart={() => setHovering(true)}
                scratchInterval={16}
                ariaLabel="Scratch to reveal Kelvin design system"
                canvasProps={{
                  className: 'web-apps-scratch__scratch-canvas',
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
              <div className="kelvin-quad-scratch__idle web-apps-scratch__card-idle">
                <KelvinAfterWireframe
                  width={SCRATCH_CARD_PX}
                  height={SCRATCH_CARD_PX}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="kelvin-quad-scratch__idle-cover web-apps-scratch__card-cover"
                  src={cover}
                  alt=""
                  draggable={false}
                />
              </div>
            ) : (
              <div className="kelvin-quad-scratch__placeholder web-apps-scratch__placeholder" />
            )}

            <div className="kelvin-quad-scratch__overlay" aria-hidden>
              {KELVIN_SCRATCH_QUADS.map((quad) => (
                <div key={quad.id} className="kelvin-quad-scratch__overlay-cell">
                  <span className="kelvin-quad-scratch__label">{quad.label}</span>
                </div>
              ))}
            </div>
          </div>

          {ready && coinInTray ? (
            <p className="kelvin-quad-scratch__hint">
              Take the coin from the tray to scratch
            </p>
          ) : null}
        </div>

        <ScratchCoinTray
          coinInTray={coinInTray}
          onPickUp={pickUpCoin}
          onLeave={leaveCoin}
          pickUpLabel="Take the Kelvin coin to scratch"
          leaveLabel="Leave the Kelvin coin in the tray"
        />
      </div>

      {showScratch ? (
        <p className="kelvin-quad-scratch__status web-apps-scratch__count">
          {percent >= FINISH_PERCENT ? 'Revealed' : `${percent}% revealed`}
        </p>
      ) : null}
    </div>
  )
}

export const KelvinQuadScratch = memo(KelvinQuadScratchInner)
