import type { ScratchProgressHandler } from '@/lib/kelvin-scratch/types'
import {
  coinDisplayPxForTicket,
  SCRATCH_TICKET_VIEWBOX,
} from '@/lib/kelvin-scratch/ticket'
import { useElementSize } from '@/lib/hooks/useElementSize'
import { useCallback, useEffect, useMemo, useState, type RefObject } from 'react'
import { trackEventOnce } from '@/lib/analytics'

export function useKelvinCoin(
  stageRef: RefObject<HTMLElement | null>,
  scratchReady: boolean,
) {
  const { ref: ticketStackRef, size: ticketStackSize } =
    useElementSize<HTMLDivElement>()
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
      trackEventOnce('scratch:start', 'scratch', { action: 'pick-up-coin' })
      setCoinInTray(false)
      setCursorPos(clientX, clientY)
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }
    },
    [setCursorPos],
  )

  const leave = useCallback(() => {
    setCoinInTray(true)
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
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
    (percent, _point, global) => {
      if (percent >= 60) {
        trackEventOnce('scratch:reveal', 'scratch', { action: 'reveal' })
      }
      setCursorPos(global.x, global.y)
    },
    [setCursorPos],
  )

  const ticketWidthPx =
    ticketStackSize.width > 0 ? ticketStackSize.width : undefined

  const ticketHeightPx = useMemo(() => {
    if (ticketStackSize.height > 0) return ticketStackSize.height
    if (!ticketWidthPx) return undefined
    return (
      ticketWidthPx *
      (SCRATCH_TICKET_VIEWBOX.height / SCRATCH_TICKET_VIEWBOX.width)
    )
  }, [ticketStackSize.height, ticketWidthPx])

  const coinDisplayPx = useMemo(() => {
    if (ticketWidthPx) {
      return coinDisplayPxForTicket(ticketWidthPx)
    }
    return 48
  }, [ticketWidthPx])

  return {
    ticketStackRef,
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
