'use client'

import { KelvinScratchTicket } from '@/components/web-apps/kelvin-scratch/KelvinScratchTicket'
import { KelvinCoinTray } from '@/components/web-apps/kelvin-scratch/KelvinCoinTray'
import type { KelvinScratchAssets } from '@/lib/kelvin-scratch/types'
import type { KelvinCoinState } from '@/lib/kelvin-scratch/useKelvinCoin'
import type { RefObject } from 'react'

type CoinState = Pick<
  KelvinCoinState,
  | 'ticketStackRef'
  | 'coinInTray'
  | 'coinActive'
  | 'pickUp'
  | 'leave'
  | 'onScratchProgress'
>

type Props = {
  assets: Pick<KelvinScratchAssets, 'ticketCoverImg' | 'coinBrush' | 'ready'>
  coin: CoinState
  captureRootRef?: RefObject<HTMLElement | null>
}

/** Ticket art, scratch panel, and tray coin — one measured column. */
export function KelvinScratchTicketStack({ assets, coin, captureRootRef }: Props) {
  const { ticketCoverImg, coinBrush, ready } = assets

  return (
    <div className="kelvin-scratch__column">
      <div ref={coin.ticketStackRef} className="kelvin-scratch__ticket-stack">
        <KelvinScratchTicket
          ticketCoverImg={ticketCoverImg}
          coinBrushSrc={coinBrush}
          scratchReady={ready}
          enabled={coin.coinActive}
          coinInTray={coin.coinInTray}
          captureRootRef={captureRootRef}
          onScratch={coin.onScratchProgress}
        />
      </div>
      <KelvinCoinTray
        className="kelvin-scratch__tray kelvin-scratch__tray--below"
        coinInTray={coin.coinInTray}
        onPickUp={coin.pickUp}
        onLeave={coin.leave}
      />
    </div>
  )
}
