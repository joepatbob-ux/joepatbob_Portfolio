import type { Mode } from '@/lib/sensi-lite/build-composition'

export type Ring = 'main' | 'homeowner' | 'contractor'

export type HomeownerScreen = 'wifi' | 'display' | 'fan' | 'units'
export type ContractorScreen = 'outdoor' | 'auxLockout' | 'balancePoint'

export const HOMEOWNER_SCREENS: HomeownerScreen[] = ['wifi', 'display', 'fan', 'units']
export const CONTRACTOR_SCREENS: ContractorScreen[] = ['outdoor', 'auxLockout', 'balancePoint']

export const HOMEOWNER_LONG_PRESS_MS = 1200
export const CONTRACTOR_LONG_PRESS_MS = 2000

export const AUX_LOCKOUT_MAX = 80
export const AUX_LOCKOUT_MIN = -4
export const BALANCE_POINT_DEFAULT = 55
export const BALANCE_POINT_MIN = -5

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
}

export function enterHomeownerRing(state: FlowState): FlowState {
  return { ...state, ring: 'homeowner', screenIndex: 0, editingSetpoint: false }
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
  return HOMEOWNER_SCREENS[state.screenIndex] ?? 'wifi'
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

export function balancePointFloor(auxLockout: number | null): number {
  if (auxLockout === null) return BALANCE_POINT_MIN
  return Math.max(BALANCE_POINT_MIN, auxLockout - 1)
}

export function stepBalancePoint(
  current: number | null,
  delta: number,
  auxLockout: number | null,
): number | null {
  const floor = balancePointFloor(auxLockout)
  if (current === null) {
    return delta > 0 ? floor : null
  }
  const next = current + delta
  if (next < floor) return null
  if (next > BALANCE_POINT_DEFAULT) return BALANCE_POINT_DEFAULT
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
