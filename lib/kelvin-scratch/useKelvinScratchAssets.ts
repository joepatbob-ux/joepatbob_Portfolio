'use client'

import { useTheme } from '@/components/ThemeProvider'
import { kelvinScratchTicketSources } from '@/lib/kelvin-scratch/ticket'
import type { KelvinScratchAssets } from '@/lib/kelvin-scratch/types'
import {
  createCoinBrushDataUrl,
  createFallbackCoinBrushDataUrl,
  loadKelvinCoinImages,
  loadScratchTicketCoverImage,
} from '@/lib/webAppsScratchAssets'
import { useEffect, useState } from 'react'

/** Ticket foil cover + coin brush raster — reloads when theme changes. */
export function useKelvinScratchAssets(): KelvinScratchAssets {
  const { resolvedTheme } = useTheme()
  const { cover: coverSrc } = kelvinScratchTicketSources(resolvedTheme)
  const [ticketCoverImg, setTicketCoverImg] =
    useState<HTMLImageElement | null>(null)
  const [coinBrush, setCoinBrush] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    Promise.all([loadScratchTicketCoverImage(coverSrc), loadKelvinCoinImages()])
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
  }, [coverSrc])

  return {
    ticketCoverImg,
    coinBrush,
    ready: Boolean(ticketCoverImg && coinBrush),
    loading,
  }
}
