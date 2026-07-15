import * as THREE from 'three'
import { applyPixel8CreamColors } from '@/lib/phone-swap/applyPixel8CreamColors'
import {
  applyPixel8DetailMaps,
  applyPixel8FrontBezel,
  applyPixel8MtlMaterials,
} from '@/lib/phone-swap/applyPixel8MtlMaterials'
import { applyPixel8Screen } from '@/lib/phone-swap/applyScreenTextures'
import { consolidateMeshesBySlot } from '@/lib/phone-swap/consolidateMeshesBySlot'
import {
  fixInvertedMeshNormals,
  rebuildMeshNormals,
} from '@/lib/phone-swap/mtlPhongToStandard'
import { mirrorModelX } from '@/lib/phone-swap/mirrorModelX'
import { normalizeModel } from '@/lib/phone-swap/normalizeModel'
import {
  PIXEL8_FRONT_OCCLUDER_MESHES,
  PIXEL8_MIRROR_X,
  type Pixel8MaterialMaps,
} from '@/lib/phone-swap/pixel8Assets'
import { splitMeshesByMaterial } from '@/lib/phone-swap/splitMeshByMaterial'
import { upgradeFbxMaterialsToStandard } from '@/lib/phone-swap/upgradeFbxMaterials'

function isolateMeshGeometries(root: THREE.Object3D) {
  root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry = child.geometry.clone()
    }
  })
}

/** Hide the internal earpiece/camera meshes that protrude in front of the display
    plane and render as faint rings over the screenshot (see the constant's note). */
function hidePixel8FrontOccluders(root: THREE.Object3D): void {
  const hidden = new Set<string>(PIXEL8_FRONT_OCCLUDER_MESHES)
  root.traverse((child) => {
    if (child instanceof THREE.Mesh && hidden.has(child.name)) {
      child.visible = false
    }
  })
}

export type PreparePixel8Options = {
  applyScreen?: boolean
  /** Keep materials parsed from FBX (DiffuseColor + maps). */
  useFbxMaterials?: boolean
}

export function preparePixel8Scene(
  raw: THREE.Object3D,
  screenTexture?: THREE.Texture,
  materialMaps?: Pixel8MaterialMaps,
  options: PreparePixel8Options = {},
) {
  const clone = raw.clone(true)
  isolateMeshGeometries(clone)

  splitMeshesByMaterial(clone)
  consolidateMeshesBySlot(clone)
  rebuildMeshNormals(clone)
  fixInvertedMeshNormals(clone)

  const { radius } = normalizeModel(clone)
  if (PIXEL8_MIRROR_X) mirrorModelX(clone)

  const useFbxMaterials = options.useFbxMaterials ?? false
  if (useFbxMaterials) {
    upgradeFbxMaterialsToStandard(clone)
    applyPixel8FrontBezel(clone)
  } else if (materialMaps) {
    applyPixel8MtlMaterials(clone, materialMaps)
  }

  if (materialMaps) {
    applyPixel8DetailMaps(clone, materialMaps)
  }

  applyPixel8CreamColors(clone)

  const applyScreen = options.applyScreen ?? true
  if (applyScreen && screenTexture) {
    applyPixel8Screen(clone, screenTexture)
  }

  hidePixel8FrontOccluders(clone)

  return { scene: clone, fitRadius: radius }
}
