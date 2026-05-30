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
  const u = clamp01(t)
  const android = lerpPose(from.android, to.android, u)
  const iphone = lerpPose(from.iphone, to.iphone, u)

  const depthRef = useEndFocusDepth ? endFocus : from
  const androidIsFront =
    depthRef.android.renderOrder > depthRef.iphone.renderOrder

  android.renderOrder = androidIsFront ? 2 : 1
  iphone.renderOrder = androidIsFront ? 1 : 2

  return { android, iphone }
}

/** Android focus → android→iPhone midpoint → iPhone focus. */
function interpolateAndroidToIphone(
  layout: PhoneSwapLayout,
  progress: number,
): PhoneSwapSnapshot {
  const t = clamp01(progress)
  const from = layout.androidFocus
  const mid = layout.androidToIphoneMidpoint
  const to = layout.iphoneFocus
  if (t <= 0.5) {
    return snapshotAtSegment(from, mid, t / 0.5, false, to)
  }
  return snapshotAtSegment(mid, to, (t - 0.5) / 0.5, true, to)
}

/** iPhone focus → iPhone→Android midpoint → Android focus (progress still 0 = Android, 1 = iPhone). */
function interpolateIphoneToAndroid(
  layout: PhoneSwapLayout,
  progress: number,
): PhoneSwapSnapshot {
  const t = clamp01(progress)
  const from = layout.androidFocus
  const mid = layout.iphoneToAndroidMidpoint
  const to = layout.iphoneFocus
  if (t >= 0.5) {
    return snapshotAtSegment(to, mid, (1 - t) / 0.5, false, from)
  }
  return snapshotAtSegment(mid, from, (0.5 - t) / 0.5, true, from)
}

export function snapshotForProgress(
  layout: PhoneSwapLayout,
  progress: number,
  forward = true,
): PhoneSwapSnapshot {
  if (progress <= 0) return layout.androidFocus
  if (progress >= 1) return layout.iphoneFocus
  return forward
    ? interpolateAndroidToIphone(layout, progress)
    : interpolateIphoneToAndroid(layout, progress)
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

export function renderOrdersForEdit(
  focus: PhoneSwapEditFocus,
  layout: PhoneSwapLayout,
) {
  if (focus === 'androidToIphoneMidpoint') {
    return {
      android: layout.androidToIphoneMidpoint.android.renderOrder,
      iphone: layout.androidToIphoneMidpoint.iphone.renderOrder,
    }
  }
  if (focus === 'iphoneToAndroidMidpoint') {
    return {
      android: layout.iphoneToAndroidMidpoint.android.renderOrder,
      iphone: layout.iphoneToAndroidMidpoint.iphone.renderOrder,
    }
  }
  return defaultRenderOrders(focus)
}
