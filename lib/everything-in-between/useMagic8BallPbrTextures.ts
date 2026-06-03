import {
  MAGIC8_BALL_TEXTURE_LIST,
  MAGIC8_BALL_TEXTURE_URLS,
} from '@/lib/everything-in-between/magic8BallTextures'
import { useLoader } from '@react-three/fiber'
import { useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'
import { TextureLoader } from 'three'

export type Magic8BallPbrTextures = {
  map: THREE.Texture
  aoMap: THREE.Texture
  roughnessMap: THREE.Texture
  metalnessMap: THREE.Texture
  emissiveMap: THREE.Texture
  alphaMap: THREE.Texture
  normalMap: THREE.Texture
}

function configureColorMap(tex: THREE.Texture) {
  tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
}

function configureDataMap(tex: THREE.Texture) {
  tex.colorSpace = THREE.NoColorSpace
  tex.needsUpdate = true
}

export function useMagic8BallPbrTextures(): Magic8BallPbrTextures {
  const loaded = useLoader(TextureLoader, [...MAGIC8_BALL_TEXTURE_LIST])

  useLayoutEffect(() => {
    configureColorMap(loaded[0])
    configureDataMap(loaded[1])
    configureDataMap(loaded[2])
    configureDataMap(loaded[3])
    configureColorMap(loaded[4])
    configureDataMap(loaded[5])
    configureDataMap(loaded[6])
  }, [loaded])

  return useMemo(
    () => ({
      map: loaded[0],
      aoMap: loaded[1],
      roughnessMap: loaded[2],
      metalnessMap: loaded[3],
      emissiveMap: loaded[4],
      alphaMap: loaded[5],
      normalMap: loaded[6],
    }),
    [loaded],
  )
}

export { MAGIC8_BALL_TEXTURE_URLS }
