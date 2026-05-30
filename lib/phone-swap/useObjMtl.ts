import { useLoader } from '@react-three/fiber'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'

/** Directory prefix for an encoded public asset URL (e.g. `/models/foo.mtl` → `/models/`). */
function assetDirectory(assetPath: string): string {
  const lastSlash = assetPath.lastIndexOf('/')
  return lastSlash >= 0 ? assetPath.slice(0, lastSlash + 1) : '/'
}

/** OBJ + MTL from /public/models — paths must be absolute (see phoneSwapUrls). */
export function useObjMtl(objPath: string, mtlPath: string) {
  const resourcePath = assetDirectory(mtlPath)

  const materials = useLoader(MTLLoader, mtlPath, (loader) => {
    // Do not setPath — mtlPath is already `/models/...`; setPath would double `/models/`.
    loader.setResourcePath(resourcePath)
  })

  return useLoader(OBJLoader, objPath, (loader) => {
    // Skip preload — MTL map_Kd paths may be missing; we assign textures in prepare*Scene.
    loader.setMaterials(materials)
  })
}
