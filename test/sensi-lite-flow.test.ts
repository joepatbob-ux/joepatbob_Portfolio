import { describe, expect, it } from 'vitest'
import {
  advanceMenuTap,
  currentHomeownerScreen,
  enterHomeownerRing,
  adjustTempUnit,
  setTempUnit,
  INITIAL_FLOW_STATE,
  stepAuxLockout,
  stepBalancePoint,
  balancePointFloor,
  stepFanDuty,
  FAN_DUTY_SEQUENCE,
} from '@/lib/sensi-lite/flow'

describe('sensi-lite flow', () => {
  it('enters homeowner ring on fan', () => {
    const next = enterHomeownerRing(INITIAL_FLOW_STATE)
    expect(next.ring).toBe('homeowner')
    expect(next.screenIndex).toBe(0)
    expect(currentHomeownerScreen(next)).toBe('fan')
  })

  it('cycles fan duty through percents, On, and Au', () => {
    expect(stepFanDuty(95, 1)).toBe('on')
    expect(stepFanDuty('on', 1)).toBe('au')
    expect(stepFanDuty('au', 1)).toBe(10)
    expect(stepFanDuty(10, -1)).toBe('au')
    expect(FAN_DUTY_SEQUENCE).toHaveLength(20)
  })

  it('cycles homeowner screens fan → units → home', () => {
    let state = enterHomeownerRing(INITIAL_FLOW_STATE)
    expect(currentHomeownerScreen(state)).toBe('fan')
    state = advanceMenuTap(state)
    expect(currentHomeownerScreen(state)).toBe('units')
    state = advanceMenuTap(state)
    expect(state.ring).toBe('main')
  })

  it('sets temp unit on the units screen', () => {
    let state = enterHomeownerRing(INITIAL_FLOW_STATE)
    state = advanceMenuTap(state)
    expect(state.tempUnit).toBe('f')
    state = setTempUnit(state, 'c')
    expect(state.tempUnit).toBe('c')
    state = adjustTempUnit(state, 1)
    expect(state.tempUnit).toBe('f')
    state = adjustTempUnit(state, -1)
    expect(state.tempUnit).toBe('c')
    state = setTempUnit(state, 'c')
    state = adjustTempUnit(state, -1)
    expect(state.tempUnit).toBe('f')
    state = setTempUnit(enterHomeownerRing(INITIAL_FLOW_STATE), 'c')
    expect(state.tempUnit).toBe('f')
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
