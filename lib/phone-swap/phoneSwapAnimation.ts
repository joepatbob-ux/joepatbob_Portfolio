import * as THREE from 'three'
import type { PhonePose, PhoneSwapLayout, PhoneSwapSnapshot } from '@/lib/phone-swap/phoneSwapLayout'

const _qa = new THREE.Quaternion()
const _qb = new THREE.Quaternion()
const _qc = new THREE.Quaternion()
const _euler = new THREE.Euler(0, 0, 0, 'XYZ')

function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t))
}

function smoothstep(edge0: number, edge1: number, t: number): number {
  const x = clamp01((t - edge0) / (edge1 - edge0))
  return x * x * (3 - 2 * x)
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function lerpRotation(
  from: [number, number, number],
  to: [number, number, number],
  t: number,
): [number, number, number] {
  _euler.set(from[0], from[1], from[2])
  _qa.setFromEuler(_euler)
  _euler.set(to[0], to[1], to[2])
  _qb.setFromEuler(_euler)
  _qc.slerpQuaternions(_qa, _qb, t)
  _euler.setFromQuaternion(_qc, 'XYZ')
  return [_euler.x, _euler.y, _euler.z]
}

/** Staggered but same global ease — avoids phones meeting at center simultaneously. */
function staggerT(t: number, lead: boolean): number {
  const delay = lead ? 0 : 0.1
  const span = 0.9
  return clamp01((t - delay) / span)
}

function lerpPose(from: PhonePose, to: PhonePose, t: number): PhonePose {
  return {
    position: [
      lerp(from.position[0], to.position[0], t),
      lerp(from.position[1], to.position[1], t),
      lerp(from.position[2], to.position[2], t),
    ],
    rotation: lerpRotation(from.rotation, to.rotation, t),
    scale: lerp(from.scale, to.scale, t),
    renderOrder: from.renderOrder,
  }
}

function detourOffset(
  from: [number, number, number],
  to: [number, number, number],
  t: number,
  side: 1 | -1,
  strength: number,
): [number, number, number] {
  const dx = to[0] - from[0]
  const dy = to[1] - from[1]
  const len = Math.hypot(dx, dy) || 1
  const bulge = Math.sin(t * Math.PI) * strength
  return [(-dy / len) * side * bulge, (dx / len) * side * bulge, 0]
}

function travelDistance(
  a: [number, number, number],
  b: [number, number, number],
): number {
  return Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])
}

/**
 * Swap with opposing arcs, quaternion rotation, and smooth depth handoff
 * (no hard render-order flip or Z clamps that cause jitter).
 */
export function interpolatePhoneSwapLayout(
  layout: PhoneSwapLayout,
  progress: number,
): PhoneSwapSnapshot {
  const t = clamp01(progress)
  const from = layout.androidFocus
  const to = layout.iphoneFocus

  const androidStartsFront = from.android.renderOrder > from.iphone.renderOrder

  const tAndroid = staggerT(t, androidStartsFront)
  const tIphone = staggerT(t, !androidStartsFront)

  const android = lerpPose(from.android, to.android, tAndroid)
  const iphone = lerpPose(from.iphone, to.iphone, tIphone)

  const arcStrength = Math.max(
    0.48,
    Math.min(
      travelDistance(from.android.position, to.android.position),
      travelDistance(from.iphone.position, to.iphone.position),
    ) *
      0.5 +
      0.32,
  )

  android.position[0] += detourOffset(from.android.position, to.android.position, tAndroid, 1, arcStrength)[0]
  android.position[1] += detourOffset(from.android.position, to.android.position, tAndroid, 1, arcStrength)[1]
  iphone.position[0] += detourOffset(from.iphone.position, to.iphone.position, tIphone, -1, arcStrength)[0]
  iphone.position[1] += detourOffset(from.iphone.position, to.iphone.position, tIphone, -1, arcStrength)[1]

  /** Zero at t=0 and t=1 so rest poses match saved layout exactly. */
  const pass = Math.sin(t * Math.PI)
  const edgeTurn = pass * 0.38
  const edgeTilt = pass * 0.12

  android.rotation[0] += edgeTilt
  android.rotation[1] += edgeTurn
  android.rotation[2] += edgeTilt * 0.25

  iphone.rotation[0] -= edgeTilt
  iphone.rotation[1] -= edgeTurn
  iphone.rotation[2] -= edgeTilt * 0.25

  const androidFrontBlend = androidStartsFront
    ? 1 - smoothstep(0.36, 0.64, t)
    : smoothstep(0.36, 0.64, t)

  const depthSpread = (androidFrontBlend - 0.5) * 0.55 * pass
  android.position[2] += depthSpread
  iphone.position[2] -= depthSpread

  android.position[1] += pass * 0.08
  iphone.position[1] += pass * 0.05

  const androidIsFront = androidFrontBlend >= 0.5
  android.renderOrder = androidIsFront ? 2 : 1
  iphone.renderOrder = androidIsFront ? 1 : 2

  return { android, iphone }
}

export function snapshotForProgress(
  layout: PhoneSwapLayout,
  progress: number,
): PhoneSwapSnapshot {
  if (progress <= 0) return layout.androidFocus
  if (progress >= 1) return layout.iphoneFocus
  return interpolatePhoneSwapLayout(layout, progress)
}

export function applyPoseToGroup(group: THREE.Group | null, pose: PhonePose) {
  if (!group) return
  group.position.set(pose.position[0], pose.position[1], pose.position[2])
  group.rotation.set(pose.rotation[0], pose.rotation[1], pose.rotation[2])
  group.scale.setScalar(pose.scale)
  group.renderOrder = pose.renderOrder
}

export function readPoseFromGroup(
  group: THREE.Group,
  renderOrder: number,
): PhonePose {
  return {
    position: [group.position.x, group.position.y, group.position.z],
    rotation: [group.rotation.x, group.rotation.y, group.rotation.z],
    scale: group.scale.x,
    renderOrder,
  }
}

export function defaultRenderOrders(focus: 'androidFocus' | 'iphoneFocus') {
  if (focus === 'androidFocus') {
    return { android: 2, iphone: 1 }
  }
  return { android: 1, iphone: 2 }
}
