'use client'

import type { BrickPivot } from '@/lib/formation/legoBricks'

type Props = {
  pivot: BrickPivot
  positionPegLabel: string
  positionGx: number
  positionGy: number
  footprintLabels: string[]
  longAxis: string
  showAlignGuide: boolean
  showDebugPegs: boolean
  onPivotChange: (pivot: BrickPivot) => void
  onToggleAlignGuide: () => void
  onToggleDebugPegs: () => void
}

function tabClass(active: boolean): string {
  return active ? 'formation-lego__tab--active' : 'formation-lego__tab'
}

export function FormationLegoTuningBar({
  pivot,
  positionPegLabel,
  positionGx,
  positionGy,
  footprintLabels,
  longAxis,
  showAlignGuide,
  showDebugPegs,
  onPivotChange,
  onToggleAlignGuide,
  onToggleDebugPegs,
}: Props) {
  return (
    <div className="formation-lego__tuning">
      <p className="formation-lego__readout" aria-live="polite">
        Position pin: <strong>{positionPegLabel}</strong> (gx {positionGx}, gy{' '}
        {positionGy}) · Footprint (block 0,0): {footprintLabels.join(', ')} ·
        Long axis <strong>{longAxis}</strong>
      </p>
      <div className="formation-lego__tuning-actions">
        <button
          type="button"
          className={tabClass(pivot === 'left')}
          onClick={() => onPivotChange('left')}
        >
          Left pivot
        </button>
        <button
          type="button"
          className={tabClass(pivot === 'right')}
          onClick={() => onPivotChange('right')}
        >
          Right pivot
        </button>
        <button
          type="button"
          className={tabClass(showAlignGuide)}
          onClick={onToggleAlignGuide}
        >
          Align guide
        </button>
        <button
          type="button"
          className={tabClass(showDebugPegs)}
          onClick={onToggleDebugPegs}
        >
          Debug pegs
        </button>
      </div>
    </div>
  )
}
