import { publicAssetUrl } from '@/lib/phone-swap/publicAssetUrl'

const TEX = '/models/Magic8Ball_OBJ/Textures/2048'

function tex(file: string): string {
  return publicAssetUrl(`${TEX}/${file}`)
}

/** All PBR maps from the authored Magic 8 Ball export (Palla8). */
export const MAGIC8_BALL_TEXTURE_URLS = {
  baseColor: tex('Magic8Ball_Base_Color.png'),
  specular: tex('Magic8Ball_Specular.png'),
  roughness: tex('Magic8Ball_Roughness.png'),
  metallic: tex('Magic8Ball_Metallic.png'),
  emission: tex('Magic8Ball_Emission.png'),
  opacity: tex('Magic8Ball_Opacity.png'),
  normal: tex('Magic8Ball_NormalOpenGL.png'),
} as const

/** Stable order for TextureLoader batching. */
export const MAGIC8_BALL_TEXTURE_LIST = [
  MAGIC8_BALL_TEXTURE_URLS.baseColor,
  MAGIC8_BALL_TEXTURE_URLS.specular,
  MAGIC8_BALL_TEXTURE_URLS.roughness,
  MAGIC8_BALL_TEXTURE_URLS.metallic,
  MAGIC8_BALL_TEXTURE_URLS.emission,
  MAGIC8_BALL_TEXTURE_URLS.opacity,
  MAGIC8_BALL_TEXTURE_URLS.normal,
] as const
