import type * as THREE from 'three'

export const PIXEL8_MESH = {
  display: 'screenSG1',
  glass: 'glassSG1',
  /** Solid fill behind the UI screenshot (visible in bezel / cutout gaps). */
  displayBacking: 'screenSG1_backing',
  /** Main body shell — cream when {@link PIXEL8_COLOR_VARIANT} is `cream`. */
  body: 'polySurface87SG1',
} as const

/** Internal earpiece / front-camera / sensor cluster meshes that sit *in front
    of* the flat display plane (Z ≈ 0.08–0.19 vs the screen at ~0.05). On a real
    phone these live under the glass; here they poke through and render as two
    faint rings over the upper-middle of the screenshot. They are never meant to
    be visible on the front, so hide them (the top punch-hole camera is a separate
    mesh and stays). */
export const PIXEL8_FRONT_OCCLUDER_MESHES: readonly string[] = [
  'pSphere1SG1',
  'polySurface44SG1',
  'polySurface53SG1',
  'polySurface60SG1',
  'polySurface61SG1',
  'polySurface62SG1',
  'polySurface67SG1',
  'polySurface102SG1',
  'polySurface103SG1',
]

/** Front OLED well + glass frame (matches Pixel 9 bezel tone). */
export const PIXEL8_DISPLAY = {
  backing: 0x050508,
  bezel: 0x121216,
  /** Lift glass frame above body (screen uses {@link surfaceNudge}). */
  bezelNudge: 0.006,
  /** Lift the screenshot clear of the coplanar glass so they don't z-fight.
      Must hold at tilted poses (the swap), not just the settled camera — 0.004
      was tuned flat and fought (diagonal moire) once the phone rotated. */
  surfaceNudge: 0.05,
} as const

/** Draw order — well above body (0); screen wins over bezel in overlap. */
export const PIXEL8_DISPLAY_RENDER_ORDER = {
  backing: 40,
  bezel: 42,
  screen: 44,
} as const

/** Max export textures (logo, speaker alphas, body atlases). */
export const PIXEL8_PRO_TEX = '/models/pixel-8-pro-tex' as const

export const PIXEL8_MAX_SOURCE = '/models/pixel-8-pro-source/pixel-8-pro.max' as const

export const PIXEL8_FBX = '/models/pixel-8-pro-source/pixel-8-pro.fbx' as const

export const PIXEL8_FBX_RESOURCE_PATH =
  '/models/pixel-8-pro-source/sceneassets/' as const

/** Active finish for PhoneSwap. */
export type Pixel8ColorVariant = 'cream' | 'mtl_default' | 'fbx_default'

/** MTL export colors (Bay blue body, gold trim, black camera). */
export const PIXEL8_COLOR_VARIANT: Pixel8ColorVariant = 'mtl_default'

/** Porcelain / cream palette (warm off-white body). */
export const PIXEL8_CREAM = {
  body: 0xf0e9dc,
  trim: 0xfaf7f2,
  shadow: 0xe4dcd0,
} as const

/** Cream / MTL use OBJ. FBX only for `fbx_default`. */
export const PIXEL8_USE_FBX: boolean =
  (PIXEL8_COLOR_VARIANT as Pixel8ColorVariant) === 'fbx_default'

/** Pixel 8 OBJ is already right-handed — unlike iPhone/Pixel 9 C4D exports. */
export const PIXEL8_MIRROR_X = false

/** Which body diffuse atlas to use (undefined = MTL colors only). */
export type Pixel8BodyAtlas = 'licorice_dark' | 'jade_light'

export const PIXEL8_BODY_ATLAS_FILES: Record<Pixel8BodyAtlas, string> = {
  licorice_dark: `${PIXEL8_PRO_TEX}/body_licorice_dark.png`,
  jade_light: `${PIXEL8_PRO_TEX}/body_jade_light.webp`,
}

/** Body shell uses Max UV atlas when set; otherwise {@link PIXEL8_JADE} solid fill. */
export const PIXEL8_BODY_ATLAS: Pixel8BodyAtlas | null = null

/** Jade Light finish — solid PBR colors (no body texture). */
export const PIXEL8_JADE = {
  body: 0xa3b0a8,
  trim: 0xb8c4bc,
  shadow: 0x8a9690,
} as const

export const PIXEL8_TEXTURES = {
  obj: '/models/Google Pixel 8 Pro.obj',
  mtl: '/models/Google Pixel 8 Pro.mtl',
  screen: '/models/Android.png',
  bodyJadeLight: PIXEL8_BODY_ATLAS_FILES.jade_light,
  bodyLicoriceDark: PIXEL8_BODY_ATLAS_FILES.licorice_dark,
  logoAlpha: `${PIXEL8_PRO_TEX}/logo_alpha.png`,
  speakerAlpha: `${PIXEL8_PRO_TEX}/speaker_alpha.png`,
  speakerGrilleAlpha: `${PIXEL8_PRO_TEX}/speaker_grille_alpha.png`,
} as const

/** Cutout maps from Max export; body atlas optional. */
export type Pixel8MaterialMaps = {
  logoAlpha: THREE.Texture
  speakerGrilleAlpha: THREE.Texture
  speakerAlpha?: THREE.Texture
  bodyAtlas?: THREE.Texture
}

export const PIXEL8_BODY_TEXTURE_SLOTS = new Set([
  'polySurface87SG1',
  'pCylinder6SG1',
  'polySurface98SG1',
  'polySurface84SG1',
  'polySurface95SG1',
])

export const PIXEL8_LOGO_SLOTS = new Set(['logoSG1'])

export const PIXEL8_SPEAKER_GRILLE_SLOTS = new Set(['pPlane009SG1'])

/** Earpiece cutout mesh (Max export `speeker.png`). */
export const PIXEL8_SPEAKER_SLOTS = new Set(['pPlane8SG1'])

export const PIXEL8_BLACK_SLOTS = new Set([
  'pPlane8SG1',
  'pSphere1SG1',
  'polySurface16SG1',
  'polySurface28SG1',
  'polySurface30SG1',
  'polySurface44SG1',
  'polySurface53SG1',
  'polySurface60SG1',
  'polySurface61SG1',
  'polySurface62SG1',
  'polySurface67SG1',
  'polySurface94SG1',
  'polySurface102SG1',
  'polySurface103SG1',
])

export const PIXEL8_GOLD_SLOTS = new Set([
  'polySurface99SG1',
  'polySurface104SG1',
])

export const PIXEL8_ACCENT_SLOTS = new Set(['polySurface20SG1'])
