import { QUOTE_BOWL_PAPER_TEXTURE_LIST } from '@/lib/everything-in-between/quoteBowl/paperTextures'
import { preloadFetches } from '@/lib/stagePreload/preloadAssets'
import { preloadOnce } from '@/lib/stagePreload/preloadOnce'

const BOWL_GLB = '/models/glass-bowl-a/glass_bowl_a.glb'
const PAPER_GLB = '/models/paper-crumpled/paper_crumpled.glb'

const QUOTE_BOWL_ASSET_URLS = [
  BOWL_GLB,
  PAPER_GLB,
  ...QUOTE_BOWL_PAPER_TEXTURE_LIST,
] as const

/** JS chunk + GLB models + textures — safe to call before the canvas mounts. */
export function preloadQuoteBowlStage(): Promise<void> {
  return preloadOnce('stage:quote-bowl', async () => {
    void import('@/components/everything-in-between/ConceptQuoteBowlCanvas')
    await preloadFetches(QUOTE_BOWL_ASSET_URLS)
  })
}
