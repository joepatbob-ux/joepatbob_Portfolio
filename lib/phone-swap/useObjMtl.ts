import { useLoader } from '@react-three/fiber'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { splitPublicAssetUrl } from '@/lib/phone-swap/publicAssetUrl'

/**
 * OBJ + MTL from /public/models.
 * Passes file names to Three loaders with setPath(dir) — required because R3F
 * memoizes loader instances and absolute URLs would concatenate with path.
 */
export function useObjMtl(objPath: string, mtlPath: string) {
  const mtl = splitPublicAssetUrl(mtlPath)
  const obj = splitPublicAssetUrl(objPath)

  const materials = useLoader(MTLLoader, mtl.fileName, (loader) => {
    loader.setPath(mtl.directory)
    loader.setResourcePath(mtl.directory)
  })

  return useLoader(OBJLoader, obj.fileName, (loader) => {
    loader.setPath(obj.directory)
    loader.setMaterials(materials)
  })
}
