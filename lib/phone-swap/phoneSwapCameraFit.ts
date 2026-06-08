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

/** Margin multiplier for production viewport framing (lower = tighter / more zoom). */
export const PHONE_VIEWPORT_FIT_MARGIN = 0.82

/** Pull-in after fit (1 = none; lower = closer). */
export const PHONE_VIEWPORT_DISTANCE_SCALE = 0.92

/** Extra vertical breathing room in viewport mode (tilted phones / front-target fit). */
export const PHONE_VIEWPORT_VERTICAL_PAD = 1.1

/** Narrow FOV in viewport mode so models fill the shell height. */
export const PHONE_VIEWPORT_FOV_TRIM = 2

const _size = new THREE.Vector3()
const _frontBox = new THREE.Box3()
const _frontCenter = new THREE.Vector3()

/** World-axis extents of box corners relative to the look-at target. */
function boxExtentsFromTarget(
  box: THREE.Box3,
  target: [number, number, number],
): { halfX: number; halfY: number } {
  let halfX = 0
  let halfY = 0
  const xs = [box.min.x, box.max.x] as const
  const ys = [box.min.y, box.max.y] as const
  const zs = [box.min.z, box.max.z] as const
  for (const x of xs) {
    for (const y of ys) {
      for (const z of zs) {
        halfX = Math.max(halfX, Math.abs(x - target[0]))
        halfY = Math.max(halfY, Math.abs(y - target[1]))
        void z
      }
    }
  }
  return { halfX, halfY }
}

/** Pull camera back along +Z (saved layout convention) so both phone roots stay in frame. */
export function cameraViewFittingPhones(
  base: PhoneCameraView,
  android: THREE.Object3D | null,
  iphone: THREE.Object3D | null,
  aspect: number,
  margin = 1.38,
  mode: 'default' | 'viewport' = 'default',
  distanceScale = PHONE_VIEWPORT_DISTANCE_SCALE,
  fovTrim = PHONE_VIEWPORT_FOV_TRIM,
  focusRoot: THREE.Object3D | null = null,
): PhoneCameraView | null {
  _box.makeEmpty()
  if (android) expandPhoneBounds(android, _box)
  if (iphone) expandPhoneBounds(iphone, _box)
  if (_box.isEmpty()) return null

  _box.getSize(_size)
  _box.getBoundingSphere(_sphere)
  const halfDiagonal = _size.length() * 0.5
  const radius = Math.max(_sphere.radius, halfDiagonal, 0.6)

  const targetBlend = mode === 'viewport' ? 0.62 : 0.45
  let target: [number, number, number]

  if (mode === 'viewport' && focusRoot) {
    _frontBox.makeEmpty()
    expandPhoneBounds(focusRoot, _frontBox)
    if (!_frontBox.isEmpty()) {
      _frontBox.getCenter(_frontCenter)
      target = [_frontCenter.x, _frontCenter.y, _frontCenter.z]
    } else {
      target = [_sphere.center.x, _sphere.center.y, _sphere.center.z]
    }
  } else {
    target = [
      lerp(base.target[0], _sphere.center.x, targetBlend),
      lerp(base.target[1], _sphere.center.y, targetBlend),
      lerp(base.target[2], _sphere.center.z, mode === 'viewport' ? 0.5 : 0.25),
    ]
  }

  const fovIn = mode === 'viewport' ? Math.max(36, base.fov - fovTrim) : base.fov
  const fovRad = (fovIn * Math.PI) / 180
  const hFov = 2 * Math.atan(Math.tan(fovRad / 2) * aspect)

  let distance: number
  if (mode === 'viewport') {
    const { halfX, halfY } = boxExtentsFromTarget(_box, target)
    const distV =
      (halfY * PHONE_VIEWPORT_VERTICAL_PAD) / Math.tan(fovRad / 2)
    const distH = halfX / Math.tan(hFov / 2)
    const zoom = margin * distanceScale
    const zoomed = Math.max(distV, distH, 0.01) * zoom
    // Tight zoom must not pull in past vertical clearance (margin*scale < 1 was clipping caps).
    distance = Math.max(zoomed, distV)
  } else {
    const distV = radius / Math.sin(fovRad / 2)
    const distH = radius / Math.sin(hFov / 2)
    distance = Math.max(distV, distH) * margin

    const offAxis = Math.max(
      Math.abs(_sphere.center.x - target[0]),
      Math.abs(_sphere.center.y - target[1]),
    )
    distance *= 1 + offAxis * 0.55
  }

  if (mode === 'viewport') {
    return {
      position: [target[0], target[1], target[2] + distance],
      target,
      fov: fovIn,
    }
  }

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
  return (
    cameraViewFittingPhones(base, android, iphone, aspect, 1.85) ?? base
  )
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
