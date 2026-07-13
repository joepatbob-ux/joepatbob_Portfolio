import type { Mode } from '@/lib/sensi-lite/build-composition'

export type Ring = 'main' | 'homeowner' | 'contractor'

/** Wi‑Fi setup is app-prompted on first connect, not in the customer menu ring. */
export type HomeownerScreen = 'fan' | 'units'
export type ContractorScreen = 'outdoor' | 'auxLockout' | 'balancePoint'

export const HOMEOWNER_SCREENS: HomeownerScreen[] = ['fan', 'units']
export const CONTRACTOR_SCREENS: ContractorScreen[] = ['outdoor', 'auxLockout', 'balancePoint']

export const HOMEOWNER_LONG_PRESS_MS = 1200
export const CONTRACTOR_LONG_PRESS_MS = 2000

export const AUX_LOCKOUT_MAX = 80
export const AUX_LOCKOUT_MIN = -4
export const BALANCE_POINT_DEFAULT = 55
export const BALANCE_POINT_MIN = -5

export type FanDuty = number | 'on' | 'au'
export type TempUnit = 'f' | 'c'

export const FAN_DUTY_SEQUENCE: FanDuty[] = (() => {
  const seq: FanDuty[] = []
  for (let p = 10; p <= 95; p += 5) seq.push(p)
  seq.push('on', 'au')
  return seq
})()

export function stepFanDuty(current: FanDuty, delta: number): FanDuty {
  const idx = FAN_DUTY_SEQUENCE.indexOf(current)
  const safeIdx = idx < 0 ? 0 : idx
  const next =
    (safeIdx + delta + FAN_DUTY_SEQUENCE.length) % FAN_DUTY_SEQUENCE.length
  return FAN_DUTY_SEQUENCE[next]
}

export type FlowState = {
  ring: Ring
  screenIndex: number
  mode: Mode
  heatTo: number
  coolTo: number
  editingSetpoint: boolean
  outdoorType: 'hp' | 'ac'
  auxLockout: number | null
  balancePoint: number | null
  fanDuty: FanDuty
  tempUnit: TempUnit
}

export const INITIAL_FLOW_STATE: FlowState = {
  ring: 'main',
  screenIndex: 0,
  mode: 'cool',
  heatTo: 68,
  coolTo: 75,
  editingSetpoint: false,
  outdoorType: 'hp',
  auxLockout: 80,
  balancePoint: BALANCE_POINT_DEFAULT,
  fanDuty: 10,
  tempUnit: 'f',
}

export function enterHomeownerRing(state: FlowState): FlowState {
  return {
    ...state,
    ring: 'homeowner',
    screenIndex: 0,
    editingSetpoint: false,
    fanDuty: state.fanDuty ?? 10,
  }
}

export function adjustFanDuty(state: FlowState, delta: number): FlowState {
  if (state.ring !== 'homeowner' || currentHomeownerScreen(state) !== 'fan') return state
  return { ...state, fanDuty: stepFanDuty(state.fanDuty, delta) }
}

export function setTempUnit(state: FlowState, unit: TempUnit): FlowState {
  if (state.ring !== 'homeowner' || currentHomeownerScreen(state) !== 'units') return state
  return { ...state, tempUnit: unit }
}

export function adjustTempUnit(state: FlowState, _delta: number): FlowState {
  if (state.ring !== 'homeowner' || currentHomeownerScreen(state) !== 'units') return state
  return { ...state, tempUnit: state.tempUnit === 'f' ? 'c' : 'f' }
}

export function enterContractorRing(state: FlowState): FlowState {
  return { ...state, ring: 'contractor', screenIndex: 0, editingSetpoint: false }
}

export function returnToMain(state: FlowState): FlowState {
  return { ...state, ring: 'main', screenIndex: 0, editingSetpoint: false }
}

export function advanceMenuTap(state: FlowState): FlowState {
  if (state.ring === 'main') return state

  const screens = state.ring === 'homeowner' ? HOMEOWNER_SCREENS : CONTRACTOR_SCREENS
  const nextIndex = state.screenIndex + 1
  if (nextIndex >= screens.length) return returnToMain(state)
  return { ...state, screenIndex: nextIndex }
}

export function currentHomeownerScreen(state: FlowState): HomeownerScreen {
  return HOMEOWNER_SCREENS[state.screenIndex] ?? 'fan'
}

export function currentContractorScreen(state: FlowState): ContractorScreen {
  return CONTRACTOR_SCREENS[state.screenIndex] ?? 'outdoor'
}

export function stepAuxLockout(current: number | null, delta: number): number | null {
  if (current === null) {
    return delta > 0 ? AUX_LOCKOUT_MIN : null
  }
  const next = current + delta
  if (next < AUX_LOCKOUT_MIN) return null
  if (next > AUX_LOCKOUT_MAX) return AUX_LOCKOUT_MAX
  return next
}

/** Highest settable balance point. It must stay below the aux lockout (the
 *  compressor and aux ranges may not invert); with aux Off there is no backup
 *  heat, so the ceiling collapses to the minimum — you can't lock out the only
 *  heat source. */
export function balancePointCeiling(auxLockout: number | null): number {
  if (auxLockout === null) return BALANCE_POINT_MIN
  return Math.max(BALANCE_POINT_MIN, auxLockout - 1)
}

export function stepBalancePoint(
  current: number | null,
  delta: number,
  auxLockout: number | null,
): number | null {
  const ceiling = balancePointCeiling(auxLockout)
  if (current === null) {
    // From Off, stepping up enters the range at its minimum (mirrors aux lockout).
    return delta > 0 ? BALANCE_POINT_MIN : null
  }
  const next = current + delta
  if (next < BALANCE_POINT_MIN) return null // below the range → Off
  if (next > ceiling) return ceiling // pinned below the aux lockout
  return next
}

export function adjustContractorValue(state: FlowState, delta: number): FlowState {
  const screen = currentContractorScreen(state)
  if (screen === 'auxLockout') {
    return { ...state, auxLockout: stepAuxLockout(state.auxLockout, delta) }
  }
  if (screen === 'balancePoint') {
    return {
      ...state,
      balancePoint: stepBalancePoint(state.balancePoint, delta, state.auxLockout),
    }
  }
  return state
}
