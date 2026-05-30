import { useLoader } from '@react-three/fiber'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'

const MODELS_BASE = '/models/'

/** Load FBX; textures resolve under resourcePath (e.g. sceneassets next to export). */
export function useFbxModel(fbxPath: string, resourcePath = MODELS_BASE) {
  return useLoader(FBXLoader, fbxPath, (loader) => {
    loader.setResourcePath(resourcePath)
  })
}
