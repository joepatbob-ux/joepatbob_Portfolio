import { describe, expect, it } from 'vitest'
import {
  adjustFahrenheitByDisplayDelta,
  celsiusToFahrenheit,
  displayTemperature,
  fahrenheitToCelsius,
} from '@/lib/sensi-lite/temperature'

describe('temperature conversion', () => {
  it('converts common thermostat values accurately', () => {
    expect(fahrenheitToCelsius(72)).toBe(22)
    expect(fahrenheitToCelsius(68)).toBe(20)
    expect(fahrenheitToCelsius(75)).toBe(24)
    expect(celsiusToFahrenheit(22)).toBe(72)
    expect(celsiusToFahrenheit(20)).toBe(68)
    expect(celsiusToFahrenheit(24)).toBe(75)
  })

  it('displays stored fahrenheit in the selected unit', () => {
    expect(displayTemperature(72, 'f')).toBe(72)
    expect(displayTemperature(72, 'c')).toBe(22)
  })

  it('adjusts by 1°C when in celsius mode', () => {
    expect(adjustFahrenheitByDisplayDelta(68, 1, 'c')).toBe(70)
    expect(adjustFahrenheitByDisplayDelta(75, -1, 'c')).toBe(73)
  })
})
