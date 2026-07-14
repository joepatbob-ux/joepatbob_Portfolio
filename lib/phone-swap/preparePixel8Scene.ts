import * as THREE from 'three'
import { applyPixel8CreamColors } from '@/lib/phone-swap/applyPixel8CreamColors'
import {
  applyPixel8DetailMaps,
  applyPixel8FrontBezel,
  applyPixel8MtlMaterials,
  countPhongMaterials,
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
  PIXEL8_COLOR_VARIANT,
  PIXEL8_FRONT_OCCLUDER_MESHES,
  PIXEL8_MESH,
  PIXEL8_MIRROR_X,
  type Pixel8MaterialMaps,
} from '@/lib/phone-swap/pixel8Assets'
import { splitMeshesByMaterial } from '@/lib/phone-swap/splitMeshByMaterial'
import {
  collectFbxMaterialSummary,
  upgradeFbxMaterialsToStandard,
} from '@/lib/phone-swap/upgradeFbxMaterials'

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

function sampleMaterialColor(mesh: THREE.Mesh | undefined): string | null {
  if (!mesh) return null
  const mat = mesh.material
  const m = Array.isArray(mat) ? mat[0] : mat
  if (m && 'color' in m && m.color instanceof THREE.Color) {
    return `#${m.color.getHexString()}`
  }
  return null
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

  const { splitCount } = splitMeshesByMaterial(clone)
  const consolidateResults = consolidateMeshesBySlot(clone)
  rebuildMeshNormals(clone)
  const normalsFixed = fixInvertedMeshNormals(clone)

  const { radius, maxDim } = normalizeModel(clone)
  if (PIXEL8_MIRROR_X) mirrorModelX(clone)

  const useFbxMaterials = options.useFbxMaterials ?? false
  const mtlMeshes = useFbxMaterials
    ? upgradeFbxMaterialsToStandard(clone)
    : materialMaps
      ? applyPixel8MtlMaterials(clone, materialMaps)
      : 0

  if (useFbxMaterials) {
    applyPixel8FrontBezel(clone)
  }

  const detailMaps = materialMaps
    ? applyPixel8DetailMaps(clone, materialMaps)
    : 0

  const creamMeshes = applyPixel8CreamColors(clone)

  const applyScreen = options.applyScreen ?? true
  const screenMeshes =
    applyScreen && screenTexture
      ? applyPixel8Screen(clone, screenTexture)
      : 0
  const phongRemaining = countPhongMaterials(clone)

  const slotNames: string[] = []
  clone.traverse((child) => {
    if (child instanceof THREE.Mesh) slotNames.push(child.name)
  })

  hidePixel8FrontOccluders(clone)

  const frameMesh = clone.getObjectByName(PIXEL8_MESH.body) as THREE.Mesh | undefined

  const fbxMaterials = useFbxMaterials
    ? collectFbxMaterialSummary(clone).slice(0, 12)
    : undefined

  return { scene: clone, fitRadius: radius }
}
