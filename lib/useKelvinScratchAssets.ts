'use client'

import { KELVIN_SCRATCH_QUADS } from '@/lib/kelvinScratchQuads'
import {
  createCoinBrushDataUrl,
  createFallbackCoinBrushDataUrl,
  createUnifiedScratchCoverDataUrl,
  loadKelvinCoinImages,
  loadKelvinScratchQuadPlaceholders,
  loadScratchFrontImage,
} from '@/lib/webAppsScratchAssets'
import { useEffect, useState } from 'react'

export function useKelvinScratchAssets(isActive: boolean) {
  const [cover, setCover] = useState<string | null>(null)
  const [coinBrush, setCoinBrush] = useState<string | null>(null)

  useEffect(() => {
    if (!isActive) return

    let cancelled = false

    Promise.all([
      loadScratchFrontImage(),
      loadKelvinCoinImages(),
      loadKelvinScratchQuadPlaceholders(
        KELVIN_SCRATCH_QUADS.map((q) => q.placeholderSrc),
      ),
    ])
      .then(([scratchFront, coins, placeholders]) => {
        if (cancelled) return
        setCover(createUnifiedScratchCoverDataUrl(scratchFront, placeholders))
        setCoinBrush(createCoinBrushDataUrl(coins.tilted))
      })
      .catch(() => {
        if (cancelled) return
        setCover(
          createUnifiedScratchCoverDataUrl(
            null,
            KELVIN_SCRATCH_QUADS.map(() => null),
          ),
        )
        setCoinBrush(createFallbackCoinBrushDataUrl())
      })

    return () => {
      cancelled = true
    }
  }, [isActive])

  return {
    cover,
    coinBrush,
    ready: Boolean(cover && coinBrush),
  }
}
