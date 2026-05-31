'use client'

import { DisplayTemp } from '@/components/sma-ios26/parts/DisplayTemp'
import { ModeSelect } from '@/components/sma-ios26/parts/ModeSelect'
import { SetpointModule } from '@/components/sma-ios26/parts/SetpointModule'
import { WeatherHeader } from '@/components/sma-ios26/parts/WeatherHeader'
import {
  clampSetpoint,
  enforceDeadband,
  type ActiveSetpoint,
  type SmaProtoState,
} from '@/lib/sma-ios26/state'

type ControlScreenProps = {
  state: SmaProtoState
  onStateChange: (patch: Partial<SmaProtoState>) => void
}

export function ControlScreen({ state, onStateChange }: ControlScreenProps) {
  const updateSetpoint = (which: ActiveSetpoint, value: number) => {
    const clamped = clampSetpoint(value)
    const cool = which === 'cool' ? clamped : state.coolSetpoint
    const heat = which === 'heat' ? clamped : state.heatSetpoint
    const next = enforceDeadband(cool, heat, which)
    onStateChange(next)
  }

  return (
    <div className="sma-control-screen">
      <div className="sma-control-screen__weather">
        <WeatherHeader
          location={state.location}
          temp={state.outdoorTemp}
          high={state.outdoorHigh}
          low={state.outdoorLow}
        />
      </div>

      <div className="sma-control-screen__display">
        <DisplayTemp temp={state.displayTemp} humidity={state.humidity} />
      </div>

      <div className="sma-control-screen__mode">
        <ModeSelect />
      </div>

      <SetpointModule
        scheduleName={state.scheduleName}
        coolSetpoint={state.coolSetpoint}
        heatSetpoint={state.heatSetpoint}
        activeSetpoint={state.activeSetpoint}
        onActiveSetpointChange={(activeSetpoint) => onStateChange({ activeSetpoint })}
        onCoolChange={(value) => updateSetpoint('cool', value)}
        onHeatChange={(value) => updateSetpoint('heat', value)}
      />
    </div>
  )
}
