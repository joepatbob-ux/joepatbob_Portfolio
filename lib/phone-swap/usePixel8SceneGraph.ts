import { useLoader } from '@react-three/fiber'
import { useLayoutEffect, useMemo } from 'react'
import { SRGBColorSpace, TextureLoader } from 'three'
import {
  PIXEL8_BODY_ATLAS,
  PIXEL8_BODY_ATLAS_FILES,
  PIXEL8_FBX,
  PIXEL8_FBX_RESOURCE_PATH,
  PIXEL8_USE_FBX,
  type Pixel8MaterialMaps,
} from '@/lib/phone-swap/pixel8Assets'
import { PHONE_SWAP_URLS } from '@/lib/phone-swap/phoneSwapUrls'
import { preparePixel8Scene } from '@/lib/phone-swap/preparePixel8Scene'
import { useFbxModel } from '@/lib/phone-swap/useFbxModel'
import { useObjMtl } from '@/lib/phone-swap/useObjMtl'

function usePixel8ProTexMaps(): Pixel8MaterialMaps {
  const urls = PHONE_SWAP_URLS.pixel8
  const loaderUrls = [
    urls.logoAlpha,
    urls.speakerGrilleAlpha,
    urls.speakerAlpha,
  ]
  if (PIXEL8_BODY_ATLAS) {
    loaderUrls.unshift(PIXEL8_BODY_ATLAS_FILES[PIXEL8_BODY_ATLAS])
  }

  const loaded = useLoader(TextureLoader, loaderUrls)

  useLayoutEffect(() => {
    loaded.forEach((tex) => {
      tex.colorSpace = SRGBColorSpace
      tex.needsUpdate = true
    })
  }, [loaded])

  return useMemo(() => {
    let i = 0
    const bodyAtlas = PIXEL8_BODY_ATLAS ? loaded[i++] : undefined
    const logoAlpha = loaded[i++]!
    const speakerGrilleAlpha = loaded[i++]!
    const speakerAlpha = loaded[i++]!
    return { logoAlpha, speakerGrilleAlpha, speakerAlpha, bodyAtlas }
  }, [loaded])
}

function usePixel8ObjScene() {
  const urls = PHONE_SWAP_URLS.pixel8
  const raw = useObjMtl(urls.obj, urls.mtl)
  const [screenTexture] = useLoader(TextureLoader, [urls.screen])
  const materialMaps = usePixel8ProTexMaps()

  useLayoutEffect(() => {
    screenTexture.colorSpace = SRGBColorSpace
    screenTexture.needsUpdate = true
  }, [screenTexture])

  return useMemo(
    () =>
      preparePixel8Scene(raw, screenTexture, materialMaps, {
        applyScreen: true,
        useFbxMaterials: false,
      }),
    [raw, screenTexture, materialMaps],
  )
}

function usePixel8FbxScene() {
  const urls = PHONE_SWAP_URLS.pixel8
  const raw = useFbxModel(PIXEL8_FBX, PIXEL8_FBX_RESOURCE_PATH)
  const [screenTexture] = useLoader(TextureLoader, [urls.screen])
  const materialMaps = usePixel8ProTexMaps()

  useLayoutEffect(() => {
    screenTexture.colorSpace = SRGBColorSpace
    screenTexture.needsUpdate = true
  }, [screenTexture])

  return useMemo(
    () =>
      preparePixel8Scene(raw, screenTexture, materialMaps, {
        applyScreen: true,
        useFbxMaterials: true,
      }),
    [raw, screenTexture, materialMaps],
  )
}

/** Cream → OBJ+MTL; otherwise FBX when {@link PIXEL8_USE_FBX}. */
export function usePixel8SceneGraph() {
  if (PIXEL8_USE_FBX) {
    return usePixel8FbxScene()
  }
  return usePixel8ObjScene()
}

export { usePixel8ObjScene }
