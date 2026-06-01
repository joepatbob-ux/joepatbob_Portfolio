'use client'

import { KelvinAfterWireframe } from '@/components/KelvinAfterWireframe'
import { KelvinTicketScratchZone } from '@/components/web-apps/KelvinTicketScratchZone'
import { ScratchCoinTray } from '@/components/web-apps/ScratchCoinTray'
import { useChapterActive } from '@/lib/chapterActiveContext'
import { KELVIN_SCRATCH_QUADS } from '@/lib/kelvinScratchQuads'
import {
  coinDisplayPxFromTrayWidth,
  KELVIN_SCRATCH_TICKET_SRC,
  SCRATCH_TICKET_DISPLAY_MAX_PX,
  scratchZoneLayoutPercents,
  scratchZonePixelSizeFromTicketWidth,
} from '@/lib/kelvinScratchTicket'
import { useKelvinScratchAssets } from '@/lib/useKelvinScratchAssets'
import { useElementSize } from '@/lib/useElementSize'
import {
  COIN_BRUSH_PX,
  COIN_CURSOR_PX,
  KELVIN_COIN_TILTED_SRC,
  SCRATCH_CARD_HEIGHT_PX,
  SCRATCH_CARD_PX,
} from '@/lib/webAppsScratchAssets'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ScratchCard, { Brushes, Covers } from 'react-scratchcard-v2'
import '@/styles/web-apps-scratch-reveal.css'

const FINISH_PERCENT = 55
const TICKET_ZONE = scratchZoneLayoutPercents()

function KelvinQuadScratchInner() {
  const isActive = useChapterActive()
  const { ref: frameRef, size: frameBox } = useElementSize<HTMLDivElement>()
  const { ref: cardRef, size: cardBox } = useElementSize<HTMLDivElement>()
  const { ref: ticketZoneRef, size: ticketZoneBox } =
    useElementSize<HTMLDivElement>()
  const stageRef = useRef<HTMLDivElement>(null)
  const { ref: trayRef, size: trayBox } = useElementSize<HTMLDivElement>()

  const { quadCover, ticketCoverImg, coinBrush, useTicketArt, ready, loading } =
    useKelvinScratchAssets(isActive)

  const [coinInTray, setCoinInTray] = useState(true)
  const [scratching, setScratching] = useState(false)
  const [coinPos, setCoinPos] = useState({ x: 0, y: 0 })

  const updateCoinPos = useCallback((clientX: number, clientY: number) => {
    const stage = stageRef.current
    if (!stage) return
    const rect = stage.getBoundingClientRect()
    setCoinPos({ x: clientX - rect.left, y: clientY - rect.top })
  }, [])

  const pickUpCoin = useCallback(
    (clientX: number, clientY: number) => {
      setCoinInTray(false)
      updateCoinPos(clientX, clientY)
    },
    [updateCoinPos],
  )

  const leaveCoin = useCallback(() => {
    setCoinInTray(true)
    setScratching(false)
  }, [])

  const coinActive = ready && !coinInTray

  useEffect(() => {
    if (!coinActive) return
    const onMove = (e: PointerEvent) => updateCoinPos(e.clientX, e.clientY)
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [coinActive, updateCoinPos])

  const trackCoin = useCallback(
    (_value: number, _pos: unknown, global: { x: number; y: number }) => {
      updateCoinPos(global.x, global.y)
    },
    [updateCoinPos],
  )

  const ticketMode = useTicketArt || loading

  const ticketZonePx = useMemo(() => {
    if (ticketZoneBox.width > 0 && ticketZoneBox.height > 0) {
      return {
        width: Math.round(ticketZoneBox.width),
        height: Math.round(ticketZoneBox.height),
      }
    }
    const ticketWidth =
      frameBox.width > 0 ? frameBox.width : SCRATCH_TICKET_DISPLAY_MAX_PX
    return scratchZonePixelSizeFromTicketWidth(ticketWidth)
  }, [ticketZoneBox.width, ticketZoneBox.height, frameBox.width])

  const cardWidth = cardBox.width > 0 ? cardBox.width : SCRATCH_CARD_PX
  const cardHeight = cardBox.height > 0 ? cardBox.height : SCRATCH_CARD_HEIGHT_PX
  const scale = cardWidth / SCRATCH_CARD_PX

  const brushPx = useMemo(
    () => Math.max(12, Math.round(COIN_BRUSH_PX * scale)),
    [scale],
  )
  const coinCursorPx = useMemo(
    () => Math.round(COIN_CURSOR_PX * scale),
    [scale],
  )

  const coinDisplayPx = useMemo(() => {
    if (ticketMode) {
      const trayW = trayBox.width > 0 ? trayBox.width : 320
      return Math.max(48, coinDisplayPxFromTrayWidth(trayW))
    }
    return coinCursorPx
  }, [ticketMode, trayBox.width, coinCursorPx])

  const quadScratchSurface =
    ready && quadCover && coinBrush ? (
      <ScratchCard
        key={`quad-${cardWidth}x${cardHeight}`}
        width={cardWidth}
        height={cardHeight}
        enabled={coinActive}
        cover={Covers.image(quadCover)}
        brush={Brushes.image(coinBrush, brushPx, brushPx)}
        finishPercent={FINISH_PERCENT}
        lockOnComplete={false}
        onScratch={trackCoin}
        onScratchStart={() => setScratching(true)}
        onScratchEnd={() => setScratching(false)}
        scratchInterval={16}
        ariaLabel="Scratch to reveal Kelvin design system"
        canvasProps={{
          className: 'web-apps-scratch__scratch-canvas',
          style: { display: 'block', cursor: coinInTray ? 'default' : 'none' },
        }}
      >
        <KelvinAfterWireframe width={cardWidth} height={cardHeight} />
      </ScratchCard>
    ) : (
      <div className="kelvin-quad-scratch__placeholder web-apps-scratch__placeholder" />
    )

  return (
    <div
      className={[
        'kelvin-quad-scratch web-apps-scratch',
        ticketMode ? 'kelvin-quad-scratch--ticket' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="application"
      aria-label="Scratch the foil with the Kelvin coin to reveal the unified design system underneath."
      style={{
        ['--scratch-coin-size' as string]: `${coinDisplayPx}px`,
        ['--scratch-zone-left' as string]: `${TICKET_ZONE.left}%`,
        ['--scratch-zone-top' as string]: `${TICKET_ZONE.top}%`,
        ['--scratch-zone-width' as string]: `${TICKET_ZONE.width}%`,
        ['--scratch-zone-height' as string]: `${TICKET_ZONE.height}%`,
      }}
    >
      <div
        ref={stageRef}
        className="kelvin-quad-scratch__stage web-apps-scratch__stage"
      >
        {coinActive ? (
          <img
            className="web-apps-scratch__coin-cursor"
            src={KELVIN_COIN_TILTED_SRC}
            alt=""
            draggable={false}
            style={{ left: coinPos.x, top: coinPos.y }}
          />
        ) : null}

        <div
          ref={frameRef}
          className={[
            'kelvin-quad-scratch__frame web-apps-scratch__card-wrap',
            ticketMode ? 'kelvin-quad-scratch__frame--ticket' : '',
            coinActive && scratching ? 'kelvin-quad-scratch__frame--hover' : '',
            coinActive ? 'kelvin-quad-scratch__frame--active' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {ticketMode ? (
            <div className="kelvin-quad-scratch__ticket">
              <img
                className="kelvin-quad-scratch__ticket-art"
                src={KELVIN_SCRATCH_TICKET_SRC}
                alt=""
                draggable={false}
              />
              <div
                ref={ticketZoneRef}
                className="kelvin-quad-scratch__ticket-zone"
              >
                {ready && ticketCoverImg && coinBrush ? (
                  <KelvinTicketScratchZone
                    zoneWidth={ticketZonePx.width}
                    zoneHeight={ticketZonePx.height}
                    ticketCoverImg={ticketCoverImg}
                    coinBrushSrc={coinBrush}
                    enabled={coinActive}
                    coinInTray={coinInTray}
                    captureRootRef={stageRef}
                    onScratch={trackCoin}
                    onScratchStart={() => setScratching(true)}
                    onScratchEnd={() => setScratching(false)}
                  />
                ) : (
                  <div className="kelvin-quad-scratch__placeholder web-apps-scratch__placeholder" />
                )}
              </div>
            </div>
          ) : (
            <div
              ref={cardRef}
              className="kelvin-quad-scratch__card web-apps-scratch__card"
            >
              {quadScratchSurface}
              <div className="kelvin-quad-scratch__overlay" aria-hidden>
                {KELVIN_SCRATCH_QUADS.map((quad) => (
                  <div key={quad.id} className="kelvin-quad-scratch__overlay-cell">
                    <span className="kelvin-quad-scratch__label">{quad.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <ScratchCoinTray
          ref={trayRef}
          coinInTray={coinInTray}
          onPickUp={pickUpCoin}
          onLeave={leaveCoin}
          pickUpLabel="Take the Kelvin coin to scratch"
          leaveLabel="Leave the Kelvin coin in the tray"
        />
      </div>
    </div>
  )
}

export const KelvinQuadScratch = memo(KelvinQuadScratchInner)
