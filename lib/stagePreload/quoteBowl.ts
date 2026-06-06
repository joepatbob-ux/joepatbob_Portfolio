import { QUOTE_BOWL_PAPER_TEXTURE_LIST } from '@/lib/everything-in-between/quoteBowl/paperTextures'
import { preloadFetches } from '@/lib/stagePreload/preloadAssets'
import { preloadOnce } from '@/lib/stagePreload/preloadOnce'

const BOWL_OBJ = '/models/glass-bowl-a/glass_bowl_a.obj'
const BOWL_MTL = '/models/glass-bowl-a/glass_bowl_a.mtl'
const PAPER_OBJ = '/models/paper-crumpled/paperCrumpled_01.obj'
const PAPER_MTL = '/models/paper-crumpled/paperCrumpled_01.mtl'

const QUOTE_BOWL_ASSET_URLS = [
  BOWL_OBJ,
  BOWL_MTL,
  PAPER_OBJ,
  PAPER_MTL,
  ...QUOTE_BOWL_PAPER_TEXTURE_LIST,
] as const

/** JS chunk + OBJ/MTL/textures — safe to call before the canvas mounts. */
export function preloadQuoteBowlStage(): Promise<void> {
  return preloadOnce('stage:quote-bowl', async () => {
    void import('@/components/everything-in-between/ConceptQuoteBowlCanvas')
    await preloadFetches(QUOTE_BOWL_ASSET_URLS)
  })
}
