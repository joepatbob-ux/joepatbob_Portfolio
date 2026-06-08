import type { Camera, Object3D } from 'three'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import {
  cameraViewFittingPhones,
  enclosingCameraView,
  lerpCameraView,
} from '@/lib/phone-swap/phoneSwapCameraFit'

/** Saved orbit camera for the phone swap stage. */
export type PhoneCameraView = {
  position: [number, number, number]
  target: [number, number, number]
  fov: number
}

export const DEFAULT_PHONE_CAMERA: PhoneCameraView = {
  position: [0, 0, 2.55],
  target: [0, 0, 0],
  fov: 40,
}

export function readCameraView(
  camera: Camera,
  controls: OrbitControlsImpl | null,
): PhoneCameraView {
  const pos = camera.position
  const target = controls?.target ?? new THREE.Vector3(0, 0, 0)
  const fov = camera instanceof THREE.PerspectiveCamera ? camera.fov : DEFAULT_PHONE_CAMERA.fov

  return {
    position: [pos.x, pos.y, pos.z],
    target: [target.x, target.y, target.z],
    fov,
  }
}

/** Frame both phones — back phone (e.g. offset iPhone) must stay inside canvas. */
export function cameraViewForSwap(
  base: PhoneCameraView,
  progress: number,
  animating: boolean,
  android: Object3D | null,
  iphone: Object3D | null,
  aspect: number,
): PhoneCameraView {
  if (!animating) {
    return base
  }

  const t = Math.max(0, Math.min(1, progress))
  const arc = Math.sin(t * Math.PI)
  if (arc < 0.001) return base

  const fitted = cameraViewFittingPhones(base, android, iphone, aspect, 1.22)
  if (!fitted) return base
  const blend = arc * 0.55
  return lerpCameraView(base, fitted, blend)
}

export function applyCameraView(
  camera: Camera,
  controls: OrbitControlsImpl | null,
  view: PhoneCameraView,
) {
  camera.position.set(view.position[0], view.position[1], view.position[2])
  if (camera instanceof THREE.PerspectiveCamera) {
    camera.fov = view.fov
    camera.updateProjectionMatrix()
  }
  if (controls) {
    controls.target.set(view.target[0], view.target[1], view.target[2])
    controls.update()
  }
}

export function formatCameraTs(view: PhoneCameraView): string {
  const p = view.position.map((n) => +n.toFixed(3)).join(', ')
  const t = view.target.map((n) => +n.toFixed(3)).join(', ')
  return `{ position: [${p}], target: [${t}], fov: ${view.fov.toFixed(1)} }`
}
