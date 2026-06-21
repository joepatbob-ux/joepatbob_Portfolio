import { prepareGoldfishBowl } from '@/lib/everything-in-between/prepareGoldfishBowl'
import { readBowlGlassTune } from '@/lib/everything-in-between/bowlGlassTune'
import { useGlb } from '@/lib/phone-swap/useGlb'
import { useMemo } from 'react'

const BOWL_GLB = '/models/glass-bowl-a/glass_bowl_a.glb'

export function useGoldfishBowlModel() {
  const raw = useGlb(BOWL_GLB)
  return useMemo(
    () => prepareGoldfishBowl(raw, readBowlGlassTune()),
    [raw],
  )
}
