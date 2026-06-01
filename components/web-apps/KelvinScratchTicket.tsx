'use client'

import { KelvinTicketScratchZone } from '@/components/web-apps/KelvinTicketScratchZone'
import {
  KELVIN_SCRATCH_TICKET_SRC,
  scratchZoneLayoutPercents,
} from '@/lib/kelvinScratchTicket'
import type { CSSProperties, RefObject } from 'react'

const ZONE = scratchZoneLayoutPercents()

const zoneVars = {
  ['--kelvin-zone-left' as string]: `${ZONE.left}%`,
  ['--kelvin-zone-top' as string]: `${ZONE.top}%`,
  ['--kelvin-zone-width' as string]: `${ZONE.width}%`,
  ['--kelvin-zone-height' as string]: `${ZONE.height}%`,
} satisfies CSSProperties

type Props = {
  ticketCoverImg: HTMLImageElement | null
  coinBrushSrc: string | null
  scratchReady: boolean
  enabled: boolean
  coinInTray: boolean
  captureRootRef: RefObject<HTMLElement | null>
  onScratch: (
    value: number,
    pos: unknown,
    global: { x: number; y: number },
  ) => void
}

/** Ticket SVG (always visible) + scratch panel when foil assets are loaded. */
export function KelvinScratchTicket({
  ticketCoverImg,
  coinBrushSrc,
  scratchReady,
  enabled,
  coinInTray,
  captureRootRef,
  onScratch,
}: Props) {
  const showScratch =
    scratchReady && ticketCoverImg !== null && coinBrushSrc !== null

  return (
    <div className="kelvin-scratch__ticket" style={zoneVars}>
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
            captureRootRef={captureRootRef}
            onScratch={onScratch}
          />
        </div>
      ) : null}
    </div>
  )
}
