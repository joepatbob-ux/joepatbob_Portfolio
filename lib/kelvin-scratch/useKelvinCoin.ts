'use client'

import type { ScratchProgressHandler } from '@/lib/kelvin-scratch/types'
import {
  coinDisplayPxForTicket,
  SCRATCH_TICKET_VIEWBOX,
} from '@/lib/kelvin-scratch/ticket'
import { useElementSize } from '@/lib/useElementSize'
import { useCallback, useEffect, useMemo, useState, type RefObject } from 'react'

export function useKelvinCoin(
  stageRef: RefObject<HTMLElement | null>,
  scratchReady: boolean,
) {
  const { ref: columnRef, size: columnSize } = useElementSize<HTMLDivElement>()
  const [coinInTray, setCoinInTray] = useState(true)

  const setCursorPos = useCallback(
    (clientX: number, clientY: number) => {
      const stage = stageRef.current
      if (!stage) return
      const rect = stage.getBoundingClientRect()
      stage.style.setProperty('--kelvin-coin-x', `${clientX - rect.left}px`)
      stage.style.setProperty('--kelvin-coin-y', `${clientY - rect.top}px`)
    },
    [stageRef],
  )

  const pickUp = useCallback(
    (clientX: number, clientY: number) => {
      setCoinInTray(false)
      setCursorPos(clientX, clientY)
    },
    [setCursorPos],
  )

  const leave = useCallback(() => {
    setCoinInTray(true)
  }, [])

  const coinOut = !coinInTray
  const scratching = scratchReady && coinOut

  useEffect(() => {
    if (!coinOut) return
    const onMove = (e: PointerEvent) => setCursorPos(e.clientX, e.clientY)
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [coinOut, setCursorPos])

  const onScratchProgress = useCallback<ScratchProgressHandler>(
    (_percent, _point, global) => {
      setCursorPos(global.x, global.y)
    },
    [setCursorPos],
  )

  const ticketWidthPx =
    columnSize.width > 0 ? columnSize.width : undefined

  const ticketHeightPx = useMemo(() => {
    if (!ticketWidthPx) return undefined
    return (
      ticketWidthPx *
      (SCRATCH_TICKET_VIEWBOX.height / SCRATCH_TICKET_VIEWBOX.width)
    )
  }, [ticketWidthPx])

  const coinDisplayPx = useMemo(() => {
    if (ticketWidthPx) {
      return coinDisplayPxForTicket(ticketWidthPx)
    }
    return 48
  }, [ticketWidthPx, ticketHeightPx])

  return {
    columnRef,
    coinInTray,
    coinOut,
    coinActive: scratching,
    coinDisplayPx,
    ticketWidthPx,
    ticketHeightPx,
    pickUp,
    leave,
    onScratchProgress,
  }
}

export type KelvinCoinState = ReturnType<typeof useKelvinCoin>
