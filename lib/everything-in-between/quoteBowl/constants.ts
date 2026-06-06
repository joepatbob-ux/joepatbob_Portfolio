/** Quote bowl scene tuning — camera, pile, unfold slip, canvas. */
export const QUOTE_BOWL = {
  slipCount: 4,
  contentYOffset: 0.35,
  hoverTiltRad: 0.34,
  idleWobbleAmp: 0.018,
  idleWobbleHz: 0.22,
  camera: {
    position: [0, 0.4, 4.8] as const,
    lookAt: [0, 0.6, 0] as const,
    fov: 42,
    near: 0.05,
    far: 40,
  },
  canvas: {
    maxDpr: 2,
  },
  shadows: {
    mapSize: 1024,
    bias: -0.00018,
    normalBias: 0.032,
    camera: {
      near: 0.4,
      far: 14,
      size: 2.6,
    },
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
    intensity: 0.11,
    resolution: 1024,
  },
  /** Crumpled paper pile — inverted against page (black on light, white on dark). */
  paper: {
    pileTint: {
      light: '#0d0d0d',
      dark: '#f5f2ec',
    },
    pileDimOpacity: 0.22,
    fallDurationSec: 0.95,
    /** Touching distance as a multiple of combined radii. */
    ballSeparation: 1,
    ballScale: {
      min: 0.62,
      max: 1.22,
    },
    /** Resting lean — radians on X/Z; Y is a full spin. */
    ballTiltRad: {
      min: 0.18,
      max: 1.08,
    },
    /** Per-axis squash/stretch to vary visible crumpled edges. */
    ballStretch: {
      min: 0.78,
      max: 1.22,
    },
    physics: {
      gravityStrength: 32,
      airDamping: 0.997,
      floorFriction: 0.58,
      floorBounce: 0,
      maxSpeed: 3.2,
      sleepSpeed: 0.002,
      subSteps: 5,
      gravitySmoothing: 0.62,
      collisionRestitution: 0.05,
      collisionPasses: 4,
      collisionCorrection: 0.85,
    },
  },
  /** Soft studio lighting on light `--color-paper`. */
  lightSurface: {
    environment: {
      preset: 'apartment' as const,
      intensity: 0.11,
      resolution: 1024,
    },
    lighting: {
      ambient: 0.34,
      key: { position: [2.6, 5, 4] as const, intensity: 0.5 },
      fill: { position: [-2.6, 2.4, -1.6] as const, intensity: 0.14 },
      hemisphere: { sky: '#faf6eb', ground: '#a09890', intensity: 0.13 },
    },
    toneMappingExposure: 0.96,
  },
  /** Glass + lights when `--color-paper` is near-black (dark mode). */
  darkSurface: {
    environment: {
      preset: 'studio' as const,
      intensity: 0.34,
      resolution: 1024,
    },
    lighting: {
      ambient: 0.2,
      key: { position: [3.2, 5.5, 4.2] as const, intensity: 0.68 },
      fill: { position: [-3, 2.6, -2] as const, intensity: 0.28 },
      rim: { position: [0.4, 3.2, -4.8] as const, intensity: 0.48, color: '#e8ecf4' },
      hemisphere: { sky: '#dce4ec', ground: '#0a0a0a', intensity: 0.26 },
    },
    toneMappingExposure: 0.92,
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
