/** Sample shake + roll keyframes (0–1 progress) for the 3D ball pivot. */

export type RollSample = {
  rotX: number
  rotZ: number
  posX: number
  posY: number
}

const KEYFRAMES: { p: number; rotX: number; rotZ: number; posX: number; posY: number }[] =
  [
    { p: 0, rotX: 0, rotZ: 0, posX: 0, posY: 0 },
    { p: 0.06, rotX: 0, rotZ: -0.12, posX: -0.05, posY: 0 },
    { p: 0.12, rotX: 0, rotZ: 0.12, posX: 0.05, posY: 0 },
    { p: 0.18, rotX: 0, rotZ: -0.16, posX: -0.06, posY: 0 },
    { p: 0.24, rotX: 0, rotZ: 0.16, posX: 0.06, posY: 0 },
    { p: 0.3, rotX: 0, rotZ: -0.1, posX: -0.04, posY: 0 },
    { p: 0.36, rotX: 0, rotZ: 0.1, posX: 0.04, posY: 0 },
    { p: 0.44, rotX: 0.94, rotZ: 0.08, posX: 0.09, posY: -0.01 },
    { p: 0.52, rotX: 1.88, rotZ: 0.06, posX: 0.13, posY: -0.02 },
    { p: 0.58, rotX: Math.PI, rotZ: 0, posX: 0.14, posY: -0.02 },
    { p: 0.66, rotX: 2.36, rotZ: -0.05, posX: 0.08, posY: -0.01 },
    { p: 0.74, rotX: 1.57, rotZ: 0, posX: 0, posY: 0 },
    { p: 0.82, rotX: 0.79, rotZ: -0.05, posX: -0.08, posY: -0.01 },
    { p: 0.88, rotX: 0, rotZ: 0, posX: -0.03, posY: 0 },
    { p: 0.94, rotX: 0, rotZ: -0.035, posX: -0.02, posY: 0 },
    { p: 1, rotX: 0, rotZ: 0, posX: 0, posY: 0 },
  ]

export function sampleMagic8BallRoll(progress: number): RollSample {
  const t = Math.max(0, Math.min(1, progress))
  let i = 0
  while (i < KEYFRAMES.length - 2 && KEYFRAMES[i + 1].p < t) i++

  const a = KEYFRAMES[i]
  const b = KEYFRAMES[i + 1]
  const span = b.p - a.p || 1
  const u = (t - a.p) / span

  return {
    rotX: a.rotX + (b.rotX - a.rotX) * u,
    rotZ: a.rotZ + (b.rotZ - a.rotZ) * u,
    posX: a.posX + (b.posX - a.posX) * u,
    posY: a.posY + (b.posY - a.posY) * u,
  }
}
