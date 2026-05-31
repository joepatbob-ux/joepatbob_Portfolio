'use client'

import { SmaFigmaIcon } from '@/components/sma-ios26/icons/SmaFigmaIcon'

type DisplayTempProps = {
  temp: number
  humidity: number
}

export function DisplayTemp({ temp, humidity }: DisplayTempProps) {
  return (
    <div className="sma-display">
      <button type="button" className="sma-sensor-pill">
        <span className="sma-sensor-pill__label">Average Of</span>
        <span className="sma-sensor-pill__value">2 of 3 Sensors</span>
      </button>
      <p className="sma-display__temp" aria-live="polite">
        {temp}
      </p>
      <div className="sma-humidity">
        <SmaFigmaIcon name="humidity" size={16} />
        <span>{humidity}%</span>
      </div>
    </div>
  )
}
