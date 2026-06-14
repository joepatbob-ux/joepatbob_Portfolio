'use client'

import { useTheme } from '@/components/ThemeProvider'
import { KelvinCoinCursor } from '@/components/web-apps/kelvin-scratch/KelvinCoinCursor'
import { KelvinScratchTicketStack } from '@/components/web-apps/kelvin-scratch/KelvinScratchTicketStack'
import { kelvinScratchRootStyle } from '@/lib/kelvin-scratch/ticket'
import { useKelvinCoin } from '@/lib/kelvin-scratch/useKelvinCoin'
import { useKelvinScratchAssets } from '@/lib/kelvin-scratch/useKelvinScratchAssets'
import { isPrerenderSnapshot } from '@/lib/isPrerenderSnapshot'
import { memo, useRef } from 'react'
import '@/styles/web-apps-scratch-reveal.css'
import '@/styles/kelvin-scratch.css'

function KelvinScratchInner() {
  const { resolvedTheme } = useTheme()
  const stageRef = useRef<HTMLDivElement>(null)
  const assets = useKelvinScratchAssets()
  const coin = useKelvinCoin(stageRef, assets.ready)

  const stageClass = [
    'kelvin-scratch__stage',
    'web-apps-scratch__stage',
    coin.coinOut ? 'kelvin-scratch__stage--coin-out' : '',
  ]
    .filter(Boolean)
    .join(' ')

  if (isPrerenderSnapshot()) {
    return null
  }

  return (
    <div
      className={[
        'kelvin-scratch',
        'web-apps-scratch',
        resolvedTheme === 'dark' ? 'kelvin-scratch--dark' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="application"
      aria-label="Scratch the foil with the Kelvin coin to reveal the unified design system underneath."
      style={kelvinScratchRootStyle(
        coin.coinDisplayPx,
        coin.ticketWidthPx,
        coin.ticketHeightPx,
      )}
    >
      <div ref={stageRef} className={stageClass}>
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
