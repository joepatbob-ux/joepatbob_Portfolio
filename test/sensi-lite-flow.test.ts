import { describe, expect, it } from 'vitest'
import {
  advanceMenuTap,
  enterHomeownerRing,
  INITIAL_FLOW_STATE,
  stepAuxLockout,
  stepBalancePoint,
  balancePointFloor,
} from '@/lib/sensi-lite/flow'

describe('sensi-lite flow', () => {
  it('enters homeowner ring from main', () => {
    const next = enterHomeownerRing(INITIAL_FLOW_STATE)
    expect(next.ring).toBe('homeowner')
    expect(next.screenIndex).toBe(0)
  })

  it('cycles homeowner screens then returns home', () => {
    let state = enterHomeownerRing(INITIAL_FLOW_STATE)
    state = advanceMenuTap(state)
    state = advanceMenuTap(state)
    state = advanceMenuTap(state)
    state = advanceMenuTap(state)
    expect(state.ring).toBe('main')
  })

  it('steps aux lockout down to off', () => {
    expect(stepAuxLockout(80, -1)).toBe(79)
    expect(stepAuxLockout(-4, -1)).toBe(null)
    expect(stepAuxLockout(null, 1)).toBe(-4)
  })

  it('respects balance point floor from aux lockout', () => {
    expect(balancePointFloor(80)).toBe(79)
    expect(balancePointFloor(null)).toBe(-5)
    expect(stepBalancePoint(55, -1, 80)).toBe(54)
    expect(stepBalancePoint(79, 1, 80)).toBe(55)
  })
})
