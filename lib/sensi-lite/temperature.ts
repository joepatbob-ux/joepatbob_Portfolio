export type TempUnit = 'f' | 'c'

/** Canonical storage is always °F; display converts for Celsius mode. */
export function fahrenheitToCelsius(f: number): number {
  return Math.round((f - 32) * (5 / 9))
}

export function celsiusToFahrenheit(c: number): number {
  return Math.round((c * 9) / 5 + 32)
}

export function displayTemperature(fahrenheit: number, unit: TempUnit): number {
  return unit === 'c' ? fahrenheitToCelsius(fahrenheit) : Math.round(fahrenheit)
}

export function adjustFahrenheitByDisplayDelta(
  fahrenheit: number,
  delta: number,
  unit: TempUnit,
): number {
  if (unit === 'f') return fahrenheit + delta
  const celsius = fahrenheitToCelsius(fahrenheit)
  return celsiusToFahrenheit(celsius + delta)
}
