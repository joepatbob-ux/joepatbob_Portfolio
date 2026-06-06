import { preparePaperCrumpled } from '@/lib/everything-in-between/preparePaperCrumpled'
import { useObjMtl } from '@/lib/phone-swap/useObjMtl'
import { useMemo } from 'react'

const PAPER_OBJ = '/models/paper-crumpled/paperCrumpled_01.obj'
const PAPER_MTL = '/models/paper-crumpled/paperCrumpled_01.mtl'

export function usePaperCrumpledModel() {
  const raw = useObjMtl(PAPER_OBJ, PAPER_MTL)
  return useMemo(() => preparePaperCrumpled(raw), [raw])
}
