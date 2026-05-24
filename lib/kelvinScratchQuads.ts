/** Kelvin scratch — 2×2 visual quadrants (single scratch surface underneath). */

export interface KelvinScratchQuadDef {
  id: string
  label: string
  /** SVG under foil for this quadrant — drop files in public/images/web-apps/scratch-quads/ */
  placeholderSrc: string
}

export const KELVIN_SCRATCH_QUADS: readonly KelvinScratchQuadDef[] = [
  {
    id: 'sensi-mtm',
    label: 'Sensi MTM',
    placeholderSrc: '/images/web-apps/scratch-quads/sensi-mtm.svg',
  },
  {
    id: 'verdant-tm',
    label: 'Verdant TM',
    placeholderSrc: '/images/web-apps/scratch-quads/verdant-tm.svg',
  },
  {
    id: 'connect-plus',
    label: 'Connect+',
    placeholderSrc: '/images/web-apps/scratch-quads/connect-plus.svg',
  },
  {
    id: 'temptrak-6',
    label: 'TempTrak 6',
    placeholderSrc: '/images/web-apps/scratch-quads/temptrak-6.svg',
  },
] as const
