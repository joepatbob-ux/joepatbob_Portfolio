import { useMemo } from 'react'
import {
  TOUCH2_MASTER_MTL,
  TOUCH2_MASTER_OBJ,
} from '@/lib/touch-2-playground/assets'
import { prepareTouch2MasterScene } from '@/lib/touch-2-playground/prepareTouch2MasterScene'
import { useObjMtl } from '@/lib/phone-swap/useObjMtl'

export function useTouch2MasterScene() {
  const raw = useObjMtl(TOUCH2_MASTER_OBJ, TOUCH2_MASTER_MTL)
  return useMemo(() => prepareTouch2MasterScene(raw), [raw])
}
