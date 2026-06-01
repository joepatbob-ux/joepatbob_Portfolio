import { KELVIN_COIN_FLAT_SRC } from '@/lib/webAppsScratchAssets'
import { forwardRef, type KeyboardEvent, type MouseEvent } from 'react'

interface Props {
  coinInTray: boolean
  onPickUp: (clientX: number, clientY: number) => void
  onLeave: () => void
  pickUpLabel?: string
  leaveLabel?: string
  className?: string
  trayBarClassName?: string
  /** Two-line “Take a / penny” labels on left and right (Kelvin tray). */
  splitPhraseLines?: boolean
}

export const ScratchCoinTray = forwardRef<HTMLButtonElement, Props>(
  function ScratchCoinTray(
    {
      coinInTray,
      onPickUp,
      onLeave,
      pickUpLabel = 'Take the Kelvin coin to scratch',
      leaveLabel = 'Leave the Kelvin coin in the tray',
      className,
      trayBarClassName,
      splitPhraseLines = false,
    },
    ref,
  ) {
    const activate = (clientX: number, clientY: number) => {
      if (coinInTray) onPickUp(clientX, clientY)
      else onLeave()
    }

    const onActivateClick = (e: MouseEvent<HTMLButtonElement>) => {
      activate(e.clientX, e.clientY)
    }

    const onActivateKey = (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key !== 'Enter' && e.key !== ' ') return
      e.preventDefault()
      const rect = e.currentTarget.getBoundingClientRect()
      activate(rect.left + rect.width / 2, rect.top + rect.height / 2)
    }

    return (
      <div
        className={['web-apps-scratch__tray', className].filter(Boolean).join(' ')}
        data-coin-in-tray={coinInTray ? 'true' : 'false'}
      >
        <button
          ref={ref}
          type="button"
          className={[
            'web-apps-scratch__tray-bar',
            trayBarClassName,
            coinInTray
              ? 'web-apps-scratch__tray-bar--ready'
              : 'web-apps-scratch__tray-bar--drop',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={onActivateClick}
          onKeyDown={onActivateKey}
          aria-label={coinInTray ? pickUpLabel : leaveLabel}
        >
          <span
            className="web-apps-scratch__tray-phrase-wrap web-apps-scratch__tray-phrase-wrap--take"
            aria-hidden
          >
            {splitPhraseLines ? (
              <span className="web-apps-scratch__tray-phrase web-apps-scratch__tray-phrase--take">
                <span className="web-apps-scratch__tray-phrase-line">Take a</span>
                <span className="web-apps-scratch__tray-phrase-line">penny</span>
              </span>
            ) : (
              <span className="web-apps-scratch__tray-phrase web-apps-scratch__tray-phrase--take">
                Take a penny
              </span>
            )}
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
            {splitPhraseLines ? (
              <span className="web-apps-scratch__tray-phrase web-apps-scratch__tray-phrase--leave">
                <span className="web-apps-scratch__tray-phrase-line">Leave a</span>
                <span className="web-apps-scratch__tray-phrase-line">penny</span>
              </span>
            ) : (
              <span className="web-apps-scratch__tray-phrase web-apps-scratch__tray-phrase--leave">
                Leave a penny
              </span>
            )}
          </span>
        </button>
      </div>
    )
  },
)
