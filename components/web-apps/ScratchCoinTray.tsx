import { KELVIN_COIN_FLAT_SRC } from '@/lib/webAppsScratchAssets'

interface Props {
  coinInTray: boolean
  onPickUp: () => void
  onLeave: () => void
  pickUpLabel?: string
  leaveLabel?: string
}

export function ScratchCoinTray({
  coinInTray,
  onPickUp,
  onLeave,
  pickUpLabel = 'Take the Kelvin coin to scratch',
  leaveLabel = 'Leave the Kelvin coin in the tray',
}: Props) {
  return (
    <div className="web-apps-scratch__tray" aria-label="Coin tray">
      <p className="web-apps-scratch__tray-label">
        Take a penny,
        <br />
        leave a penny
      </p>
      <button
        type="button"
        className={[
          'web-apps-scratch__tray-well',
          coinInTray ? '' : 'web-apps-scratch__tray-well--leave',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={coinInTray ? onPickUp : onLeave}
        aria-label={coinInTray ? pickUpLabel : leaveLabel}
      >
        {coinInTray ? (
                    <img
            className="web-apps-scratch__tray-coin-img"
            src={KELVIN_COIN_FLAT_SRC}
            alt=""
            width={56}
            height={56}
            draggable={false}
          />
        ) : (
          <span className="web-apps-scratch__tray-empty" aria-hidden />
        )}
      </button>
    </div>
  )
}
