import * as THREE from 'three'
import type {
  PhonePose,
  PhoneSwapEditFocus,
  PhoneSwapLayout,
  PhoneSwapSnapshot,
} from '@/lib/phone-swap/phoneSwapLayout'
import {
  clampAnimSettings,
  DEFAULT_PHONE_SWAP_ANIM,
  type PhoneSwapAnimSettings,
} from '@/lib/phone-swap/phoneSwapAnimSettings'
import { easeInOutSine } from '@/lib/phone-swap/phoneSwapTiming'

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

/** Quadratic Bézier through three poses (de Casteljau — smooth velocity at the middle control). */
function quadraticBezierPose(p0: PhonePose, p1: PhonePose, p2: PhonePose, s: number): PhonePose {
  const t = clamp01(s)
  const a = lerpPose(p0, p1, t)
  const b = lerpPose(p1, p2, t)
  return lerpPose(a, b, t)
}

function quadraticBezierSnapshot(
  p0: PhoneSwapSnapshot,
  p1: PhoneSwapSnapshot,
  p2: PhoneSwapSnapshot,
  s: number,
): PhoneSwapSnapshot {
  return {
    android: quadraticBezierPose(p0.android, p1.android, p2.android, s),
    iphone: quadraticBezierPose(p0.iphone, p1.iphone, p2.iphone, s),
  }
}

/** Soft depth handoff — blend render orders through the midpoint band instead of a hard flip. */
function applyRenderOrdersSmooth(
  snapshot: PhoneSwapSnapshot,
  start: PhoneSwapSnapshot,
  mid: PhoneSwapSnapshot,
  end: PhoneSwapSnapshot,
  s: number,
  anim: PhoneSwapAnimSettings,
) {
  const t = clamp01(s)
  const bandStart = anim.depthBlendStart
  const bandEnd = anim.depthBlendEnd

  if (t < bandStart) {
    const u = smoothstep(t / bandStart)
    snapshot.android.renderOrder = Math.round(
      lerp(start.android.renderOrder, mid.android.renderOrder, u),
    )
    snapshot.iphone.renderOrder = Math.round(
      lerp(start.iphone.renderOrder, mid.iphone.renderOrder, u),
    )
    return
  }

  if (t > bandEnd) {
    const u = smoothstep((t - bandEnd) / (1 - bandEnd))
    snapshot.android.renderOrder = Math.round(
      lerp(mid.android.renderOrder, end.android.renderOrder, u),
    )
    snapshot.iphone.renderOrder = Math.round(
      lerp(mid.iphone.renderOrder, end.iphone.renderOrder, u),
    )
    return
  }

  snapshot.android.renderOrder = mid.android.renderOrder
  snapshot.iphone.renderOrder = mid.iphone.renderOrder
}

/** Map layout progress (0 = Android, 1 = iPhone) to eased curve parameter. */
function curveParameter(progress: number, forward: boolean): number {
  const eased = easeInOutSine(progress)
  return forward ? eased : 1 - eased
}

function interpolateAndroidToIphone(
  layout: PhoneSwapLayout,
  progress: number,
  anim: PhoneSwapAnimSettings,
): PhoneSwapSnapshot {
  const s = curveParameter(progress, true)
  const start = layout.androidFocus
  const mid = layout.androidToIphoneMidpoint
  const end = layout.iphoneFocus
  const snapshot = quadraticBezierSnapshot(start, mid, end, s)
  applyRenderOrdersSmooth(snapshot, start, mid, end, s, anim)
  return snapshot
}

function interpolateIphoneToAndroid(
  layout: PhoneSwapLayout,
  progress: number,
  anim: PhoneSwapAnimSettings,
): PhoneSwapSnapshot {
  const s = curveParameter(progress, false)
  const start = layout.iphoneFocus
  const mid = layout.iphoneToAndroidMidpoint
  const end = layout.androidFocus
  const snapshot = quadraticBezierSnapshot(start, mid, end, s)
  applyRenderOrdersSmooth(snapshot, start, mid, end, s, anim)
  return snapshot
}

export function snapshotForProgress(
  layout: PhoneSwapLayout,
  progress: number,
  forward = true,
  anim: PhoneSwapAnimSettings = DEFAULT_PHONE_SWAP_ANIM,
): PhoneSwapSnapshot {
  const settings = clampAnimSettings(anim)
  if (progress <= 0) return layout.androidFocus
  if (progress >= 1) return layout.iphoneFocus
  return forward
    ? interpolateAndroidToIphone(layout, progress, settings)
    : interpolateIphoneToAndroid(layout, progress, settings)
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
