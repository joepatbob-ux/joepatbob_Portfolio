import { preparePaperCrumpled } from '@/lib/everything-in-between/preparePaperCrumpled'
import { useGlb } from '@/lib/phone-swap/useGlb'
import { useMemo } from 'react'

const PAPER_GLB = '/models/paper-crumpled/paper_crumpled.glb'

export function usePaperCrumpledModel() {
  const raw = useGlb(PAPER_GLB)
  return useMemo(() => preparePaperCrumpled(raw), [raw])
}
