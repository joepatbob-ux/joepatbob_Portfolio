import * as THREE from 'three'
import type { PhoneCameraView } from '@/lib/phone-swap/phoneSwapCamera'

const _box = new THREE.Box3()
const _meshBox = new THREE.Box3()
const _sphere = new THREE.Sphere()

function expandPhoneBounds(root: THREE.Object3D, box: THREE.Box3) {
  root.updateMatrixWorld(true)
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh) || !child.geometry) return
    const geo = child.geometry
    if (!geo.boundingBox) geo.computeBoundingBox()
    if (!geo.boundingBox) return
    _meshBox.copy(geo.boundingBox).applyMatrix4(child.matrixWorld)
    box.union(_meshBox)
  })
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function lerpCameraView(
  a: PhoneCameraView,
  b: PhoneCameraView,
  t: number,
): PhoneCameraView {
  return {
    position: [
      lerp(a.position[0], b.position[0], t),
      lerp(a.position[1], b.position[1], t),
      lerp(a.position[2], b.position[2], t),
    ],
    target: [
      lerp(a.target[0], b.target[0], t),
      lerp(a.target[1], b.target[1], t),
      lerp(a.target[2], b.target[2], t),
    ],
    fov: lerp(a.fov, b.fov, t),
  }
}

const _size = new THREE.Vector3()

/**
 * Pull camera back along +Z (saved layout convention) so both phone roots stay in frame.
 */
export function cameraViewFittingPhones(
  base: PhoneCameraView,
  android: THREE.Object3D | null,
  iphone: THREE.Object3D | null,
  aspect: number,
  margin = 1.38,
): PhoneCameraView {
  _box.makeEmpty()
  if (android) expandPhoneBounds(android, _box)
  if (iphone) expandPhoneBounds(iphone, _box)
  if (_box.isEmpty()) return base

  _box.getSize(_size)
  _box.getBoundingSphere(_sphere)
  const halfDiagonal = _size.length() * 0.5
  const radius = Math.max(_sphere.radius, halfDiagonal, 0.6)

  const target: [number, number, number] = [
    lerp(base.target[0], _sphere.center.x, 0.45),
    lerp(base.target[1], _sphere.center.y, 0.45),
    lerp(base.target[2], _sphere.center.z, 0.25),
  ]

  const fovRad = (base.fov * Math.PI) / 180
  const distV = radius / Math.sin(fovRad / 2)
  const hFov = 2 * Math.atan(Math.tan(fovRad / 2) * aspect)
  const distH = radius / Math.sin(hFov / 2)
  let distance = Math.max(distV, distH) * margin

  // Back phone often sits off-center (e.g. iPhone right + rear) — add horizontal slack.
  const offAxis = Math.max(
    Math.abs(_sphere.center.x - target[0]),
    Math.abs(_sphere.center.y - target[1]),
  )
  distance *= 1 + offAxis * 0.55

  const baseDistance = Math.max(base.position[2] - base.target[2], 0.01)
  const z = target[2] + Math.max(baseDistance, distance)

  const fovOut = Math.min(52, Math.max(base.fov + 6, base.fov + Math.max(0, radius - 0.85) * 6))

  return {
    position: [target[0], target[1], z],
    target,
    fov: fovOut,
  }
}

/** Layout tool — frame both phones with extra margin. */
export function cameraViewZoomAllOut(
  base: PhoneCameraView,
  android: THREE.Object3D | null,
  iphone: THREE.Object3D | null,
  aspect: number,
): PhoneCameraView {
  return cameraViewFittingPhones(base, android, iphone, aspect, 1.85)
}

/** Keep saved layout when possible; never clip the back phone vs fitted view. */
export function enclosingCameraView(
  base: PhoneCameraView,
  fitted: PhoneCameraView,
): PhoneCameraView {
  return {
    position: [
      lerp(base.position[0], fitted.position[0], 0.35),
      lerp(base.position[1], fitted.position[1], 0.35),
      Math.max(base.position[2], fitted.position[2]),
    ],
    target: [
      lerp(base.target[0], fitted.target[0], 0.3),
      lerp(base.target[1], fitted.target[1], 0.3),
      base.target[2],
    ],
    fov: Math.max(base.fov, fitted.fov),
  }
}
