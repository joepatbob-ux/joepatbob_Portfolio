import { eibChapterId } from '@/lib/everything-in-between/content'
import { useStagePreload } from '@/lib/hooks/useStagePreload'
import { preloadFormationLegoStage } from '@/lib/stagePreload/formationLego'

/** Background warm-up for EIB stage assets as chapters enter the scroll viewport. */
export function EibStagePreloads() {
  useStagePreload(eibChapterId('formation'), preloadFormationLegoStage)
  return null
}
