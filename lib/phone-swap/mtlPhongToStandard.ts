import * as THREE from 'three'

/** Map Maya/MTL Phong shininess (Ns) to PBR roughness. */
export function phongShininessToRoughness(shininess: number): number {
  if (shininess <= 0) return 0.62
  if (shininess >= 500) return 0.16
  return THREE.MathUtils.clamp(1 - Math.log10(shininess + 1) / 2.75, 0.12, 0.82)
}

/** Specular intensity + shininess → metalness hint. */
export function phongSpecularToMetalness(
  specular: THREE.Color | undefined,
  shininess: number,
): number {
  if (!specular) return 0.15
  const lum = (specular.r + specular.g + specular.b) / 3
  if (lum < 0.02) return 0.08
  if (shininess > 150 && lum > 0.85) return 0.78
  if (lum > 0.75) return 0.32
  return 0.14
}

export type PhongToStandardOptions = {
  name: string
  metalness?: number
  roughness?: number
  envMapIntensity?: number
  color?: number
}

/** Upgrade MTLLoader Phong materials to Standard while preserving authored Kd/Ks/Ns. */
export function mtlPhongToStandard(
  source: THREE.Material,
  options: PhongToStandardOptions,
): THREE.MeshStandardMaterial {
  if (source instanceof THREE.MeshStandardMaterial) {
    const mat = source.clone()
    mat.name = options.name
    if (options.color !== undefined) mat.color.setHex(options.color)
    if (options.metalness !== undefined) mat.metalness = options.metalness
    if (options.roughness !== undefined) mat.roughness = options.roughness
    if (options.envMapIntensity !== undefined) {
      mat.envMapIntensity = options.envMapIntensity
    }
    return mat
  }

  if (
    source instanceof THREE.MeshPhongMaterial ||
    source instanceof THREE.MeshLambertMaterial
  ) {
    const shininess =
      source instanceof THREE.MeshPhongMaterial ? source.shininess : 30
    const specular =
      source instanceof THREE.MeshPhongMaterial ? source.specular : undefined

    return new THREE.MeshStandardMaterial({
      name: options.name,
      color: options.color ?? source.color.getHex(),
      metalness: options.metalness ?? phongSpecularToMetalness(specular, shininess),
      roughness: options.roughness ?? phongShininessToRoughness(shininess),
      envMapIntensity: options.envMapIntensity ?? 0.75,
      transparent: source.transparent,
      opacity: source.opacity,
      side: THREE.FrontSide,
    })
  }

  return new THREE.MeshStandardMaterial({
    name: options.name,
    color: options.color ?? 0x888890,
    metalness: options.metalness ?? 0.15,
    roughness: options.roughness ?? 0.5,
    envMapIntensity: options.envMapIntensity ?? 0.75,
    side: THREE.FrontSide,
  })
}

export function rebuildMeshNormals(root: THREE.Object3D) {
  root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.computeVertexNormals()
    }
  })
}

/** Flip winding when most normals point inward (common on Max/OBJ exports). */
export function fixMeshNormalsIfInverted(mesh: THREE.Mesh): boolean {
  const geo = mesh.geometry
  const pos = geo.getAttribute('position')
  const norm = geo.getAttribute('normal')
  if (!pos || !norm || norm.count === 0) return false

  geo.computeBoundingBox()
  const center = new THREE.Vector3()
  geo.boundingBox!.getCenter(center)

  let outward = 0
  const step = Math.max(1, Math.floor(norm.count / 2000))
  for (let i = 0; i < norm.count; i += step) {
    const dx = pos.getX(i) - center.x
    const dy = pos.getY(i) - center.y
    const dz = pos.getZ(i) - center.z
    const dot =
      norm.getX(i) * dx + norm.getY(i) * dy + norm.getZ(i) * dz
    if (dot > 0) outward += 1
  }

  const samples = Math.ceil(norm.count / step)
  if (outward / samples >= 0.55) return false

  const index = geo.index
  if (index) {
    const arr = index.array as ArrayLike<number> & { [index: number]: number }
    for (let i = 0; i < arr.length; i += 3) {
      const tmp = arr[i + 1]
      arr[i + 1] = arr[i + 2]
      arr[i + 2] = tmp
    }
    index.needsUpdate = true
  }

  geo.computeVertexNormals()
  return true
}

export function fixInvertedMeshNormals(root: THREE.Object3D): number {
  let fixed = 0
  root.traverse((child) => {
    if (child instanceof THREE.Mesh && fixMeshNormalsIfInverted(child)) {
      fixed += 1
    }
  })
  return fixed
}
