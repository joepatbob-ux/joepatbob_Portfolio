'use client'

import { KelvinScratchTicket } from '@/components/web-apps/KelvinScratchTicket'
import { ScratchCoinTray } from '@/components/web-apps/ScratchCoinTray'
import { coinDisplayPxFromTicketWidth } from '@/lib/kelvinScratchTicket'
import { useKelvinScratchAssets } from '@/lib/useKelvinScratchAssets'
import { useElementSize } from '@/lib/useElementSize'
import { KELVIN_COIN_TILTED_SRC } from '@/lib/webAppsScratchAssets'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import '@/styles/web-apps-scratch-reveal.css'
import '@/styles/kelvin-scratch.css'

function KelvinScratchInner() {
  const stageRef = useRef<HTMLDivElement>(null)
  const { ref: columnRef, size: columnBox } = useElementSize<HTMLDivElement>()

  const { ticketCoverImg, coinBrush, ready } = useKelvinScratchAssets()

  const [coinInTray, setCoinInTray] = useState(true)
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

  const ticketWidthPx =
    columnBox.width > 0 ? columnBox.width : undefined

  const coinDisplayPx = useMemo(() => {
    if (ticketWidthPx) return coinDisplayPxFromTicketWidth(ticketWidthPx)
    return 64
  }, [ticketWidthPx])

  const stageClass = [
    'kelvin-scratch__stage',
    'web-apps-scratch__stage',
    coinActive ? 'kelvin-scratch__stage--coin-out' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const rootStyle = {
    ['--scratch-coin-size' as string]: `${coinDisplayPx}px`,
    ...(ticketWidthPx
      ? { ['--scratch-ticket-w' as string]: `${ticketWidthPx}px` }
      : {}),
  }

  return (
    <div
      className="kelvin-scratch web-apps-scratch"
      role="application"
      aria-label="Scratch the foil with the Kelvin coin to reveal the unified design system underneath."
      style={rootStyle}
    >
      <div ref={stageRef} className={stageClass}>
        {coinActive ? (
          <img
            className="web-apps-scratch__coin-cursor"
            src={KELVIN_COIN_TILTED_SRC}
            alt=""
            draggable={false}
            style={{ left: coinPos.x, top: coinPos.y }}
          />
        ) : null}

        <div ref={columnRef} className="kelvin-scratch__column">
          <KelvinScratchTicket
            ticketCoverImg={ticketCoverImg}
            coinBrushSrc={coinBrush}
            scratchReady={ready}
            enabled={coinActive}
            coinInTray={coinInTray}
            captureRootRef={stageRef}
            onScratch={trackCoin}
          />

        <ScratchCoinTray
          className="kelvin-scratch__tray"
          trayBarClassName="kelvin-scratch__tray-bar"
          splitPhraseLines
          coinInTray={coinInTray}
            onPickUp={pickUpCoin}
            onLeave={leaveCoin}
            pickUpLabel="Take the Kelvin coin to scratch"
            leaveLabel="Leave the Kelvin coin in the tray"
          />
        </div>
      </div>
    </div>
  )
}

export const KelvinScratch = memo(KelvinScratchInner)
