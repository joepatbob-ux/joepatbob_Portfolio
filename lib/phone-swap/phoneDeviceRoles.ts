import * as THREE from 'three'
import type { PhoneDevice, PhoneSwapSnapshot } from '@/lib/phone-swap/phoneSwapLayout'

const savedRaycast = new WeakMap<
  THREE.Mesh,
  (raycaster: THREE.Raycaster, intersects: THREE.Intersection[]) => void
>()

export function backDeviceFromSnapshot(
  snapshot: PhoneSwapSnapshot,
): PhoneDevice {
  if (snapshot.android.renderOrder !== snapshot.iphone.renderOrder) {
    return snapshot.android.renderOrder < snapshot.iphone.renderOrder
      ? 'android'
      : 'iphone'
  }
  return snapshot.android.scale <= snapshot.iphone.scale ? 'android' : 'iphone'
}

export function frontDeviceFromSnapshot(
  snapshot: PhoneSwapSnapshot,
): PhoneDevice {
  return backDeviceFromSnapshot(snapshot) === 'android' ? 'iphone' : 'android'
}

/** Toggle mesh raycasts so only the back phone receives pointer hits. */
export function setPhonePointerHits(
  root: THREE.Object3D | null,
  enabled: boolean,
) {
  if (!root) return

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return

    if (!enabled) {
      if (!savedRaycast.has(child)) {
        savedRaycast.set(child, child.raycast.bind(child))
      }
      child.raycast = () => {}
      return
    }

    const restore = savedRaycast.get(child)
    if (restore) {
      child.raycast = restore
      savedRaycast.delete(child)
    }
  })
}
