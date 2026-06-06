import * as THREE from 'three'
import {
  applyPixel9DisplayStandIn,
  applyPixel9MtlMaterials,
} from '@/lib/phone-swap/applyPixel9MtlMaterials'
import { applyPixel9Screen } from '@/lib/phone-swap/applyScreenTextures'
import { debugLog } from '@/lib/phone-swap/debugLog'
import { mergeAllMaterialIslands } from '@/lib/phone-swap/mergeMeshesByMaterial'
import { mirrorModelX } from '@/lib/phone-swap/mirrorModelX'
import { normalizeModel } from '@/lib/phone-swap/normalizeModel'
import {
  PIXEL9_COLOR_VARIANT,
  PIXEL9_MESH,
} from '@/lib/phone-swap/pixel9Assets'
import { splitMeshesByMaterial } from '@/lib/phone-swap/splitMeshByMaterial'

const HIDDEN_SHELLS = new Set<string>([
  PIXEL9_MESH.glass,
  PIXEL9_MESH.cameraGlass,
  PIXEL9_MESH.flashGlass,
])

function isolateMeshGeometries(root: THREE.Object3D) {
  root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry = child.geometry.clone()
    }
  })
}

function hideReflectionShells(root: THREE.Object3D) {
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    if (!HIDDEN_SHELLS.has(child.name)) return
    child.visible = false
    child.renderOrder = 0
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

export type PreparePixel9Options = {
  /** When true, maps Android.png onto the merged GP9p_display mesh only. */
  applyScreen?: boolean
}

export function preparePixel9Scene(
  raw: THREE.Object3D,
  screenTexture?: THREE.Texture | null,
  options: PreparePixel9Options = {},
) {
  const applyScreen = options.applyScreen ?? false

  const clone = raw.clone(true)
  isolateMeshGeometries(clone)

  const { splitCount } = splitMeshesByMaterial(clone)
  const mergeResults = mergeAllMaterialIslands(clone)

  const { radius, maxDim } = normalizeModel(clone)
  mirrorModelX(clone)

  hideReflectionShells(clone)
  const mtlMeshes = applyPixel9MtlMaterials(clone)

  let screenMeshes = 0
  if (applyScreen && screenTexture) {
    screenMeshes = applyPixel9Screen(clone, screenTexture)
  } else {
    screenMeshes = applyPixel9DisplayStandIn(clone)
  }

  const frameMesh = clone.getObjectByName(PIXEL9_MESH.body) as THREE.Mesh | undefined

  // #region agent log
  debugLog(
    'preparePixel9Scene.ts:ready',
    'Pixel 9 scene prepared',
    {
      colorVariant: PIXEL9_COLOR_VARIANT,
      mtlMeshes,
      screenMeshes,
      applyScreen,
      modelMirroredX: clone.scale.x < 0,
      frameMeshFound: !!frameMesh,
      frameColor: sampleMaterialColor(frameMesh),
      maxDim,
      fitRadius: radius,
      mergeResults,
      splitCount,
    },
    'M',
    'pixel9-porcelain-mirror',
  )
  // #endregion

  return { scene: clone, fitRadius: radius }
}
