import type { PhoneCameraView } from '@/lib/phone-swap/phoneSwapCamera'
import { DEFAULT_PHONE_CAMERA, formatCameraTs } from '@/lib/phone-swap/phoneSwapCamera'
import {
  clampStageSize,
  clampStageWidth,
  DEFAULT_PHONE_STAGE_SIZE,
  DEFAULT_PHONE_STAGE_WIDTH,
} from '@/lib/phone-swap/phoneSwapStageSize'

/** Transform for one phone in the scene. */
export type PhonePose = {
  position: [number, number, number]
  /** Euler XYZ in radians. */
  rotation: [number, number, number]
  scale: number
  renderOrder: number
}

export type { PhoneCameraView }

export type PhoneDevice = 'android' | 'iphone'

/** Both phones at once — one “focus” state. */
export type PhoneSwapSnapshot = {
  android: PhonePose
  iphone: PhonePose
}

export type PhoneSwapFocus = 'androidFocus' | 'iphoneFocus'

/** Layout edit target — includes pass-around pose at t = 0.5. */
export type PhoneSwapEditFocus = PhoneSwapFocus | 'swapMidpoint'

export type PhoneSwapLayout = {
  /** Android featured (start). */
  androidFocus: PhoneSwapSnapshot
  /** iPhone featured (end). */
  iphoneFocus: PhoneSwapSnapshot
  /** Pass-around pose — phones stay on opposite sides (no crossing). */
  swapMidpoint: PhoneSwapSnapshot
  /** Fixed stage camera — orbit when unlocked in layout mode. */
  camera: PhoneCameraView
  /** View box height scale (0.42–1.05, default ~0.68). */
  stageSize: number
  /** View box width scale (0.42–1.05; defaults to stageSize when omitted). */
  stageWidth: number
}

export const PHONE_SWAP_LAYOUT: PhoneSwapLayout = {
  androidFocus: {
    android: {
      position: [0, 0, 0],
      rotation: [0.04, 1.57, -0.06],
      scale: 1,
      renderOrder: 2,
    },
    iphone: {
      position: [0.622, 0.11, -0.482],
      rotation: [-0.399, -0.672, -0.402],
      scale: 0.78,
      renderOrder: 1,
    },
  },
  iphoneFocus: {
    android: {
      position: [-0.636, 0.089, -0.817],
      rotation: [-2.702, 1.171, 2.317],
      scale: 0.8,
      renderOrder: 1,
    },
    iphone: {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: 1,
      renderOrder: 2,
    },
  },
  swapMidpoint: {
    android: {
      position: [-0.78, 0.06, -0.5],
      rotation: [0.1, 1.35, 0.06],
      scale: 0.84,
      renderOrder: 1,
    },
    iphone: {
      position: [0.78, 0.06, -0.5],
      rotation: [-0.1, -1.35, -0.06],
      scale: 0.84,
      renderOrder: 1,
    },
  },
  camera: DEFAULT_PHONE_CAMERA,
  stageSize: DEFAULT_PHONE_STAGE_SIZE,
  stageWidth: DEFAULT_PHONE_STAGE_WIDTH,
}

function normalizeSnapshot(raw: PhoneSwapSnapshot): PhoneSwapSnapshot {
  return {
    android: normalizePose(raw.android),
    iphone: normalizePose(raw.iphone),
  }
}

export function cloneLayout(layout: PhoneSwapLayout): PhoneSwapLayout {
  const cloned = JSON.parse(JSON.stringify(layout)) as Partial<PhoneSwapLayout>
  return {
    androidFocus: normalizeSnapshot(
      cloned.androidFocus ?? PHONE_SWAP_LAYOUT.androidFocus,
    ),
    iphoneFocus: normalizeSnapshot(cloned.iphoneFocus ?? PHONE_SWAP_LAYOUT.iphoneFocus),
    swapMidpoint: normalizeSnapshot(
      cloned.swapMidpoint ?? PHONE_SWAP_LAYOUT.swapMidpoint,
    ),
    camera: cloned.camera ?? DEFAULT_PHONE_CAMERA,
    stageSize: clampStageSize(cloned.stageSize ?? DEFAULT_PHONE_STAGE_SIZE),
    stageWidth: clampStageWidth(
      cloned.stageWidth ??
        cloned.stageSize ??
        DEFAULT_PHONE_STAGE_WIDTH,
    ),
  }
}

function normalizePose(raw: Partial<PhonePose> & { rotationY?: number }): PhonePose {
  const rotation =
    raw.rotation ??
    ([0, raw.rotationY ?? 0, 0] as [number, number, number])
  return {
    position: raw.position ?? [0, 0, 0],
    rotation,
    scale: raw.scale ?? 1,
    renderOrder: raw.renderOrder ?? 1,
  }
}

export function cloneSnapshot(snapshot: PhoneSwapSnapshot): PhoneSwapSnapshot {
  const cloned = JSON.parse(JSON.stringify(snapshot)) as {
    android: Partial<PhonePose> & { rotationY?: number }
    iphone: Partial<PhonePose> & { rotationY?: number }
  }
  return {
    android: normalizePose(cloned.android),
    iphone: normalizePose(cloned.iphone),
  }
}

export type LayoutLocks = {
  viewAngle: boolean
}

export const DEFAULT_LAYOUT_LOCKS: LayoutLocks = {
  viewAngle: true,
}

export function focusLabel(focus: PhoneSwapEditFocus): string {
  if (focus === 'androidFocus') return 'Android focus'
  if (focus === 'iphoneFocus') return 'iPhone focus'
  return 'Swap midpoint'
}

export function layoutSnapshotForEdit(
  layout: PhoneSwapLayout,
  focus: PhoneSwapEditFocus,
): PhoneSwapSnapshot {
  if (focus === 'swapMidpoint') return layout.swapMidpoint
  return layout[focus]
}

export function formatLayoutTs(layout: PhoneSwapLayout): string {
  const fmt = (p: PhonePose) =>
    `{ position: [${p.position.map((n) => +n.toFixed(3)).join(', ')}], rotation: [${p.rotation.map((n) => +n.toFixed(3)).join(', ')}], scale: ${p.scale.toFixed(3)}, renderOrder: ${p.renderOrder} }`

  return `export const PHONE_SWAP_LAYOUT: PhoneSwapLayout = {
  androidFocus: {
    android: ${fmt(layout.androidFocus.android)},
    iphone: ${fmt(layout.androidFocus.iphone)},
  },
  iphoneFocus: {
    android: ${fmt(layout.iphoneFocus.android)},
    iphone: ${fmt(layout.iphoneFocus.iphone)},
  },
  swapMidpoint: {
    android: ${fmt(layout.swapMidpoint.android)},
    iphone: ${fmt(layout.swapMidpoint.iphone)},
  },
  camera: ${formatCameraTs(layout.camera)},
  stageSize: ${clampStageSize(layout.stageSize).toFixed(2)},
  stageWidth: ${clampStageWidth(layout.stageWidth).toFixed(2)},
}`
}
