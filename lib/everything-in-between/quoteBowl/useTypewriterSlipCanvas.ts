'use client'

import { QUOTE_BOWL } from '@/lib/everything-in-between/quoteBowl/constants'
import { paintQuoteSlipTexture } from '@/lib/everything-in-between/quotePaper'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'

const [TEXTURE_W, TEXTURE_H] = QUOTE_BOWL.unfold.textureSize

export type TypewriterSlipCanvas = {
  texture: THREE.CanvasTexture
  ctx: CanvasRenderingContext2D
  paint: (quote: string, crinkleSeed: number, textProgress: number) => void
}

/** Mutable canvas texture for progressive typewriter text on the 3D slip. */
export function useTypewriterSlipCanvas(): TypewriterSlipCanvas {
  const slipCanvas = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = TEXTURE_W
    canvas.height = TEXTURE_H
    return canvas
  }, [])

  const texture = useMemo(() => {
    const tex = new THREE.CanvasTexture(slipCanvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.minFilter = THREE.LinearFilter
    tex.magFilter = THREE.LinearFilter
    return tex
  }, [slipCanvas])

  const ctx = useMemo(() => slipCanvas.getContext('2d'), [slipCanvas])

  const paint = useMemo(
    () => (quote: string, crinkleSeed: number, textProgress: number) => {
      if (!ctx) return
      paintQuoteSlipTexture(
        ctx,
        TEXTURE_W,
        TEXTURE_H,
        quote,
        crinkleSeed,
        true,
        textProgress,
      )
      texture.needsUpdate = true
    },
    [ctx, texture],
  )

  useEffect(() => () => texture.dispose(), [texture])

  if (!ctx) {
    throw new Error('Quote slip canvas 2D context unavailable')
  }

  return { texture, ctx, paint }
}
