import { publicAssetUrl } from '@/lib/phone-swap/publicAssetUrl'

/** Validated public URLs for PhoneSwap loaders (avoids undefined useLoader keys). */

function asset(path: string, label: string): string {
  if (!path) {
    throw new Error(`[PhoneSwap] Missing asset URL: ${label}`)
  }
  return publicAssetUrl(path)
}

export const PHONE_SWAP_URLS = {
  pixel8: {
    glb: asset('/models/pixel8-pro.glb', 'pixel8.glb'),
    bodyJadeLight: asset(
      '/models/pixel-8-pro-tex/body_jade_light.webp',
      'pixel8.bodyJadeLight',
    ),
    logoAlpha: asset('/models/pixel-8-pro-tex/logo_alpha.png', 'pixel8.logoAlpha'),
    speakerGrilleAlpha: asset(
      '/models/pixel-8-pro-tex/speaker_grille_alpha.png',
      'pixel8.speakerGrilleAlpha',
    ),
    speakerAlpha: asset(
      '/models/pixel-8-pro-tex/speaker_alpha.webp',
      'pixel8.speakerAlpha',
    ),
  },
  iphone16: {
    glb: asset('/models/iphone16-pro.glb', 'iphone16.glb'),
    brushNormalRough: asset(
      '/models/iphone16-pro-tex/brush_normal_a.webp',
      'iphone16.brushNormalRough',
    ),
    brushNormalSatin: asset(
      '/models/iphone16-pro-tex/brush_normal_b.webp',
      'iphone16.brushNormalSatin',
    ),
    flash: asset('/models/iphone16-pro-tex/flash.webp', 'iphone16.flash'),
    screwGrooves: asset(
      '/models/iphone16-pro-tex/screw_grooves.webp',
      'iphone16.screwGrooves',
    ),
    frontCamera: asset(
      '/models/iphone16-pro-tex/front_camera.webp',
      'iphone16.frontCamera',
    ),
    speakerAlpha: asset(
      '/models/iphone16-pro-tex/speaker_mesh_alpha.webp',
      'iphone16.speakerAlpha',
    ),
    speakerBump: asset(
      '/models/iphone16-pro-tex/speaker_mesh_bump.webp',
      'iphone16.speakerBump',
    ),
  },
} as const
