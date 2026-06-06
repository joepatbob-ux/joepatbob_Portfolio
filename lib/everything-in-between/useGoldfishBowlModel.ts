import { prepareGoldfishBowl } from '@/lib/everything-in-between/prepareGoldfishBowl'
import { readBowlGlassTune } from '@/lib/everything-in-between/bowlGlassTune'
import { useObjMtl } from '@/lib/phone-swap/useObjMtl'
import { useMemo } from 'react'

const BOWL_OBJ = '/models/glass-bowl-a/glass_bowl_a.obj'
const BOWL_MTL = '/models/glass-bowl-a/glass_bowl_a.mtl'

export function useGoldfishBowlModel() {
  const raw = useObjMtl(BOWL_OBJ, BOWL_MTL)
  return useMemo(
    () => prepareGoldfishBowl(raw, readBowlGlassTune()),
    [raw],
  )
}
