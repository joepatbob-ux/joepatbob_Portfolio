'use client'

import { PhoneScreenViewport } from '@/components/sma-ios26/PhoneScreenViewport'
import { SmaIos26Proto } from '@/components/sma-ios26/SmaIos26Proto'
import {
  SMA_LOGICAL_HEIGHT,
  SMA_LOGICAL_WIDTH,
  SMA_TEXTURE_HEIGHT,
  SMA_TEXTURE_WIDTH,
} from '@/lib/sma-ios26/screen-spec'
import { DEFAULT_SMA_STATE, type SmaProtoState } from '@/lib/sma-ios26/state'
import { useEffect, useState } from 'react'

function fitScale(maxWidth: number, maxHeight: number) {
  const pad = 48
  const wScale = (maxWidth - pad) / SMA_LOGICAL_WIDTH
  const hScale = (maxHeight - pad) / SMA_LOGICAL_HEIGHT
  return Math.min(1, wScale, hScale)
}

function StatePanel({ state }: { state: SmaProtoState }) {
  return (
    <aside className="sma-proto-lab__panel">
      <h2 className="sma-proto-lab__panel-title">Live state</h2>
      <dl className="sma-proto-lab__dl">
        <div>
          <dt>Tab</dt>
          <dd>{state.activeTab}</dd>
        </div>
        <div>
          <dt>Room</dt>
          <dd>{state.displayTemp}°</dd>
        </div>
        <div>
          <dt>Cool / Heat</dt>
          <dd>
            {state.coolSetpoint}° / {state.heatSetpoint}°
          </dd>
        </div>
        <div>
          <dt>Active setpoint</dt>
          <dd>{state.activeSetpoint}</dd>
        </div>
        <div>
          <dt>Schedule</dt>
          <dd>{state.scheduleName}</dd>
        </div>
      </dl>
    </aside>
  )
}

/** Full-page SMA iOS26 proto lab — open with `?sma-proto=1`. */
export function SmaIos26DebugPage() {
  const [scale, setScale] = useState(0.85)
  const [state, setState] = useState(DEFAULT_SMA_STATE)

  useEffect(() => {
    const update = () =>
      setScale(fitScale(window.innerWidth, window.innerHeight))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return (
    <div className="sma-proto-lab">
      <header className="sma-proto-lab__top">
        <h1 className="sma-proto-lab__title">SMA · iOS 26 Control</h1>
        <p className="sma-proto-lab__subtitle">
          iPhone 16 Pro screen · {SMA_LOGICAL_WIDTH}×{SMA_LOGICAL_HEIGHT} →{' '}
          {SMA_TEXTURE_WIDTH}×{SMA_TEXTURE_HEIGHT} texture ·{' '}
          <code>?sma-proto=1</code>
        </p>
      </header>
      <div className="sma-proto-lab__layout">
        <div className="sma-proto-lab__stage">
          <PhoneScreenViewport scale={scale} captureId="sma-phone-screen">
            <SmaIos26Proto onStateSnapshot={setState} />
          </PhoneScreenViewport>
          <p className="sma-proto-lab__scale-label">
            {Math.round(scale * 100)}% preview
          </p>
        </div>
        <StatePanel state={state} />
      </div>
    </div>
  )
}
