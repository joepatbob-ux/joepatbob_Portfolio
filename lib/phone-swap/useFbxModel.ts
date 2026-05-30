import { useLoader } from '@react-three/fiber'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { splitPublicAssetUrl } from '@/lib/phone-swap/publicAssetUrl'

/** Load FBX; textures resolve under resourcePath (e.g. sceneassets next to export). */
export function useFbxModel(fbxPath: string, resourcePath?: string) {
  const fbx = splitPublicAssetUrl(fbxPath)
  const texDir = resourcePath
    ? resourcePath.endsWith('/')
      ? resourcePath
      : `${resourcePath}/`
    : fbx.directory

  return useLoader(FBXLoader, fbx.fileName, (loader) => {
    loader.setPath(fbx.directory)
    loader.setResourcePath(texDir)
  })
}
