'use client'

import { KELVIN_SCRATCH_QUADS } from '@/lib/kelvinScratchQuads'
import {
  createCoinBrushDataUrl,
  createFallbackCoinBrushDataUrl,
  createUnifiedScratchCoverDataUrl,
  loadKelvinCoinImages,
  loadKelvinScratchQuadPlaceholders,
  loadScratchTicketCoverImage,
  loadScratchFrontImage,
} from '@/lib/webAppsScratchAssets'
import { useEffect, useState } from 'react'

export function useKelvinScratchAssets(isActive: boolean) {
  const [quadCover, setQuadCover] = useState<string | null>(null)
  const [ticketCoverImg, setTicketCoverImg] =
    useState<HTMLImageElement | null>(null)
  const [coinBrush, setCoinBrush] = useState<string | null>(null)
  const [useTicketArt, setUseTicketArt] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isActive) return

    let cancelled = false
    setLoading(true)

    Promise.all([loadScratchTicketCoverImage(), loadKelvinCoinImages()])
      .then(([ticketCover, coins]) => {
        if (cancelled) return
        setUseTicketArt(true)
        setTicketCoverImg(ticketCover)
        setCoinBrush(createCoinBrushDataUrl(coins.tilted))
      })
      .catch(() => {
        if (cancelled) return
        setUseTicketArt(false)
        setTicketCoverImg(null)
        Promise.all([
          loadScratchFrontImage(),
          loadKelvinCoinImages(),
          loadKelvinScratchQuadPlaceholders(
            KELVIN_SCRATCH_QUADS.map((q) => q.placeholderSrc),
          ),
        ])
          .then(([scratchFront, coins, placeholders]) => {
            if (cancelled) return
            setQuadCover(createUnifiedScratchCoverDataUrl(scratchFront, placeholders))
            setCoinBrush(createCoinBrushDataUrl(coins.tilted))
          })
          .catch(() => {
            if (cancelled) return
            setQuadCover(
              createUnifiedScratchCoverDataUrl(
                null,
                KELVIN_SCRATCH_QUADS.map(() => null),
              ),
            )
            setCoinBrush(createFallbackCoinBrushDataUrl())
          })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isActive])

  const ready = Boolean(
    coinBrush && (useTicketArt ? ticketCoverImg : quadCover),
  )

  return {
    quadCover,
    ticketCoverImg,
    coinBrush,
    useTicketArt,
    loading,
    ready,
  }
}
