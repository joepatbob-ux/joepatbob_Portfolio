import { describe, expect, it } from 'vitest'
import { buildHomeComposition, buildSettingsComposition } from '@/lib/sensi-lite/build-composition'
import { ICON_IDS, LABEL_IDS } from '@/lib/sensi-lite/segment-ids'

describe('buildHomeComposition', () => {
  it('lights icon-set-to (not label-indoor) when editing setpoint', () => {
    const lit = buildHomeComposition({
      temp: 72,
      mode: 'heat',
      onActive: false,
      showSetTo: true,
    })

    expect(lit.has(ICON_IDS.setTo)).toBe(true)
    expect(lit.has(LABEL_IDS.setto)).toBe(false)
  })

  it('wifi screen alternates wifi and disconnected while radio is on', () => {
    const wifiOn = buildSettingsComposition('wifi', 'homeowner', null, {
      wifi: { radioOn: true, blinkWifi: true },
    })
    const xOn = buildSettingsComposition('wifi', 'homeowner', null, {
      wifi: { radioOn: true, blinkWifi: false },
    })

    expect(wifiOn.has(ICON_IDS.wifi)).toBe(true)
    expect(wifiOn.has(ICON_IDS.disconnected)).toBe(false)
    expect(wifiOn.has(LABEL_IDS.setup)).toBe(true)
    expect(wifiOn.has(ICON_IDS.onText)).toBe(true)

    expect(xOn.has(ICON_IDS.disconnected)).toBe(true)
    expect(xOn.has(ICON_IDS.wifi)).toBe(false)
  })

  it('wifi screen shows OFF when radio is disabled', () => {
    const lit = buildSettingsComposition('wifi', 'homeowner', null, {
      wifi: { radioOn: false, blinkWifi: true },
    })

    expect(lit.has(ICON_IDS.off)).toBe(true)
    expect(lit.has(ICON_IDS.onText)).toBe(false)
    expect(lit.has(ICON_IDS.wifi)).toBe(false)
  })

  it('fan screen shows setup, fan, percent, and duty digits', () => {
    const lit = buildSettingsComposition('fan', 'homeowner', null, { fanDuty: 45 })

    expect(lit.has(LABEL_IDS.setup)).toBe(true)
    expect(lit.has(ICON_IDS.fan)).toBe(true)
    expect(lit.has(ICON_IDS.percent)).toBe(true)
    expect(lit.has('digit-tens-mid')).toBe(true)
    expect(lit.has('digit-ones-br')).toBe(true)
  })

  it('fan screen defaults to duty 10 digits when fanDuty is omitted', () => {
    const lit = buildSettingsComposition('fan', 'homeowner', null)

    expect(lit.has(ICON_IDS.percent)).toBe(true)
    expect(lit.has('digit-tens-tr')).toBe(true)
    expect(lit.has('digit-tens-br')).toBe(true)
    expect(lit.has('digit-ones-top')).toBe(true)
    expect(lit.has('digit-ones-bot')).toBe(true)
  })

  it('fan screen hides percent for On and Au', () => {
    const onLit = buildSettingsComposition('fan', 'homeowner', null, { fanDuty: 'on' })
    const auLit = buildSettingsComposition('fan', 'homeowner', null, { fanDuty: 'au' })

    expect(onLit.has(ICON_IDS.percent)).toBe(false)
    expect(auLit.has(ICON_IDS.percent)).toBe(false)
    expect(onLit.has('digit-tens-top')).toBe(true)
    expect(onLit.has('digit-ones-mid')).toBe(true)
    expect(onLit.has('digit-ones-tl')).toBe(false)
    expect(auLit.has('digit-tens-mid')).toBe(true)
    expect(auLit.has('digit-tens-bl')).toBe(true)
    expect(auLit.has('digit-tens-bot')).toBe(false)
    expect(auLit.has('digit-ones-bot')).toBe(true)
  })

  it('units screen shows setup with °F or °C based on selection', () => {
    const fahrenheit = buildSettingsComposition('units', 'homeowner', null, { tempUnit: 'f' })
    const celsius = buildSettingsComposition('units', 'homeowner', null, { tempUnit: 'c' })

    expect(fahrenheit.has(LABEL_IDS.setup)).toBe(true)
    expect(fahrenheit.has(ICON_IDS.onDegree)).toBe(false)
    expect(fahrenheit.has('digit-tens-top')).toBe(true)
    expect(fahrenheit.has('digit-tens-mid')).toBe(true)
    expect(fahrenheit.has('digit-tens-tl')).toBe(true)
    expect(fahrenheit.has('digit-tens-tr')).toBe(true)
    expect(fahrenheit.has('digit-tens-bl')).toBe(false)
    expect(fahrenheit.has('digit-tens-br')).toBe(false)
    expect(fahrenheit.has('digit-ones-mid')).toBe(true)
    expect(fahrenheit.has('digit-ones-tl')).toBe(true)
    expect(fahrenheit.has('digit-ones-bot')).toBe(false)

    expect(celsius.has('digit-tens-top')).toBe(true)
    expect(celsius.has('digit-ones-top')).toBe(true)
    expect(celsius.has('digit-ones-bot')).toBe(true)
    expect(celsius.has('digit-ones-mid')).toBe(false)
  })
})
