import * as THREE from 'three'
import { isPhoneScreenPngMesh } from '@/lib/phone-swap/phoneAccentHover'
import { screenTextureForDisplay } from '@/lib/phone-swap/fitScreenTextureToMesh'

const displayMapByMesh = new WeakMap<THREE.Mesh, THREE.Texture>()

/** Swap the UI screenshot on every display mesh under `root`. */
export function updatePhoneScreenTextures(
  root: THREE.Object3D | null,
  sourceTexture: THREE.Texture,
): void {
  if (!root) return

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    if (!isPhoneScreenPngMesh(child)) return

    const mat = child.material
    if (!(mat instanceof THREE.MeshBasicMaterial)) return

    let displayMap = displayMapByMesh.get(child)
    if (!displayMap) {
      displayMap = screenTextureForDisplay(sourceTexture)
      displayMapByMesh.set(child, displayMap)
      mat.map = displayMap
      mat.needsUpdate = true
      return
    }

    displayMap.image = sourceTexture.image
    displayMap.needsUpdate = true
    mat.map = displayMap
    mat.needsUpdate = true
  })
}
