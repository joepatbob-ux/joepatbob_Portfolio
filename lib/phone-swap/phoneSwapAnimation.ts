import * as THREE from 'three'
import type {
  PhonePose,
  PhoneSwapEditFocus,
  PhoneSwapLayout,
  PhoneSwapSnapshot,
} from '@/lib/phone-swap/phoneSwapLayout'

const _qa = new THREE.Quaternion()
const _qb = new THREE.Quaternion()
const _qc = new THREE.Quaternion()
const _euler = new THREE.Euler(0, 0, 0, 'XYZ')

function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t))
}

function smoothstep(t: number): number {
  const x = clamp01(t)
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

function snapshotAtSegment(
  from: PhoneSwapSnapshot,
  to: PhoneSwapSnapshot,
  t: number,
  useEndFocusDepth: boolean,
  endFocus: PhoneSwapSnapshot,
): PhoneSwapSnapshot {
  const u = smoothstep(t)
  const android = lerpPose(from.android, to.android, u)
  const iphone = lerpPose(from.iphone, to.iphone, u)

  const depthRef = useEndFocusDepth ? endFocus : from
  const androidIsFront =
    depthRef.android.renderOrder > depthRef.iphone.renderOrder

  android.renderOrder = androidIsFront ? 2 : 1
  iphone.renderOrder = androidIsFront ? 1 : 2

  return { android, iphone }
}

/**
 * Android focus → swap midpoint → iPhone focus (authored pass-around, no crossing).
 */
export function interpolatePhoneSwapLayout(
  layout: PhoneSwapLayout,
  progress: number,
): PhoneSwapSnapshot {
  const t = clamp01(progress)
  const from = layout.androidFocus
  const mid = layout.swapMidpoint
  const to = layout.iphoneFocus
  if (t <= 0.5) {
    return snapshotAtSegment(from, mid, t / 0.5, false, to)
  }

  return snapshotAtSegment(mid, to, (t - 0.5) / 0.5, true, to)
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

export function renderOrdersForEdit(focus: PhoneSwapEditFocus, layout: PhoneSwapLayout) {
  if (focus === 'swapMidpoint') {
    return {
      android: layout.swapMidpoint.android.renderOrder,
      iphone: layout.swapMidpoint.iphone.renderOrder,
    }
  }
  return defaultRenderOrders(focus)
}
