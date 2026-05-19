/** Product silhouettes for the Hardware → Lessons lineup (left → right). */
export interface HardwareLessonDevice {
  id: string
  label: string
  /** Omit for devices rendered as a composed component (e.g. Sensi Lite). */
  src?: string
}

export const HARDWARE_LESSON_DEVICES: HardwareLessonDevice[] = [
  {
    id: 'touch-2',
    label: 'Sensi Touch 2',
    src: '/images/Front/Touch%202.svg',
  },
  {
    id: 'eim',
    label: 'Equipment Interface Module',
    src: '/images/EIM.svg',
  },
  {
    id: 'remote-sensor',
    label: 'Remote sensor',
    src: '/images/Remote%20Sensor.svg',
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
