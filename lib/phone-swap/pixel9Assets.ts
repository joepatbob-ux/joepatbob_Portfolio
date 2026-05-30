export const PIXEL9_MESH = {
  display: 'GP9p_display',
  glass: 'GP9p_glass',
  cameraGlass: 'GP9p_c_glass',
  flashGlass: 'GP9p_flash_glass',
  body: 'GP9p_mid',
} as const

export type Pixel9ColorVariant = 'obsidian' | 'porcelain'

/** Active finish for PhoneSwap. */
export const PIXEL9_COLOR_VARIANT: Pixel9ColorVariant = 'porcelain'

export type Pixel9Palette = {
  frame: number
  frameBack: number
  black: number
  bezel: number
  plastic: number
  camera: number
  cameraTex: number
  gold: number
  lens: number
  logo: number
  flash: number
  usb: number
  led: number
  display: number
}

export const PIXEL9_OBSIDIAN: Pixel9Palette = {
  frame: 0x6e6e76,
  frameBack: 0x58585f,
  black: 0x36363c,
  bezel: 0x2c2c32,
  plastic: 0x404048,
  camera: 0x323238,
  cameraTex: 0x4a4a52,
  gold: 0xd4af37,
  lens: 0x18181c,
  logo: 0xaeb0b8,
  flash: 0xf2f2ea,
  usb: 0x34343a,
  led: 0x4466ee,
  display: 0x121216,
}

/** Warm off-white frame; dark camera bar for contrast. */
export const PIXEL9_PORCELAIN: Pixel9Palette = {
  frame: 0xfaf8f4,
  frameBack: 0xe8e4dc,
  black: 0x3a3a40,
  bezel: 0x2e2e34,
  plastic: 0xc8c4bc,
  camera: 0x2a2a30,
  cameraTex: 0x404048,
  gold: 0xd4af37,
  lens: 0x141418,
  logo: 0x6a6a72,
  flash: 0xf4f4ec,
  usb: 0x3c3c42,
  led: 0x4466ee,
  display: 0x121216,
}

export const PIXEL9_PALETTES: Record<Pixel9ColorVariant, Pixel9Palette> = {
  obsidian: PIXEL9_OBSIDIAN,
  porcelain: PIXEL9_PORCELAIN,
}

export function pixel9Palette(
  variant: Pixel9ColorVariant = PIXEL9_COLOR_VARIANT,
): Pixel9Palette {
  return PIXEL9_PALETTES[variant]
}

type SlotSpec = {
  color: number
  metalness: number
  roughness: number
  envMapIntensity?: number
}

function buildPixel9Slot(palette: Pixel9Palette, variant: Pixel9ColorVariant): Record<string, SlotSpec> {
  const lightFrame = variant === 'porcelain'
  return {
    GP9p_mid: {
      color: palette.frame,
      metalness: lightFrame ? 0.12 : 0.32,
      roughness: lightFrame ? 0.52 : 0.42,
      envMapIntensity: lightFrame ? 0.85 : 1.2,
    },
    GP9p_back: {
      color: palette.frameBack,
      metalness: lightFrame ? 0.1 : 0.28,
      roughness: lightFrame ? 0.55 : 0.45,
      envMapIntensity: lightFrame ? 0.8 : 1.1,
    },
    GP9p_black: { color: palette.black, metalness: 0.15, roughness: 0.55 },
    GP9p_f_black: { color: palette.bezel, metalness: 0.12, roughness: 0.58 },
    GP9p_plastic: {
      color: palette.plastic,
      metalness: lightFrame ? 0.08 : 0.1,
      roughness: lightFrame ? 0.58 : 0.62,
    },
    GP9p_camera: { color: palette.camera, metalness: 0.2, roughness: 0.52 },
    GP9p_c_noise: { color: palette.cameraTex, metalness: 0.22, roughness: 0.5 },
    GP9p_gold: {
      color: palette.gold,
      metalness: 0.82,
      roughness: 0.3,
      envMapIntensity: 1.3,
    },
    GP9p_lens: { color: palette.lens, metalness: 0.5, roughness: 0.22 },
    GP9p_logo: {
      color: palette.logo,
      metalness: lightFrame ? 0.35 : 0.55,
      roughness: lightFrame ? 0.45 : 0.38,
      envMapIntensity: lightFrame ? 0.9 : 1.15,
    },
    GP9p_flash: { color: palette.flash, metalness: 0.08, roughness: 0.48 },
    GP9p_usb: { color: palette.usb, metalness: 0.18, roughness: 0.52 },
    GP9p_led: { color: palette.led, metalness: 0.05, roughness: 0.4 },
    GP9p_display: { color: palette.display, metalness: 0, roughness: 0.9 },
  }
}

export function getPixel9Slot(
  variant: Pixel9ColorVariant = PIXEL9_COLOR_VARIANT,
): Record<string, SlotSpec> {
  return buildPixel9Slot(pixel9Palette(variant), variant)
}

export const PIXEL9_TEXTURES = {
  obj: '/models/Google Pixel 9 Pro.obj',
  mtl: '/models/Google Pixel 9 Pro.mtl',
  screen: '/models/Android.png',
} as const
