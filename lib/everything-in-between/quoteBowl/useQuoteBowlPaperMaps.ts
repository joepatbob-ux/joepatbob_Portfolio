'use client'

import {
  QUOTE_BOWL_PAPER_TEXTURE_LIST,
} from '@/lib/everything-in-between/quoteBowl/paperTextures'
import { useLoader } from '@react-three/fiber'
import { useEffect } from 'react'
import * as THREE from 'three'
import { SRGBColorSpace, TextureLoader } from 'three'

function configurePaperTexture(
  texture: THREE.Texture,
  colorSpace: THREE.ColorSpace,
) {
  texture.colorSpace = colorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = 4
  texture.needsUpdate = true
  return texture
}

/** Applies lined handwriting paper PBR maps to crumpled slip instances. */
export function useQuoteBowlPaperMaps(material: THREE.MeshStandardMaterial) {
  const [baseColor, normal, roughness] = useLoader(
    TextureLoader,
    [...QUOTE_BOWL_PAPER_TEXTURE_LIST],
  )

  useEffect(() => {
    configurePaperTexture(baseColor, SRGBColorSpace)
    configurePaperTexture(normal, THREE.NoColorSpace)
    configurePaperTexture(roughness, THREE.NoColorSpace)

    material.map = baseColor
    material.normalMap = normal
    material.roughnessMap = roughness
    material.normalScale.set(0.65, 0.65)
    material.metalness = 0
    material.roughness = 1
    material.color.set('#ffffff')
    material.needsUpdate = true
  }, [baseColor, material, normal, roughness])
}
