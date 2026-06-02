'use client'

import type { KelvinScratchAssets } from '@/lib/kelvin-scratch/types'
import {
  createCoinBrushDataUrl,
  createFallbackCoinBrushDataUrl,
  loadKelvinCoinImages,
  loadScratchTicketCoverImage,
} from '@/lib/webAppsScratchAssets'
import { useEffect, useState } from 'react'

/** Ticket foil cover + coin brush raster — loads once on mount. */
export function useKelvinScratchAssets(): KelvinScratchAssets {
  const [ticketCoverImg, setTicketCoverImg] =
    useState<HTMLImageElement | null>(null)
  const [coinBrush, setCoinBrush] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    Promise.all([loadScratchTicketCoverImage(), loadKelvinCoinImages()])
      .then(([cover, coins]) => {
        if (cancelled) return
        setTicketCoverImg(cover)
        setCoinBrush(createCoinBrushDataUrl(coins.tilted))
      })
      .catch(() => {
        if (cancelled) return
        setTicketCoverImg(null)
        setCoinBrush(createFallbackCoinBrushDataUrl())
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return {
    ticketCoverImg,
    coinBrush,
    ready: Boolean(ticketCoverImg && coinBrush),
    loading,
  }
}
