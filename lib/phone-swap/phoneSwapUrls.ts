/** Validated public URLs for PhoneSwap loaders (avoids undefined useLoader keys). */

function requireUrl(url: string | undefined, label: string): string {
  if (typeof url !== 'string' || url.length === 0) {
    throw new Error(`[PhoneSwap] Missing asset URL: ${label}`)
  }
  return url
}

export const PHONE_SWAP_URLS = {
  pixel8: {
    obj: requireUrl('/models/Google Pixel 8 Pro.obj', 'pixel8.obj'),
    mtl: requireUrl('/models/Google Pixel 8 Pro.mtl', 'pixel8.mtl'),
    fbx: requireUrl(
      '/models/pixel-8-pro-source/pixel-8-pro.fbx',
      'pixel8.fbx',
    ),
    screen: requireUrl('/models/Android.png', 'pixel8.screen'),
    /** Export from pixel-8-pro.max (Material Editor → google-pixel-8-pro-licorice-dark.png). */
    bodyLicoriceDark: requireUrl(
      '/models/pixel-8-pro-tex/body_licorice_dark.png',
      'pixel8.bodyLicoriceDark',
    ),
    bodyJadeLight: requireUrl(
      '/models/pixel-8-pro-tex/body_jade_light.png',
      'pixel8.bodyJadeLight',
    ),
    logoAlpha: requireUrl(
      '/models/pixel-8-pro-tex/logo_alpha.png',
      'pixel8.logoAlpha',
    ),
    speakerGrilleAlpha: requireUrl(
      '/models/pixel-8-pro-tex/speaker_grille_alpha.png',
      'pixel8.speakerGrilleAlpha',
    ),
    speakerAlpha: requireUrl(
      '/models/pixel-8-pro-tex/speaker_alpha.png',
      'pixel8.speakerAlpha',
    ),
  },
  iphone16: {
    obj: requireUrl('/models/APPLE_iPhone 16 Pro.obj', 'iphone16.obj'),
    mtl: requireUrl('/models/APPLE_iPhone 16 Pro.mtl', 'iphone16.mtl'),
    screen: requireUrl('/models/Iphone.png', 'iphone16.screen'),
    brushNormalRough: requireUrl(
      '/models/iphone16-pro-tex/brush_normal_a.png',
      'iphone16.brushNormalRough',
    ),
    brushNormalSatin: requireUrl(
      '/models/iphone16-pro-tex/brush_normal_b.png',
      'iphone16.brushNormalSatin',
    ),
    flash: requireUrl('/models/iphone16-pro-tex/flash.png', 'iphone16.flash'),
    screwGrooves: requireUrl(
      '/models/iphone16-pro-tex/screw_grooves.png',
      'iphone16.screwGrooves',
    ),
    frontCamera: requireUrl(
      '/models/iphone16-pro-tex/front_camera.png',
      'iphone16.frontCamera',
    ),
    speakerAlpha: requireUrl(
      '/models/iphone16-pro-tex/speaker_mesh_alpha.png',
      'iphone16.speakerAlpha',
    ),
    speakerBump: requireUrl(
      '/models/iphone16-pro-tex/speaker_mesh_bump.png',
      'iphone16.speakerBump',
    ),
  },
} as const
