import type * as THREE from 'three'

export const IPHONE16_MESH = {
  body: 'Body',
  display: 'Display',
  glass: 'Glass',
} as const

export const IPHONE16_PRO_TEX = '/models/iphone16-pro-tex' as const

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
