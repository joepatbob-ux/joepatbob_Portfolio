import type { Camera } from 'three'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

/** Saved orbit camera for the phone swap stage. */
export type PhoneCameraView = {
  position: [number, number, number]
  target: [number, number, number]
  fov: number
}

export const DEFAULT_PHONE_CAMERA: PhoneCameraView = {
  position: [0, 0, 3.2],
  target: [0, 0, 0],
  fov: 42,
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
