import type { FortuneTellerStep } from '@/lib/everything-in-between/fortuneTeller'

export const ORIGAMI_SIZE = 1.05

export type FlapId = 'top' | 'right' | 'bottom' | 'left'

export type FlapSpec = {
  id: FlapId
  hinge: [number, number, number]
  /** Local rotation axis for open/close (X or Z in hinge space). */
  axis: 'x' | 'z'
  /** Direction the flap lifts when “open”. */
  sign: 1 | -1
  labelPosition: [number, number, number]
  labelRotation: [number, number, number]
}

export const FLAP_SPECS: readonly FlapSpec[] = [
  {
    id: 'top',
    hinge: [0, 0, -ORIGAMI_SIZE],
    axis: 'x',
    sign: 1,
    labelPosition: [0, 0.04, -ORIGAMI_SIZE * 0.42],
    labelRotation: [-Math.PI / 2, 0, 0],
  },
  {
    id: 'right',
    hinge: [ORIGAMI_SIZE, 0, 0],
    axis: 'z',
    sign: -1,
    labelPosition: [ORIGAMI_SIZE * 0.42, 0.04, 0],
    labelRotation: [-Math.PI / 2, 0, Math.PI / 2],
  },
  {
    id: 'bottom',
    hinge: [0, 0, ORIGAMI_SIZE],
    axis: 'x',
    sign: -1,
    labelPosition: [0, 0.04, ORIGAMI_SIZE * 0.42],
    labelRotation: [-Math.PI / 2, 0, Math.PI],
  },
  {
    id: 'left',
    hinge: [-ORIGAMI_SIZE, 0, 0],
    axis: 'z',
    sign: 1,
    labelPosition: [-ORIGAMI_SIZE * 0.42, 0.04, 0],
    labelRotation: [-Math.PI / 2, 0, -Math.PI / 2],
  },
] as const

export function flapOpenAngle(
  step: FortuneTellerStep,
  pinchTick: number,
  reducedMotion: boolean,
): number {
  if (step === 'pick-number') return 0.92
  if (step === 'revealed') return 1.15
  if (step === 'pinching') {
    if (reducedMotion) return 0.72
    return pinchTick % 2 === 1 ? 0.22 : 0.68
  }
  return 0.14
}

export function origamiGroupTilt(step: FortuneTellerStep, pinchTick: number): number {
  if (step === 'pinching') return pinchTick % 2 === 1 ? 0.08 : -0.06
  if (step === 'pick-number') return 0.12
  return 0
}

export function mixHex(base: string, tint: string, amount: number): string {
  const parse = (hex: string) => {
    const h = hex.replace('#', '')
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ] as const
  }
  const [br, bg, bb] = parse(base)
  const [tr, tg, tb] = parse(tint)
  const t = Math.min(1, Math.max(0, amount))
  const r = Math.round(br + (tr - br) * t)
  const g = Math.round(bg + (tg - bg) * t)
  const b = Math.round(bb + (tb - bb) * t)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}
