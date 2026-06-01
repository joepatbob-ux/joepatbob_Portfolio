'use client'

import {
  createCoinBrushDataUrl,
  createFallbackCoinBrushDataUrl,
  loadKelvinCoinImages,
  loadScratchTicketCoverImage,
} from '@/lib/webAppsScratchAssets'
import { useEffect, useState } from 'react'

/** Ticket scratch foil + coin brush — loads once on mount. */
export function useKelvinScratchAssets() {
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

  const ready = Boolean(ticketCoverImg && coinBrush)

  return { ticketCoverImg, coinBrush, ready, loading }
}
