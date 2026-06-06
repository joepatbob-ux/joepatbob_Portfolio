import {
  applyBowlGlassTune,
  applyDarkSurfaceGlassBoost,
  createTunedBowlGlassMaterial,
  readBowlGlassTune,
  type BowlGlassTuneSettings,
} from '@/lib/everything-in-between/bowlGlassTune'
import { QUOTE_BOWL } from '@/lib/everything-in-between/quoteBowl/constants'
import { fixInvertedMeshNormals } from '@/lib/phone-swap/mtlPhongToStandard'
import { normalizeModel } from '@/lib/phone-swap/normalizeModel'
import {
  applyAccentTint,
  applyModelHoverGlow,
  restoreColorMaterial,
} from '@/lib/phone-swap/phoneAccentHover'
import * as THREE from 'three'

const BOWL_TARGET = 2.78

function cloneRaw(raw: THREE.Object3D) {
  const scene = raw.clone(true)
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry = child.geometry.clone()
    }
  })
  return scene
}

function applyGlassMaterial(root: THREE.Object3D, tune: BowlGlassTuneSettings) {
  const material = createTunedBowlGlassMaterial(tune)
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    child.castShadow = false
    child.receiveShadow = false
    child.raycast = () => {}
    child.renderOrder = 2
    child.material = material
    cacheBowlHoverBaseline(material)
  })
}

export type PreparedGoldfishBowl = {
  bowl: THREE.Object3D
  fitRadius: number
  height: number
  innerRadius: number
  bottomY: number
  topY: number
  /** Visible glass cavity — use for paper pile, not raw bbox min. */
  pileBottomY: number
  pileTopY: number
}

function measureBowlFloor(
  bowl: THREE.Object3D,
  innerRadius: number,
): number | null {
  const floorYs: number[] = []
  const v = new THREE.Vector3()

  bowl.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    const pos = child.geometry.attributes.position as THREE.BufferAttribute
    if (!pos) return

    for (let i = 0; i < pos.count; i += 1) {
      v.fromBufferAttribute(pos, i)
      child.localToWorld(v)
      const r = Math.hypot(v.x, v.z)
      if (r > innerRadius * 0.34) continue
      floorYs.push(v.y)
    }
  })

  if (floorYs.length < 6) return null
  floorYs.sort((a, b) => a - b)
  return floorYs[Math.floor(floorYs.length * 0.06)]
}

function measureBowlCavity(
  bowl: THREE.Object3D,
  innerRadius: number,
): { bottom: number; top: number } | null {
  const bellyYs: number[] = []
  const interiorYs: number[] = []
  const v = new THREE.Vector3()

  bowl.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    const pos = child.geometry.attributes.position as THREE.BufferAttribute
    if (!pos) return

    for (let i = 0; i < pos.count; i += 1) {
      v.fromBufferAttribute(pos, i)
      child.localToWorld(v)
      const r = Math.hypot(v.x, v.z)
      if (r > innerRadius * 0.92) continue

      interiorYs.push(v.y)
      // Skip the flat foot disk — sample the curved belly wall only.
      if (r >= innerRadius * 0.2 && r <= innerRadius * 0.86) {
        bellyYs.push(v.y)
      }
    }
  })

  const ys = bellyYs.length >= 12 ? bellyYs : interiorYs
  if (ys.length < 8) return null
  ys.sort((a, b) => a - b)

  return {
    bottom: ys[Math.floor(ys.length * 0.06)],
    top: ys[Math.floor(ys.length * 0.88)],
  }
}

/** Normalize Adobe glass bowl OBJ and swap in glass PBR. */
export function prepareGoldfishBowl(
  raw: THREE.Object3D,
  tune: BowlGlassTuneSettings,
): PreparedGoldfishBowl {
  const bowl = cloneRaw(raw)
  fixInvertedMeshNormals(bowl)
  applyGlassMaterial(bowl, tune)

  const { radius } = normalizeModel(bowl, BOWL_TARGET)

  bowl.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(bowl)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  bowl.position.y -= center.y - size.y * 0.02

  bowl.updateMatrixWorld(true)
  const fitted = new THREE.Box3().setFromObject(bowl)
  const fittedSize = fitted.getSize(new THREE.Vector3())

  const innerRadius = radius * 0.52
  const cavity = measureBowlCavity(bowl, innerRadius)
  const floorY = measureBowlFloor(bowl, innerRadius)
  const pileBottomY =
    floorY ??
    cavity?.bottom ??
    fitted.min.y + fittedSize.y * 0.05
  const pileTopY =
    cavity?.top ??
    fitted.max.y - fittedSize.y * 0.08

  return {
    bowl,
    fitRadius: radius,
    height: size.y,
    innerRadius,
    bottomY: fitted.min.y,
    topY: fitted.max.y,
    pileBottomY,
    pileTopY,
  }
}

export function updateBowlGlassMaterial(
  bowl: THREE.Object3D,
  tune: BowlGlassTuneSettings,
  darkSurface = false,
) {
  bowl.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.material instanceof THREE.MeshPhysicalMaterial) {
        applyBowlGlassTune(child.material, tune)
        if (darkSurface) {
          applyDarkSurfaceGlassBoost(child.material, QUOTE_BOWL.darkSurface.glass)
        }
      } else {
        const material = createTunedBowlGlassMaterial(tune)
        if (darkSurface) {
          applyDarkSurfaceGlassBoost(material, QUOTE_BOWL.darkSurface.glass)
        }
        child.material = material
      }
      cacheBowlHoverBaseline(child.material)
    }
  })
}

type BowlHoverBaseline = {
  color: THREE.Color
  opacity: number
  emissive: THREE.Color
  emissiveIntensity: number
}

function cacheBowlHoverBaseline(material: THREE.Material) {
  if (!(material instanceof THREE.MeshPhysicalMaterial)) return
  if (material.userData.bowlHoverBaseline) return
  material.userData.bowlHoverBaseline = {
    color: material.color.clone(),
    opacity: material.opacity,
    emissive: material.emissive.clone(),
    emissiveIntensity: material.emissiveIntensity,
  } satisfies BowlHoverBaseline
}

/** Orange accent glow on the glass bowl during hover. */
export function applyBowlGlassHover(bowl: THREE.Object3D, hover: number) {
  bowl.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    const mat = child.material
    if (!(mat instanceof THREE.MeshPhysicalMaterial)) return
    cacheBowlHoverBaseline(mat)
    const base = mat.userData.bowlHoverBaseline as BowlHoverBaseline
    if (!base) return

    if (hover <= 0.001) {
      restoreColorMaterial(mat, base)
      mat.emissive.copy(base.emissive)
      mat.emissiveIntensity = base.emissiveIntensity
      return
    }

    applyAccentTint(mat, base, hover)
    applyModelHoverGlow(mat, base, hover)
  })
}
