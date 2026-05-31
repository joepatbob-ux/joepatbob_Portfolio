import type { SmaTabId } from '@/lib/sma-ios26/tokens'

export type ActiveSetpoint = 'cool' | 'heat'

export type SmaProtoState = {
  displayTemp: number
  coolSetpoint: number
  heatSetpoint: number
  activeSetpoint: ActiveSetpoint
  humidity: number
  activeTab: SmaTabId
  scheduleName: string
  location: string
  outdoorTemp: number
  outdoorHigh: number
  outdoorLow: number
}

export const DEFAULT_SMA_STATE: SmaProtoState = {
  displayTemp: 72,
  coolSetpoint: 62,
  heatSetpoint: 73,
  activeSetpoint: 'heat',
  humidity: 40,
  activeTab: 'control',
  scheduleName: 'Workout',
  location: 'St. Louis, MO',
  outdoorTemp: 89,
  outdoorHigh: 89,
  outdoorLow: 81,
}

export const SETPOINT_MIN = 40
export const SETPOINT_MAX = 99

export function clampSetpoint(value: number): number {
  return Math.min(SETPOINT_MAX, Math.max(SETPOINT_MIN, Math.round(value)))
}

/** Preview a step without mutating state — returns null when the move is blocked. */
export function previewSetpointStep(
  cool: number,
  heat: number,
  active: ActiveSetpoint,
  delta: number,
): { coolSetpoint: number; heatSetpoint: number } | null {
  const nextCool = active === 'cool' ? cool + delta : cool
  const nextHeat = active === 'heat' ? heat + delta : heat
  const result = enforceDeadband(nextCool, nextHeat, active)
  if (
    result.coolSetpoint === cool &&
    result.heatSetpoint === heat
  ) {
    return null
  }
  return result
}

/** Keep cool at least 2° below heat when both move. */
export function enforceDeadband(
  cool: number,
  heat: number,
  changed: ActiveSetpoint,
): { coolSetpoint: number; heatSetpoint: number } {
  let nextCool = clampSetpoint(cool)
  let nextHeat = clampSetpoint(heat)
  const minGap = 2

  if (changed === 'heat' && nextHeat - nextCool < minGap) {
    nextCool = clampSetpoint(nextHeat - minGap)
  }
  if (changed === 'cool' && nextHeat - nextCool < minGap) {
    nextHeat = clampSetpoint(nextCool + minGap)
  }

  return { coolSetpoint: nextCool, heatSetpoint: nextHeat }
}
