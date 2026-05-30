import * as THREE from 'three'
import {
  applyIPhone16Screen,
  IPHONE16_MESH,
} from '@/lib/phone-swap/applyScreenTextures'
import { debugLog } from '@/lib/phone-swap/debugLog'
import type { IPhone16ProMaps } from '@/lib/phone-swap/iphone16Assets'
import { normalizeModel } from '@/lib/phone-swap/normalizeModel'

export { IPHONE16_TEXTURES } from '@/lib/phone-swap/iphone16Assets'

function isolateMeshGeometries(root: THREE.Object3D) {
  root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry = child.geometry.clone()
    }
  })
}

function hideFrontGlass(root: THREE.Object3D) {
  const glass = root.getObjectByName(IPHONE16_MESH.glass) as THREE.Mesh | undefined
  if (glass) {
    glass.visible = false
    glass.renderOrder = 0
  }
}

function materialName(mesh: THREE.Mesh): string | undefined {
  const mat = mesh.material
  if (Array.isArray(mat)) return mat[0]?.name
  return mat?.name
}

function configureColorTexture(tex: THREE.Texture) {
  tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
}

function configureDataTexture(tex: THREE.Texture) {
  tex.colorSpace = THREE.NoColorSpace
  tex.needsUpdate = true
}

/** Apply Natural Titanium textures by MTL name (MTLLoader maps are async/unreliable). */
function applyIPhone16ProMaterials(root: THREE.Object3D, maps: IPhone16ProMaps) {
  ;[
    maps.flash,
    maps.screwGrooves,
    maps.frontCamera,
    maps.speakerAlpha,
  ].forEach(configureColorTexture)
  configureDataTexture(maps.brushNormalRough)
  configureDataTexture(maps.brushNormalSatin)
  configureDataTexture(maps.speakerBump)

  const titanium = (
    normal: THREE.Texture,
    color: number,
    roughness: number,
  ): THREE.MeshStandardMaterial =>
    new THREE.MeshStandardMaterial({
      color,
      normalMap: normal,
      metalness: 0.9,
      roughness,
      side: THREE.FrontSide,
    })

  const applied: string[] = []

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    if (child.name === IPHONE16_MESH.display) return

    const name = materialName(child)
    if (!name) return

    let next: THREE.Material | null = null

    switch (name) {
      case 'TITANIUM Rough':
        next = titanium(maps.brushNormalRough, 0x6b6b6e, 0.58)
        break
      case 'TITANIUM Satin':
        next = titanium(maps.brushNormalSatin, 0x7a7a7d, 0.42)
        break
      case 'STEEL Satin':
        next = titanium(maps.brushNormalSatin, 0x8c8c90, 0.38)
        break
      case 'FLASH':
        next = new THREE.MeshStandardMaterial({
          map: maps.flash,
          color: 0xffffff,
          metalness: 0.15,
          roughness: 0.55,
          side: THREE.FrontSide,
        })
        break
      case 'SCREW Grooves':
        next = new THREE.MeshStandardMaterial({
          map: maps.screwGrooves,
          color: 0xffffff,
          metalness: 0.25,
          roughness: 0.65,
          side: THREE.FrontSide,
        })
        break
      case 'CAMERA Front':
        next = new THREE.MeshStandardMaterial({
          map: maps.frontCamera,
          color: 0xffffff,
          metalness: 0.1,
          roughness: 0.6,
          side: THREE.FrontSide,
        })
        break
      case 'MESH':
      case 'MESH Bottom':
        next = new THREE.MeshStandardMaterial({
          color: 0x262628,
          alphaMap: maps.speakerAlpha,
          bumpMap: maps.speakerBump,
          bumpScale: 0.15,
          transparent: true,
          metalness: 0.2,
          roughness: 0.7,
          side: THREE.FrontSide,
        })
        break
      case 'PL_GLOSSY Black':
      case 'PL_SATIN Black':
      case 'PL_ANTENNAS':
        next = new THREE.MeshStandardMaterial({
          color: 0x0a0a0c,
          metalness: 0.35,
          roughness: 0.55,
          side: THREE.FrontSide,
        })
        break
      case 'GLASS':
      case 'GLASS Flash':
        next = new THREE.MeshStandardMaterial({
          color: 0x8899aa,
          metalness: 0.95,
          roughness: 0.08,
          transparent: true,
          opacity: 0.35,
          side: THREE.FrontSide,
        })
        break
      case 'GL_BACK Polished':
      case 'GL_BACK Rough':
        next = new THREE.MeshStandardMaterial({
          color: 0x55585c,
          metalness: 0.7,
          roughness: name === 'GL_BACK Polished' ? 0.15 : 0.45,
          side: THREE.FrontSide,
        })
        break
      case 'GOLD Connectors':
        next = new THREE.MeshStandardMaterial({
          color: 0xb8942e,
          metalness: 0.95,
          roughness: 0.25,
          side: THREE.FrontSide,
        })
        break
      case 'LENS':
        next = new THREE.MeshStandardMaterial({
          color: 0x111114,
          metalness: 0.9,
          roughness: 0.1,
          side: THREE.FrontSide,
        })
        break
      case 'GL_LOGO':
        next = new THREE.MeshStandardMaterial({
          color: 0x808285,
          metalness: 0.85,
          roughness: 0.2,
          side: THREE.FrontSide,
        })
        break
      case 'SCREEN':
        // Placeholder until applyIPhone16Screen replaces Display mesh material
        next = new THREE.MeshStandardMaterial({
          color: 0x111111,
          side: THREE.FrontSide,
        })
        break
      default:
        break
    }

    if (next) {
      child.material = next
      child.frustumCulled = false
      applied.push(name)
    }
  })

  // #region agent log
  debugLog(
    'prepareIPhone16Scene.ts:materials',
    'iPhone 16 Pro textures applied',
    {
      appliedCount: applied.length,
      applied: [...new Set(applied)],
      flashLoaded: !!maps.flash.image,
      screwLoaded: !!maps.screwGrooves.image,
      brushRoughLoaded: !!maps.brushNormalRough.image,
    },
    'M',
    'iphone16-pro-tex-fix',
  )
  // #endregion
}

/** Cinema 4D iPhone 16 Pro — `Display` mesh + SCREEN material (same pattern as Android). */
export function prepareIPhone16Scene(
  raw: THREE.Object3D,
  proMaps: IPhone16ProMaps,
  screenTexture: THREE.Texture,
) {
  const clone = raw.clone(true)
  isolateMeshGeometries(clone)

  const { radius, maxDim } = normalizeModel(clone)

  applyIPhone16ProMaterials(clone, proMaps)
  hideFrontGlass(clone)
  const displayMeshes = applyIPhone16Screen(clone, screenTexture)

  const display = clone.getObjectByName(IPHONE16_MESH.display)
  const body = clone.getObjectByName(IPHONE16_MESH.body)
  const glass = clone.getObjectByName(IPHONE16_MESH.glass)

  // #region agent log
  debugLog(
    'prepareIPhone16Scene.ts:ready',
    'iPhone 16 Pro scene prepared',
    {
      displayFound: !!display,
      bodyFound: !!body,
      displayMeshes,
      glassVisible: glass?.visible ?? null,
      maxDim,
      fitRadius: radius,
    },
    'S',
    'iphone16-pro-tex-fix',
  )
  // #endregion

  return { scene: clone, fitRadius: radius }
}
