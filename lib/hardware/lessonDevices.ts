/** Product silhouettes for the Hardware → Lessons lineup (left → right). */
export interface HardwareLessonDevice {
  id: string
  label: string
  /** Omit for devices rendered as a composed component (e.g. Sensi Lite). */
  src?: string
}

/** Composed in {@link EimTouchFamilyArt} — not rendered as separate lineup items. */
export const EIM_TOUCH_FAMILY_DEVICE_IDS = [
  'touch-2',
  'eim',
  'remote-sensor',
] as const

export const HARDWARE_LESSON_DEVICES: HardwareLessonDevice[] = [
  {
    id: 'eim-touch-family',
    label: 'Sensi Touch 2 system',
  },
  {
    id: 'vx4',
    label: 'Verdant VX4',
    src: '/images/Front/VX4.png',
  },
  {
    id: 'lite',
    label: 'Sensi Lite',
  },
  {
    id: 'classic',
    label: 'Sensi Classic',
    src: '/images/Front/Classic.svg',
  },
]
