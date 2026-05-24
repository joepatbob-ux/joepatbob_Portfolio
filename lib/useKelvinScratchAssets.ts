'use client'

import {
  createCoinBrushDataUrl,
  createQuadBeforeCoverDataUrl,
  loadKelvinCoinImages,
  loadScratchFrontImage,
} from '@/lib/webAppsScratchAssets'
import { useEffect, useState } from 'react'

const QUAD_COUNT = 4

export function useKelvinScratchAssets(isActive: boolean) {
  const [covers, setCovers] = useState<string[] | null>(null)
  const [coinBrush, setCoinBrush] = useState<string | null>(null)

  useEffect(() => {
    if (!isActive) return

    let cancelled = false

    Promise.all([loadScratchFrontImage(), loadKelvinCoinImages()])
      .then(([scratchFront, coins]) => {
        if (cancelled) return
        setCovers(
          Array.from({ length: QUAD_COUNT }, (_, i) =>
            createQuadBeforeCoverDataUrl(i, scratchFront),
          ),
        )
        setCoinBrush(createCoinBrushDataUrl(coins.tilted))
      })
      .catch(() => {
        if (cancelled) return
        setCovers(
          Array.from({ length: QUAD_COUNT }, (_, i) =>
            createQuadBeforeCoverDataUrl(i, null),
          ),
        )
        setCoinBrush(null)
      })

    return () => {
      cancelled = true
    }
  }, [isActive])

  return {
    covers,
    coinBrush,
    ready: Boolean(covers && coinBrush),
  }
}
