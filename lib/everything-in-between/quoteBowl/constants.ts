/** Quote bowl scene tuning — camera, pile, unfold slip, canvas. */
export const QUOTE_BOWL = {
  slipCount: 5,
  contentYOffset: 0.35,
  hoverTiltRad: -0.28,
  idleWobbleAmp: 0.024,
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
  /** Accent crumpled paper wads in the pile. */
  paper: {
    pileDimOpacity: 0.52,
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
      airDamping: 0.988,
      floorFriction: 0.62,
      floorBounce: 0.05,
      maxSpeed: 2.8,
      sleepSpeed: 0.012,
      subSteps: 6,
      gravitySmoothing: 1,
      collisionRestitution: 0.12,
      collisionPasses: 5,
      collisionCorrection: 0.88,
    },
  },
  /** Soft studio lighting on light `--color-paper`. */
  lightSurface: {
    environment: {
      preset: 'apartment' as const,
      intensity: 0.22,
      resolution: 1024,
    },
    lighting: {
      ambient: 0.42,
      key: { position: [2.6, 5, 4] as const, intensity: 0.64, color: '#fff8f0' },
      fill: { position: [-2.6, 2.4, -1.6] as const, intensity: 0.22, color: '#ffe4d4' },
      hemisphere: { sky: '#fff8f0', ground: '#c4a898', intensity: 0.18 },
    },
    toneMappingExposure: 1.02,
    glass: {
      envMapIntensityMin: 0.28,
      attenuationColor: '#fff5eb',
      attenuationDistanceMax: 8,
      clearcoatMin: 0.06,
    },
  },
  /** Glass + lights when `--color-paper` is near-black (dark mode). */
  darkSurface: {
    environment: {
      preset: 'studio' as const,
      intensity: 0.38,
      resolution: 1024,
    },
    lighting: {
      ambient: 0.22,
      key: { position: [3.2, 5.5, 4.2] as const, intensity: 0.72, color: '#fff4ea' },
      fill: { position: [-3, 2.6, -2] as const, intensity: 0.3, color: '#ffd0b0' },
      rim: { position: [0.4, 3.2, -4.8] as const, intensity: 0.55, color: '#ffb080' },
      hemisphere: { sky: '#e8ecf4', ground: '#0a0a0a', intensity: 0.28 },
    },
    toneMappingExposure: 0.96,
    glass: {
      envMapIntensityMul: 2.4,
      envMapIntensityAdd: 0.12,
      clearcoatMin: 0.1,
      clearcoatRoughnessMax: 0.04,
      colorLift: '#eef4fa',
    },
  },
  revealDelayMs: 120,
  pull: {
    durationMs: 1180,
    slipRevealProgress: 0.75,
    dipRad: 0.14,
    dipDecay: 5.5,
    /** Rim lift relative to bowl lip (`topY`), in paper-radius units. */
    rimLift: 0.12,
    rimZFactor: 0.22,
    ballHoverScale: 1.1,
  },
  reset: {
    slipExitMs: 320,
    ballReturnMs: 950,
  },
} as const
