'use client'

import { LiquidGlassSurface } from '@/components/sma-ios26/chrome/LiquidGlassSurface'
import { SmaFigmaIcon } from '@/components/sma-ios26/icons/SmaFigmaIcon'

export function TopToolbar() {
  return (
    <nav className="sma-toolbar" aria-label="Home">
      <LiquidGlassSurface className="sma-toolbar__btn-wrap sma-toolbar__btn-wrap--leading">
        <button type="button" className="sma-icon-btn sma-icon-btn--back" aria-label="Back">
          <SmaFigmaIcon name="back" className="sma-toolbar__icon sma-toolbar__icon--back" />
        </button>
      </LiquidGlassSurface>

      <h1 className="sma-toolbar__title">Home</h1>

      <LiquidGlassSurface className="sma-toolbar__btn-wrap sma-toolbar__btn-wrap--trailing" tone="strong">
        <button type="button" className="sma-icon-btn sma-icon-btn--help" aria-label="Help">
          <SmaFigmaIcon name="help" className="sma-toolbar__icon sma-toolbar__icon--help" />
        </button>
      </LiquidGlassSurface>
    </nav>
  )
}
