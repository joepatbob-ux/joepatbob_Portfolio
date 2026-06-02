'use client'

import { useTheme } from '@/components/ThemeProvider'
import { KelvinCoinCursor } from '@/components/web-apps/kelvin-scratch/KelvinCoinCursor'
import { KelvinScratchTicketStack } from '@/components/web-apps/kelvin-scratch/KelvinScratchTicketStack'
import { kelvinScratchRootStyle } from '@/lib/kelvin-scratch/ticket'
import { useKelvinCoin } from '@/lib/kelvin-scratch/useKelvinCoin'
import { useKelvinScratchAssets } from '@/lib/kelvin-scratch/useKelvinScratchAssets'
import { KELVIN_LAYER } from '@/lib/kelvin-scratch/layers'
import { isKelvinGhostLayoutEnabled } from '@/lib/protoDebugMode'
import { memo, useEffect, useRef, useState } from 'react'
import '@/styles/web-apps-scratch-reveal.css'
import '@/styles/kelvin-scratch.css'

function KelvinScratchInner() {
  const { resolvedTheme } = useTheme()
  const stageRef = useRef<HTMLDivElement>(null)
  const [ghostLayout, setGhostLayout] = useState(() =>
    isKelvinGhostLayoutEnabled(),
  )
  const assets = useKelvinScratchAssets()
  const coin = useKelvinCoin(stageRef, assets.ready)

  useEffect(() => {
    const sync = () => setGhostLayout(isKelvinGhostLayoutEnabled())
    sync()
    window.addEventListener('popstate', sync)
    window.addEventListener('hashchange', sync)
    return () => {
      window.removeEventListener('popstate', sync)
      window.removeEventListener('hashchange', sync)
    }
  }, [])

  const stageClass = [
    'kelvin-scratch__stage',
    'web-apps-scratch__stage',
    coin.coinOut ? 'kelvin-scratch__stage--coin-out' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={[
        'kelvin-scratch',
        'web-apps-scratch',
        resolvedTheme === 'dark' ? 'kelvin-scratch--dark' : '',
        ghostLayout ? 'kelvin-scratch--ghost-layout' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-kelvin-layer={KELVIN_LAYER.root}
      role="application"
      aria-label="Scratch the foil with the Kelvin coin to reveal the unified design system underneath."
      style={kelvinScratchRootStyle(
        coin.coinDisplayPx,
        coin.ticketWidthPx,
        coin.ticketHeightPx,
      )}
    >
      <div
        ref={stageRef}
        className={stageClass}
        data-kelvin-layer={KELVIN_LAYER.stage}
      >
        {coin.coinOut ? <KelvinCoinCursor /> : null}

        <KelvinScratchTicketStack
          assets={assets}
          coin={coin}
          captureRootRef={stageRef}
        />
      </div>
    </div>
  )
}

export const KelvinScratch = memo(KelvinScratchInner)
