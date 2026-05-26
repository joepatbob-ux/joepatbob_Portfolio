/** Shared debug colors — top-down grid and isometric overlay. */

export const PEG_MARKER_PIN = '#e85d04'
export const PEG_MARKER_ORIGIN = '#06c'
export const PEG_MARKER_FOOTPRINT = '#00aeef'

export type CornerPegMarker = {
  gx: number
  gy: number
  label: string
  color: string
}

export const CORNER_PEG_MARKERS: CornerPegMarker[] = [
  { gx: 0, gy: 0, label: 'A0', color: '#00aeef' },
  { gx: 0, gy: 9, label: 'J0', color: '#c800a1' },
  { gx: 9, gy: 0, label: 'A9', color: '#ffe600' },
  { gx: 9, gy: 9, label: 'J9', color: '#1a1a1a' },
]

export function cornerMarkerKey(gx: number, gy: number): string | null {
  if ((gx === 0 || gx === 9) && (gy === 0 || gy === 9)) return `${gx},${gy}`
  return null
}
