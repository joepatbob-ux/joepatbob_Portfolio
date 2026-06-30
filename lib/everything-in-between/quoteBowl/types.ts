import type { BowlGlassTuneSettings } from '@/lib/everything-in-between/bowlGlassTune'
import type { QuoteSlipLayout } from '@/lib/everything-in-between/quotePaper'
import type { MutableRefObject, RefObject } from 'react'
import type * as THREE from 'three'

export type QuoteBowlStep = 'pick' | 'pulling' | 'revealed' | 'resetting'

export type QuoteBowlCanvasProps = {
  answers: readonly string[]
  step: QuoteBowlStep
  selectedSlipId: number | null
  pullStartedAt: number | null
  resetStartedAt: number | null
  showSlip: boolean
  pileSeed: number
  pendingPick: boolean
  lastQuote: string | null
  reducedMotion: boolean
  darkSurface: boolean
  glassTune: BowlGlassTuneSettings
  onPickSlip: (layout: QuoteSlipLayout) => void
  onReset: (options?: { chainPick?: boolean }) => void
  onClearPendingPick: () => void
  canRepick: boolean
  pickActionRef?: MutableRefObject<(() => void) | null>
  stackRef?: RefObject<HTMLElement | null>
}

export type SlipHomeTransform = {
  position: THREE.Vector3
  rotation: THREE.Euler
}
