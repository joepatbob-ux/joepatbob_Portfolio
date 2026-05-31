'use client'

import { LiquidGlassSurface } from '@/components/sma-ios26/chrome/LiquidGlassSurface'
import { SmaFigmaIcon } from '@/components/sma-ios26/icons/SmaFigmaIcon'

type TopToolbarProps = {
  title?: string
  leadingAction?: 'back' | 'close'
  onLeadingClick?: () => void
}

export function TopToolbar({
  title = 'Home',
  leadingAction = 'back',
  onLeadingClick,
}: TopToolbarProps) {
  return (
    <nav className="sma-toolbar" aria-label={title}>
      <LiquidGlassSurface className="sma-toolbar__btn-wrap sma-toolbar__btn-wrap--leading">
        <button
          type="button"
          className={`sma-icon-btn${leadingAction === 'close' ? ' sma-icon-btn--close' : ' sma-icon-btn--back'}`}
          aria-label={leadingAction === 'close' ? 'Close' : 'Back'}
          onClick={onLeadingClick}
        >
          {leadingAction === 'close' ? (
            <span className="sma-toolbar__close" aria-hidden>
              ✕
            </span>
          ) : (
            <SmaFigmaIcon name="back" className="sma-toolbar__icon sma-toolbar__icon--back" />
          )}
        </button>
      </LiquidGlassSurface>

      <h1 className="sma-toolbar__title">{title}</h1>

      <LiquidGlassSurface className="sma-toolbar__btn-wrap sma-toolbar__btn-wrap--trailing">
        <button type="button" className="sma-icon-btn sma-icon-btn--help" aria-label="Help">
          <SmaFigmaIcon name="help" className="sma-toolbar__icon sma-toolbar__icon--help" />
        </button>
      </LiquidGlassSurface>
    </nav>
  )
}
