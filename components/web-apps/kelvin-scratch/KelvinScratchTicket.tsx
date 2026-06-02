'use client'

import { useTheme } from '@/components/ThemeProvider'
import { KelvinTicketScratchZone } from '@/components/web-apps/kelvin-scratch/KelvinTicketScratchZone'
import {
  kelvinScratchTicketSources,
  scratchZoneCssVars,
} from '@/lib/kelvin-scratch/ticket'
import type { ScratchProgressHandler } from '@/lib/kelvin-scratch/types'
import type { RefObject } from 'react'

type Props = {
  ticketCoverImg: HTMLImageElement | null
  coinBrushSrc: string | null
  scratchReady: boolean
  enabled: boolean
  coinInTray: boolean
  captureRootRef?: RefObject<HTMLElement | null>
  onScratch: ScratchProgressHandler
}

/** Ticket frame SVG + scratch panel once foil assets are loaded. */
export function KelvinScratchTicket({
  ticketCoverImg,
  coinBrushSrc,
  scratchReady,
  enabled,
  coinInTray,
  captureRootRef,
  onScratch,
}: Props) {
  const { resolvedTheme } = useTheme()
  const { ticket: ticketSrc } = kelvinScratchTicketSources(resolvedTheme)
  const showScratch =
    scratchReady && ticketCoverImg !== null && coinBrushSrc !== null

  return (
    <div className="kelvin-scratch__ticket" style={scratchZoneCssVars()}>
      <img
        className="kelvin-scratch__art"
        src={ticketSrc}
        key={ticketSrc}
        alt=""
        draggable={false}
        decoding="async"
      />
      {showScratch ? (
        <div className="kelvin-scratch__panel" aria-hidden={false}>
          <KelvinTicketScratchZone
            ticketCoverImg={ticketCoverImg}
            coinBrushSrc={coinBrushSrc}
            enabled={enabled}
            coinInTray={coinInTray}
            captureRootRef={captureRootRef}
            onScratch={onScratch}
          />
        </div>
      ) : null}
    </div>
  )
}
