import type { BowlGlassTuneSettings } from '@/lib/everything-in-between/bowlGlassTune'
import type { QuoteSlipLayout } from '@/lib/everything-in-between/quotePaper'
import type * as THREE from 'three'

export type QuoteBowlStep = 'pick' | 'revealed'

export type QuoteBowlCanvasProps = {
  answers: readonly string[]
  step: QuoteBowlStep
  selectedSlipId: number | null
  reducedMotion: boolean
  darkSurface: boolean
  glassTune: BowlGlassTuneSettings
  onPickSlip: (layout: QuoteSlipLayout) => void
  onReset: () => void
}

export type SlipHomeTransform = {
  position: THREE.Vector3
  rotation: THREE.Euler
}
