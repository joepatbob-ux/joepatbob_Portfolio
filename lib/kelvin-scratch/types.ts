import type { ScratchPoint } from '@/lib/kelvin-scratch/scratchCanvas'

export type ScratchPointerGlobal = { x: number; y: number }

export type ScratchProgressHandler = (
  percent: number,
  point: ScratchPoint,
  global: ScratchPointerGlobal,
) => void

export type KelvinScratchAssets = {
  ticketCoverImg: HTMLImageElement | null
  coinBrush: string | null
  ready: boolean
  loading: boolean
}
