import { mtlPhongToStandard, fixInvertedMeshNormals } from '@/lib/phone-swap/mtlPhongToStandard'
import { normalizeModel } from '@/lib/phone-swap/normalizeModel'
import * as THREE from 'three'

const PAPER_TARGET = 0.095 * 6

export type PreparedPaperCrumpled = {
  geometry: THREE.BufferGeometry
  material: THREE.MeshStandardMaterial
  /** Normalized mesh bounding-sphere radius — use for matching physics colliders. */
  radius: number
}

function extractMesh(root: THREE.Object3D): THREE.Mesh | null {
  let best: THREE.Mesh | null = null
  let bestVerts = 0
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    const count = child.geometry.attributes.position?.count ?? 0
    if (count > bestVerts) {
      bestVerts = count
      best = child
    }
  })
  return best
}

function toPaperMaterial(source: THREE.Material): THREE.MeshStandardMaterial {
  if (source instanceof THREE.MeshStandardMaterial) {
    const mat = source.clone()
    mat.roughness = 0.9
    mat.metalness = 0
    mat.side = THREE.DoubleSide
    if (mat.map) mat.map.colorSpace = THREE.SRGBColorSpace
    return mat
  }
  if (source instanceof THREE.MeshPhongMaterial) {
    const mat = mtlPhongToStandard(source, {
      name: 'paperCrumpled',
      roughness: 0.9,
      metalness: 0,
    })
    mat.side = THREE.DoubleSide
    if (mat.map) mat.map.colorSpace = THREE.SRGBColorSpace
    return mat
  }
  return new THREE.MeshStandardMaterial({
    color: '#faf6eb',
    roughness: 0.92,
    metalness: 0,
    side: THREE.DoubleSide,
  })
}

/** Normalize Adobe crumpled-paper OBJ for instancing inside the bowl. */
export function preparePaperCrumpled(raw: THREE.Object3D): PreparedPaperCrumpled {
  const root = raw.clone(true)
  fixInvertedMeshNormals(root)

  const sourceMesh = extractMesh(root)
  if (!sourceMesh) {
    return {
      geometry: new THREE.BoxGeometry(0.08, 0.04, 0.08),
      material: new THREE.MeshStandardMaterial({ color: '#faf6eb', roughness: 0.92 }),
      radius: 0.05,
    }
  }

  const material = toPaperMaterial(
    sourceMesh.material instanceof Array
      ? sourceMesh.material[0]
      : sourceMesh.material,
  )

  const paperRoot = new THREE.Group()
  const mesh = new THREE.Mesh(sourceMesh.geometry.clone(), material)
  paperRoot.add(mesh)
  normalizeModel(paperRoot, PAPER_TARGET)

  mesh.updateMatrixWorld(true)
  const geometry = mesh.geometry.clone()
  geometry.applyMatrix4(mesh.matrixWorld)
  geometry.computeBoundingSphere()

  return {
    geometry,
    material,
    radius: geometry.boundingSphere?.radius ?? PAPER_TARGET * 0.5,
  }
}
