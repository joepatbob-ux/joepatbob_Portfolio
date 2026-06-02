'use client'

import { useTheme } from '@/components/ThemeProvider'
import { kelvinScratchTicketSources } from '@/lib/kelvin-scratch/ticket'
import { useKelvinScratchCanvas } from '@/lib/kelvin-scratch/useKelvinScratchCanvas'
import type { ScratchProgressHandler } from '@/lib/kelvin-scratch/types'
import { KELVIN_LAYER } from '@/lib/kelvin-scratch/layers'
import type { RefObject } from 'react'

type Props = {
  ticketCoverImg: HTMLImageElement
  coinBrushSrc: string
  enabled: boolean
  coinInTray: boolean
  captureRootRef?: RefObject<HTMLElement | null>
  onScratch: ScratchProgressHandler
  onScratchStart?: () => void
  onScratchEnd?: () => void
}

/** Reveal image + scratchable foil canvas, sized from the zone element. */
export function KelvinTicketScratchZone({
  ticketCoverImg,
  coinBrushSrc,
  enabled,
  coinInTray,
  captureRootRef,
  onScratch,
  onScratchStart,
  onScratchEnd,
}: Props) {
  const { resolvedTheme } = useTheme()
  const { reveal: revealSrc } = kelvinScratchTicketSources(resolvedTheme)
  const { zoneRef, canvasRef, coverCursor } = useKelvinScratchCanvas({
    ticketCoverImg,
    coinBrushSrc,
    enabled,
    coinInTray,
    captureRootRef,
    onScratch,
    onScratchStart,
    onScratchEnd,
  })

  return (
    <div
      ref={zoneRef}
      className="kelvin-scratch-zone"
      data-kelvin-layer={KELVIN_LAYER.scratchZone}
    >
      <img
        className="kelvin-scratch-zone__reveal"
        src={revealSrc}
        key={revealSrc}
        alt=""
        draggable={false}
      />
      <canvas
        ref={canvasRef}
        className="kelvin-scratch-zone__cover web-apps-scratch__scratch-canvas"
        style={{ cursor: coverCursor, pointerEvents: 'none' }}
        aria-hidden
      />
    </div>
  )
}
