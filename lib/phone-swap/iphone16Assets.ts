import type * as THREE from 'three'

export const IPHONE16_MESH = {
  body: 'Body',
  display: 'Display',
  glass: 'Glass',
} as const

export const IPHONE16_PRO_TEX = '/models/iphone16-pro-tex' as const

/** Natural titanium palette (warm light gray — not black). */
export const NATURAL_TITANIUM = {
  body: 0xc9c4bc,
  bodyLight: 0xd8d3cb,
  side: 0xbfb9b1,
  ring: 0xd0ccc6,
} as const

export const IPHONE16_TEXTURES = {
  obj: '/models/APPLE_iPhone 16 Pro.obj',
  mtl: '/models/APPLE_iPhone 16 Pro.mtl',
  screen: '/models/Iphone.png',
  brushNormalRough: `${IPHONE16_PRO_TEX}/brush_normal_a.png`,
  brushNormalSatin: `${IPHONE16_PRO_TEX}/brush_normal_b.png`,
  flash: `${IPHONE16_PRO_TEX}/flash.png`,
  screwGrooves: `${IPHONE16_PRO_TEX}/screw_grooves.png`,
  frontCamera: `${IPHONE16_PRO_TEX}/front_camera.png`,
  speakerAlpha: `${IPHONE16_PRO_TEX}/speaker_mesh_alpha.png`,
  speakerBump: `${IPHONE16_PRO_TEX}/speaker_mesh_bump.png`,
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
