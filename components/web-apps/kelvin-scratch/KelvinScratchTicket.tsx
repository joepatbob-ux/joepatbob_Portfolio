'use client'

import { KelvinTicketScratchZone } from '@/components/web-apps/kelvin-scratch/KelvinTicketScratchZone'
import {
  KELVIN_SCRATCH_TICKET_SRC,
  scratchZoneCssVars,
} from '@/lib/kelvin-scratch/ticket'
import type { ScratchProgressHandler } from '@/lib/kelvin-scratch/types'

type Props = {
  ticketCoverImg: HTMLImageElement | null
  coinBrushSrc: string | null
  scratchReady: boolean
  enabled: boolean
  coinInTray: boolean
  onScratch: ScratchProgressHandler
}

/** Ticket frame SVG + scratch panel once foil assets are loaded. */
export function KelvinScratchTicket({
  ticketCoverImg,
  coinBrushSrc,
  scratchReady,
  enabled,
  coinInTray,
  onScratch,
}: Props) {
  const showScratch =
    scratchReady && ticketCoverImg !== null && coinBrushSrc !== null

  return (
    <div className="kelvin-scratch__ticket" style={scratchZoneCssVars()}>
      <img
        className="kelvin-scratch__art"
        src={KELVIN_SCRATCH_TICKET_SRC}
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
            onScratch={onScratch}
          />
        </div>
      ) : null}
    </div>
  )
}
