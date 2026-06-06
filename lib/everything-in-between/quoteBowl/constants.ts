/** Quote bowl scene tuning — camera, pile, unfold slip, canvas. */
export const QUOTE_BOWL = {
  slipCount: 14,
  contentYOffset: -0.42,
  hoverTiltRad: 0.34,
  idleWobbleAmp: 0.04,
  idleWobbleHz: 0.28,
  camera: {
    position: [0, 0.52, 6.35] as const,
    lookAt: [0, 0.18, 0] as const,
    fov: 42,
    near: 0.05,
    far: 40,
  },
  canvas: {
    maxDpr: 2,
  },
  unfold: {
    width: 0.92,
    height: 0.36,
    scale: 1.65,
    geoSegments: [32, 12] as const,
    textureSize: [1440, 440] as const,
    textStartT: 0.42,
    textEndT: 0.98,
  },
  environment: {
    preset: 'apartment' as const,
    intensity: 0.18,
    resolution: 1024,
  },
  /** Glass + lights when `--color-paper` is near-black (dark mode). */
  darkSurface: {
    environment: {
      preset: 'studio' as const,
      intensity: 0.52,
      resolution: 1024,
    },
    lighting: {
      ambient: 0.28,
      key: { position: [3.5, 6, 4.5] as const, intensity: 1.05 },
      fill: { position: [-3.2, 2.8, -2.2] as const, intensity: 0.48 },
      rim: { position: [0.4, 3.2, -4.8] as const, intensity: 0.92, color: '#f4f8ff' },
      hemisphere: { sky: '#e4ecf4', ground: '#0a0a0a', intensity: 0.38 },
    },
    glass: {
      envMapIntensityMul: 2.4,
      envMapIntensityAdd: 0.12,
      clearcoatMin: 0.1,
      clearcoatRoughnessMax: 0.04,
      colorLift: '#eef4fa',
    },
  },
  revealDelayMs: 120,
} as const
