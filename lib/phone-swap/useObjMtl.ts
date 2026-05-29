import { useLoader } from '@react-three/fiber'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'

const MODELS_BASE = '/models/'

/** OBJ + MTL from /public/models with texture paths resolved under /models/. */
export function useObjMtl(objPath: string, mtlPath: string) {
  const materials = useLoader(MTLLoader, mtlPath, (loader) => {
    loader.setPath(MODELS_BASE)
    loader.setResourcePath(MODELS_BASE)
  })

  return useLoader(OBJLoader, objPath, (loader) => {
    materials.preload()
    loader.setMaterials(materials)
  })
}
