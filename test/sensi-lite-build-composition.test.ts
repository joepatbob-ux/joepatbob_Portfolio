import { describe, expect, it } from 'vitest'
import { buildHomeComposition } from '@/lib/sensi-lite/build-composition'
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
})
