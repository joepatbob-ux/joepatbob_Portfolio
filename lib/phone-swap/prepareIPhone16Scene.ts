import * as THREE from 'three'
import {
  applyIPhone16FrontBezel,
  applyIPhone16FrontOverlays,
  applyIPhone16Screen,
  IPHONE16_MESH,
} from '@/lib/phone-swap/applyScreenTextures'
import {
  IPHONE16_RING_OBJECTS,
  IPHONE16_SIDE_OBJECTS,
  NATURAL_TITANIUM,
  type IPhone16ProMaps,
} from '@/lib/phone-swap/iphone16Assets'
import { normalizeModel } from '@/lib/phone-swap/normalizeModel'


function isolateMeshGeometries(root: THREE.Object3D) {
  root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry = child.geometry.clone()
    }
  })
}

/** C4D export is left-handed on X — mirror whole model, then rebuild normals for lighting. */
function mirrorModelX(root: THREE.Object3D) {
  root.scale.x *= -1
  root.updateMatrixWorld(true)
  root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.computeVertexNormals()
    }
  })
}

function materialName(mesh: THREE.Mesh): string | undefined {
  const mat = mesh.material
  if (Array.isArray(mat)) return mat[0]?.name
  return mat?.name
}

function cloneColorMap(source: THREE.Texture): THREE.Texture {
  const map = source.clone()
  map.colorSpace = THREE.SRGBColorSpace
  map.wrapS = THREE.ClampToEdgeWrapping
  map.wrapT = THREE.ClampToEdgeWrapping
  map.needsUpdate = true
  return map
}

function cloneDataMap(source: THREE.Texture): THREE.Texture {
  const map = source.clone()
  map.colorSpace = THREE.NoColorSpace
  map.needsUpdate = true
  return map
}

function flatTitanium(
  color: number,
  roughness: number,
  metalness: number,
  name: string,
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    name,
    color,
    metalness,
    roughness,
    side: THREE.FrontSide,
  })
}

function bodyTitanium(
  maps: IPhone16ProMaps,
  satin: boolean,
): THREE.MeshStandardMaterial {
  const normal = cloneDataMap(
    satin ? maps.brushNormalSatin : maps.brushNormalRough,
  )
  return new THREE.MeshStandardMaterial({
    name: satin ? 'TITANIUM Satin' : 'TITANIUM Rough',
    color: satin ? NATURAL_TITANIUM.bodyLight : NATURAL_TITANIUM.body,
    normalMap: normal,
    normalScale: new THREE.Vector2(0.28, 0.28),
    metalness: 0.72,
    roughness: satin ? 0.34 : 0.42,
    side: THREE.FrontSide,
  })
}

/** Per-mesh materials: gradient map stretched on side UVs → use flat titanium colors. */
function applyIPhone16ProMaterials(root: THREE.Object3D, maps: IPhone16ProMaps) {
  const counts = { body: 0, side: 0, ring: 0, black: 0, other: 0 }

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    if (child.name === IPHONE16_MESH.display) return
    if (child.name === IPHONE16_MESH.glass) return

    const matName = materialName(child)
    const objName = child.name
    if (!matName) return

    let next: THREE.Material | null = null

    if (objName === 'Body') {
      if (matName === 'TITANIUM Rough' || matName === 'TITANIUM Satin') {
        next = bodyTitanium(maps, matName === 'TITANIUM Satin')
        counts.body += 1
      }
    } else if (IPHONE16_SIDE_OBJECTS.has(objName)) {
      next = flatTitanium(NATURAL_TITANIUM.side, 0.38, 0.78, matName)
      counts.side += 1
    } else if (IPHONE16_RING_OBJECTS.has(objName)) {
      next = flatTitanium(NATURAL_TITANIUM.ring, 0.3, 0.82, matName)
      counts.ring += 1
    } else {
      switch (matName) {
        case 'TITANIUM Rough':
        case 'TITANIUM Satin':
          next = flatTitanium(
            NATURAL_TITANIUM.body,
            0.4,
            0.75,
            matName,
          )
          counts.other += 1
          break
        case 'STEEL Satin':
          next = flatTitanium(0xe0dcd6, 0.28, 0.85, matName)
          counts.other += 1
          break
        case 'FLASH':
          next = new THREE.MeshStandardMaterial({
            name: matName,
            map: cloneColorMap(maps.flash),
            color: 0xffffff,
            metalness: 0.15,
            roughness: 0.55,
            side: THREE.FrontSide,
          })
          counts.other += 1
          break
        case 'SCREW Grooves':
          next = new THREE.MeshStandardMaterial({
            name: matName,
            map: cloneColorMap(maps.screwGrooves),
            color: 0xffffff,
            metalness: 0.25,
            roughness: 0.65,
            side: THREE.FrontSide,
          })
          counts.other += 1
          break
        case 'CAMERA Front':
          next = new THREE.MeshStandardMaterial({
            name: matName,
            map: cloneColorMap(maps.frontCamera),
            color: 0xffffff,
            metalness: 0.1,
            roughness: 0.6,
            side: THREE.FrontSide,
          })
          counts.other += 1
          break
        case 'MESH':
        case 'MESH Bottom':
          next = new THREE.MeshStandardMaterial({
            name: matName,
            color: 0x4a4a4c,
            alphaMap: cloneDataMap(maps.speakerAlpha),
            bumpMap: cloneDataMap(maps.speakerBump),
            bumpScale: 0.1,
            transparent: true,
            alphaTest: 0.45,
            depthWrite: false,
            metalness: 0.2,
            roughness: 0.75,
            side: THREE.FrontSide,
          })
          counts.other += 1
          break
        case 'PL_GLOSSY Black':
        case 'PL_SATIN Black':
        case 'PL_ANTENNAS':
          next = flatTitanium(0x2a2a2e, 0.48, 0.42, matName)
          counts.black += 1
          break
        case 'GLASS':
        case 'GLASS Flash':
          next = new THREE.MeshStandardMaterial({
            name: matName,
            color: 0x99aabb,
            metalness: 0.95,
            roughness: 0.06,
            transparent: true,
            opacity: 0.25,
            depthWrite: false,
            side: THREE.FrontSide,
          })
          counts.other += 1
          break
        case 'GL_BACK Polished':
        case 'GL_BACK Rough':
          next = flatTitanium(
            NATURAL_TITANIUM.bodyLight,
            matName === 'GL_BACK Polished' ? 0.14 : 0.38,
            0.7,
            matName,
          )
          counts.other += 1
          break
        case 'GOLD Connectors':
          next = flatTitanium(0xb8942e, 0.25, 0.92, matName)
          counts.other += 1
          break
        case 'LENS':
          next = flatTitanium(0x151518, 0.12, 0.88, matName)
          counts.other += 1
          break
        case 'GL_LOGO':
          next = flatTitanium(0xa8a39c, 0.24, 0.82, matName)
          counts.other += 1
          break
        case 'SCREEN':
          next = new THREE.MeshStandardMaterial({
            name: matName,
            color: 0x111111,
            side: THREE.FrontSide,
          })
          counts.other += 1
          break
        default:
          break
      }
    }

    if (next) {
      child.material = next
      child.frustumCulled = false
    }
  })
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
  mirrorModelX(clone)

  applyIPhone16ProMaterials(clone, proMaps)
  applyIPhone16FrontBezel(clone)
  const displayMeshes = applyIPhone16Screen(clone, screenTexture)
  applyIPhone16FrontOverlays(clone)

  const display = clone.getObjectByName(IPHONE16_MESH.display)
  const body = clone.getObjectByName(IPHONE16_MESH.body)
  const glass = clone.getObjectByName(IPHONE16_MESH.glass)

  return { scene: clone, fitRadius: radius }
}
