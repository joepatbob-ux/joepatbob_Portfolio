import type * as THREE from 'three'

export const IPHONE16_MESH = {
  body: 'Body',
  display: 'Display',
  glass: 'Glass',
  /** Solid fill behind the UI screenshot (bezel / island gaps). */
  displayBacking: 'Display_backing',
} as const

/** Front OLED well + glass frame. */
export const IPHONE16_DISPLAY = {
  backing: 0x050508,
  bezel: 0x121216,
  /** Push screenshot above overlapping glass from the settled camera. */
  surfaceNudge: 0.004,
} as const

/** Draw order — display must win over overlapping glass. */
export const IPHONE16_DISPLAY_RENDER_ORDER = {
  backing: 29,
  bezel: 31,
  screen: 35,
  /** Dynamic Island + front sensors sit on the glass stack. */
  overlay: 37,
} as const

/** Island / sensor meshes rendered above the screenshot PNG. */
export const IPHONE16_FRONT_OVERLAY_OBJECTS = new Set([
  'Dynamic_Island',
  'Front_Sensors',
  'Front_Camera',
])

export const IPHONE16_PRO_TEX = '/models/iphone16-pro-tex' as const

/** Natural titanium palette (warm light gray — not black). */
export const NATURAL_TITANIUM = {
  body: 0xc9c4bc,
  bodyLight: 0xd8d3cb,
  side: 0xbfb9b1,
  ring: 0xd0ccc6,
} as const

export type IPhone16ProMaps = {
  brushNormalRough: THREE.Texture
  brushNormalSatin: THREE.Texture
  flash: THREE.Texture
  screwGrooves: THREE.Texture
  frontCamera: THREE.Texture
  speakerAlpha: THREE.Texture
  speakerBump: THREE.Texture
}

/** Side / button meshes — brush normals stretch badly on these UVs. */
export const IPHONE16_SIDE_OBJECTS = new Set([
  'Side_Button',
  'Volume_Up',
  'Volume_Down',
  'Action_Button',
  'Camera_Control',
])

export const IPHONE16_RING_OBJECTS = new Set([
  'Camera_Ring',
  'Camera_Ring_2',
  'Camera_Ring_3',
])
