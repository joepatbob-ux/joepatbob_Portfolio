'use client'

import { KELVIN_LAYER } from '@/lib/kelvin-scratch/layers'
import { KELVIN_COIN_TILTED_SRC } from '@/lib/webAppsScratchAssets'

/** Tilted coin — position driven by `--kelvin-coin-x/y` on the stage (no per-frame React state). */
export function KelvinCoinCursor() {
  return (
    <span
      className="kelvin-scratch__coin-cursor-wrap"
      data-kelvin-layer={KELVIN_LAYER.coinCursor}
    >
      <img
        className="web-apps-scratch__coin-cursor kelvin-scratch__coin-cursor"
        src={KELVIN_COIN_TILTED_SRC}
        alt=""
        draggable={false}
      />
    </span>
  )
}
