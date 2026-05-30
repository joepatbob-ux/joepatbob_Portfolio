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

/** Pull back slightly mid-swap so arc paths stay inside the canvas. */
export function cameraViewForSwap(
  base: PhoneCameraView,
  progress: number,
  animating: boolean,
): PhoneCameraView {
  if (!animating && progress <= 0.001) return base
  if (!animating && progress >= 0.999) return base

  const t = Math.max(0, Math.min(1, progress))
  const arc = Math.sin(t * Math.PI)
  const pullZ = arc * 0.62
  const fovBump = arc * 2.5

  return {
    position: [base.position[0], base.position[1], base.position[2] + pullZ],
    target: [...base.target],
    fov: base.fov + fovBump,
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
