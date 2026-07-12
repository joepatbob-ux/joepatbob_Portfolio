import { KELVIN_COIN_FLAT_SRC } from '@/lib/kelvin-scratch/scratchAssets'
import type { KeyboardEvent, MouseEvent } from 'react'

type Props = {
  coinInTray: boolean
  onPickUp: (clientX: number, clientY: number) => void
  onLeave: () => void
  className?: string
  trayBarClassName?: string
}

function centerOf(el: HTMLElement) {
  const rect = el.getBoundingClientRect()
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

/** Kelvin footer tray — one hit target: take when the coin is in, leave when it's out. */
export function KelvinCoinTray({
  coinInTray,
  onPickUp,
  onLeave,
  className,
  trayBarClassName,
}: Props) {
  const onTrayClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (coinInTray) onPickUp(e.clientX, e.clientY)
    else onLeave()
  }

  const onTrayKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    if (coinInTray) {
      const { x, y } = centerOf(e.currentTarget)
      onPickUp(x, y)
    } else {
      onLeave()
    }
  }

  const barClass = [
    'web-apps-scratch__tray-bar',
    'kelvin-scratch__tray-bar',
    trayBarClassName,
    coinInTray
      ? 'web-apps-scratch__tray-bar--ready'
      : 'web-apps-scratch__tray-bar--drop',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={['web-apps-scratch__tray', className].filter(Boolean).join(' ')}
      data-coin-in-tray={coinInTray ? 'true' : 'false'}
    >
      <button
        type="button"
        className={barClass}
        onClick={onTrayClick}
        onKeyDown={onTrayKey}
        aria-label={
          coinInTray
            ? 'Take the Kelvin coin to scratch'
            : 'Leave the Kelvin coin in the tray'
        }
      >
        <span
          className="web-apps-scratch__tray-phrase-wrap web-apps-scratch__tray-phrase-wrap--take"
          aria-hidden
        >
          <span className="web-apps-scratch__tray-phrase web-apps-scratch__tray-phrase--take">
            <span className="web-apps-scratch__tray-phrase-line">Take a</span>
            <span className="web-apps-scratch__tray-phrase-line">penny</span>
          </span>
        </span>

        <span
          className={[
            'web-apps-scratch__tray-coin',
            coinInTray
              ? 'web-apps-scratch__tray-coin--ready'
              : 'web-apps-scratch__tray-coin--empty',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-hidden
        >
          {coinInTray ? (
            <img
              className="web-apps-scratch__tray-coin-img"
              src={KELVIN_COIN_FLAT_SRC}
              alt=""
              draggable={false}
            />
          ) : (
            <span className="web-apps-scratch__tray-coin-slot" />
          )}
        </span>

        <span
          className="web-apps-scratch__tray-phrase-wrap web-apps-scratch__tray-phrase-wrap--leave"
          aria-hidden
        >
          <span className="web-apps-scratch__tray-phrase web-apps-scratch__tray-phrase--leave">
            <span className="web-apps-scratch__tray-phrase-line">Leave a</span>
            <span className="web-apps-scratch__tray-phrase-line">penny</span>
          </span>
        </span>
      </button>
    </div>
  )
}
